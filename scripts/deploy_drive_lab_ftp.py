#!/usr/bin/env python3
"""Deploy Drive Lab to the canonical web root without logging secrets."""

from __future__ import annotations

import argparse
import ftplib
import hashlib
import io
import json
import math
import os
import re
import secrets
import stat
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BUILD = ROOT / "prototype" / "drive-lab" / "dist" / "client"
ILLOBO_ARCHIVE_ROOT = ROOT / "_references" / "audio" / "tracks" / "illobo"
ILLOBO_WEB_ROOT = ILLOBO_ARCHIVE_ROOT / "web"
ILLOBO_SOURCE_MANIFEST = ILLOBO_ARCHIVE_ROOT / "web-manifest.json"
ILLOBO_REMOTE_DIRECTORY = "illobo"
ILLOBO_PUBLIC_CATALOG = "catalog.json"
ILLOBO_PUBLIC_CATALOG_SCHEMA = "sedicivalvole.illobo-public-catalog.v1"
ILLOBO_SOURCE_MANIFEST_SCHEMA = "sedicivalvole.illobo-web-audio-manifest.v1"
ILLOBO_EXPECTED_TRACKS = 29
LEGACY_ROOT_FILE = "Default.html"
STATIC_ROOT_ENTRY = "index.html"
DYNAMIC_ROOT_ENTRY = "index.php"
DYNAMIC_STAGE_ENTRY = "index.php.stage"
DYNAMIC_NEXT_ENTRY = "index.php.next"
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
RETIRED_FONT_HASHES = {
    "OFL-IBM-Plex-Mono.txt": "d741e57d5f865e294df801f96b7b5161a88b211df65887e4358d271c9fc5fb4f",
    "ibm-plex-mono-regular.ttf": "6a3412f058c7d8dfd9170c41e85ade48e5156ecb89356110ca57a0a27734af46",
    "ibm-plex-mono-semibold.ttf": "d3c38e55c78f5b0f28009fddba4834ec503278936a5986032424c9bd2d23aa46",
    "orbitron-latin-variable.woff2": "c25a9f9da5d9f3db1bf2a01474722dc9b377675b7bbab6d0dfda6902794fd1ed",
}
RETIRED_BRAND_HASHES = {
    "illobo-featured-provisional.png": "da6d5086f06dc8a38ea580f3a5c4289363c214cb8736c9e84ffa39a462946e2b",
}
DIAGNOSTIC_ENDPOINT = "send-diagnostic.php"
DIAGNOSTIC_RECIPIENT_CONFIG = "recipient.local.php"
DIAGNOSTIC_RECIPIENT_SOURCE = (
    ROOT / "prototype" / "drive-lab" / "config" / "diagnostic-recipient.local.php"
)
DIAGNOSTIC_ENDPOINT_MARKER_SETS = (
    (b"sedicivalvole.tesla-diagnostic.v3", b"EXPECTED_ORIGIN", b"recipient.local.php"),
    (b"sedicivalvole.tesla-diagnostic.v2", b"EXPECTED_ORIGIN", b"recipient.local.php"),
    (b"sedicivalvole.tesla-diagnostic.v2", b"EXPECTED_ORIGIN", b"DIAGNOSTIC_RECIPIENT"),
)
DIAGNOSTIC_RECIPIENT_CONFIG_MARKERS = (
    b"sedicivalvole local diagnostic recipient",
    b"return",
)
JAMENDO_CONFIG = "jamendo.local.php"
JAMENDO_CONFIG_MARKERS = (b"sedicivalvole local Jamendo configuration", b"client_id")
SOUNDTRACK_CATALOG_ENDPOINT = "soundtrack-catalog.php"
SOUNDTRACK_AUDIO_ENDPOINT = "soundtrack-audio.php"
SOUNDTRACK_API_MARKERS = {
    SOUNDTRACK_CATALOG_ENDPOINT: (b"sedicivalvole.soundtrack-catalog-api.v1", b"JAMENDO_CONFIG_FILE"),
    SOUNDTRACK_AUDIO_ENDPOINT: (b"JAMENDO_AUDIO_CONFIG_FILE", b"track_effects_not_admitted"),
}
LAB_DIRECTORY = "lab"
LAB_AUTH_CONFIG = "auth.local.php"
LAB_AUTH_CONFIG_MARKERS = (
    b"sedicivalvole local LAB authentication",
    b"password_hash_hex",
    b"session_ttl_seconds",
)
LAB_PAGE_MARKERS = (b"sedicivalvole / LAB", b"SEDICIVALVOLE_LAB_BOOT", b"labLoadConfig")
LAB_BOOTSTRAP_MARKERS = (b"LAB_EXPECTED_ORIGIN", b"labRequireAuthenticatedJson", b"auth.local.php")
LAB_SEND_MARKERS = (b"sedicivalvole.lab-mail.v1", b"labRequireCsrf", b"buildLabPresetMail")
LAB_BLOOM_PROCESSOR_MARKERS = (b"AudioWorkletProcessor", b'registerProcessor("bloom-processor"')
LAB_SCORE_PROCESSOR_MARKERS = (b"AudioWorkletProcessor", b'registerProcessor("score-processor"')
PRIVATE_STATIC_NAME_TOKEN = re.compile(
    r"(^|[._-])(secret|secrets|credential|credentials|private|key|keys|cert|certs|certificate|certificates)([._-]|$)",
    re.IGNORECASE,
)
PRIVATE_STATIC_EXTENSIONS = {
    ".pem",
    ".key",
    ".p12",
    ".pfx",
    ".crt",
    ".cer",
    ".der",
    ".jks",
    ".keystore",
}
PRIVATE_STATIC_DOTFILE = re.compile(
    r"^\.(docker|dockercfg|git|htpasswd|netrc|npmrc|pypirc|ssh)($|[^a-z0-9])",
    re.IGNORECASE,
)
ENV_STATIC_NAME = re.compile(r"^\.env($|[^a-z0-9])", re.IGNORECASE)
SSH_PRIVATE_KEY_NAME = re.compile(
    r"^id_(rsa|dsa|ecdsa|ed25519)($|[^a-z0-9].*)",
    re.IGNORECASE,
)
LOCAL_STATIC_NAME_TOKEN = re.compile(r"(^|[._-])local([._-]|$)", re.IGNORECASE)
STATIC_SAFETY_ERROR = "static build contains a forbidden filename or symbolic link"
REQUIRED = (
    "DEPLOY_PROTOCOL",
    "DEPLOY_HOST",
    "DEPLOY_PORT",
    "DEPLOY_USERNAME",
    "DEPLOY_PASSWORD",
    "DEPLOY_REMOTE_PATH",
)
PROJECT_OWNED_THIRD_PARTY_MARKERS = {
    "drivey/sedicivalvole.html": (
        b'import Drivey from "./js/Drivey.js"',
        b"window.__SEDICIVALVOLE_DRIVEY__",
        b"5104cdade2a3158786b05b9b0680a50e942830cf",
    ),
    "drivey/SEDICIVALVOLE-INTEGRATION.md": (
        b"# Drivey.js integration boundary",
        b"Project integration shell:",
        b"sedicivalvole.html",
        b"5104cdade2a3158786b05b9b0680a50e942830cf",
    ),
}
PROJECT_OWNED_BRAND_HASHES = {
    "sedicivalvole-mark.svg": frozenset({
        # Previously published dark master and the selected Road Sheet light master.
        "e47522c4166f6c4f7e8e978b09b9fd2e2835f438732cf67004aede57ff0d8ace",
        "210b319522825982589907c213661720abbf7ea94d29b3a53a7fb4a7cec275e5",
    }),
}


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


