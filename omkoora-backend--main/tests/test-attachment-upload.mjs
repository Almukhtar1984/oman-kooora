#!/usr/bin/env node
/**
 * Guards for the player-attachment upload fix.
 *
 * The bug: `await stream.pipe(createWriteStream(path))` does not await the
 * write (pipe returns the stream, not a promise), so the resolver returned
 * "success" before the file was written, swallowed write errors, and — for
 * multi-file uploads — read the next file before the previous stream finished,
 * which breaks graphql-upload. Result on the client: "I upload and nothing
 * happens."
 *
 * This runs a REAL behavioural unit test of the saveUpload helper plus static
 * guards over the resolver + modal. No DB, no network.
 *
 *   node tests/test-attachment-upload.mjs
 */

import { saveUpload, fileExtension } from "../src/Helpers/Upload.mjs";
import { Readable } from "stream";
import { promises as fs, existsSync, readFileSync } from "fs";
import os from "os";
import path from "path";
import { readFileSync as read } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const c = { reset: "\x1b[0m", green: "\x1b[32m", red: "\x1b[31m", cyan: "\x1b[36m" };
const ok  = (m) => console.log(`${c.green}✓${c.reset} ${m}`);
const bad = (m) => console.log(`${c.red}✗${c.reset} ${m}`);
let failures = 0;
const assert = (cond, msg) => { if (cond) ok(msg); else { bad(msg); failures++; } };

const root = resolve(__dirname, "..", "..");
const readSrc = (...p) => { try { return read(resolve(root, ...p), "utf8"); } catch { return ""; } };

const tmp = path.join(os.tmpdir(), "omkoora-attachment-upload-test");
const makeUpload = (filename, content) => ({
    filename,
    createReadStream: () => Readable.from([Buffer.from(content)]),
});

// ── Behavioural unit test of saveUpload ──────────────────────────────────────
console.log(`${c.cyan}▶ saveUpload actually writes the file (awaits completion)${c.reset}`);
{
    await fs.rm(tmp, { recursive: true, force: true }); // start from a MISSING dir

    const name = await saveUpload(makeUpload("photo.png", "hello-attachment-bytes"), { dir: tmp });
    const stored = path.join(tmp, name);

    assert(existsSync(tmp), "creates the uploads directory if missing (mkdir recursive)");
    assert(existsSync(stored), "the file exists once saveUpload resolves (write is awaited)");
    assert(readFileSync(stored, "utf8") === "hello-attachment-bytes", "the full byte content is written");
    assert(/\.PNG$/.test(name), "stored name keeps the upper-cased extension");
    assert(fileExtension("a.b.PdF") === "PDF", "fileExtension takes the last segment, upper-cased");
}

console.log(`${c.cyan}▶ Sequential multi-file uploads each land correctly${c.reset}`);
{
    const n1 = await saveUpload(makeUpload("one.pdf", "FILE-ONE"), { dir: tmp });
    const n2 = await saveUpload(makeUpload("two.pdf", "FILE-TWO"), { dir: tmp });
    assert(n1 !== n2, "each upload gets a unique name");
    assert(readFileSync(path.join(tmp, n1), "utf8") === "FILE-ONE", "first file content correct");
    assert(readFileSync(path.join(tmp, n2), "utf8") === "FILE-TWO", "second file content correct");
}

console.log(`${c.cyan}▶ Bad input is rejected loudly (not swallowed)${c.reset}`);
{
    let threw = false;
    try {
        await saveUpload(makeUpload("malware.exe", "x"), { dir: tmp });
    } catch (e) {
        threw = true;
        assert(/غير مدعوم/.test(e.message) || e?.extensions?.code === "UNSUPPORTED_FILE_TYPE",
            "unsupported extension throws a typed error");
    }
    assert(threw, "unsupported extension rejects instead of silently returning");

    let threw2 = false;
    try { await saveUpload(null, { dir: tmp }); } catch { threw2 = true; }
    assert(threw2, "a null/invalid upload rejects");
}

await fs.rm(tmp, { recursive: true, force: true });

// ── Static guards: resolver no longer has the broken pattern ─────────────────
console.log(`${c.cyan}▶ Resolver uses the safe helper${c.reset}`);
{
    const players = readSrc("omkoora-backend--main", "src", "Graphql", "Resolvers", "Players.mjs");
    assert(/import\s*\{\s*saveUpload\s*\}\s*from\s*["'][^"']*Helpers\/Upload\.mjs["']/.test(players),
        "Players.mjs imports saveUpload");

    // Scope to the addAttachmentPlayer body.
    const start = players.indexOf("addAttachmentPlayer:");
    const body = players.slice(start, start + 1400);
    assert(start !== -1, "addAttachmentPlayer resolver exists");
    assert(/saveUpload\(upload\)/.test(body), "addAttachmentPlayer writes via saveUpload");
    assert(!/stream\.pipe\(/.test(body), "addAttachmentPlayer no longer uses the un-awaited stream.pipe");
    assert(/ATTACHMENT_UPLOAD_FAILED/.test(body), "surfaces a real error code on failure (not swallowed)");
}

console.log(`${c.cyan}▶ Upload helper awaits + ensures the directory${c.reset}`);
{
    const helper = readSrc("omkoora-backend--main", "src", "Helpers", "Upload.mjs");
    assert(/new Promise\(/.test(helper) && /"finish"/.test(helper) && /reject/.test(helper),
        "helper awaits the write via a finish/error promise");
    assert(/mkdir\([^)]*recursive:\s*true/.test(helper), "helper ensures the uploads dir exists");
}

console.log(`${c.cyan}▶ Modal gives real feedback${c.reset}`);
{
    const modal = readSrc("client", "omkoora-team--main", "components", "Modal", "AddAttachmentPlayerModal.tsx");
    assert(/!attachments\.length/.test(modal), "modal blocks submit when no file is chosen");
    assert(/notyf\.success/.test(modal), "modal shows a success toast");
    assert(/graphQLErrors\?\.\[0\]\?\.message/.test(modal), "modal surfaces the server error message");
}

console.log("");
if (failures === 0) {
    console.log(`${c.green}All attachment-upload guards passed.${c.reset}`);
    process.exit(0);
} else {
    console.log(`${c.red}${failures} attachment-upload guard(s) failed.${c.reset}`);
    process.exit(1);
}
