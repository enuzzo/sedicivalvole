import assert from "node:assert/strict";
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  assertStaticFileSafe,
  assertStaticTreeSafe,
  copyStaticFileSafely,
  isForbiddenStaticName,
  isLocalRecipientConfig,
  readStaticTreeSafely,
} from "../scripts/static-package-safety.mjs";
import worker from "../worker/index.js";

test("serves existing static assets without a fallback", async () => {
  const calls = [];
  const response = await worker.fetch(new Request("https://example.test/assets/app.js"), {
    ASSETS: {
      fetch: async (request) => {
        calls.push(new URL(request.url).pathname);
        return new Response("asset", { status: 200 });
      },
    },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(calls, ["/assets/app.js"]);
});

test("falls back to index.html for an unknown app route", async () => {
  const calls = [];
  const emittedIndex = await readFile(new URL("../dist/client/index.html", import.meta.url), "utf8");
  const response = await worker.fetch(
    new Request("https://example.test/flow/step-two?source=share", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async (request) => {
          const url = new URL(request.url);
          calls.push(url.pathname + url.search);
          return new Response(url.pathname === "/index.html" ? emittedIndex : "missing", {
            status: url.pathname === "/index.html" ? 200 : 404,
          });
        },
      },
    },
  );

  assert.equal(response.status, 200);
  assert.deepEqual(calls, ["/flow/step-two?source=share", "/index.html"]);
  const html = await response.text();
  const entryReference = html.match(/<script[^>]+src="([^"]+)"/)?.[1];
  assert.match(entryReference, /^\/assets\//);
  assert.match(new URL(entryReference, "https://example.test/flow/step-two").pathname, /^\/assets\//);
});

test("does not turn missing API or write requests into the app shell", async () => {
  for (const request of [
    new Request("https://example.test/api/missing", { headers: { accept: "application/json" } }),
    new Request("https://example.test/flow", { method: "POST", headers: { accept: "text/html" } }),
  ]) {
    let calls = 0;
    const response = await worker.fetch(request, {
      ASSETS: {
        fetch: async () => {
          calls += 1;
          return new Response("missing", { status: 404 });
        },
      },
    });

    assert.equal(response.status, 404);
    assert.equal(calls, 1);
  }
});

test("emits the files required by Sites packaging", async () => {
  await access(new URL("../dist/client/index.html", import.meta.url));
  await access(new URL("../dist/client/third-party/infinite-lights/index7.html", import.meta.url));
  await access(new URL("../dist/server/index.js", import.meta.url));
  await access(new URL("../dist/.openai/hosting.json", import.meta.url));
});

test("the static emission gate runs only during builds", async () => {
  const viteConfig = await readFile(new URL("../vite.config.mjs", import.meta.url), "utf8");
  assert.match(viteConfig, /name: "sedicivalvole-static-package-safety",\s*apply: "build",/);
});

test("emitted entry assets stay root-relative on deep app routes", async () => {
  const html = await readFile(new URL("../dist/client/index.html", import.meta.url), "utf8");
  const references = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((reference) => /^\/(?:assets|fonts)\//.test(reference));

  assert.ok(references.length >= 2, "expected emitted JavaScript and CSS or font references");
  for (const reference of references) {
    assert.ok(reference.startsWith("/"));
    const resolved = new URL(reference, "https://example.test/flow/step-two");
    assert.equal(resolved.pathname, reference);
  }
});

test("static packaging rejects private filenames and symbolic links without removing them", async () => {
  const fixture = await mkdtemp(path.join(tmpdir(), "sedicivalvole-sites-safety-"));
  try {
    const api = path.join(fixture, "api");
    const config = path.join(fixture, "config");
    await mkdir(api, { recursive: true });
    await mkdir(config, { recursive: true });
    await writeFile(path.join(api, "send-diagnostic.php"), "<?php // fixture endpoint ?>\n");
    await writeFile(path.join(fixture, "keyboard.js"), "// legitimate fixture\n");
    assert.doesNotThrow(() => assertStaticTreeSafe(fixture));
    assert.deepEqual(
      readStaticTreeSafely(fixture).map(({ fileName }) => fileName).sort(),
      ["api/send-diagnostic.php", "keyboard.js"],
    );

    const forbiddenFiles = [
      path.join(fixture, ".env"),
      path.join(fixture, ".env.production"),
      path.join(fixture, ".env-local"),
      path.join(fixture, ".envrc"),
      path.join(fixture, ".htpasswd"),
      path.join(fixture, ".npmrc"),
      path.join(fixture, "id_ed25519.backup"),
      path.join(api, "recipient.local.php"),
      path.join(api, "diagnostic-recipient.private.php"),
      path.join(config, "client-secret.json"),
      path.join(config, "server.pem"),
      path.join(fixture, ".ssh", "config"),
      path.join(fixture, ".docker", "config.json"),
    ];
    for (const forbiddenFile of forbiddenFiles) {
      await mkdir(path.dirname(forbiddenFile), { recursive: true });
      await writeFile(forbiddenFile, "harmless fixture\n");
      assert.throws(
        () => assertStaticTreeSafe(fixture),
        /Static tree contains a forbidden filename or symbolic link/,
      );
      await access(forbiddenFile);
      await rm(forbiddenFile);
      if (isForbiddenStaticName(path.basename(path.dirname(forbiddenFile)))) {
        await rm(path.dirname(forbiddenFile), { recursive: true, force: true });
      }
    }

    const target = path.join(fixture, "harmless-target.txt");
    const link = path.join(fixture, "asset-link.txt");
    await writeFile(target, "harmless fixture\n");
    await symlink(target, link);
    assert.throws(
      () => assertStaticTreeSafe(fixture),
      /Static tree contains a forbidden filename or symbolic link/,
    );
    assert.throws(
      () => assertStaticFileSafe(link, fixture),
      /Static tree contains a forbidden filename or symbolic link/,
    );
    await access(link);

    const realInput = path.join(fixture, "real-input");
    const linkedInput = path.join(fixture, "linked-input");
    await mkdir(path.join(realInput, "nested"), { recursive: true });
    await writeFile(path.join(realInput, "nested", "index.js"), "// harmless fixture\n");
    await symlink(realInput, linkedInput);
    assert.throws(
      () => assertStaticFileSafe(path.join(linkedInput, "nested", "index.js"), fixture),
      /Static tree contains a forbidden filename or symbolic link/,
    );

    const safeSource = path.join(fixture, "safe-source.js");
    const outsideTarget = path.join(fixture, "outside-target.js");
    const unsafeDestination = path.join(fixture, "unsafe-destination.js");
    await writeFile(safeSource, "// safe source\n");
    await writeFile(outsideTarget, "// must remain unchanged\n");
    await symlink(outsideTarget, unsafeDestination);
    assert.throws(
      () => copyStaticFileSafely(safeSource, unsafeDestination, fixture),
      /Static tree contains a forbidden filename or symbolic link/,
    );
    assert.equal(await readFile(outsideTarget, "utf8"), "// must remain unchanged\n");
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});

test("private static-name classification preserves ordinary similarly named assets", () => {
  for (const name of [
    ".env",
    ".env.local",
    ".env-local",
    "recipient.local.php",
    "diagnostic-recipient.private.php",
    "client-secret.json",
    ".docker",
    ".htpasswd",
    ".npmrc",
    ".npmrc.backup",
    ".ssh",
    "id_ed25519",
    "id_ed25519.backup",
    "id_ed25519~",
    "server.key",
    "server.pem",
  ]) {
    assert.equal(isForbiddenStaticName(name), true, name);
  }
  for (const name of ["send-diagnostic.php", "keyboard.js", "localization.php", ".gitignore"]) {
    assert.equal(isForbiddenStaticName(name), false, name);
  }
  assert.equal(isLocalRecipientConfig("localization.php"), false);
});

test("Sites output passes the complete static package safety policy", async () => {
  const distRoot = fileURLToPath(new URL("../dist/", import.meta.url));
  assert.doesNotThrow(() => assertStaticTreeSafe(distRoot));
});
