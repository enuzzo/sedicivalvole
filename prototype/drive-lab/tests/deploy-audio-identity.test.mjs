import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const deployScript = new URL("../../../scripts/deploy_drive_lab_ftp.py", import.meta.url);
const junctionBank = new URL("../public/audio/junction.svb", import.meta.url);
const nightshiftBank = new URL("../public/audio/nightshift.svb", import.meta.url);

test("the deploy gate recognizes an owned JUNCTION bank without accepting arbitrary audio", () => {
  const program = String.raw`
import importlib.util
import json
import pathlib
import re
import sys

spec = importlib.util.spec_from_file_location("sedicivalvole_deploy", sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
bank = pathlib.Path(sys.argv[2]).read_bytes()
assert module.is_recognized_junction_bank(bank)
assert not module.is_recognized_junction_bank(b"not-a-junction-bank")
assert not module.is_recognized_junction_bank(b"BADMAGIC" + bank[8:])
malicious = bytearray(bank)
marker = b'"maxDecodedClips":6'
at = malicious.find(marker)
assert at >= 0
malicious[at + len(marker) - 1] = ord("9")
assert not module.is_recognized_junction_bank(bytes(malicious))

missing_asset = bytearray(bank)
manifest_length = int.from_bytes(missing_asset[8:12], "little")
manifest = missing_asset[12:12 + manifest_length]
sections_at = manifest.find(b'"sections"')
reference = re.search(rb'"assetId":"([^"]+)"', manifest[sections_at:])
assert sections_at >= 0 and reference is not None
reference_at = 12 + sections_at + reference.start(1)
missing_asset[reference_at:reference_at + len(reference.group(1))] = b"x" * len(reference.group(1))
assert not module.is_recognized_junction_bank(bytes(missing_asset))

legacy_manifest = {
    "format": "sedicivalvole.music-bank.v1",
    "score": "junction",
    "source": "rendered-production",
    "mime": "audio/ogg; codecs=opus",
    "bpm": 168,
    "bars": 64,
    "barsPerSection": 8,
    "durationSeconds": 8,
    "sections": [
        {
            "id": f"section-{index}",
            "startSeconds": index,
            "durationSeconds": 1,
        }
        for index in range(8)
    ],
}
legacy_manifest_bytes = json.dumps(legacy_manifest, separators=(",", ":")).encode()
legacy_bank = b"SVJCTN01" + len(legacy_manifest_bytes).to_bytes(4, "little") + legacy_manifest_bytes + b"x"
assert module.is_recognized_junction_bank(legacy_bank)
legacy_manifest["sections"][0]["assetId"] = "missing"
legacy_manifest_bytes = json.dumps(legacy_manifest, separators=(",", ":")).encode()
legacy_bank = b"SVJCTN01" + len(legacy_manifest_bytes).to_bytes(4, "little") + legacy_manifest_bytes + b"x"
assert not module.is_recognized_junction_bank(legacy_bank)

boolean_length_manifest = {
    "format": "sedicivalvole.music-bank.v4",
    "score": "junction",
    "source": "rendered-production",
    "maxDecodedClips": 6,
    "assets": [{"id": "asset", "audioBytes": True}],
    "sections": [{"id": f"section-{index}", "assetId": "asset"} for index in range(8)],
}
boolean_manifest_bytes = json.dumps(boolean_length_manifest, separators=(",", ":")).encode()
boolean_length_bank = b"SVJCTN04" + len(boolean_manifest_bytes).to_bytes(4, "little") + boolean_manifest_bytes + b"x"
assert not module.is_recognized_junction_bank(boolean_length_bank)

for nonfinite_value, token in [
    (float("nan"), b"NaN"),
    (float("inf"), b"Infinity"),
    (float("-inf"), b"-Infinity"),
]:
    nonfinite_manifest = {
        "format": "sedicivalvole.music-bank.v4",
        "score": "junction",
        "source": "rendered-production",
        "maxDecodedClips": 6,
        "bpm": nonfinite_value,
        "assets": [{"id": "asset", "audioBytes": 1}],
        "sections": [{"id": f"section-{index}", "assetId": "asset"} for index in range(8)],
    }
    nonfinite_manifest_bytes = json.dumps(nonfinite_manifest, separators=(",", ":")).encode()
    nonfinite_bank = b"SVJCTN04" + len(nonfinite_manifest_bytes).to_bytes(4, "little") + nonfinite_manifest_bytes + b"x"
    assert token in nonfinite_manifest_bytes
    assert not module.is_recognized_junction_bank(nonfinite_bank)
assert module.LEGACY_UI_HASHES == {
    "launch-latch.png": "2a692ce1a7d3933495f1047be4449a7c168dbb1692a3724ec62a9c60b6b51c49",
    "launch-safety.png": "19533d8ce389d7342806f6090ca52b17c582adfac841bb3172ef175e29359d8c",
    "launch-vent.png": "e78d35a833b66dc5dd2cada78521db77b8e146ff820fd7366b98bc828bda0f1c",
}
`;
  execFileSync("python3", [
    "-c",
    program,
    deployScript.pathname,
    junctionBank.pathname,
  ], {
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
  });
});

