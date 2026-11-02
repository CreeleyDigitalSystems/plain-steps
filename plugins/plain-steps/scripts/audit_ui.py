#!/usr/bin/env python3
"""Inspect one authored HTML file. No browser, asset reads or conformance claim."""

import argparse
from collections import Counter
from dataclasses import dataclass, field
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import stat
import sys
from urllib.parse import unquote, urlsplit

VOID = set("area base br col embed hr img input link meta param source track wbr".split())
CONTROLS = {"button", "input", "select", "textarea", "summary"}
QUIET = {"head", "script", "style", "template", "noscript"}
REFS = ("aria-labelledby", "aria-describedby", "aria-controls", "aria-owns",
        "aria-activedescendant", "aria-details", "aria-errormessage", "aria-flowto")


@dataclass(eq=False)
class Element:
    tag: str
    attrs: dict
    line: int
    parent: object = None
    children: list = field(default_factory=list)
    visible: bool = True
    aria_hidden: bool = False


class Source(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Element("document", {}, 1)
        self.stack = [self.root]
        self.nodes = []

    def handle_starttag(self, tag, attrs):
        if len(self.nodes) >= 30000 or len(self.stack) > 128:
            raise ValueError("Source exceeds the 30,000-element or 128-level inspection limit.")
        node = Element(tag, dict(attrs), self.getpos()[0], self.stack[-1])
        self.stack[-1].children.append(node)
        self.nodes.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for pos in range(len(self.stack) - 1, 0, -1):
            if self.stack[pos].tag == tag:
                del self.stack[pos:]
                return

    def handle_data(self, data):
        self.stack[-1].children.append(data)


def normal(text):
    return " ".join(text.split())


def text_of(node, label=False):
    pieces = []
    for child in node.children:
        if isinstance(child, str):
            pieces.append(child)
        elif child.tag not in QUIET and not (label and child.tag in CONTROLS):
            if child.tag == "img":
                pieces.append(child.attrs.get("alt", ""))
            pieces.append(text_of(child, label))
    return normal(" ".join(pieces))


def mark_visibility(node, hidden=False, aria_hidden=False):
    style = re.sub(r"\s+", "", (node.attrs.get("style") or "").lower())
    hidden = hidden or node.tag in QUIET or "hidden" in node.attrs
    hidden = hidden or bool(re.search(r"(?:^|;)(?:display:none|visibility:(?:hidden|collapse))(?:!important)?(?:;|$)", style))
    hidden = hidden or (node.tag == "input" and (node.attrs.get("type") or "").lower() == "hidden")
    node.visible = not hidden
    node.aria_hidden = aria_hidden or (node.attrs.get("aria-hidden") or "").lower() == "true"
    summary = next((c for c in node.children if isinstance(c, Element) and c.tag == "summary"), None)
    for child in node.children:
        if isinstance(child, Element):
            closed_content = node.tag == "details" and "open" not in node.attrs and child is not summary
            mark_visibility(child, hidden or closed_content, node.aria_hidden)


def visible_text(node):
    if not node.visible:
        return ""
    pieces = []
    closed = node.tag == "details" and "open" not in node.attrs
    for child in node.children:
        if isinstance(child, str):
            if not closed:
                pieces.append(child)
        else:
            pieces.append(visible_text(child))
    return normal(" ".join(pieces))


def is_control(node):
    return node.tag in CONTROLS or (node.tag == "a" and "href" in node.attrs)


def name_evidence(node, ids, labels):
    attrs = node.attrs
    sources, text = [], ""
    refs = (attrs.get("aria-labelledby") or "").split()
    if refs:
        text = normal(" ".join(text_of(ids[r]) for r in refs if r in ids))
        sources.append("aria-labelledby source")
    if not text and normal(attrs.get("aria-label") or ""):
        text = normal(attrs["aria-label"])
        sources.append("aria-label")
    if not text and attrs.get("id") in labels:
        text = normal(" ".join(text_of(label, True) for label in labels[attrs["id"]]))
        sources.append("label for")
    parent = node.parent
    while not text and parent:
        if parent.tag == "label":
            text = text_of(parent, True)
            sources.append("wrapping label")
        parent = parent.parent
    if not text and node.tag in {"button", "a", "summary"}:
        text = text_of(node)
        sources.append("element content")
    kind = (attrs.get("type") or "text").lower()
    if not text and node.tag == "input" and kind in {"submit", "reset", "button", "image"}:
        text = normal((attrs.get("alt") if kind == "image" else attrs.get("value")) or "")
        if not text and kind in {"submit", "reset"}:
            text = f"browser default {kind} label (locale unverified)"
        sources.append("input value/alt/default")
    if not text and attrs.get("title"):
        text = normal(attrs["title"])
        sources.append("title only")
    return {"text": text[:200], "sources": sources}


def inspect_html(html, name):
    parser = Source()
    parser.feed(html)
    parser.close()
    mark_visibility(parser.root)
    nodes = parser.nodes
    ids, occurrences, labels, concerns = {}, Counter(), {}, []
    for node in nodes:
        ident = node.attrs.get("id")
        if ident:
            ids.setdefault(ident, node)
            occurrences[ident] += 1
        if node.tag == "label" and node.attrs.get("for"):
            labels.setdefault(node.attrs["for"], []).append(node)
    duplicates = {key: count for key, count in occurrences.items() if count > 1}
    if duplicates:
        concerns.append({"code": "duplicate_ids", "ids": duplicates})
    title = next((text_of(n) for n in nodes if n.tag == "title"), "")
    lang = next(((n.attrs.get("lang") or "").strip() for n in nodes if n.tag == "html"), "")
    if not title:
        concerns.append({"code": "missing_title"})
    if not lang:
        concerns.append({"code": "missing_document_language"})
    broken = []
    anchors = set(ids) | {n.attrs["name"] for n in nodes if n.tag == "a" and n.attrs.get("name")}
    for node in nodes:
        if node.tag == "label" and node.attrs.get("for") and node.attrs["for"] not in ids:
            broken.append({"line": node.line, "attribute": "label for", "target": node.attrs["for"]})
        for attr in REFS:
            for ref in (node.attrs.get(attr) or "").split():
                if ref not in ids:
                    broken.append({"line": node.line, "attribute": attr, "target": ref})
        href = node.attrs.get("href") or ""
        if node.tag == "a" and href.startswith("#") and len(href) > 1 and unquote(href[1:]) not in anchors:
            broken.append({"line": node.line, "attribute": "href fragment", "target": unquote(href[1:])})
    if broken:
        concerns.append({"code": "unresolved_source_references", "references": broken})
    controls = []
    for node in nodes:
        if not is_control(node):
            continue
        evidence = name_evidence(node, ids, labels)
        item = {"tag": node.tag, "line": node.line, "id": node.attrs.get("id"),
                "source_visible": node.visible, "disabled_attribute": "disabled" in node.attrs,
                "aria_hidden_ancestor": node.aria_hidden, "name_evidence": evidence}
        controls.append(item)
        if node.visible and not evidence["text"]:
            concerns.append({"code": "no_static_name_evidence", "tag": node.tag, "line": node.line, "id": node.attrs.get("id")})
        if node.visible and node.aria_hidden:
            concerns.append({"code": "visible_control_inside_aria_hidden", "tag": node.tag, "line": node.line})
    disclosures = []
    for node in nodes:
        if node.tag == "details":
            summary = next((c for c in node.children if isinstance(c, Element) and c.tag == "summary"), None)
            label = text_of(summary) if summary else ""
            disclosures.append({"line": node.line, "label": label[:200], "open_attribute": "open" in node.attrs, "source_visible": node.visible})
            if not label:
                concerns.append({"code": "disclosure_without_authored_name", "line": node.line})
    resources = []
    for node in nodes:
        attr = "src" if node.tag in {"script", "img", "iframe", "audio", "video", "source", "track", "embed"} else "href" if node.tag == "link" else None
        if attr and node.attrs.get(attr):
            value = node.attrs[attr]
            resources.append("network" if urlsplit(value).scheme in {"http", "https"} or value.startswith("//") else "other/local")
    shown = [c for c in controls if c["source_visible"]]
    return {
        "file": name, "scope": "one authored HTML file; no scripts executed or linked assets read",
        "observations": {"title": title[:300], "language": lang, "duplicate_ids": duplicates,
                         "native_controls_total": len(controls), "source_visible_native_controls": len(shown),
                         "source_visible_control_types": dict(Counter(c["tag"] for c in shown)),
                         "source_visible_text_words": len(visible_text(parser.root).split()),
                         "controls": controls, "optional_disclosures": disclosures,
                         "referenced_resources_by_kind": dict(Counter(resources)), "asset_files_read": 0},
        "concerns": concerns,
        "unverified": ["CSS, script-generated or repaired browser DOM may change these source observations.",
                       "Accessible names are source evidence, not the browser's computed accessibility tree.",
                       "Keyboard/focus, layout/reflow, contrast, runtime data/requests, saving and task completion need permitted execution checks.",
                       "Control/text counts have no universal usability threshold. This report is not WCAG conformance or participant validation."]
    }


def read_entry(entry, scope=None):
    entry = Path(entry).absolute()
    root = Path(scope).absolute() if scope else entry.parent
    if root.is_symlink() or not root.is_dir():
        raise ValueError("Scope must be an existing regular directory, not a symlink.")
    try:
        entry.relative_to(root)
    except ValueError:
        raise ValueError("Entry must be inside the explicit scope directory.") from None
    check = entry
    while check != root:
        if check.is_symlink():
            raise ValueError("Symlink entries or path components are not inspected.")
        check = check.parent
    resolved_root = root.resolve(strict=True)
    resolved_entry = entry.resolve(strict=True)
    if not resolved_entry.is_relative_to(resolved_root):
        raise ValueError("Entry resolves outside the explicit scope directory.")
    if not stat.S_ISREG(entry.lstat().st_mode):
        raise ValueError("Entry must be a regular HTML file.")
    if entry.suffix.lower() not in {".html", ".htm"}:
        raise ValueError("Entry must have an .html or .htm extension.")
    flags = os.O_RDONLY | getattr(os, "O_NOFOLLOW", 0) | getattr(os, "O_NONBLOCK", 0)
    descriptor = os.open(entry, flags)
    with os.fdopen(descriptor, "rb") as handle:
        if not stat.S_ISREG(os.fstat(handle.fileno()).st_mode):
            raise ValueError("Entry must remain a regular file.")
        data = handle.read(2 * 1024 * 1024 + 1)
    if len(data) > 2 * 1024 * 1024:
        raise ValueError("Entry exceeds the 2 MiB source inspection limit.")
    return data.decode("utf-8-sig"), str(resolved_entry.relative_to(resolved_root))


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("entry", help="One local .html/.htm source file")
    ap.add_argument("--root", help="Optional containing scope directory; defaults to the entry's directory")
    ap.add_argument("--json", action="store_true", help="JSON is the default output (accepted for explicit use)")
    args = ap.parse_args(argv)
    try:
        html, name = read_entry(args.entry, args.root)
        result = inspect_html(html, name)
    except (OSError, UnicodeError, ValueError) as exc:
        print(json.dumps({"error": str(exc), "inspection_completed": False}, ensure_ascii=False))
        return 2
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
