import assert from "node:assert/strict";
import {existsSync} from "node:fs";
import {rm} from "node:fs/promises";
import path from "node:path";
import {Readable} from "node:stream";
import test from "node:test";

import {saveImageUpload, savePdfUpload, saveDocumentUpload} from "../src/Helpers/Upload.mjs";

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

// ─── PDF upload tests ─────────────────────────────────────────────────────────

const pdfBytes = Buffer.concat([
    Buffer.from([0x25, 0x50, 0x44, 0x46]), // %PDF
    Buffer.from("-1.4 fake pdf content")
]);

test("savePdfUpload stores a valid PDF upload", async () => {
    const storedFilename = await savePdfUpload(fakeUpload({
        filename: "document.pdf",
        mimetype: "application/pdf",
        bytes: pdfBytes
    }));

    try {
        assert.match(storedFilename, /^[0-9a-f-]+\.PDF$/i);
        assert.equal(existsSync(path.join(uploadDir, storedFilename)), true);
    } finally {
        await removeUpload(storedFilename);
    }
});

test("savePdfUpload rejects non-PDF extensions", async () => {
    await assert.rejects(
        () => savePdfUpload(fakeUpload({
            filename: "document.docx",
            mimetype: "application/pdf",
            bytes: pdfBytes
        })),
        (error) => error.extensions?.code === "INVALID_UPLOAD_TYPE"
    );
});

test("savePdfUpload rejects wrong MIME type", async () => {
    await assert.rejects(
        () => savePdfUpload(fakeUpload({
            filename: "document.pdf",
            mimetype: "application/octet-stream",
            bytes: pdfBytes
        })),
        (error) => error.extensions?.code === "INVALID_UPLOAD_MIME"
    );
});

test("savePdfUpload rejects content that is not a PDF", async () => {
    await assert.rejects(
        () => savePdfUpload(fakeUpload({
            filename: "document.pdf",
            mimetype: "application/pdf",
            bytes: Buffer.from("not a real pdf")
        })),
        (error) => error.extensions?.code === "INVALID_UPLOAD_CONTENT"
    );
});

// ─── Document upload tests ────────────────────────────────────────────────────

test("saveDocumentUpload stores a valid PDF as document", async () => {
    const storedFilename = await saveDocumentUpload(fakeUpload({
        filename: "attachment.pdf",
        mimetype: "application/pdf",
        bytes: pdfBytes
    }));

    try {
        assert.match(storedFilename, /^[0-9a-f-]+\.PDF$/i);
        assert.equal(existsSync(path.join(uploadDir, storedFilename)), true);
    } finally {
        await removeUpload(storedFilename);
    }
});

test("saveDocumentUpload stores a valid PNG as document", async () => {
    const storedFilename = await saveDocumentUpload(fakeUpload({
        filename: "photo.png",
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

test("saveDocumentUpload rejects disallowed file types", async () => {
    await assert.rejects(
        () => saveDocumentUpload(fakeUpload({
            filename: "payload.exe",
            mimetype: "application/octet-stream",
            bytes: Buffer.from("MZ fake exe")
        })),
        (error) => error.extensions?.code === "INVALID_UPLOAD_TYPE"
    );
});

test("saveDocumentUpload rejects mismatched MIME for PDF", async () => {
    await assert.rejects(
        () => saveDocumentUpload(fakeUpload({
            filename: "document.pdf",
            mimetype: "text/plain",
            bytes: pdfBytes
        })),
        (error) => error.extensions?.code === "INVALID_UPLOAD_MIME"
    );
});

test("saveDocumentUpload rejects PDF content mismatch", async () => {
    await assert.rejects(
        () => saveDocumentUpload(fakeUpload({
            filename: "document.pdf",
            mimetype: "application/pdf",
            bytes: Buffer.from("this is not a pdf at all")
        })),
        (error) => error.extensions?.code === "INVALID_UPLOAD_CONTENT"
    );
});
