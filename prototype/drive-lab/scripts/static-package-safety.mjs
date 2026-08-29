import {
  closeSync,
  constants,
  existsSync,
  fstatSync,
  ftruncateSync,
  lstatSync,
  openSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const PRIVATE_NAME_TOKEN = /(^|[._-])(secret|secrets|credential|credentials|private|key|keys|cert|certs|certificate|certificates)([._-]|$)/i;
const PRIVATE_FILE_EXTENSION = /\.(pem|key|p12|pfx|crt|cer|der|jks|keystore)$/i;
const PRIVATE_DOTFILE_NAME = /^\.(docker|dockercfg|git|htpasswd|netrc|npmrc|pypirc|ssh)(?:$|[^a-z0-9])/i;
const ENV_FILE_NAME = /^\.env(?:$|[^a-z0-9])/i;
const SSH_PRIVATE_KEY_NAME = /^id_(rsa|dsa|ecdsa|ed25519)(?:$|[^a-z0-9].*)/i;
const LOCAL_NAME_TOKEN = /(^|[._-])local([._-]|$)/i;
const STATIC_SAFETY_ERROR = "Static tree contains a forbidden filename or symbolic link";

export function isLocalRecipientConfig(filePath) {
  const basename = path.basename(filePath).toLowerCase();
  return basename.endsWith(".php")
    && (basename.includes("recipient") || LOCAL_NAME_TOKEN.test(basename));
}

export function isForbiddenStaticName(name) {
  const basename = path.basename(String(name)).toLowerCase();
  return ENV_FILE_NAME.test(basename)
    || basename === ".envrc"
    || PRIVATE_DOTFILE_NAME.test(basename)
    || SSH_PRIVATE_KEY_NAME.test(basename)
    || isLocalRecipientConfig(basename)
    || PRIVATE_NAME_TOKEN.test(basename)
    || PRIVATE_FILE_EXTENSION.test(basename);
}

function absolutePathWithinBoundary(filePath, boundary) {
  const absolutePath = path.resolve(filePath);
  const absoluteBoundary = path.resolve(boundary);
  const relative = path.relative(absoluteBoundary, absolutePath);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(STATIC_SAFETY_ERROR);
  }
  return { absolutePath, absoluteBoundary, relative };
}

function pathChain(filePath, boundary) {
  const { absolutePath, absoluteBoundary, relative } = absolutePathWithinBoundary(filePath, boundary);
  const chain = [absoluteBoundary];
  if (relative) {
    let cursor = absoluteBoundary;
    for (const part of relative.split(path.sep)) {
      cursor = path.join(cursor, part);
      chain.push(cursor);
    }
  }
  if (chain.at(-1) !== absolutePath) throw new Error(STATIC_SAFETY_ERROR);
  return chain;
}

function snapshot(stat) {
  return {
    dev: stat.dev,
    ino: stat.ino,
    mode: stat.mode,
    size: stat.size,
    mtimeNs: stat.mtimeNs,
    ctimeNs: stat.ctimeNs,
  };
}

function sameIdentity(left, right, { includeMutable = false } = {}) {
  return left.dev === right.dev
    && left.ino === right.ino
    && left.mode === right.mode
    && (!includeMutable || (
      left.size === right.size
      && left.mtimeNs === right.mtimeNs
      && left.ctimeNs === right.ctimeNs
    ));
}

function snapshotSafePath(filePath, boundary, leafType) {
  const chain = pathChain(filePath, boundary);
  return chain.map((candidate, index) => {
    const stat = lstatSync(candidate, { bigint: true });
    const isLeaf = index === chain.length - 1;
    if (stat.isSymbolicLink()
      || isForbiddenStaticName(candidate)
      || (isLeaf && leafType === "file" && !stat.isFile())
      || ((!isLeaf || leafType === "directory") && !stat.isDirectory())) {
      throw new Error(STATIC_SAFETY_ERROR);
    }
    return { path: candidate, stat: snapshot(stat) };
  });
}

function assertSnapshotsUnchanged(snapshots, { includeLeafMutable = false } = {}) {
  snapshots.forEach((expected, index) => {
    const current = lstatSync(expected.path, { bigint: true });
    const includeMutable = includeLeafMutable && index === snapshots.length - 1;
    if (current.isSymbolicLink()
      || !sameIdentity(expected.stat, snapshot(current), { includeMutable })) {
      throw new Error(STATIC_SAFETY_ERROR);
    }
  });
}

function assertDescriptorMatches(descriptor, expected, { includeMutable = false } = {}) {
  const current = fstatSync(descriptor, { bigint: true });
  if (!current.isFile()
    || !sameIdentity(expected.stat, snapshot(current), { includeMutable })) {
    throw new Error(STATIC_SAFETY_ERROR);
  }
}

