"""Meaningful source/visibility/scope fixtures for the optional offline inspector."""
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
from unittest.mock import patch

sys.dont_write_bytecode = True

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts/audit_ui.py"
spec = importlib.util.spec_from_file_location("plain_steps_audit", SCRIPT)
audit = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = audit
spec.loader.exec_module(audit)
results = []


def check(name, fn):
    fn()
    results.append({"name": name, "passed": True})


def inspect(body):
    return audit.inspect_html(f'<!doctype html><html lang="en"><head><title>Fictional app</title></head><body>{body}</body></html>', "index.html")


def counts():
    r = inspect('<main><h1>Plan</h1><button>Start plan</button><section hidden><button>Save draft</button></section>'
                '<details><summary>More information</summary>Hidden prose <button>Hidden action</button></details>'
                '<details open><summary>Visible detail</summary>Visible prose <button>Visible action</button></details></main>')
    o = r["observations"]
    assert o["native_controls_total"] == 6
    assert o["source_visible_native_controls"] == 4
    assert o["source_visible_text_words"] == 11
    assert [d["label"] for d in o["optional_disclosures"]] == ["More information", "Visible detail"]
    assert [d["open_attribute"] for d in o["optional_disclosures"]] == [False, True]
    assert not r["concerns"]


def hidden_nested():
    r = inspect('<div style="display: none"><button>One</button></div><div hidden="false"><button>Two</button></div>'
                '<div style="visibility: hidden !important;"><input aria-label="Three"></div>'
                '<button aria-hidden="true">Four</button><input type="hidden" value="token"><button>Five</button>')
    o = r["observations"]
    assert o["source_visible_native_controls"] == 2
    assert len([c for c in r["concerns"] if c["code"] == "visible_control_inside_aria_hidden"]) == 1
    assert not [c for c in r["concerns"] if c["code"] == "no_static_name_evidence"]


def label_sources():
    r = inspect('<label for="area">Wall area</label><input id="area">'
                '<label><input type="checkbox">Packed</label><span id="custom">Chosen option</span>'
                '<select aria-labelledby="custom"><option>One</option></select>'
                '<button aria-label="Save plan"><span aria-hidden="true">★</span></button>'
                '<a href="#destination"><img alt="Skip to results"></a><p id="destination">Results</p>')
    assert [c["name_evidence"]["text"] for c in r["observations"]["controls"]] == [
        "Wall area", "Packed", "Chosen option", "Save plan", "Skip to results"]
    assert not r["concerns"]


def malformed_references():
    r = audit.inspect_html('<html><button></button><input id="same"><p id="same">A</p>'
                           '<label for="absent">Area</label><textarea aria-describedby="missing"></textarea>'
                           '<a href="#lost">Skip</a><details><p>No authored summary</p></details></html>', "bad.html")
    codes = {c["code"] for c in r["concerns"]}
    assert {"missing_title", "missing_document_language", "duplicate_ids", "no_static_name_evidence",
            "unresolved_source_references", "disclosure_without_authored_name"} <= codes
    refs = next(c["references"] for c in r["concerns"] if c["code"] == "unresolved_source_references")
    assert {v["target"] for v in refs} == {"absent", "missing", "lost"}


def dynamic_unknown():
    r = inspect('<main><div id="app"></div><script>document.getElementById("app").innerHTML="<button>Run</button>";</script>'
                '<button class="hidden-by-external-css">Authored action</button>')
    assert r["observations"]["source_visible_native_controls"] == 1
    assert r["observations"]["source_visible_text_words"] == 2
    assert r["unverified"]
    assert "pass" not in r and "conformance" not in r
    try:
        audit.inspect_html("<div>" * 140, "deep.html")
    except ValueError:
        pass
    else:
        raise AssertionError("Unbounded source nesting was accepted")


def scope_files():
    with tempfile.TemporaryDirectory(prefix="audit-fixtures-", dir=ROOT / "work/v2") as temporary:
        root = Path(temporary)
        scope = root / "scope"
        scope.mkdir()
        source = scope / "index.html"
        source.write_text('<html lang="en"><title>Scope</title><script src="../../not-authorised.js"></script>'
                          '<img src="https://example.invalid/not-fetched.png" alt="Example"></html>')
        real_open = audit.os.open
        with patch.object(audit.os, "open", wraps=real_open) as opened:
            html, name = audit.read_entry(source, scope)
            report = audit.inspect_html(html, name)
            assert opened.call_count == 1
            assert Path(opened.call_args.args[0]) == source
        assert report["observations"]["asset_files_read"] == 0
        assert report["observations"]["referenced_resources_by_kind"] == {"other/local": 1, "network": 1}
        assert name == "index.html"
        outside = root / "outside.html"
        outside.write_text("<title>Outside</title>")
        link = scope / "linked.html"
        link.symlink_to(outside)
        for path in (outside, link, scope):
            try:
                audit.read_entry(path, scope)
            except (ValueError, OSError):
                pass
            else:
                raise AssertionError(f"Accepted out-of-scope, symlink or nonregular input: {path.name}")
        nested_link = scope / "alias"
        nested_link.symlink_to(root, target_is_directory=True)
        try:
            audit.read_entry(nested_link / "outside.html", scope)
        except (ValueError, OSError):
            pass
        else:
            raise AssertionError("Accepted a symlink path component")
        large = scope / "large.html"
        large.write_bytes(b" " * (2 * 1024 * 1024 + 1))
        try:
            audit.read_entry(large, scope)
        except ValueError:
            pass
        else:
            raise AssertionError("Accepted oversized input")
        good = subprocess.run([sys.executable, str(SCRIPT), str(source), "--root", str(scope), "--json"], capture_output=True, text=True)
        assert good.returncode == 0 and json.loads(good.stdout)["observations"]["asset_files_read"] == 0
        bad = subprocess.run([sys.executable, str(SCRIPT), str(link), "--root", str(scope)], capture_output=True, text=True)
        assert bad.returncode == 2 and json.loads(bad.stdout)["inspection_completed"] is False


check("initial authored visibility distinguishes hidden sections and closed/open details", counts)
check("nested hidden attributes/inline styles stay separate from aria-hidden semantics", hidden_nested)
check("native label, wrapping label, ARIA and image-alt name evidence is reported", label_sources)
check("missing names/language/title, duplicate IDs and dangling references are concerns", malformed_references)
check("script content is not executed or counted; CSS and runtime behaviour stay unverified", dynamic_unknown)
check("one scoped regular HTML is read; linked assets untouched; symlink/escape/size inputs rejected; CLI works", scope_files)
receipt = {"checks_passed": len(results), "results": results,
           "limits": ["HTML source inspection only; no browser, asset/network access or script execution.",
                      "No universal control-count threshold, usability or WCAG conformance result."]}
(ROOT / "work/v2/audit-results.json").write_text(json.dumps(receipt, indent=2) + "\n")
print(json.dumps(receipt, indent=2))
