#!/usr/bin/env python3
"""Prepare optional, project-only Plain Steps instructions. No network or host settings."""
from __future__ import annotations

import argparse
import errno
import hashlib
import json
import os
from pathlib import Path
import re
import stat
from typing import Any

MAX_AGENTS_BYTES = 64 * 1024
STANDARD_FILE = "AGENTS.md"
OVERRIDE_FILE = "AGENTS.override.md"
BEGIN = "<!-- plain-steps:project-guidance:begin -->"
END = "<!-- plain-steps:project-guidance:end -->"
BLOCK = f"""{BEGIN}
## Plain Steps for this project

For user-facing app creation or repair, use the installed Plain Steps `build-clear-apps` workflow when available. For rough or multi-intent requests, corrections, drafts, rewrites, or incoming-message explanations, use `keep-the-meaning` when relevant. Answer simple unrelated questions directly. Preserve the person's current goal, numbers, exclusions, uncertainty, voice, and latest corrections. Do not add features, access records, publish, spend, or change permissions merely because these instructions are present. Current user instructions and existing permission boundaries take precedence. Verify the actual requested operation and user journey before claiming completion; distinguish source, logic, browser, and participant evidence.
{END}
"""


class SetupError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code


def _protected_roots() -> tuple[Path, ...]:
    home = Path(os.path.abspath(Path.home()))
    return tuple(home / p for p in (".codex", ".agents", ".ssh", ".config", ".local", "Library")) + (
        Path("/System"), Path("/Library"), Path("/Applications"), Path("/etc"),
    )


def _project_path(value: str | os.PathLike[str]) -> Path:
    raw = Path(value).expanduser()
    if ".." in raw.parts:
        raise SetupError("ambiguous_path", "Choose the explicit project path without '..' components.")
    project = Path(os.path.abspath(raw))
    if project == Path(project.anchor) or project == Path(os.path.abspath(Path.home())):
        raise SetupError("broad_scope", "Choose one project directory, not a home or filesystem root.")
    if any(project == root or root in project.parents for root in _protected_roots()):
        raise SetupError("protected_scope", "Choose a project outside host settings, credentials and application directories.")
    return project


def _flags() -> tuple[int, int]:
    if not hasattr(os, "O_NOFOLLOW") or not hasattr(os, "O_DIRECTORY") or os.open not in os.supports_dir_fd:
        raise SetupError("unsupported_platform", "This helper needs non-following, directory-relative file operations. Use a supported host editor instead.")
    return os.O_NOFOLLOW, os.O_DIRECTORY


def _open_project(project: Path) -> int:
    nofollow, directory = _flags()
    fd = os.open(project.anchor, os.O_RDONLY | directory | nofollow)
    try:
        for part in project.parts[1:]:
            child = os.open(part, os.O_RDONLY | directory | nofollow, dir_fd=fd)
            os.close(fd)
            fd = child
        return fd
    except OSError:
        os.close(fd)
        raise SetupError("project_unavailable", "The project must already exist as a real directory, with no symlink path components.")


def _identity(info: os.stat_result) -> tuple[int, int]:
    return info.st_dev, info.st_ino


def _named_project_matches(project: Path, directory_fd: int) -> bool:
    try:
        named_fd = _open_project(project)
        try:
            return _identity(os.fstat(named_fd)) == _identity(os.fstat(directory_fd))
        finally:
            os.close(named_fd)
    except (OSError, SetupError):
        return False


def _named_agents_matches(directory_fd: int, inspected: os.stat_result, filename: str = STANDARD_FILE) -> bool:
    try:
        current = os.stat(filename, dir_fd=directory_fd, follow_symlinks=False)
    except OSError:
        return False
    return (
        stat.S_ISREG(current.st_mode) and current.st_nlink == 1
        and _identity(current) == _identity(inspected)
        and (current.st_size, current.st_mtime_ns, current.st_ctime_ns)
        == (inspected.st_size, inspected.st_mtime_ns, inspected.st_ctime_ns)
    )