function assertSafeDirectory(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    const stat = lstatSync(entryPath);
    if (entry.isSymbolicLink() || stat.isSymbolicLink() || isForbiddenStaticName(entry.name)) {
      throw new Error(STATIC_SAFETY_ERROR);
    }
    if (stat.isDirectory()) assertSafeDirectory(entryPath);
    else if (!stat.isFile()) throw new Error(STATIC_SAFETY_ERROR);
  }
}

export function assertStaticTreeSafe(directory, boundary = directory) {
  snapshotSafePath(directory, boundary, "directory");
  try {
    assertSafeDirectory(directory);
  } catch {
    throw new Error(STATIC_SAFETY_ERROR);
  }
}

export function assertStaticFileSafe(filePath, boundary = path.dirname(filePath)) {
  try {
    snapshotSafePath(filePath, boundary, "file");
  } catch {
    throw new Error(STATIC_SAFETY_ERROR);
  }
}

function readPinnedStaticFile(source, boundary, expectedSnapshots = undefined) {
  if (!Number.isInteger(constants.O_NOFOLLOW)) throw new Error(STATIC_SAFETY_ERROR);
  const snapshots = expectedSnapshots || snapshotSafePath(source, boundary, "file");
  let descriptor;
  try {
    descriptor = openSync(source, constants.O_RDONLY | constants.O_NOFOLLOW);
    assertDescriptorMatches(descriptor, snapshots.at(-1), { includeMutable: true });
    assertSnapshotsUnchanged(snapshots, { includeLeafMutable: true });
    const contents = readFileSync(descriptor);
    assertDescriptorMatches(descriptor, snapshots.at(-1), { includeMutable: true });
    assertSnapshotsUnchanged(snapshots, { includeLeafMutable: true });
    return contents;
  } catch {
    throw new Error(STATIC_SAFETY_ERROR);
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
  }
}

export function readStaticTreeSafely(directory, boundary = directory) {
  const rootSnapshots = snapshotSafePath(directory, boundary, "directory");
  const assets = [];

  function collect(currentDirectory, ancestorSnapshots) {
    const entries = readdirSync(currentDirectory, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(currentDirectory, entry.name);
      if (entry.isSymbolicLink() || isForbiddenStaticName(entry.name)) {
        throw new Error(STATIC_SAFETY_ERROR);
      }
      const stat = lstatSync(entryPath, { bigint: true });
      if (stat.isSymbolicLink()) throw new Error(STATIC_SAFETY_ERROR);
      const entrySnapshots = [
        ...ancestorSnapshots,
        { path: entryPath, stat: snapshot(stat) },
      ];
      if (stat.isDirectory()) {
        collect(entryPath, entrySnapshots);
      } else if (stat.isFile()) {
        assets.push({
          fileName: path.relative(directory, entryPath).split(path.sep).join("/"),
          source: readPinnedStaticFile(entryPath, boundary, entrySnapshots),
        });
      } else {
        throw new Error(STATIC_SAFETY_ERROR);
      }
    }
  }

  try {
    collect(path.resolve(directory), rootSnapshots);
    assertSnapshotsUnchanged(rootSnapshots);
    return assets;
  } catch {
    throw new Error(STATIC_SAFETY_ERROR);
  }
}

export function copyStaticFileSafely(source, destination, boundary = path.dirname(source)) {
  const contents = readPinnedStaticFile(source, boundary);
  const destinationParent = path.dirname(destination);
  const parentSnapshots = snapshotSafePath(destinationParent, boundary, "directory");
  let destinationSnapshots;
  if (existsSync(destination)) {
    destinationSnapshots = snapshotSafePath(destination, boundary, "file");
  }

  let destinationDescriptor;
  try {
    const flags = constants.O_WRONLY | constants.O_NOFOLLOW | (
      destinationSnapshots ? 0 : constants.O_CREAT | constants.O_EXCL
    );
    destinationDescriptor = openSync(destination, flags, 0o644);
    if (destinationSnapshots) {
      assertDescriptorMatches(destinationDescriptor, destinationSnapshots.at(-1));
    } else if (!fstatSync(destinationDescriptor).isFile()) {
      throw new Error(STATIC_SAFETY_ERROR);
    }
    assertSnapshotsUnchanged(parentSnapshots);
    ftruncateSync(destinationDescriptor, 0);
    writeFileSync(destinationDescriptor, contents);
  } catch {
    throw new Error(STATIC_SAFETY_ERROR);
  } finally {
    if (destinationDescriptor !== undefined) closeSync(destinationDescriptor);
  }
}