def build_lab_auth_config(password: str) -> bytes:
    """Build an upload-only PBKDF2 verifier without logging the password."""
    if len(password) < 12 or len(password) > 256:
        raise ValueError("LAB access password must contain 12 to 256 characters")
    iterations = 310_000
    salt = secrets.token_bytes(24)
    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        iterations,
        dklen=32,
    )
    return (
        "<?php\n"
        "// sedicivalvole local LAB authentication; generated during guarded deployment.\n"
        "return [\n"
        f"    'salt_hex' => '{salt.hex()}',\n"
        f"    'password_hash_hex' => '{password_hash.hex()}',\n"
        f"    'iterations' => {iterations},\n"
        "    'session_ttl_seconds' => 28800,\n"
        "];\n"
    ).encode("utf-8")


def build_jamendo_config(client_id: str) -> bytes:
    """Build an upload-only Jamendo read API configuration without logging it."""
    normalized = client_id.strip()
    if not re.fullmatch(r"[A-Za-z0-9_-]{4,128}", normalized):
        raise ValueError("Jamendo client ID is invalid")
    return (
        "<?php\n"
        "// sedicivalvole local Jamendo configuration; generated during guarded deployment.\n"
        "return [\n"
        f"    'client_id' => '{normalized}',\n"
        "];\n"
    ).encode("utf-8")


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


def is_recognized_project_owned_third_party_entry(
    relative_path: Path | str,
    payload: bytes,
) -> bool:
    """Recognize only the two mutable Sedici files inside the vendor tree."""
    markers = PROJECT_OWNED_THIRD_PARTY_MARKERS.get(Path(relative_path).as_posix())
    return markers is not None and all(marker in payload for marker in markers)


def is_recognized_retired_font(name: str, payload: bytes) -> bool:
    """Admit only byte-identical previous fonts during cache-overlap deploys."""
    expected_hash = RETIRED_FONT_HASHES.get(name)
    return expected_hash is not None and sha256_bytes(payload) == expected_hash


def is_recognized_retired_brand(name: str, payload: bytes) -> bool:
    """Admit only byte-identical retired brand assets during cache overlap."""
    expected_hash = RETIRED_BRAND_HASHES.get(name)
    return expected_hash is not None and sha256_bytes(payload) == expected_hash


def is_recognized_project_owned_brand_entry(
    relative_path: Path | str,
    payload: bytes,
) -> bool:
    """Admit only exact reviewed project-owned brand revisions."""
    expected_hashes = PROJECT_OWNED_BRAND_HASHES.get(Path(relative_path).as_posix())
    return expected_hashes is not None and sha256_bytes(payload) in expected_hashes