def _read_agents(directory_fd: int, filename: str = STANDARD_FILE) -> tuple[bytes, os.stat_result] | None:
    try:
        before = os.stat(filename, dir_fd=directory_fd, follow_symlinks=False)
    except FileNotFoundError:
        return None
    if not stat.S_ISREG(before.st_mode) or before.st_nlink != 1:
        raise SetupError("unsafe_agents", "The existing instruction source must be one regular, non-symlink, non-hardlinked file. It was not read or changed.")
    if before.st_size > MAX_AGENTS_BYTES:
        raise SetupError("agents_too_large", "The existing instruction source exceeds the bounded read limit and was not changed.")
    nofollow, _ = _flags()
    fd = os.open(filename, os.O_RDONLY | nofollow | getattr(os, "O_NONBLOCK", 0), dir_fd=directory_fd)
    try:
        current = os.fstat(fd)
        if not stat.S_ISREG(current.st_mode) or current.st_nlink != 1 or _identity(current) != _identity(before):
            raise SetupError("agents_changed", "The instruction source changed during inspection. No setup edit was made.")
        parts: list[bytes] = []
        remaining = MAX_AGENTS_BYTES + 1
        while remaining:
            part = os.read(fd, min(8192, remaining))
            if not part:
                break
            parts.append(part)
            remaining -= len(part)
        data = b"".join(parts)
        after = os.fstat(fd)
        if len(data) > MAX_AGENTS_BYTES:
            raise SetupError("agents_too_large", "The instruction source grew beyond the bounded read limit and was not changed.")
        if (after.st_size, after.st_mtime_ns, after.st_ctime_ns) != (current.st_size, current.st_mtime_ns, current.st_ctime_ns):
            raise SetupError("agents_changed", "The instruction source changed during inspection. No setup edit was made.")
        return data, after
    finally:
        os.close(fd)


def _exact_managed_block(data: bytes) -> bool:
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError:
        return False
    if text.count(BEGIN) != 1 or text.count(END) != 1:
        return False
    start = text.index(BEGIN)
    finish = text.index(END) + len(END)
    if text[start:finish] != BLOCK.rstrip("\n"):
        return False
    fence: tuple[str, int] | None = None
    for line in text[:start].splitlines():
        marker = re.match(r"^ {0,3}(`{3,}|~{3,})(.*)$", line)
        if not marker:
            continue
        chars, trailing = marker.groups()
        if fence is None:
            fence = (chars[0], len(chars))
        elif chars[0] == fence[0] and len(chars) >= fence[1] and not trailing.strip():
            fence = None
    return fence is None


def _present(directory_fd: int, filename: str) -> bool:
    try:
        os.stat(filename, dir_fd=directory_fd, follow_symlinks=False)
        return True
    except FileNotFoundError:
        return False


def _source(directory_fd: int, active_file: str | None) -> tuple[str | None, bool]:
    # Only known per-directory precedence and an explicitly host-confirmed fallback.
    for filename in (OVERRIDE_FILE, STANDARD_FILE):
        if _present(directory_fd, filename):
            return filename, True
    if active_file == STANDARD_FILE:
        return STANDARD_FILE, False
    if active_file is not None:
        if not _present(directory_fd, active_file):
            raise SetupError("active_source_missing", "The host-confirmed instruction source is not present. Refresh the source check; no file was created.")
        return active_file, True
    return None, False