test("the deploy gate recognizes only the mixed NIGHTSHIFT production bank", () => {
  const program = String.raw`
import importlib.util
import pathlib
import sys

spec = importlib.util.spec_from_file_location("sedicivalvole_deploy", sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
bank = pathlib.Path(sys.argv[2]).read_bytes()
assert module.is_recognized_nightshift_bank(bank)
assert not module.is_recognized_nightshift_bank(b"not-nightshift")
wrong_magic = b"BADMAGIC" + bank[8:]
assert not module.is_recognized_nightshift_bank(wrong_magic)
manifest_length = int.from_bytes(bank[8:12], "little")
manifest = bytearray(bank[12:12 + manifest_length])
marker = b'"rawSourceAssetsPublished":false'
at = manifest.find(marker)
assert at >= 0
manifest[at + len(marker) - 5:at + len(marker)] = b"true "
mutated = bank[:12] + bytes(manifest) + bank[12 + manifest_length:]
assert not module.is_recognized_nightshift_bank(mutated)
`;
  execFileSync("python3", [
    "-c",
    program,
    deployScript.pathname,
    nightshiftBank.pathname,
  ], {
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
  });
});

test("the deploy gate admits only the byte-identical retired repeat worklet", () => {
  const source = readFileSync(deployScript, "utf8");
  assert.match(source, /RETIRED_LAB_HASHES = \{/);
  assert.match(source, /"soundtrack-repeat-processor\.js": "4394837a3bebf6e065cd1dabc6b43e73f302bbead98bf43af830f9df15620aad"/);
  assert.match(source, /sha256_bytes\(remote_bytes\(ftp, name\)\) != RETIRED_LAB_HASHES\[name\]/);
  assert.match(source, /raise ValueError\("retired LAB entry identity mismatch"\)/);
});

test("the deploy gate removes only bounded Finder metadata from the canonical root", () => {
  const program = String.raw`
import importlib.util
import sys

spec = importlib.util.spec_from_file_location("sedicivalvole_deploy", sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

assert module.is_recognized_macos_metadata(b"\x00\x00\x00\x01Bud1payload")
assert not module.is_recognized_macos_metadata(b"not finder metadata")
assert not module.is_recognized_macos_metadata(b"\x00\x00\x00\x01Bud1" + b"x" * (1024 * 1024))
`;
  execFileSync("python3", ["-c", program, deployScript.pathname], {
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
  });

  const source = readFileSync(deployScript, "utf8");
  assert.match(source, /MACOS_METADATA_ROOT_ENTRY = "\.DS_Store"/);
  assert.match(source, /root_metadata_cleanup=PASS removed=/);
});

test("the deploy gate verifies the packaged font tree explicitly", () => {
  const source = readFileSync(deployScript, "utf8");

  assert.match(source, /"fonts",\n\s+"third-party"/);
  assert.match(source, /if "fonts" in root_names:/);
  assert.match(source, /BUILD \/ "fonts",\n\s+tree_name="fonts"/);
});

test("the deploy gate admits only byte-identical retired fonts during cache overlap", () => {
  const program = String.raw`
import importlib.util
import sys

spec = importlib.util.spec_from_file_location("sedicivalvole_deploy", sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

assert module.RETIRED_FONT_HASHES == {
    "OFL-IBM-Plex-Mono.txt": "d741e57d5f865e294df801f96b7b5161a88b211df65887e4358d271c9fc5fb4f",
    "ibm-plex-mono-regular.ttf": "6a3412f058c7d8dfd9170c41e85ade48e5156ecb89356110ca57a0a27734af46",
    "ibm-plex-mono-semibold.ttf": "d3c38e55c78f5b0f28009fddba4834ec503278936a5986032424c9bd2d23aa46",
    "orbitron-latin-variable.woff2": "c25a9f9da5d9f3db1bf2a01474722dc9b377675b7bbab6d0dfda6902794fd1ed",
}

module.RETIRED_FONT_HASHES = {"old.ttf": module.sha256_bytes(b"retired")}
assert module.is_recognized_retired_font("old.ttf", b"retired")
assert not module.is_recognized_retired_font("old.ttf", b"retired-mutated")

assert not module.is_recognized_retired_font("unknown-font.ttf", b"font")
`;
  execFileSync("python3", [
    "-c",
    program,
    deployScript.pathname,
  ], {
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
  });
});

test("the deploy gate verifies the selected brand tree explicitly", () => {
  const source = readFileSync(deployScript, "utf8");

  assert.match(source, /"brand",\n\s+"fonts"/);
  assert.match(source, /if "brand" in root_names:/);
  assert.match(source, /BUILD \/ "brand",\n\s+tree_name="brand"/);
  assert.match(source, /tree_name == "brand"/);

  const program = String.raw`
import importlib.util
import sys

spec = importlib.util.spec_from_file_location("sedicivalvole_deploy", sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

new_master = bytes.fromhex(sys.argv[2])
assert module.PROJECT_OWNED_BRAND_HASHES["sedicivalvole-mark.svg"] == frozenset({
    "e47522c4166f6c4f7e8e978b09b9fd2e2835f438732cf67004aede57ff0d8ace",
    "210b319522825982589907c213661720abbf7ea94d29b3a53a7fb4a7cec275e5",
})
assert module.is_recognized_project_owned_brand_entry(
    "sedicivalvole-mark.svg", new_master
)
assert not module.is_recognized_project_owned_brand_entry(
    "sedicivalvole-mark.svg", b"arbitrary brand payload"
)
assert not module.is_recognized_project_owned_brand_entry(
    "product-icon-512.png", new_master
)
assert module.RETIRED_BRAND_HASHES == {
    "illobo-featured-provisional.png": "da6d5086f06dc8a38ea580f3a5c4289363c214cb8736c9e84ffa39a462946e2b",
}
module.RETIRED_BRAND_HASHES = {"old.png": module.sha256_bytes(b"retired")}
assert module.is_recognized_retired_brand("old.png", b"retired")
assert not module.is_recognized_retired_brand("old.png", b"mutated")
assert not module.is_recognized_retired_brand("unknown.png", new_master)
`;
  const newMaster = readFileSync(
    new URL("../public/brand/sedicivalvole-mark.svg", import.meta.url),
  );
  execFileSync("python3", [
    "-c",
    program,
    deployScript.pathname,
    newMaster.toString("hex"),
  ], {
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
  });
});

test("third-party upgrades are limited to recognized project-owned Drivey bridge files", () => {
  const source = readFileSync(deployScript, "utf8");
  assert.match(source, /tree_name == "third-party"/);
  assert.match(source, /relative_path,\n\s+remote_payload/);
  assert.match(source, /relative_path,\n\s+local_payload/);

  const program = String.raw`
import importlib.util
import pathlib
import sys

spec = importlib.util.spec_from_file_location("sedicivalvole_deploy", sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

shell = b'''import Drivey from "./js/Drivey.js";
window.__SEDICIVALVOLE_DRIVEY__ = Object.freeze({
  upstreamCommit: "5104cdade2a3158786b05b9b0680a50e942830cf",
});'''
boundary = b'''# Drivey.js integration boundary
- Project integration shell: sedicivalvole.html
- Imported commit: 5104cdade2a3158786b05b9b0680a50e942830cf'''

assert module.is_recognized_project_owned_third_party_entry(
    "drivey/sedicivalvole.html", shell
)
assert module.is_recognized_project_owned_third_party_entry(
    pathlib.Path("drivey/SEDICIVALVOLE-INTEGRATION.md"), boundary
)
assert not module.is_recognized_project_owned_third_party_entry(
    "drivey/js/Drivey.js", shell
)
assert not module.is_recognized_project_owned_third_party_entry(
    "drivey/sedicivalvole.html", b"arbitrary remote content"
)
`;
  execFileSync("python3", ["-c", program, deployScript.pathname], {
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
  });
});

test("FTP publication sources the local recipient outside every Vite-served tree", () => {
  const program = String.raw`
import importlib.util
import sys

spec = importlib.util.spec_from_file_location("sedicivalvole_deploy", sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

expected = module.ROOT / "prototype" / "drive-lab" / "config" / "diagnostic-recipient.local.php"
assert module.DIAGNOSTIC_RECIPIENT_SOURCE == expected
assert module.DIAGNOSTIC_RECIPIENT_SOURCE != module.BUILD / "api" / "recipient.local.php"
assert (module.ROOT / "prototype" / "drive-lab" / "public") not in module.DIAGNOSTIC_RECIPIENT_SOURCE.parents
assert module.BUILD not in module.DIAGNOSTIC_RECIPIENT_SOURCE.parents
`;

  execFileSync("python3", ["-c", program, deployScript.pathname], {
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
  });
});

test("the recipient example cannot direct operators back into the public tree", () => {
  const example = readFileSync(
    new URL("../config/diagnostic-recipient.local.php.example", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(example, /public\/api/i);
  assert.match(example, /config\/diagnostic-recipient\.local\.php/);
  assert.match(example, /outside public\/ and dist\//);
});

test("static uploads never overwrite the reserved root entries", () => {
  const program = String.raw`
import importlib.util
import pathlib
import sys
import tempfile

spec = importlib.util.spec_from_file_location("sedicivalvole_deploy", sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

with tempfile.TemporaryDirectory() as directory:
    root = pathlib.Path(directory)
    module.BUILD = root
    (root / "assets").mkdir()
    (root / "api").mkdir()
    (root / "index.html").write_text("reserved", encoding="utf-8")
    (root / "index.php").write_text("reserved", encoding="utf-8")
    (root / "assets" / "index.html").write_text("nested", encoding="utf-8")
    (root / "assets" / "app.js").write_text("asset", encoding="utf-8")
    relative = [path.relative_to(root).as_posix() for path in module.static_upload_files()]
    assert relative == ["assets/app.js", "assets/index.html"]
`;

  execFileSync("python3", ["-c", program, deployScript.pathname], {
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
  });
});

test("FTP publication rejects private filenames and symbolic links without reading them", () => {
  const program = String.raw`
import importlib.util
import pathlib
import sys
import tempfile

spec = importlib.util.spec_from_file_location("sedicivalvole_deploy", sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

for safe_name in ("send-diagnostic.php", "keyboard.js", "localization.php", ".gitignore"):
    assert not module.is_forbidden_static_name(safe_name)

for relative in (
    ".env",
    ".env.production",
    ".env-local",
    ".envrc",
    ".htpasswd",
    ".npmrc",
    ".npmrc.backup",
    "id_ed25519",
    "id_ed25519.backup",
    "id_ed25519~",
    ".ssh/config",
    ".docker/config.json",
    "api/recipient.local.php",
    "api/diagnostic-recipient.private.php",
    "config/client-secret.json",
    "config/server.pem",
):
    with tempfile.TemporaryDirectory() as directory:
        root = pathlib.Path(directory)
        module.BUILD = root
        candidate = root / relative
        candidate.parent.mkdir(parents=True, exist_ok=True)
        candidate.write_text("harmless fixture", encoding="utf-8")
        try:
            module.static_upload_files()
        except ValueError as error:
            assert str(error) == module.STATIC_SAFETY_ERROR
        else:
            raise AssertionError(f"accepted forbidden static name: {relative}")

with tempfile.TemporaryDirectory() as directory:
    root = pathlib.Path(directory)
    module.BUILD = root
    target = root / "harmless-target.txt"
    target.write_text("harmless fixture", encoding="utf-8")
    (root / "asset-link.txt").symlink_to(target)
    try:
        module.static_upload_files()
    except ValueError as error:
        assert str(error) == module.STATIC_SAFETY_ERROR
    else:
        raise AssertionError("accepted symbolic link in static build")

with tempfile.TemporaryDirectory() as directory:
    root = pathlib.Path(directory)
    real_dist = root / "real-dist"
    (real_dist / "client").mkdir(parents=True)
    (real_dist / "client" / "index.html").write_text("harmless fixture", encoding="utf-8")
    linked_dist = root / "dist"
    linked_dist.symlink_to(real_dist, target_is_directory=True)
    module.BUILD = linked_dist / "client"
    try:
        module.static_upload_files()
    except ValueError as error:
        assert str(error) == module.STATIC_SAFETY_ERROR
    else:
        raise AssertionError("accepted symbolic link as static build parent")

with tempfile.TemporaryDirectory() as directory:
    root = pathlib.Path(directory)
    module.BUILD = root
    candidate = root / "index.html"
    candidate.write_text("harmless fixture", encoding="utf-8")
    module.static_upload_files()
    target = root.parent / f"{root.name}-target.txt"
    target.write_text("harmless fixture", encoding="utf-8")
    candidate.unlink()
    candidate.symlink_to(target)
    try:
        module.open_static_build_file(candidate)
    except ValueError as error:
        assert str(error) == module.STATIC_SAFETY_ERROR
    else:
        raise AssertionError("followed a file symlink introduced after validation")
    target.unlink()

with tempfile.TemporaryDirectory() as directory:
    root = pathlib.Path(directory)
    module.BUILD = root
    assets = root / "assets"
    assets.mkdir()
    candidate = assets / "app.js"
    candidate.write_text("harmless fixture", encoding="utf-8")
    module.static_upload_files()
    real_assets = root / "assets-real"
    assets.rename(real_assets)
    assets.symlink_to(real_assets, target_is_directory=True)
    try:
        module.open_static_build_file(assets / "app.js")
    except ValueError as error:
        assert str(error) == module.STATIC_SAFETY_ERROR
    else:
        raise AssertionError("followed a directory symlink introduced after validation")
`;

  execFileSync("python3", ["-c", program, deployScript.pathname], {
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
  });
});

test("PHP staging round-trips a non-executable candidate without replacing index.php", () => {
  const program = String.raw`
import importlib.util
import io
import sys

spec = importlib.util.spec_from_file_location("sedicivalvole_deploy", sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class FakeFtp:
    def __init__(self):
        self.files = {}
        self.commands = []

    def storbinary(self, command, handle, blocksize=65536):
        self.commands.append(command)
        self.files[command.removeprefix("STOR ")] = handle.read()

    def retrbinary(self, command, callback):
        self.commands.append(command)
        callback(self.files[command.removeprefix("RETR ")])

    def nlst(self):
        return list(self.files)

    def delete(self, name):
        self.commands.append(f"DELE {name}")
        del self.files[name]

ftp = FakeFtp()
module.verify_staged_dynamic_root(ftp, b"generated entry")
assert "STOR index.php" not in ftp.commands
assert ftp.commands == [
    "STOR index.php.stage",
    "RETR index.php.stage",
    "DELE index.php.stage",
]
assert ftp.files == {}
`;

  execFileSync("python3", ["-c", program, deployScript.pathname], {
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
  });
});

test("normal publication verifies the complete build before replacing the live PHP entry", () => {
  const source = readFileSync(deployScript, "utf8");
  const completedGateAt = source.lastIndexOf("verify_completed_upload(ftp, recipient_config, lab_auth_config, jamendo_config)");
  const liveEntryWriteAt = source.lastIndexOf("install_dynamic_root(ftp, php_entry)");
  assert.ok(completedGateAt >= 0);
  assert.ok(liveEntryWriteAt > completedGateAt);
  assert.doesNotMatch(source, /STOR \{DYNAMIC_ROOT_ENTRY\}/);
  assert.match(source, /require_complete=True/);
  assert.match(source, /if require_complete and not expected_names\.issubset\(remote_names\)/);
  assert.match(source, /"artwork",/);
  assert.match(source, /BUILD \/ "artwork"/);
  assert.match(source, /expected_api_names = \{/);
});

test("the artwork migration admits and removes only exact retired Illobo PNG masters", () => {
  const program = String.raw`
import importlib.util
import pathlib
import sys
import tempfile

spec = importlib.util.spec_from_file_location("sedicivalvole_deploy", sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

with tempfile.TemporaryDirectory() as directory:
    root = pathlib.Path(directory)
    module.ILLOBO_ARTWORK_MASTERS_ROOT = root / "masters"
    module.ILLOBO_ARTWORK_ROOT = root / "public"
    module.ILLOBO_ARTWORK_MASTERS_ROOT.mkdir()
    module.ILLOBO_ARTWORK_ROOT.mkdir()
    (module.ILLOBO_ARTWORK_MASTERS_ROOT / "track.png").write_bytes(b"reviewed png master")
    (module.ILLOBO_ARTWORK_ROOT / "track.webp").write_bytes(b"optimized webp")

    assert module.is_recognized_retired_illobo_artwork(
        pathlib.Path("illobo/track.png"),
        b"reviewed png master",
    )
    assert not module.is_recognized_retired_illobo_artwork(
        pathlib.Path("illobo/track.png"),
        b"changed remote payload",
    )
    assert not module.is_recognized_retired_illobo_artwork(
        pathlib.Path("other/track.png"),
        b"reviewed png master",
    )
`;

  execFileSync("python3", ["-c", program, deployScript.pathname], {
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
  });

  const source = readFileSync(deployScript, "utf8");
  const removeAt = source.lastIndexOf("retired_illobo_artwork = remove_retired_illobo_artwork(ftp)");
  const verifyAt = source.lastIndexOf("verify_completed_upload(ftp, recipient_config, lab_auth_config, jamendo_config)");
  assert.ok(removeAt >= 0);
  assert.ok(verifyAt > removeAt);
  assert.match(source, /illobo_artwork_migration=PASS retired_png_files=/);
});

test("the live PHP entry is installed only by verified same-directory rename", () => {
  const program = String.raw`
import importlib.util
import sys

spec = importlib.util.spec_from_file_location("sedicivalvole_deploy", sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class FakeFtp:
    def __init__(self):
        self.files = {"index.php": b"previous"}
        self.commands = []

    def storbinary(self, command, handle, blocksize=65536):
        self.commands.append(command)
        self.files[command.removeprefix("STOR ")] = handle.read()

    def retrbinary(self, command, callback):
        self.commands.append(command)
        callback(self.files[command.removeprefix("RETR ")])

    def rename(self, source, target):
        self.commands.append(f"RNFR/RNTO {source} {target}")
        self.files[target] = self.files.pop(source)

    def nlst(self):
        return list(self.files)

    def delete(self, name):
        self.commands.append(f"DELE {name}")
        del self.files[name]

ftp = FakeFtp()
module.install_dynamic_root(ftp, b"complete next entry")
assert ftp.files == {"index.php": b"complete next entry"}
assert "STOR index.php" not in ftp.commands
assert ftp.commands == [
    "STOR index.php.next",
    "RETR index.php.next",
    "RNFR/RNTO index.php.next index.php",
    "RETR index.php",
]
`;

  execFileSync("python3", ["-c", program, deployScript.pathname], {
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
  });
});

test("deployment modes are explicit and operational flags require publication", () => {
  const program = String.raw`
import importlib.util
import contextlib
import io
import sys

spec = importlib.util.spec_from_file_location("sedicivalvole_deploy", sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

publish = module.parse_arguments(["--publish"])
assert publish.publish
assert not publish.verify_only
assert not publish.preserve_existing
assert not publish.stage_php_entry

preserved = module.parse_arguments(["--publish", "--preserve-existing"])
assert preserved.publish and preserved.preserve_existing

staged = module.parse_arguments(["--stage-php-entry", "--publish"])
assert staged.publish and staged.stage_php_entry

combined = module.parse_arguments([
    "--publish",
    "--preserve-existing",
    "--stage-php-entry",
])
assert combined.publish and combined.preserve_existing and combined.stage_php_entry

verified = module.parse_arguments(["--verify-only"])
assert verified.verify_only
assert not verified.publish

for rejected in (
    [],
    ["--unknown"],
    ["--help", "--unknown"],
    ["--help", "--publish"],
    ["--publish", "--publish"],
    ["--preserve-existing"],
    ["--stage-php-entry"],
    ["--verify-only", "--preserve-existing"],
    ["--verify-only", "--stage-php-entry"],
    ["--verify-only", "--publish"],
):
    with contextlib.redirect_stderr(io.StringIO()):
        try:
            module.parse_arguments(rejected)
        except SystemExit as error:
            assert error.code == 2
        else:
            raise AssertionError(f"accepted unsafe deployment arguments: {rejected}")
`;

  execFileSync("python3", ["-c", program, deployScript.pathname], {
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
  });
});

test("an invalid configured FTP port never appears in deployment output", () => {
  const program = String.raw`
import contextlib
import importlib.util
import io
import sys

spec = importlib.util.spec_from_file_location("sedicivalvole_deploy", sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

sentinel = "SHOULD_NOT_LEAK_94f51"
module.parse_env = lambda path: {
    "DEPLOY_PROTOCOL": "ftp",
    "DEPLOY_HOST": "fixture",
    "DEPLOY_PORT": sentinel,
    "DEPLOY_USERNAME": "fixture",
    "DEPLOY_PASSWORD": "fixture",
    "DEPLOY_REMOTE_PATH": "fixture",
}
sys.argv = [sys.argv[1], "--verify-only"]
stderr = io.StringIO()
with contextlib.redirect_stderr(stderr):
    exit_code = module.main()
output = stderr.getvalue()
assert exit_code == 1
assert output.strip() == "configuration=FAIL reason=configured_ftp_port_is_invalid"
assert sentinel.lower() not in output.lower()
`;

  execFileSync("python3", ["-c", program, deployScript.pathname], {
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
  });
});

test("invalid deployment CLI invocations stop before configuration is loaded", () => {
  const environment = { ...process.env, PYTHONDONTWRITEBYTECODE: "1" };
  const rejectedCommands = [
    [],
    ["--unknown"],
    ["--help", "--unknown"],
    ["--help", "--publish"],
    ["--publish", "--publish"],
    ["--preserve-existing"],
    ["--verify-only", "--stage-php-entry"],
    ["--verify-only", "--publish"],
  ];

  for (const arguments_ of rejectedCommands) {
    const result = spawnSync("python3", [deployScript.pathname, ...arguments_], {
      encoding: "utf8",
      env: environment,
    });
    assert.equal(result.status, 2, `unsafe arguments should fail: ${arguments_.join(" ")}`);
    assert.match(result.stderr, /usage:/);
    assert.doesNotMatch(result.stdout + result.stderr, /configuration=(?:PASS|FAIL)/);
  }

  const help = spawnSync("python3", [deployScript.pathname, "--help"], {
    encoding: "utf8",
    env: environment,
  });
  assert.equal(help.status, 0);
  assert.match(help.stdout, /--publish/);
  assert.doesNotMatch(help.stdout + help.stderr, /configuration=(?:PASS|FAIL)/);
});
