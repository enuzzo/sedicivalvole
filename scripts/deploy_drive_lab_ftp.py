#!/usr/bin/env python3
"""Deploy Drive Lab to the canonical web root without logging secrets."""

from __future__ import annotations

import ftplib
import hashlib
import io
import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BUILD = ROOT / "prototype" / "drive-lab" / "dist" / "client"
LEGACY_ROOT_FILE = "Default.html"
STATIC_ROOT_ENTRY = "index.html"
DYNAMIC_ROOT_ENTRY = "index.php"
PHP_ENTRY_PREFIX = b"""<?php
declare(strict_types=1);
header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');
header('X-Content-Type-Options: nosniff');
?>
"""
LEGACY_BUILD_FILES = {
    "index.html",
    "index-Ct5dIEVe.js",
    "index-BbWXMXk1.css",
    "luminous-axis.png",
}
LEGACY_BUILD_HASHES = {
    "index.html": "fac1ca7ebf8b7c399bbd1014cce2115b1f16390be5bdfbb5e07ca1b9d27b275e",
    "index-Ct5dIEVe.js": "70faf53413db91a70a35531cf3981f9069b00dad2c0474ce32239948771513b2",
    "index-BbWXMXk1.css": "1641693f87b78f8173d0913416c2267ccf9298e690ab1960a4ab552720785455",
    "luminous-axis.png": "36f61bf26f7c5a658bc4a4811938e64b40a3587e23cdabd19a74291cdfeadc0a",
}
LEGACY_UI_HASHES = {
    "launch-latch.png": "2a692ce1a7d3933495f1047be4449a7c168dbb1692a3724ec62a9c60b6b51c49",
    "launch-safety.png": "19533d8ce389d7342806f6090ca52b17c582adfac841bb3172ef175e29359d8c",
    "launch-vent.png": "e78d35a833b66dc5dd2cada78521db77b8e146ff820fd7366b98bc828bda0f1c",
}
DIAGNOSTIC_ENDPOINT = "send-diagnostic.php"
DIAGNOSTIC_RECIPIENT_CONFIG = "recipient.local.php"
DIAGNOSTIC_ENDPOINT_MARKER_SETS = (
    (b"sedicivalvole.tesla-diagnostic.v3", b"EXPECTED_ORIGIN", b"recipient.local.php"),
    (b"sedicivalvole.tesla-diagnostic.v2", b"EXPECTED_ORIGIN", b"recipient.local.php"),
    (b"sedicivalvole.tesla-diagnostic.v2", b"EXPECTED_ORIGIN", b"DIAGNOSTIC_RECIPIENT"),
)
DIAGNOSTIC_RECIPIENT_CONFIG_MARKERS = (
    b"sedicivalvole local diagnostic recipient",
    b"return",
)
REQUIRED = (
    "DEPLOY_PROTOCOL",
    "DEPLOY_HOST",
    "DEPLOY_PORT",
    "DEPLOY_USERNAME",
    "DEPLOY_PASSWORD",
    "DEPLOY_REMOTE_PATH",
)


