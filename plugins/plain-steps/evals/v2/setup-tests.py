"""Filesystem/CLI checks with synthetic instructions only; no model, browser or network."""
import importlib.util
import hashlib
import json
import os
from pathlib import Path
import stat
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[2]
HELPER = ROOT / "scripts/setup_project.py"
spec = importlib.util.spec_from_file_location("plain_steps_setup", HELPER)
setup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(setup)


class ProjectSetupChecks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temporary = tempfile.TemporaryDirectory(prefix="plain-steps-setup-fixtures-")
        cls.base = Path(cls.temporary.name)

    @classmethod
    def tearDownClass(cls):
        cls.temporary.cleanup()

    def project(self, name):
        path = self.base / name
        path.mkdir()
        return path

    def standard(self, project, mode="preview"):
        return setup.configure(project, mode, active_file="AGENTS.md")

    def test_preview_and_missing_check_never_create_files(self):
        p = self.project("readonly")
        self.assertEqual(self.standard(p)["state"], "preview")
        self.assertEqual(self.standard(p, "check")["state"], "not_configured")
        self.assertEqual(list(p.iterdir()), [])

    def test_apply_creates_only_new_file_with_exact_readback(self):
        p = self.project("create")
        result = self.standard(p, "apply")
        self.assertEqual(result["state"], "created_verified")
        data = (p / "AGENTS.md").read_bytes()
        self.assertEqual(data, setup.BLOCK.encode())
        self.assertEqual(result["sha256"], hashlib.sha256(data).hexdigest())
        self.assertEqual([f.name for f in p.iterdir()], ["AGENTS.md"])
        self.assertEqual(stat.S_IMODE((p / "AGENTS.md").stat().st_mode) & 0o022, 0)

    def test_exact_existing_block_is_noop_with_surrounding_rules(self):
        p = self.project("idempotent")
        target = p / "AGENTS.md"
        original = b"# Existing rules\nKeep all work local.\n\n" + setup.BLOCK.encode() + b"\nRetain the existing lint command.\n"
        target.write_bytes(original)
        before = target.stat()
        result = self.standard(p, "apply")
        after = target.stat()
        self.assertEqual(result["state"], "already_configured")
        self.assertFalse(result["changed"])
        self.assertEqual((before.st_ino, before.st_mtime_ns, before.st_mode), (after.st_ino, after.st_mtime_ns, after.st_mode))
        self.assertEqual(target.read_bytes(), original)

    def test_existing_altered_duplicate_and_example_blocks_are_preserved(self):
        cases = {
            "foreign": "# DO_NOT_ECHO_EXISTING_CONTENT\nKeep the existing process.\n",
            "altered": setup.BLOCK.replace("Current user instructions", "Existing custom instructions"),
            "duplicated": setup.BLOCK + setup.BLOCK,
            "fenced": "```markdown\n" + setup.BLOCK + "```\n",
        }
        for name, original in cases.items():
            with self.subTest(name=name):
                p = self.project(name)
                target = p / "AGENTS.md"
                target.write_text(original)
                result = self.standard(p, "apply")
                self.assertEqual(result["state"], "merge_required")
                self.assertFalse(result["changed"])
                self.assertEqual(result["instruction_block"], setup.BLOCK)
                self.assertNotIn("DO_NOT_ECHO_EXISTING_CONTENT", json.dumps(result))
                self.assertEqual(target.read_text(), original)

    def test_symlink_project_ancestor_and_instruction_file_are_refused(self):
        outside = self.project("symlink-real")
        (outside / "child").mkdir()
        link = self.base / "project-link"
        link.symlink_to(outside, target_is_directory=True)
        for selected in [link, link / "child"]:
            with self.subTest(path=selected.name), self.assertRaises(setup.SetupError):
                self.standard(selected, "apply")
        p = self.project("agents-link")
        source = self.base / "synthetic-outside.md"
        source.write_text("Synthetic instructions must stay intact.")
        (p / "AGENTS.md").symlink_to(source)
        with self.assertRaises(setup.SetupError):
            self.standard(p, "apply")
        self.assertEqual(source.read_text(), "Synthetic instructions must stay intact.")

    def test_nonregular_hardlinked_and_large_files_are_refused(self):
        p = self.project("agents-directory")
        (p / "AGENTS.md").mkdir()
        with self.assertRaises(setup.SetupError):
            self.standard(p, "apply")
        p = self.project("agents-fifo")
        os.mkfifo(p / "AGENTS.md")
        with self.assertRaises(setup.SetupError):
            self.standard(p, "apply")
        p = self.project("agents-hardlink")
        source = self.base / "hardlink-source.md"
        source.write_text("Keep this synthetic file.")
        os.link(source, p / "AGENTS.md")
        with self.assertRaises(setup.SetupError):
            self.standard(p, "apply")
        self.assertEqual(source.read_text(), "Keep this synthetic file.")
        p = self.project("agents-large")
        original = b"x" * (setup.MAX_AGENTS_BYTES + 1)
        (p / "AGENTS.md").write_bytes(original)
        with self.assertRaises(setup.SetupError):
            self.standard(p, "apply")
        self.assertEqual((p / "AGENTS.md").read_bytes(), original)

    def test_missing_nondirectory_ambiguous_and_protected_scope_make_no_directories(self):
        missing = self.base / "does-not-exist"
        with self.assertRaises(setup.SetupError):
            self.standard(missing, "apply")
        self.assertFalse(missing.exists())
        file_path = self.base / "not-a-directory"
        file_path.write_text("Keep file.")
        with self.assertRaises(setup.SetupError):
            self.standard(file_path, "apply")
        p = self.project("protected-fixture")
        with patch.object(setup, "_protected_roots", return_value=(p,)):
            with self.assertRaises(setup.SetupError):
                self.standard(p, "apply")
        self.assertEqual(list(p.iterdir()), [])
        with self.assertRaises(setup.SetupError):
            self.standard(p / ".." / p.name, "apply")

    def test_competing_file_at_exclusive_create_is_never_overwritten(self):
        p = self.project("exclusive-race")
        original_open = os.open
        competitor = b"# Concurrent editor\nKeep this content.\n"
        fired = False

        def racing_open(path, flags, *args, **kwargs):
            nonlocal fired
            if path == "AGENTS.md" and flags & os.O_CREAT and not fired:
                fired = True
                fd = original_open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600, dir_fd=kwargs["dir_fd"])
                os.write(fd, competitor)
                os.close(fd)
            return original_open(path, flags, *args, **kwargs)

        with patch.object(setup.os, "open", side_effect=racing_open):
            # Preserve capability lookup while the open function is mocked.
            with patch.object(setup, "_flags", return_value=(os.O_NOFOLLOW, os.O_DIRECTORY)):
                result = self.standard(p, "apply")
        self.assertEqual(result["state"], "conflict")
        self.assertFalse(result["changed"])
        self.assertEqual((p / "AGENTS.md").read_bytes(), competitor)

    def test_changed_readback_is_retained_without_verified_claim(self):
        p = self.project("readback-change")
        original_fsync = os.fsync
        replacement = b"# Another editor's synthetic instructions\n"

        def after_sync(fd):
            original_fsync(fd)
            (p / "AGENTS.md").write_bytes(replacement)

        with patch.object(setup.os, "fsync", side_effect=after_sync):
            result = self.standard(p, "apply")
        self.assertEqual(result["state"], "created_unverified")
        self.assertEqual((p / "AGENTS.md").read_bytes(), replacement)
        self.assertNotIn("sha256", result)

    def test_replaced_inode_even_with_exact_content_is_not_claimed_verified(self):
        p = self.project("readback-replacement")
        original_fsync = os.fsync

        def after_sync(fd):
            original_fsync(fd)
            (p / "AGENTS.md").unlink()
            (p / "AGENTS.md").write_text(setup.BLOCK)

        with patch.object(setup.os, "fsync", side_effect=after_sync):
            result = self.standard(p, "apply")
        self.assertEqual(result["state"], "created_unverified")
        self.assertEqual((p / "AGENTS.md").read_text(), setup.BLOCK)

    def test_partial_write_failure_keeps_inspectable_file(self):
        p = self.project("partial-write")
        original_write = os.write
        calls = 0

        def interrupted_write(fd, payload):
            nonlocal calls
            calls += 1
            if calls == 1:
                return original_write(fd, payload[:8])
            raise OSError("Synthetic interrupted write")

        with patch.object(setup.os, "write", side_effect=interrupted_write):
            result = self.standard(p, "apply")
        self.assertEqual(result["state"], "created_unverified")
        self.assertEqual((p / "AGENTS.md").read_bytes(), setup.BLOCK.encode()[:8])
        self.assertEqual(self.standard(p, "apply")["state"], "merge_required")

    def test_project_substitution_before_create_is_detected(self):
        p = self.project("project-race")
        moved = self.base / "project-race-original"
        original_open_project = setup._open_project
        count = 0

        def swapped_project(project):
            nonlocal count
            count += 1
            if count == 2:
                p.rename(moved)
                p.mkdir()
            return original_open_project(project)

        with patch.object(setup, "_open_project", side_effect=swapped_project):
            with self.assertRaisesRegex(setup.SetupError, "project changed"):
                self.standard(p, "apply")
        self.assertFalse((p / "AGENTS.md").exists())
        self.assertFalse((moved / "AGENTS.md").exists())

    def test_unsupported_nonfollowing_operations_refuse_before_write(self):
        p = self.project("unsupported")
        with patch.object(setup, "_flags", side_effect=setup.SetupError("unsupported_platform", "Unsupported safe operations")):
            with self.assertRaises(setup.SetupError):
                self.standard(p, "apply")
        self.assertEqual(list(p.iterdir()), [])

    def test_project_replacement_after_write_is_not_reported_configured(self):
        p = self.project("postwrite-project-race")
        moved = self.base / "postwrite-project-original"
        original_fsync = os.fsync

        def after_sync(fd):
            original_fsync(fd)
            p.rename(moved)
            p.mkdir()

        with patch.object(setup.os, "fsync", side_effect=after_sync):
            result = self.standard(p, "apply")
        self.assertEqual(result["state"], "created_unverified")
        self.assertFalse((p / "AGENTS.md").exists())
        self.assertEqual((moved / "AGENTS.md").read_text(), setup.BLOCK)
        self.assertNotIn("sha256", result)

    def test_existing_block_in_replaced_project_is_not_reported_configured(self):
        p = self.project("existing-project-race")
        moved = self.base / "existing-project-original"
        (p / "AGENTS.md").write_text(setup.BLOCK)
        original_read = setup._read_agents

        def changed_after_read(directory_fd, filename=setup.STANDARD_FILE):
            result = original_read(directory_fd, filename)
            p.rename(moved)
            p.mkdir()
            return result

        with patch.object(setup, "_read_agents", side_effect=changed_after_read):
            with self.assertRaises(setup.SetupError) as failure:
                self.standard(p, "check")
        self.assertEqual(failure.exception.code, "project_changed")
        self.assertFalse((p / "AGENTS.md").exists())
        self.assertEqual((moved / "AGENTS.md").read_text(), setup.BLOCK)

    def test_replaced_existing_instruction_file_is_not_reported_configured(self):
        p = self.project("existing-agents-race")
        (p / "AGENTS.md").write_text(setup.BLOCK)
        original_read = setup._read_agents
        replacement = "# Preserve the new editor's instructions.\n"

        def changed_after_read(directory_fd, filename=setup.STANDARD_FILE):
            result = original_read(directory_fd, filename)
            (p / "AGENTS.md").rename(p / "original.md")
            (p / "AGENTS.md").write_text(replacement)
            return result

        with patch.object(setup, "_read_agents", side_effect=changed_after_read):
            with self.assertRaises(setup.SetupError) as failure:
                self.standard(p, "check")
        self.assertEqual(failure.exception.code, "agents_changed")
        self.assertEqual((p / "AGENTS.md").read_text(), replacement)
        self.assertEqual((p / "original.md").read_text(), setup.BLOCK)

    def test_new_file_changed_after_readback_is_not_reported_verified(self):
        p = self.project("post-readback-agents-race")
        original_read = setup._read_agents
        count = 0
        replacement = "# The other editor's new instructions.\n"

        def changed_after_read(directory_fd, filename=setup.STANDARD_FILE):
            nonlocal count
            count += 1
            result = original_read(directory_fd, filename)
            if count == 2:
                (p / "AGENTS.md").write_text(replacement)
            return result

        with patch.object(setup, "_read_agents", side_effect=changed_after_read):
            result = self.standard(p, "apply")
        self.assertEqual(result["state"], "created_unverified")
        self.assertEqual((p / "AGENTS.md").read_text(), replacement)
        self.assertNotIn("sha256", result)

    def test_unconfirmed_source_never_creates_a_shadowing_file(self):
        p = self.project("unknown-active-source")
        (p / "TEAM.md").write_text("# Custom fallback instructions must remain active.\n")
        for mode in ["preview", "check", "apply"]:
            result = setup.configure(p, mode)
            self.assertEqual(result["state"], "source_unconfirmed")
            self.assertFalse(result["changed"])
            self.assertFalse((p / "AGENTS.md").exists())
        missing = self.project("missing-active-source")
        with self.assertRaises(setup.SetupError):
            setup.configure(missing, "apply", active_file="TEAM.md")
        for name in ["../TEAM.md", "/tmp/TEAM.md", ".env", "config.json"]:
            with self.assertRaises(setup.SetupError):
                setup.configure(missing, "apply", active_file=name)
        self.assertEqual(list(missing.iterdir()), [])

    def test_override_precedence_preserves_both_sources(self):
        p = self.project("override-precedence")
        normal = setup.BLOCK
        override = "# Active override\nDO_NOT_ECHO_OVERRIDE\n"
        (p / "AGENTS.md").write_text(normal)
        (p / "AGENTS.override.md").write_text(override)
        result = self.standard(p, "apply")
        self.assertEqual((result["state"], result["target"]), ("merge_required", "AGENTS.override.md"))
        self.assertFalse(result["changed"])
        self.assertNotIn("DO_NOT_ECHO_OVERRIDE", json.dumps(result))
        self.assertEqual((p / "AGENTS.md").read_text(), normal)
        self.assertEqual((p / "AGENTS.override.md").read_text(), override)

    def test_exact_active_override_is_idempotent_without_normal_file(self):
        p = self.project("override-already-configured")
        source = "# Other active rules\n\n" + setup.BLOCK
        target = p / "AGENTS.override.md"
        target.write_text(source)
        before = target.stat()
        result = setup.configure(p, "apply")
        after = target.stat()
        self.assertEqual((result["state"], result["target"]), ("already_configured", "AGENTS.override.md"))
        self.assertEqual((before.st_ino, before.st_mtime_ns), (after.st_ino, after.st_mtime_ns))
        self.assertEqual(target.read_text(), source)
        self.assertFalse((p / "AGENTS.md").exists())

    def test_host_confirmed_custom_fallback_is_readonly_merge_or_noop(self):
        p = self.project("custom-fallback")
        target = p / "TEAM.md"
        original = "# Keep this custom project source.\n"
        target.write_text(original)
        result = setup.configure(p, "apply", active_file="TEAM.md")
        self.assertEqual((result["state"], result["target"]), ("merge_required", "TEAM.md"))
        self.assertEqual(target.read_text(), original)
        self.assertFalse((p / "AGENTS.md").exists())
        target.write_text(original + setup.BLOCK)  # Simulated authorised host-editor merge.
        result = setup.configure(p, "check", active_file="TEAM.md")
        self.assertEqual((result["state"], result["target"]), ("already_configured", "TEAM.md"))
        self.assertFalse((p / "AGENTS.md").exists())

    def test_unsafe_override_is_refused_without_creating_normal_file(self):
        p = self.project("unsafe-override")
        target = self.base / "override-outside.md"
        original = "# Synthetic outside rules.\n"
        target.write_text(original)
        (p / "AGENTS.override.md").symlink_to(target)
        with self.assertRaises(setup.SetupError):
            self.standard(p, "apply")
        self.assertFalse((p / "AGENTS.md").exists())
        self.assertEqual(target.read_text(), original)

    def test_empty_candidates_fail_closed_without_shadowing_other_rules(self):
        cases = [
            ("empty-override", "AGENTS.override.md", "", {"AGENTS.md": setup.BLOCK}, "AGENTS.md"),
            ("whitespace-override", "AGENTS.override.md", " \t\n\u2003", {}, "AGENTS.md"),
            ("empty-standard", "AGENTS.md", "\n", {"TEAM.md": "# Keep fallback rules.\n"}, "TEAM.md"),
            ("empty-fallback", "TEAM.md", "\t\n", {}, "TEAM.md"),
        ]
        for name, candidate, content, others, confirmed in cases:
            with self.subTest(name=name):
                p = self.project(name)
                for filename, value in {**others, candidate: content}.items():
                    (p / filename).write_text(value)
                before = {f.name: (f.read_bytes(), f.stat().st_ino, f.stat().st_mtime_ns) for f in p.iterdir()}
                for mode in ["preview", "check", "apply"]:
                    result = setup.configure(p, mode, active_file=confirmed)
                    self.assertEqual(result["state"], "ambiguous_source")
                    self.assertIsNone(result["target"])
                    self.assertFalse(result["changed"])
                    self.assertFalse(result["would_create"])
                after = {f.name: (f.read_bytes(), f.stat().st_ino, f.stat().st_mtime_ns) for f in p.iterdir()}
                self.assertEqual(before, after)

    def test_new_override_during_inspection_prevents_false_existing_success(self):
        p = self.project("override-inspection-race")
        (p / "AGENTS.md").write_text(setup.BLOCK)
        original_read = setup._read_agents
        override = "# Keep the concurrently created override.\n"

        def changed_after_read(directory_fd, filename=setup.STANDARD_FILE):
            result = original_read(directory_fd, filename)
            (p / "AGENTS.override.md").write_text(override)
            return result

        with patch.object(setup, "_read_agents", side_effect=changed_after_read):
            result = self.standard(p, "check")
        self.assertEqual(result["state"], "merge_required")
        self.assertFalse(result["changed"])
        self.assertEqual((p / "AGENTS.md").read_text(), setup.BLOCK)
        self.assertEqual((p / "AGENTS.override.md").read_text(), override)

    def test_override_created_during_write_prevents_verified_setup_claim(self):
        p = self.project("override-write-race")
        original_fsync = os.fsync
        override = "# Keep this new active override.\n"

        def after_sync(fd):
            original_fsync(fd)
            (p / "AGENTS.override.md").write_text(override)

        with patch.object(setup.os, "fsync", side_effect=after_sync):
            result = self.standard(p, "apply")
        self.assertEqual(result["state"], "created_unverified")
        self.assertEqual((p / "AGENTS.override.md").read_text(), override)
        self.assertEqual((p / "AGENTS.md").read_text(), setup.BLOCK)
        self.assertNotIn("sha256", result)

    def test_cli_preview_apply_check_and_merge_exit_states(self):
        p = self.project("cli")
        def run(*args):
            result = subprocess.run([sys.executable, str(HELPER), str(p), "--active-file", "AGENTS.md", *args], capture_output=True, text=True)
            self.assertEqual(result.stderr, "")
            return result.returncode, json.loads(result.stdout)
        code, result = run()
        self.assertEqual((code, result["state"]), (0, "preview"))
        self.assertFalse((p / "AGENTS.md").exists())
        code, result = run("--check")
        self.assertEqual((code, result["state"]), (1, "not_configured"))
        code, result = run("--apply")
        self.assertEqual((code, result["state"]), (0, "created_verified"))
        code, result = run("--check")
        self.assertEqual((code, result["state"]), (0, "already_configured"))
        (p / "AGENTS.md").write_text("# Existing instructions\nDO_NOT_ECHO_CLI_CONTENT\n")
        code, result = run("--apply")
        self.assertEqual((code, result["state"]), (3, "merge_required"))
        self.assertNotIn("DO_NOT_ECHO_CLI_CONTENT", json.dumps(result))


if __name__ == "__main__":
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(ProjectSetupChecks)
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    report = {
        "tests_run": result.testsRun,
        "passed": result.testsRun - len(result.failures) - len(result.errors),
        "failures": len(result.failures), "errors": len(result.errors),
        "helper_sha256": hashlib.sha256(HELPER.read_bytes()).hexdigest(),
        "groups": [name.removeprefix("test_").replace("_", " ") for name in unittest.defaultTestLoader.getTestCaseNames(ProjectSetupChecks)],
        "limits": ["Synthetic filesystem/CLI checks only; no browser, model invocation, global configuration or real private project was touched.", "An instruction file is configuration. Native selection and useful app completion need separate checks.", "Safe non-following directory-relative operations are required; this run is on the current macOS runtime."],
    }
    (ROOT / "evals/v2/setup-results.json").write_text(json.dumps(report, indent=2) + "\n")
    raise SystemExit(0 if result.wasSuccessful() else 1)
