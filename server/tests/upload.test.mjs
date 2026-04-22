import assert from "node:assert/strict";
import {existsSync} from "node:fs";
import {rm} from "node:fs/promises";
import path from "node:path";
import {Readable} from "node:stream";
import test from "node:test";

import {saveImageUpload} from "../src/Helpers/Upload.mjs";

const uploadDir = path.resolve(process.cwd(), "uploads");
const pngBytes = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x00
]);

const fakeUpload = ({filename, mimetype, bytes}) => ({
    filename,
    mimetype,
    createReadStream: () => Readable.from(bytes)
});

const removeUpload = async (filename) => {
    if (!filename) return;
    await rm(path.join(uploadDir, filename), {force: true});
}

test("saveImageUpload stores a valid PNG upload", async () => {
    const storedFilename = await saveImageUpload(fakeUpload({
        filename: "logo.png",
        mimetype: "image/png",
        bytes: pngBytes
    }));

    try {
        assert.match(storedFilename, /^[0-9a-f-]+\.PNG$/i);
        assert.equal(existsSync(path.join(uploadDir, storedFilename)), true);
    } finally {
        await removeUpload(storedFilename);
    }
});

test("saveImageUpload rejects unsupported file extensions", async () => {
    await assert.rejects(
        () => saveImageUpload(fakeUpload({
            filename: "payload.svg",
            mimetype: "image/svg+xml",
            bytes: Buffer.from("<svg></svg>")
        })),
        (error) => error.extensions?.code === "INVALID_UPLOAD_TYPE"
    );
});

test("saveImageUpload rejects mismatched MIME types", async () => {
    await assert.rejects(
        () => saveImageUpload(fakeUpload({
            filename: "logo.png",
            mimetype: "text/plain",
            bytes: pngBytes
        })),
        (error) => error.extensions?.code === "INVALID_UPLOAD_MIME"
    );
});

test("saveImageUpload rejects invalid image content", async () => {
    await assert.rejects(
        () => saveImageUpload(fakeUpload({
            filename: "logo.png",
            mimetype: "image/png",
            bytes: Buffer.from("not a png")
        })),
        (error) => error.extensions?.code === "INVALID_UPLOAD_CONTENT"
    );
});