def verify_remote_static_tree(
    ftp: ftplib.FTP,
    local_root: Path,
    *,
    tree_name: str,
    require_complete: bool = False,
    relative_root: Path = Path(),
) -> None:
    """Verify that every existing remote static entry matches the local tree."""
    remote_names = safe_names(ftp)
    expected_names = {path.name for path in local_root.iterdir()}
    if require_complete and not expected_names.issubset(remote_names):
        raise ValueError(f"incomplete {tree_name} upload")
    if not require_complete:
        unexpected_names = remote_names - expected_names
        recognized_overlap = (
            tree_name == "fonts"
            and all(
                is_recognized_retired_font(name, remote_bytes(ftp, name))
                for name in unexpected_names
            )
        ) or (
            tree_name == "brand"
            and all(
                is_recognized_retired_brand(name, remote_bytes(ftp, name))
                for name in unexpected_names
            )
        )
        if unexpected_names and not recognized_overlap:
            raise ValueError(f"unexpected {tree_name} entry")

    names_to_verify = expected_names if require_complete else remote_names & expected_names
    for name in names_to_verify:
        local_path = local_root / name
        relative_path = relative_root / name
        if local_path.is_dir():
            ftp.cwd(name)
            try:
                verify_remote_static_tree(
                    ftp,
                    local_path,
                    tree_name=tree_name,
                    require_complete=require_complete,
                    relative_root=relative_path,
                )
            finally:
                ftp.cwd("..")
            continue
        remote_payload = remote_bytes(ftp, name)
        local_payload = static_build_bytes(local_path)
        if sha256_bytes(remote_payload) != hashlib.sha256(local_payload).hexdigest():
            project_owned_update = (
                (
                    tree_name == "third-party"
                    and is_recognized_project_owned_third_party_entry(
                        relative_path,
                        remote_payload,
                    )
                    and is_recognized_project_owned_third_party_entry(
                        relative_path,
                        local_payload,
                    )
                )
                or (
                    tree_name == "brand"
                    and is_recognized_project_owned_brand_entry(
                        relative_path,
                        remote_payload,
                    )
                    and is_recognized_project_owned_brand_entry(
                        relative_path,
                        local_payload,
                    )
                )
            )
            if project_owned_update:
                continue
            raise ValueError(
                f"{tree_name} content mismatch at {relative_path.as_posix()}"
            )