def parse_env(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    with path.open("r", encoding="utf-8") as handle:
        for raw_line in handle:
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip()
            if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
                value = value[1:-1]
            values[key] = value
    return values


def enter_or_create(ftp: ftplib.FTP, name: str) -> None:
    if not name or name in {".", ".."} or "/" in name or "\\" in name:
        raise ValueError("unsafe target segment")
    try:
        ftp.cwd(name)
    except ftplib.error_perm:
        ftp.mkd(name)
        ftp.cwd(name)


def safe_names(ftp: ftplib.FTP) -> set[str]:
    return {
        Path(entry.rstrip("/")).name
        for entry in ftp.nlst()
        if Path(entry.rstrip("/")).name not in {"", ".", ".."}
    }


def remote_bytes(ftp: ftplib.FTP, name: str) -> bytes:
    buffer = io.BytesIO()
    ftp.retrbinary(f"RETR {name}", buffer.write)
    return buffer.getvalue()


def verify_remote_static_tree(
    ftp: ftplib.FTP,
    local_root: Path,
    *,
    tree_name: str,
) -> None:
    """Verify that every existing remote static entry matches the local tree."""
    remote_names = safe_names(ftp)
    expected_names = {path.name for path in local_root.iterdir()}
    if not remote_names.issubset(expected_names):
        raise ValueError(f"unexpected {tree_name} entry")

    for name in remote_names:
        local_path = local_root / name
        if local_path.is_dir():
            ftp.cwd(name)
            try:
                verify_remote_static_tree(ftp, local_path, tree_name=tree_name)
            finally:
                ftp.cwd("..")
            continue
        if sha256_bytes(remote_bytes(ftp, name)) != hashlib.sha256(local_path.read_bytes()).hexdigest():
            raise ValueError(f"{tree_name} content mismatch")


def sha256_bytes(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def dynamic_root_payload() -> bytes:
    return PHP_ENTRY_PREFIX + (BUILD / STATIC_ROOT_ENTRY).read_bytes()


def is_recognized_app_entry(payload: bytes) -> bool:
    return (
        b"sedicivalvole" in payload
        and b'<div id="root"></div>' in payload
        and b"assets/index-" in payload
    )


def is_recognized_junction_bank(payload: bytes) -> bool:
    """Recognize an existing owned bank without requiring the next bank's hash."""
    if len(payload) < 13 or payload[:8] not in {b"SVJCTN01", b"SVJCTN02", b"SVJCTN03"}:
        return False
    manifest_length = int.from_bytes(payload[8:12], "little")
    audio_offset = 12 + manifest_length
    if manifest_length <= 0 or audio_offset >= len(payload):
        return False
    try:
        manifest = json.loads(payload[12:audio_offset].decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return False
    common_valid = (
        manifest.get("score") == "junction"
        and manifest.get("source") == "rendered-production"
        and isinstance(manifest.get("sections"), list)
        and len(manifest["sections"]) >= 8
    )
    if manifest.get("format") == "sedicivalvole.music-bank.v1":
        return common_valid and payload[:8] == b"SVJCTN01"
    segmented_signatures = {
        "sedicivalvole.music-bank.v2": b"SVJCTN02",
        "sedicivalvole.music-bank.v3": b"SVJCTN03",
    }
    if segmented_signatures.get(manifest.get("format")) != payload[:8]:
        return False
    assets = manifest.get("assets")
    if not isinstance(assets, list) or not assets:
        return False
    asset_ids = [asset.get("id") for asset in assets if isinstance(asset, dict)]
    asset_lengths = [asset.get("audioBytes") for asset in assets if isinstance(asset, dict)]
    return (
        common_valid
        and len(asset_ids) == len(assets)
        and len(set(asset_ids)) == len(asset_ids)
        and all(isinstance(length, int) and length > 0 for length in asset_lengths)
        and sum(asset_lengths) == len(payload) - audio_offset
    )


def verify_remote_root(ftp: ftplib.FTP) -> set[str]:
    """Abort unless every overwrite/delete target can be identified read-only."""
    root_names = safe_names(ftp)
    allowed_root_names = {
        LEGACY_ROOT_FILE,
        "diagnostics",
        STATIC_ROOT_ENTRY,
        DYNAMIC_ROOT_ENTRY,
        "assets",
        "audio",
        "api",
        "fonts",
        "third-party",
        "ui",
    }
    unexpected_root_names = root_names - allowed_root_names
    if unexpected_root_names:
        unexpected = ",".join(sorted(unexpected_root_names))
        raise ValueError(f"unexpected canonical-root entry: {unexpected}")

    if LEGACY_ROOT_FILE in root_names:
        default_page = remote_bytes(ftp, LEGACY_ROOT_FILE)
        if b"Awesome Site in The Making" not in default_page or b"bg_under_construction" not in default_page:
            raise ValueError("unrecognized default root page")

    current_entries: list[bytes] = []
    if STATIC_ROOT_ENTRY in root_names:
        current_entries.append(remote_bytes(ftp, STATIC_ROOT_ENTRY))
    if DYNAMIC_ROOT_ENTRY in root_names:
        current_php = remote_bytes(ftp, DYNAMIC_ROOT_ENTRY)
        if not current_php.startswith(PHP_ENTRY_PREFIX) or not is_recognized_app_entry(current_php):
            raise ValueError("unrecognized dynamic root application")
        current_entries.append(current_php)

    obsolete_root_assets: set[str] = set()
    if current_entries:
        for current_entry in current_entries:
            if not is_recognized_app_entry(current_entry):
                raise ValueError("unrecognized existing root application")
        current_asset_names = {
            path.name for path in (BUILD / "assets").iterdir() if path.is_file()
        }
        referenced_assets = {
            Path(match.decode("utf-8")).name
            for current_entry in current_entries
            for match in re.findall(rb"assets/[A-Za-z0-9._-]+", current_entry)
        }
        obsolete_root_assets = referenced_assets - current_asset_names

    if "assets" in root_names:
        ftp.cwd("assets")
        try:
            remote_asset_names = safe_names(ftp)
            local_assets = {path.name: path for path in (BUILD / "assets").iterdir() if path.is_file()}
            for name in remote_asset_names & local_assets.keys():
                local_hash = hashlib.sha256(local_assets[name].read_bytes()).hexdigest()
                if sha256_bytes(remote_bytes(ftp, name)) != local_hash:
                    raise ValueError("content-addressed asset mismatch")
        finally:
            ftp.cwd("..")

    if "api" in root_names:
        ftp.cwd("api")
        try:
            api_names = safe_names(ftp)
            if not api_names.issubset({DIAGNOSTIC_ENDPOINT, DIAGNOSTIC_RECIPIENT_CONFIG}):
                raise ValueError("unexpected API entry")
            if DIAGNOSTIC_ENDPOINT in api_names:
                endpoint = remote_bytes(ftp, DIAGNOSTIC_ENDPOINT)
                if not any(
                    all(marker in endpoint for marker in marker_set)
                    for marker_set in DIAGNOSTIC_ENDPOINT_MARKER_SETS
                ):
                    raise ValueError("diagnostic endpoint identity mismatch")
            if DIAGNOSTIC_RECIPIENT_CONFIG in api_names:
                recipient_config = remote_bytes(ftp, DIAGNOSTIC_RECIPIENT_CONFIG)
                if not all(marker in recipient_config for marker in DIAGNOSTIC_RECIPIENT_CONFIG_MARKERS):
                    raise ValueError("diagnostic recipient identity mismatch")
        finally:
            ftp.cwd("..")

    if "third-party" in root_names:
        ftp.cwd("third-party")
        try:
            verify_remote_static_tree(
                ftp,
                BUILD / "third-party",
                tree_name="third-party",
            )
        finally:
            ftp.cwd("..")

    if "fonts" in root_names:
        ftp.cwd("fonts")
        try:
            verify_remote_static_tree(
                ftp,
                BUILD / "fonts",
                tree_name="fonts",
            )
        finally:
            ftp.cwd("..")

    if "audio" in root_names:
        ftp.cwd("audio")
        try:
            audio_names = safe_names(ftp)
            if not audio_names.issubset({"junction.svb"}):
                raise ValueError("unexpected audio entry")
            if "junction.svb" in audio_names and not is_recognized_junction_bank(
                remote_bytes(ftp, "junction.svb")
            ):
                raise ValueError("audio identity mismatch")
        finally:
            ftp.cwd("..")

    if "ui" in root_names:
        ftp.cwd("ui")
        try:
            ui_names = safe_names(ftp)
            if not ui_names.issubset(LEGACY_UI_HASHES):
                raise ValueError("unexpected legacy UI entry")
            for name in ui_names:
                if sha256_bytes(remote_bytes(ftp, name)) != LEGACY_UI_HASHES[name]:
                    raise ValueError("legacy UI asset identity mismatch")
        finally:
            ftp.cwd("..")

    if "diagnostics" in root_names:
        ftp.cwd("diagnostics")
        try:
            diagnostic_names = safe_names(ftp)
            if not diagnostic_names.issubset({"drive-lab"}):
                raise ValueError("unexpected diagnostics entry")
            if "drive-lab" in diagnostic_names:
                ftp.cwd("drive-lab")
                try:
                    names = safe_names(ftp)
                    if not (names - {"assets"}).issubset({"index.html"}):
                        raise ValueError("unexpected legacy build entry")
                    if "index.html" in names and sha256_bytes(remote_bytes(ftp, "index.html")) != LEGACY_BUILD_HASHES["index.html"]:
                        raise ValueError("legacy index identity mismatch")
                    if "assets" in names:
                        ftp.cwd("assets")
                        try:
                            asset_names = safe_names(ftp)
                            expected_assets = set(LEGACY_BUILD_HASHES) - {"index.html"}
                            if not asset_names.issubset(expected_assets):
                                raise ValueError("unexpected legacy asset")
                            for name in asset_names:
                                if sha256_bytes(remote_bytes(ftp, name)) != LEGACY_BUILD_HASHES[name]:
                                    raise ValueError("legacy asset identity mismatch")
                        finally:
                            ftp.cwd("..")
                finally:
                    ftp.cwd("..")
        finally:
            ftp.cwd("..")
    return obsolete_root_assets


def remove_legacy_publish(ftp: ftplib.FTP) -> tuple[int, int]:
    """Remove only the exact, previously verified default and nested build files."""
    deleted_files = 0
    removed_directories = 0

    root_names = safe_names(ftp)
    if LEGACY_ROOT_FILE in root_names:
        ftp.delete(LEGACY_ROOT_FILE)
        deleted_files += 1

    if "ui" in root_names:
        ftp.cwd("ui")
        try:
            ui_names = safe_names(ftp)
            if ui_names.issubset(LEGACY_UI_HASHES):
                for name in ui_names:
                    ftp.delete(name)
                    deleted_files += 1
        finally:
            ftp.cwd("..")
        ftp.cwd("ui")
        try:
            ui_empty = not safe_names(ftp)
        finally:
            ftp.cwd("..")
        if ui_empty:
            ftp.rmd("ui")
            removed_directories += 1

    if "diagnostics" not in root_names:
        return deleted_files, removed_directories

    ftp.cwd("diagnostics")
    try:
        if "drive-lab" not in safe_names(ftp):
            return deleted_files, removed_directories
        ftp.cwd("drive-lab")
        try:
            names = safe_names(ftp)
            direct_files = names - {"assets"}
            if not direct_files.issubset(LEGACY_BUILD_FILES):
                return deleted_files, removed_directories
            if "assets" in names:
                ftp.cwd("assets")
                try:
                    asset_names = safe_names(ftp)
                    if not asset_names.issubset(LEGACY_BUILD_FILES):
                        return deleted_files, removed_directories
                    for name in asset_names:
                        ftp.delete(name)
                        deleted_files += 1
                finally:
                    ftp.cwd("..")
                ftp.rmd("assets")
                removed_directories += 1
            for name in direct_files:
                ftp.delete(name)
                deleted_files += 1
        finally:
            ftp.cwd("..")
        ftp.rmd("drive-lab")
        removed_directories += 1
    finally:
        ftp.cwd("..")

    if "diagnostics" in safe_names(ftp):
        ftp.cwd("diagnostics")
        try:
            diagnostics_empty = not safe_names(ftp)
        finally:
            ftp.cwd("..")
        if diagnostics_empty:
            ftp.rmd("diagnostics")
            removed_directories += 1
    return deleted_files, removed_directories


USAGE = """sedicivalvole publication

Uploads the built client to the canonical root. This performs a real
publication; there is no dry-run mode.

  python3 scripts/deploy_drive_lab_ftp.py           publish
  python3 scripts/deploy_drive_lab_ftp.py --verify-only
                                                  verify identity; write nothing
  python3 scripts/deploy_drive_lab_ftp.py --help    show this and do nothing
"""


def parse_arguments(argv: list[str]) -> bool:
    """Returns True when the caller asked to publish.

    The script previously ignored every argument, so `--help` ran a real
    deployment. That has now happened twice. An unrecognised argument must stop
    the run rather than be treated as consent to publish.
    """
    if not argv:
        return True
    if argv == ["--verify-only"]:
        return True
    if argv == ["--help"] or argv == ["-h"]:
        print(USAGE, end="")
        return False
    print(USAGE, end="")
    print(f"\nunrecognised argument: {' '.join(argv)}\nnothing was published.")
    return False


def main() -> int:
    if not parse_arguments(sys.argv[1:]):
        return 0
    stage = "configuration"
    ftp: ftplib.FTP | None = None
    try:
        config = parse_env(ROOT / ".env")
        if any(not config.get(key) for key in REQUIRED):
            raise ValueError("missing required deploy field")
        if config["DEPLOY_PROTOCOL"].strip().lower() != "ftp":
            raise ValueError("configured protocol is not FTP")
        port = int(config["DEPLOY_PORT"])
        if port != 21:
            raise ValueError("configured FTP port is not 21")
        if not (BUILD / "index.html").is_file():
            raise FileNotFoundError("production build is missing")
        if not (BUILD / "api" / DIAGNOSTIC_RECIPIENT_CONFIG).is_file():
            raise FileNotFoundError("local diagnostic recipient configuration is missing")

        stage = "network"
        ftp = ftplib.FTP()
        ftp.connect(config["DEPLOY_HOST"], port, timeout=25)
        print("network=PASS")

        stage = "login"
        ftp.login(config["DEPLOY_USERNAME"], config["DEPLOY_PASSWORD"])
        ftp.set_pasv(True)
        print("login=PASS")

        stage = "directory"
        ftp.cwd(config["DEPLOY_REMOTE_PATH"])
        print("directory=PASS target=canonical_root")

        stage = "read_only_identity"
        obsolete_root_assets = verify_remote_root(ftp)
        print("read_only_identity=PASS root_and_legacy_targets_verified")
        if "--verify-only" in sys.argv[1:]:
            remote_count = len(safe_names(ftp))
            ftp.quit()
            ftp = None
            print(f"remote_listing=PASS entries={remote_count}")
            print("remote_writes=NONE")
            return 0

        stage = "upload"
        stage_php_entry = "--stage-php-entry" in sys.argv[1:]
        preserve_existing = "--preserve-existing" in sys.argv[1:]
        files = sorted(
            (
                path
                for path in BUILD.rglob("*")
                if path.is_file() and (stage_php_entry or path.name != STATIC_ROOT_ENTRY)
            ),
            key=lambda path: path.as_posix(),
        )
        uploaded_bytes = 0
        for local_file in files:
            relative = local_file.relative_to(BUILD)
            for part in relative.parts[:-1]:
                enter_or_create(ftp, part)
            with local_file.open("rb") as handle:
                ftp.storbinary(f"STOR {relative.name}", handle, blocksize=65536)
            for _ in relative.parts[:-1]:
                ftp.cwd("..")
            uploaded_bytes += local_file.stat().st_size

        php_entry = dynamic_root_payload()
        ftp.storbinary(f"STOR {DYNAMIC_ROOT_ENTRY}", io.BytesIO(php_entry), blocksize=65536)
        uploaded_bytes += len(php_entry)
        if sha256_bytes(remote_bytes(ftp, DYNAMIC_ROOT_ENTRY)) != sha256_bytes(php_entry):
            raise ValueError("dynamic root upload mismatch")

        ftp.cwd("audio")
        try:
            verify_remote_static_tree(ftp, BUILD / "audio", tree_name="audio")
        finally:
            ftp.cwd("..")

        switched_entry = False
        if not stage_php_entry and not preserve_existing and STATIC_ROOT_ENTRY in safe_names(ftp):
            ftp.delete(STATIC_ROOT_ENTRY)
            switched_entry = True

        stage = "legacy_cleanup"
        if preserve_existing:
            deleted_files, removed_directories = 0, 0
        else:
            deleted_files, removed_directories = remove_legacy_publish(ftp)
        remote_count = len(safe_names(ftp))
        ftp.quit()
        ftp = None
        print(f"upload=PASS files={len(files) + 1} bytes={uploaded_bytes}")
        print(f"dynamic_root=PASS staged={str(stage_php_entry).lower()} static_entry_removed={str(switched_entry).lower()}")
        if preserve_existing:
            print("legacy_cleanup=SKIPPED preserve_existing=true")
        else:
            print(f"legacy_cleanup=PASS files={deleted_files} directories={removed_directories}")
        print(f"previous_assets_retained=PASS files={len(obsolete_root_assets)} cache_overlap=true")
        print(f"remote_listing=PASS entries={remote_count}")
        print(
            "remote_writes=ROOT_UPLOAD_ONLY"
            if preserve_existing
            else "remote_writes=ROOT_UPLOAD_AND_EXACT_LEGACY_CLEANUP"
        )
        return 0
    except (ValueError, FileNotFoundError) as error:
        if ftp is not None:
            try:
                ftp.close()
            except Exception:
                pass
        reason = re.sub(r"[^a-z0-9_-]+", "_", str(error).lower()).strip("_") or "validation_failed"
        print(f"{stage}=FAIL reason={reason}", file=sys.stderr)
        return 1
    except Exception:
        if ftp is not None:
            try:
                ftp.close()
            except Exception:
                pass
        print(f"{stage}=FAIL sanitized_error=true", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