def configure(project_value: str | os.PathLike[str], mode: str = "preview", active_file: str | None = None) -> dict[str, Any]:
    if mode not in {"preview", "check", "apply"}:
        raise SetupError("invalid_mode", "Choose preview, check or apply.")
    if active_file is not None and not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{0,119}\.(?:md|txt)", active_file, re.IGNORECASE):
        raise SetupError("unsupported_instruction_name", "Supply the host-confirmed basename of a Markdown/text instruction file, without directory components. Other sources need a supported host editor.")
    project = _project_path(project_value)
    directory_fd = _open_project(project)
    base: dict[str, Any] = {
        "project": str(project), "target": "AGENTS.md", "mode": mode, "changed": False,
        "scope": "This project only; no global rules, host settings, hooks, credentials, chat records or network access.",
        "limits": "Instructions are configuration. Verify actual skill selection and useful task completion separately.",
    }
    try:
        target, observed_existing = _source(directory_fd, active_file)
        base["target"] = target
        if target is None:
            return {**base, "state": "source_unconfirmed", "would_create": False, "instruction_block": BLOCK, "message": "Confirm the host's active instruction source and custom fallbacks before applying. Use --active-file AGENTS.md only after confirming standard new-file setup. No file was written."}
        existing = _read_agents(directory_fd, target)
        if not _named_project_matches(project, directory_fd):
            raise SetupError("project_changed", "The chosen project changed during inspection. No setup edit was made.")
        if _source(directory_fd, active_file)[0] != target:
            return {**base, "state": "merge_required", "instruction_block": BLOCK, "message": "The active instruction source changed. Refresh the host's source view before merging; nothing was written."}
        if existing is not None:
            data, inspected = existing
            if not _named_agents_matches(directory_fd, inspected, target):
                raise SetupError("agents_changed", "The instruction source changed after inspection. No setup edit was made.")
            try:
                empty_candidate = not data.decode("utf-8").strip()
            except UnicodeDecodeError:
                empty_candidate = False
            if empty_candidate:
                return {**base, "target": None, "state": "ambiguous_source", "would_create": False, "instruction_block": BLOCK, "message": "A project instruction candidate is empty or whitespace-only. Inspect the host's active instruction chain before merging; no file was written and no source was assumed active."}
            if _exact_managed_block(data):
                return {**base, "state": "already_configured", "sha256": hashlib.sha256(data).hexdigest(), "message": "The exact project block is already present. Nothing was written."}
            return {**base, "state": "merge_required", "instruction_block": BLOCK, "message": "Existing project instructions were preserved. A supported host editor must review and merge only the proposed block under the user's project-scoped authority."}
        if observed_existing or target != STANDARD_FILE:
            return {**base, "state": "conflict", "message": "An observed instruction source disappeared. It was not recreated. Refresh the active-source check before merging."}
        if mode != "apply":
            return {**base, "state": "preview" if mode == "preview" else "not_configured", "would_create": True, "instruction_block": BLOCK, "message": "No file was written. Apply only for the explicitly chosen project."}

        # Pin the chosen directory and refuse a substituted project path before creating anything.
        if not _named_project_matches(project, directory_fd):
            raise SetupError("project_changed", "The chosen project changed. No setup file was created.")
        if _source(directory_fd, active_file)[0] != STANDARD_FILE:
            return {**base, "state": "merge_required", "instruction_block": BLOCK, "message": "A higher-priority instruction source appeared. It was preserved; no shadowing file was created."}
        nofollow, _ = _flags()
        try:
            created_fd = os.open("AGENTS.md", os.O_WRONLY | os.O_CREAT | os.O_EXCL | nofollow | getattr(os, "O_NONBLOCK", 0), 0o644, dir_fd=directory_fd)
        except FileExistsError:
            return {**base, "state": "conflict", "message": "AGENTS.md appeared during setup. It was not opened for writing or replaced. Inspect it before merging."}
        created_identity: tuple[int, int] | None = None
        try:
            created_identity = _identity(os.fstat(created_fd))
            payload = BLOCK.encode("utf-8")
            offset = 0
            while offset < len(payload):
                written = os.write(created_fd, payload[offset:])
                if written <= 0:
                    raise OSError(errno.EIO, "Incomplete project instruction write")
                offset += written
            os.fsync(created_fd)
        except OSError:
            return {**base, "state": "created_unverified", "changed": True, "message": "A new setup file may be incomplete. It was retained for inspection; no existing file was replaced. Do not claim configuration verified."}
        finally:
            os.close(created_fd)
        try:
            readback = _read_agents(directory_fd)
        except (OSError, SetupError):
            readback = None
        if (readback is None or readback[0] != BLOCK.encode("utf-8")
                or _identity(readback[1]) != created_identity
                or not _named_agents_matches(directory_fd, readback[1])):
            return {**base, "state": "created_unverified", "changed": True, "message": "The new file could not be verified or changed during readback. It was retained; inspect it before relying on setup."}
        if not _named_project_matches(project, directory_fd):
            return {**base, "state": "created_unverified", "changed": True, "message": "The project path changed before verification. The new file was retained in the originally selected directory; inspect it before relying on setup at the named path."}
        if _source(directory_fd, active_file)[0] != STANDARD_FILE:
            return {**base, "state": "created_unverified", "changed": True, "message": "A higher-priority instruction source appeared during setup. The new file was retained, but setup is unverified; merge into the active source with a supported host editor."}
        return {**base, "state": "created_verified", "changed": True, "sha256": hashlib.sha256(readback[0]).hexdigest(), "message": "Created only this project's AGENTS.md and verified immediate exact readback. Actual host activation and task behaviour still need checking."}
    finally:
        os.close(directory_fd)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Preview or apply optional Plain Steps guidance for one existing project. Never overwrites AGENTS.md.")
    parser.add_argument("project", help="Explicit existing project directory")
    modes = parser.add_mutually_exclusive_group()
    modes.add_argument("--apply", action="store_true", help="Create AGENTS.md only if absent; preserve existing instructions")
    modes.add_argument("--check", action="store_true", help="Read-only configuration check")
    parser.add_argument("--active-file", help="Host-confirmed instruction basename; confirm AGENTS.md explicitly for standard new-file setup after checking custom fallbacks")
    args = parser.parse_args(argv)
    mode = "apply" if args.apply else "check" if args.check else "preview"
    try:
        result = configure(args.project, mode, args.active_file)
    except SetupError as error:
        result = {"state": "refused", "changed": False, "error": error.code, "message": str(error)}
    except OSError as error:
        result = {"state": "refused", "changed": False, "error": "filesystem_error", "message": f"Project access failed ({error.strerror or 'filesystem error'}). No global settings were changed."}
    print(json.dumps(result, ensure_ascii=False, indent=2))
    state = result["state"]
    if state in {"refused", "created_unverified", "conflict"}:
        return 2
    if mode == "apply" and state in {"merge_required", "source_unconfirmed", "ambiguous_source"}:
        return 3
    if mode == "check" and state != "already_configured":
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