def sha256_bytes(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def illobo_archive() -> tuple[list[dict[str, object]], bytes]:
    """Validate the ignored Illobo masters and build their public metadata catalog."""
    if ILLOBO_SOURCE_MANIFEST.is_symlink() or not ILLOBO_SOURCE_MANIFEST.is_file():
        raise FileNotFoundError("Illobo source manifest is missing")
    try:
        manifest = json.loads(ILLOBO_SOURCE_MANIFEST.read_text(encoding="utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        raise ValueError("Illobo source manifest is invalid") from None
    tracks = manifest.get("tracks") if isinstance(manifest, dict) else None
    aggregate = manifest.get("aggregate") if isinstance(manifest, dict) else None
    if (
        manifest.get("schema") != ILLOBO_SOURCE_MANIFEST_SCHEMA
        or not isinstance(tracks, list)
        or len(tracks) != ILLOBO_EXPECTED_TRACKS
        or not isinstance(aggregate, dict)
        or aggregate.get("output_count") != ILLOBO_EXPECTED_TRACKS
        or aggregate.get("validation") != "passed"
    ):
        raise ValueError("Illobo source manifest identity mismatch")

    validated: list[dict[str, object]] = []
    public_tracks: list[dict[str, object]] = []
    seen_names: set[str] = set()
    seen_hashes: set[str] = set()
    for track in tracks:
        editorial = track.get("editorial") if isinstance(track, dict) else None
        output = track.get("output") if isinstance(track, dict) else None
        filename = editorial.get("output_filename") if isinstance(editorial, dict) else None
        title = editorial.get("title") if isinstance(editorial, dict) else None
        artist = editorial.get("artist") if isinstance(editorial, dict) else None
        digest = output.get("sha256") if isinstance(output, dict) else None
        byte_count = output.get("bytes") if isinstance(output, dict) else None
        duration = output.get("duration_seconds") if isinstance(output, dict) else None
        if (
            not isinstance(filename, str)
            or re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*\.mp3", filename) is None
            or not isinstance(title, str)
            or not title.strip()
            or artist != "Illobo"
            or not isinstance(digest, str)
            or re.fullmatch(r"[a-f0-9]{64}", digest) is None
            or type(byte_count) is not int
            or byte_count <= 0
            or type(duration) not in {int, float}
            or not math.isfinite(duration)
            or duration <= 0
            or filename in seen_names
            or digest in seen_hashes
        ):
            raise ValueError("Illobo track manifest entry is invalid")
        path = ILLOBO_WEB_ROOT / filename
        if path.is_symlink() or not path.is_file():
            raise FileNotFoundError("Illobo web master is missing")
        if path.stat().st_size != byte_count:
            raise ValueError("Illobo web master size mismatch")
        with path.open("rb") as handle:
            local_digest = hashlib.file_digest(handle, "sha256").hexdigest()
        if local_digest != digest:
            raise ValueError("Illobo web master identity mismatch")
        seen_names.add(filename)
        seen_hashes.add(digest)
        validated.append({"path": path, "filename": filename, "bytes": byte_count, "sha256": digest})
        public_tracks.append({
            "id": filename.removesuffix(".mp3"),
            "title": title.strip(),
            "artistName": "Illobo",
            "filename": filename,
            "durationSeconds": duration,
            "bytes": byte_count,
            "sha256": digest,
        })

    public_payload = json.dumps({
        "schema": ILLOBO_PUBLIC_CATALOG_SCHEMA,
        "generatedAt": manifest.get("generated_at_utc"),
        "trackCount": len(public_tracks),
        "tracks": public_tracks,
    }, ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode("utf-8") + b"\n"
    return validated, public_payload


def verify_remote_illobo(ftp: ftplib.FTP, *, full_hash: bool) -> None:
    tracks, catalog = illobo_archive()
    names = safe_names(ftp)
    expected_names = {ILLOBO_PUBLIC_CATALOG, *(str(track["filename"]) for track in tracks)}
    if names != expected_names:
        raise ValueError("Illobo remote playlist is incomplete")
    if sha256_bytes(remote_bytes(ftp, ILLOBO_PUBLIC_CATALOG)) != sha256_bytes(catalog):
        raise ValueError("Illobo remote catalog identity mismatch")
    for track in tracks:
        filename = str(track["filename"])
        if ftp.size(filename) != track["bytes"]:
            raise ValueError("Illobo remote track size mismatch")
        if full_hash and sha256_bytes(remote_bytes(ftp, filename)) != track["sha256"]:
            raise ValueError("Illobo remote track identity mismatch")


def is_forbidden_static_name(name: str) -> bool:
    """Classify private-looking package names without opening their contents."""
    basename = Path(name).name.lower()
    return (
        ENV_STATIC_NAME.search(basename) is not None
        or basename == ".envrc"
        or PRIVATE_STATIC_DOTFILE.search(basename) is not None
        or SSH_PRIVATE_KEY_NAME.fullmatch(basename) is not None
        or (
            basename.endswith(".php")
            and (
                "recipient" in basename
                or LOCAL_STATIC_NAME_TOKEN.search(basename) is not None
            )
        )
        or PRIVATE_STATIC_NAME_TOKEN.search(basename) is not None
        or Path(basename).suffix in PRIVATE_STATIC_EXTENSIONS
    )


def static_build_control_root() -> Path:
    return ROOT if BUILD == ROOT or ROOT in BUILD.parents else BUILD.parent.parent


def static_build_files() -> list[Path]:
    """Return regular build files after a metadata-only, fail-closed walk."""
    build_control_root = static_build_control_root()
    candidate = BUILD
    while True:
        if candidate.is_symlink():
            raise ValueError(STATIC_SAFETY_ERROR)
        if candidate == build_control_root:
            break
        candidate = candidate.parent
    if not BUILD.is_dir():
        raise FileNotFoundError("production build is missing")

    files: list[Path] = []
    pending = [BUILD]
    while pending:
        directory = pending.pop()
        for path in directory.iterdir():
            if path.is_symlink() or is_forbidden_static_name(path.name):
                raise ValueError(STATIC_SAFETY_ERROR)
            if path.is_dir():
                pending.append(path)
            elif path.is_file():
                files.append(path)
            else:
                raise ValueError(STATIC_SAFETY_ERROR)
    return files


def open_static_build_file(path: Path):
    """Open a build file through pinned directories without following symlinks."""
    control_root = static_build_control_root()
    try:
        path.relative_to(BUILD)
        relative = path.relative_to(control_root)
    except ValueError:
        raise ValueError(STATIC_SAFETY_ERROR) from None
    if not relative.parts:
        raise ValueError(STATIC_SAFETY_ERROR)

    directory_flags = os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW
    directory_descriptor: int | None = None
    file_descriptor: int | None = None
    try:
        directory_descriptor = os.open(control_root, directory_flags)
        for part in relative.parts[:-1]:
            next_descriptor = os.open(
                part,
                directory_flags,
                dir_fd=directory_descriptor,
            )
            os.close(directory_descriptor)
            directory_descriptor = next_descriptor
        file_descriptor = os.open(
            relative.parts[-1],
            os.O_RDONLY | os.O_NOFOLLOW,
            dir_fd=directory_descriptor,
        )
        if not stat.S_ISREG(os.fstat(file_descriptor).st_mode):
            raise ValueError(STATIC_SAFETY_ERROR)
        handle = os.fdopen(file_descriptor, "rb")
        file_descriptor = None
        return handle
    except (OSError, ValueError):
        raise ValueError(STATIC_SAFETY_ERROR)
    finally:
        if file_descriptor is not None:
            os.close(file_descriptor)
        if directory_descriptor is not None:
            os.close(directory_descriptor)


def static_build_bytes(path: Path) -> bytes:
    with open_static_build_file(path) as handle:
        return handle.read()


def dynamic_root_payload() -> bytes:
    static_build_files()
    return PHP_ENTRY_PREFIX + static_build_bytes(BUILD / STATIC_ROOT_ENTRY)


def static_upload_files() -> list[Path]:
    """Return publishable build files while reserving both root-entry names."""
    return sorted(
        (
            path
            for path in static_build_files()
            if path != BUILD / STATIC_ROOT_ENTRY
            and path != BUILD / DYNAMIC_ROOT_ENTRY
        ),
        key=lambda path: path.as_posix(),
    )


def verify_staged_dynamic_root(ftp: ftplib.FTP, payload: bytes) -> None:
    """Round-trip the generated entry under a non-executable temporary name."""
    try:
        ftp.storbinary(f"STOR {DYNAMIC_STAGE_ENTRY}", io.BytesIO(payload), blocksize=65536)
        if sha256_bytes(remote_bytes(ftp, DYNAMIC_STAGE_ENTRY)) != sha256_bytes(payload):
            raise ValueError("staged dynamic root upload mismatch")
    finally:
        if DYNAMIC_STAGE_ENTRY in safe_names(ftp):
            ftp.delete(DYNAMIC_STAGE_ENTRY)


def install_dynamic_root(ftp: ftplib.FTP, payload: bytes) -> None:
    """Verify a complete candidate, then atomically rename it over the live entry."""
    try:
        ftp.storbinary(f"STOR {DYNAMIC_NEXT_ENTRY}", io.BytesIO(payload), blocksize=65536)
        if sha256_bytes(remote_bytes(ftp, DYNAMIC_NEXT_ENTRY)) != sha256_bytes(payload):
            raise ValueError("dynamic root candidate mismatch")
        ftp.rename(DYNAMIC_NEXT_ENTRY, DYNAMIC_ROOT_ENTRY)
        if sha256_bytes(remote_bytes(ftp, DYNAMIC_ROOT_ENTRY)) != sha256_bytes(payload):
            raise ValueError("dynamic root upload mismatch")
    finally:
        if DYNAMIC_NEXT_ENTRY in safe_names(ftp):
            ftp.delete(DYNAMIC_NEXT_ENTRY)


def verify_completed_upload(
    ftp: ftplib.FTP,
    recipient_config: bytes,
    lab_auth_config: bytes,
    jamendo_config: bytes,
) -> None:
    """Verify every new build file before the live root entry is replaced."""
    static_build_files()
    remote_root_names = safe_names(ftp)
    for local_path in BUILD.iterdir():
        if local_path.name in {STATIC_ROOT_ENTRY, DYNAMIC_ROOT_ENTRY, "api"}:
            continue
        if local_path.is_dir():
            if local_path.name not in remote_root_names:
                raise ValueError(f"missing {local_path.name} upload")
            ftp.cwd(local_path.name)
            try:
                verify_remote_static_tree(
                    ftp,
                    local_path,
                    tree_name=local_path.name,
                    require_complete=True,
                )
            finally:
                ftp.cwd("..")
            continue
        if local_path.name not in remote_root_names:
            raise ValueError(f"missing root upload: {local_path.name}")
        if sha256_bytes(remote_bytes(ftp, local_path.name)) != hashlib.sha256(
            static_build_bytes(local_path)
        ).hexdigest():
            raise ValueError(f"root upload mismatch: {local_path.name}")

    ftp.cwd("api")
    try:
        api_names = safe_names(ftp)
        expected_api_names = {
            path.name
            for path in (BUILD / "api").iterdir()
            if path.is_file() and path.name != DIAGNOSTIC_RECIPIENT_CONFIG
        } | {DIAGNOSTIC_RECIPIENT_CONFIG, JAMENDO_CONFIG}
        if not expected_api_names.issubset(api_names):
            raise ValueError("incomplete API upload")
        for name in expected_api_names - {DIAGNOSTIC_RECIPIENT_CONFIG, JAMENDO_CONFIG}:
            local_api_file = BUILD / "api" / name
            if sha256_bytes(remote_bytes(ftp, name)) != hashlib.sha256(
                static_build_bytes(local_api_file)
            ).hexdigest():
                raise ValueError(f"API upload mismatch: {name}")
        if sha256_bytes(remote_bytes(ftp, DIAGNOSTIC_RECIPIENT_CONFIG)) != sha256_bytes(
            recipient_config
        ):
            raise ValueError("diagnostic recipient upload mismatch")
        if sha256_bytes(remote_bytes(ftp, JAMENDO_CONFIG)) != sha256_bytes(jamendo_config):
            raise ValueError("Jamendo configuration upload mismatch")
    finally:
        ftp.cwd("..")

    ftp.cwd(LAB_DIRECTORY)
    try:
        if sha256_bytes(remote_bytes(ftp, LAB_AUTH_CONFIG)) != sha256_bytes(lab_auth_config):
            raise ValueError("LAB authentication upload mismatch")
    finally:
        ftp.cwd("..")

    ftp.cwd("audio")
    try:
        ftp.cwd(ILLOBO_REMOTE_DIRECTORY)
        try:
            verify_remote_illobo(ftp, full_hash=True)
        finally:
            ftp.cwd("..")
    finally:
        ftp.cwd("..")


def is_recognized_app_entry(payload: bytes) -> bool:
    return (
        b"sedicivalvole" in payload
        and b'<div id="root"></div>' in payload
        and b"assets/index-" in payload
    )


def is_recognized_junction_bank(payload: bytes) -> bool:
    """Recognize an existing owned bank without requiring the next bank's hash."""
    if len(payload) < 13 or payload[:8] not in {b"SVJCTN01", b"SVJCTN02", b"SVJCTN03", b"SVJCTN04"}:
        return False
    manifest_length = int.from_bytes(payload[8:12], "little")
    audio_offset = 12 + manifest_length
    if manifest_length <= 0 or audio_offset >= len(payload):
        return False
    try:
        def reject_nonstandard_constant(value: str) -> None:
            raise ValueError(f"non-standard JSON constant: {value}")

        manifest = json.loads(
            payload[12:audio_offset].decode("utf-8"),
            parse_constant=reject_nonstandard_constant,
        )
    except (UnicodeDecodeError, ValueError):
        return False
    if not isinstance(manifest, dict):
        return False
    sections = manifest.get("sections")
    base_valid = (
        manifest.get("score") == "junction"
        and manifest.get("source") == "rendered-production"
        and isinstance(sections, list)
        and len(sections) >= 8
    )
    if manifest.get("format") == "sedicivalvole.music-bank.v1":
        def numeric(value: object) -> bool:
            return type(value) in {int, float} and math.isfinite(value)

        duration = manifest.get("durationSeconds")
        section_ids = [
            section.get("id") for section in sections if isinstance(section, dict)
        ]
        return (
            base_valid
            and payload[:8] == b"SVJCTN01"
            and len(sections) == 8
            and isinstance(manifest.get("mime"), str)
            and manifest["mime"].startswith("audio/")
            and numeric(manifest.get("bpm"))
            and manifest["bpm"] > 0
            and numeric(manifest.get("bars"))
            and manifest["bars"] > 0
            and numeric(manifest.get("barsPerSection"))
            and manifest["barsPerSection"] > 0
            and numeric(duration)
            and duration > 0
            and len(section_ids) == len(sections)
            and all(isinstance(section_id, str) and section_id for section_id in section_ids)
            and len(set(section_ids)) == len(section_ids)
            and all(
                "assetId" not in section
                and numeric(section.get("startSeconds"))
                and section["startSeconds"] >= 0
                and numeric(section.get("durationSeconds"))
                and section["durationSeconds"] > 0
                and section["startSeconds"] + section["durationSeconds"] <= duration + 1e-6
                for section in sections
            )
        )
    common_valid = base_valid and manifest.get("maxDecodedClips") == 6
    segmented_signatures = {
        "sedicivalvole.music-bank.v2": b"SVJCTN02",
        "sedicivalvole.music-bank.v3": b"SVJCTN03",
        "sedicivalvole.music-bank.v4": b"SVJCTN04",
    }
    if segmented_signatures.get(manifest.get("format")) != payload[:8]:
        return False
    assets = manifest.get("assets")
    if not isinstance(assets, list) or not assets:
        return False
    asset_ids = [asset.get("id") for asset in assets if isinstance(asset, dict)]
    asset_lengths = [asset.get("audioBytes") for asset in assets if isinstance(asset, dict)]
    asset_id_set = {asset_id for asset_id in asset_ids if isinstance(asset_id, str)}
    section_asset_ids = [
        section.get("assetId") for section in sections if isinstance(section, dict)
    ]
    return (
        common_valid
        and len(asset_ids) == len(assets)
        and all(isinstance(asset_id, str) and asset_id for asset_id in asset_ids)
        and len(asset_id_set) == len(asset_ids)
        and all(type(length) is int and length > 0 for length in asset_lengths)
        and len(section_asset_ids) == len(sections)
        and all(asset_id in asset_id_set for asset_id in section_asset_ids)
        and sum(asset_lengths) == len(payload) - audio_offset
    )


def is_recognized_nightshift_bank(payload: bytes) -> bool:
    """Recognize the mixed NIGHTSHIFT bank without admitting source loops."""
    if len(payload) < 13 or payload[:8] != b"SVNGHT01":
        return False
    manifest_length = int.from_bytes(payload[8:12], "little")
    audio_offset = 12 + manifest_length
    if manifest_length <= 0 or audio_offset >= len(payload):
        return False
    try:
        manifest = json.loads(
            payload[12:audio_offset].decode("utf-8"),
            parse_constant=lambda value: (_ for _ in ()).throw(ValueError(value)),
        )
    except (UnicodeDecodeError, ValueError):
        return False
    if not isinstance(manifest, dict):
        return False
    sections = manifest.get("sections")
    assets = manifest.get("assets")
    if not isinstance(sections, list) or not isinstance(assets, list):
        return False
    asset_ids = [asset.get("id") for asset in assets if isinstance(asset, dict)]
    asset_lengths = [asset.get("audioBytes") for asset in assets if isinstance(asset, dict)]
    asset_id_set = {asset_id for asset_id in asset_ids if isinstance(asset_id, str)}
    section_assets = [section.get("assetId") for section in sections if isinstance(section, dict)]
    return (
        manifest.get("format") == "sedicivalvole.music-bank.v1"
        and manifest.get("score") == "nightshift"
        and manifest.get("source") == "rendered-production"
        and manifest.get("rawSourceAssetsPublished") is False
        and manifest.get("mixing") == "single-synchronous-performance"
        and manifest.get("transitionMode") == "complete-eight-bar-boundary"
        and manifest.get("barsPerPerformance") == 8
        and manifest.get("primaryGrooves") == 1
        and manifest.get("maxDecodedClips") == 6
        and len(sections) == 18
        and len(assets) == 18
        and len(asset_ids) == len(assets)
        and len(asset_id_set) == len(assets)
        and all(isinstance(asset_id, str) and asset_id for asset_id in asset_ids)
        and all(type(length) is int and length > 0 for length in asset_lengths)
        and len(section_assets) == len(sections)
        and all(asset_id in asset_id_set for asset_id in section_assets)
        and sum(asset_lengths) == len(payload) - audio_offset
    )


def verify_remote_root(ftp: ftplib.FTP) -> set[str]:
    """Abort unless every overwrite/delete target can be identified read-only."""
    static_build_files()
    root_names = safe_names(ftp)
    allowed_root_names = {
        LEGACY_ROOT_FILE,
        "diagnostics",
        STATIC_ROOT_ENTRY,
        DYNAMIC_ROOT_ENTRY,
        DYNAMIC_STAGE_ENTRY,
        DYNAMIC_NEXT_ENTRY,
        "assets",
        "audio",
        "api",
        "brand",
        "fonts",
        "third-party",
        "ui",
        LAB_DIRECTORY,
    }
    allowed_root_names.update(
        path.name
        for path in BUILD.iterdir()
        if path.is_file() and path.name not in {STATIC_ROOT_ENTRY, DYNAMIC_ROOT_ENTRY}
    )
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
    for temporary_entry in (DYNAMIC_STAGE_ENTRY, DYNAMIC_NEXT_ENTRY):
        if temporary_entry not in root_names:
            continue
        temporary_php = remote_bytes(ftp, temporary_entry)
        if not temporary_php.startswith(PHP_ENTRY_PREFIX) or not is_recognized_app_entry(temporary_php):
            raise ValueError("unrecognized dynamic root candidate")

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
                local_hash = hashlib.sha256(static_build_bytes(local_assets[name])).hexdigest()
                if sha256_bytes(remote_bytes(ftp, name)) != local_hash:
                    raise ValueError("content-addressed asset mismatch")
        finally:
            ftp.cwd("..")

    if "api" in root_names:
        ftp.cwd("api")
        try:
            api_names = safe_names(ftp)
            if not api_names.issubset({
                DIAGNOSTIC_ENDPOINT,
                DIAGNOSTIC_RECIPIENT_CONFIG,
                JAMENDO_CONFIG,
                SOUNDTRACK_CATALOG_ENDPOINT,
                SOUNDTRACK_AUDIO_ENDPOINT,
            }):
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
            if JAMENDO_CONFIG in api_names:
                jamendo_config = remote_bytes(ftp, JAMENDO_CONFIG)
                if not all(marker in jamendo_config for marker in JAMENDO_CONFIG_MARKERS):
                    raise ValueError("Jamendo configuration identity mismatch")
            for name, markers in SOUNDTRACK_API_MARKERS.items():
                if name in api_names and not all(marker in remote_bytes(ftp, name) for marker in markers):
                    raise ValueError("Soundtrack API identity mismatch")
        finally:
            ftp.cwd("..")

    if LAB_DIRECTORY in root_names:
        ftp.cwd(LAB_DIRECTORY)
        try:
            lab_names = safe_names(ftp)
            if not lab_names.issubset({
                "index.php",
                "bootstrap.php",
                "send.php",
                "bloom-processor.js",
                "score-processor.js",
                LAB_AUTH_CONFIG,
            }):
                raise ValueError("unexpected LAB entry")
            marker_sets = {
                "index.php": LAB_PAGE_MARKERS,
                "bootstrap.php": LAB_BOOTSTRAP_MARKERS,
                "send.php": LAB_SEND_MARKERS,
                "bloom-processor.js": LAB_BLOOM_PROCESSOR_MARKERS,
                "score-processor.js": LAB_SCORE_PROCESSOR_MARKERS,
                LAB_AUTH_CONFIG: LAB_AUTH_CONFIG_MARKERS,
            }
            for name in lab_names:
                if not all(marker in remote_bytes(ftp, name) for marker in marker_sets[name]):
                    raise ValueError("LAB entry identity mismatch")
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

    if "brand" in root_names:
        ftp.cwd("brand")
        try:
            verify_remote_static_tree(
                ftp,
                BUILD / "brand",
                tree_name="brand",
            )
        finally:
            ftp.cwd("..")

    if "audio" in root_names:
        ftp.cwd("audio")
        try:
            audio_names = safe_names(ftp)
            if not audio_names.issubset({"junction.svb", "nightshift.svb", ILLOBO_REMOTE_DIRECTORY}):
                raise ValueError("unexpected audio entry")
            if "junction.svb" in audio_names and not is_recognized_junction_bank(
                remote_bytes(ftp, "junction.svb")
            ):
                raise ValueError("audio identity mismatch")
            if "nightshift.svb" in audio_names and not is_recognized_nightshift_bank(
                remote_bytes(ftp, "nightshift.svb")
            ):
                raise ValueError("NIGHTSHIFT audio identity mismatch")
            if ILLOBO_REMOTE_DIRECTORY in audio_names:
                ftp.cwd(ILLOBO_REMOTE_DIRECTORY)
                try:
                    verify_remote_illobo(ftp, full_hash=True)
                finally:
                    ftp.cwd("..")
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


def argument_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Verify or publish the built client at the canonical root. "
            "Publication always requires the explicit --publish flag."
        ),
    )
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument(
        "--publish",
        action="store_true",
        help="perform a real publication after all identity gates pass",
    )
    mode.add_argument(
        "--verify-only",
        action="store_true",
        help="verify configuration and remote identity without remote writes",
    )
    parser.add_argument(
        "--preserve-existing",
        action="store_true",
        help="publish without deleting the existing static entry or legacy tree",
    )
    parser.add_argument(
        "--stage-php-entry",
        action="store_true",
        help="publish and verify the PHP entry without switching the static root",
    )
    return parser


def parse_arguments(argv: list[str]) -> argparse.Namespace:
    """Parse a fail-closed deployment command without loading configuration."""
    parser = argument_parser()
    known_flags = {
        "-h",
        "--help",
        "--publish",
        "--verify-only",
        "--preserve-existing",
        "--stage-php-entry",
    }
    if any(argument not in known_flags for argument in argv):
        parser.error("unsupported argument")
    if len(argv) != len(set(argv)):
        parser.error("arguments may not be repeated")
    if ("-h" in argv or "--help" in argv) and len(argv) != 1:
        parser.error("--help must be used alone")
    arguments = parser.parse_args(argv)
    if not arguments.publish and (arguments.preserve_existing or arguments.stage_php_entry):
        parser.error("--preserve-existing and --stage-php-entry require --publish")
    return arguments


def main() -> int:
    arguments = parse_arguments(sys.argv[1:])
    stage = "configuration"
    ftp: ftplib.FTP | None = None
    try:
        config = parse_env(ROOT / ".env")
        jamendo_local = parse_env(ROOT / ".env.jamendo.local")
        if any(not config.get(key) for key in REQUIRED):
            raise ValueError("missing required deploy field")
        if config["DEPLOY_PROTOCOL"].strip().lower() != "ftp":
            raise ValueError("configured protocol is not FTP")
        try:
            port = int(config["DEPLOY_PORT"])
        except (TypeError, ValueError):
            raise ValueError("configured FTP port is invalid") from None
        if port != 21:
            raise ValueError("configured FTP port is not 21")
        if not config.get("LAB_ACCESS_PASSWORD"):
            raise ValueError("LAB access password is missing")
        jamendo_client_id = (
            config.get("JAMENDO_CLIENT_ID")
            or config.get("JAMENDO_API_KEY")
            or jamendo_local.get("JAMENDO_CLIENT_ID")
            or jamendo_local.get("JAMENDO_API_KEY")
        )
        if not jamendo_client_id:
            raise ValueError("Jamendo client ID is missing")
        if not (BUILD / "index.html").is_file():
            raise FileNotFoundError("production build is missing")
        static_build_files()
        if not DIAGNOSTIC_RECIPIENT_SOURCE.is_file():
            raise FileNotFoundError("local diagnostic recipient configuration is missing")
        recipient_config = DIAGNOSTIC_RECIPIENT_SOURCE.read_bytes()
        if not all(marker in recipient_config for marker in DIAGNOSTIC_RECIPIENT_CONFIG_MARKERS):
            raise ValueError("local diagnostic recipient configuration is invalid")
        lab_auth_config = build_lab_auth_config(config["LAB_ACCESS_PASSWORD"])
        if not all(marker in lab_auth_config for marker in LAB_AUTH_CONFIG_MARKERS):
            raise ValueError("generated LAB authentication configuration is invalid")
        jamendo_config = build_jamendo_config(jamendo_client_id)
        if not all(marker in jamendo_config for marker in JAMENDO_CONFIG_MARKERS):
            raise ValueError("generated Jamendo configuration is invalid")
        illobo_tracks, illobo_catalog = illobo_archive()

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
        if arguments.verify_only:
            remote_count = len(safe_names(ftp))
            ftp.quit()
            ftp = None
            print(f"remote_listing=PASS entries={remote_count}")
            print("remote_writes=NONE")
            return 0

        stage = "upload"
        stage_php_entry = arguments.stage_php_entry
        preserve_existing = arguments.preserve_existing
        php_entry = dynamic_root_payload()
        if stage_php_entry:
            verify_staged_dynamic_root(ftp, php_entry)
            remote_count = len(safe_names(ftp))
            ftp.quit()
            ftp = None
            print(f"upload=PASS files=1 bytes={len(php_entry)}")
            print("dynamic_root=PASS staged=true static_entry_removed=false")
            print("legacy_cleanup=SKIPPED staged_php_entry=true")
            print(f"remote_listing=PASS entries={remote_count}")
            print("remote_writes=STAGED_PHP_ENTRY_ONLY_REMOVED")
            return 0

        files = static_upload_files()
        uploaded_bytes = 0
        for local_file in files:
            relative = local_file.relative_to(BUILD)
            for part in relative.parts[:-1]:
                enter_or_create(ftp, part)
            with open_static_build_file(local_file) as handle:
                local_size = os.fstat(handle.fileno()).st_size
                ftp.storbinary(f"STOR {relative.name}", handle, blocksize=65536)
            for _ in relative.parts[:-1]:
                ftp.cwd("..")
            uploaded_bytes += local_size

        enter_or_create(ftp, "api")
        try:
            ftp.storbinary(
                f"STOR {DIAGNOSTIC_RECIPIENT_CONFIG}",
                io.BytesIO(recipient_config),
                blocksize=65536,
            )
            if sha256_bytes(remote_bytes(ftp, DIAGNOSTIC_RECIPIENT_CONFIG)) != sha256_bytes(
                recipient_config
            ):
                raise ValueError("diagnostic recipient upload mismatch")
            ftp.storbinary(
                f"STOR {JAMENDO_CONFIG}",
                io.BytesIO(jamendo_config),
                blocksize=65536,
            )
            if sha256_bytes(remote_bytes(ftp, JAMENDO_CONFIG)) != sha256_bytes(jamendo_config):
                raise ValueError("Jamendo configuration upload mismatch")
        finally:
            ftp.cwd("..")
        uploaded_bytes += len(recipient_config) + len(jamendo_config)

        enter_or_create(ftp, LAB_DIRECTORY)
        try:
            ftp.storbinary(
                f"STOR {LAB_AUTH_CONFIG}",
                io.BytesIO(lab_auth_config),
                blocksize=65536,
            )
            if sha256_bytes(remote_bytes(ftp, LAB_AUTH_CONFIG)) != sha256_bytes(lab_auth_config):
                raise ValueError("LAB authentication upload mismatch")
        finally:
            ftp.cwd("..")
        uploaded_bytes += len(lab_auth_config)

        enter_or_create(ftp, "audio")
        try:
            enter_or_create(ftp, ILLOBO_REMOTE_DIRECTORY)
            try:
                ftp.storbinary(
                    f"STOR {ILLOBO_PUBLIC_CATALOG}",
                    io.BytesIO(illobo_catalog),
                    blocksize=65536,
                )
                for track in illobo_tracks:
                    with Path(track["path"]).open("rb") as handle:
                        ftp.storbinary(
                            f"STOR {track['filename']}",
                            handle,
                            blocksize=65536,
                        )
            finally:
                ftp.cwd("..")
        finally:
            ftp.cwd("..")
        uploaded_bytes += len(illobo_catalog) + sum(int(track["bytes"]) for track in illobo_tracks)

        verify_completed_upload(ftp, recipient_config, lab_auth_config, jamendo_config)

        # The canonical entry is deliberately the final content operation. The
        # candidate is uploaded and verified under a non-executable name, then a
        # same-directory FTP rename replaces the live file as one server action.
        install_dynamic_root(ftp, php_entry)
        uploaded_bytes += len(php_entry)

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
        print(f"upload=PASS files={len(files) + 5 + len(illobo_tracks)} bytes={uploaded_bytes}")
        print(f"illobo_playlist=PASS tracks={len(illobo_tracks)} full_hash_verification=true")
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
