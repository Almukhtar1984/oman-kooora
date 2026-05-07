import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import {getUploadFilePath, isSafeUploadFilename} from "../src/Middlewares/PrivateFiles.mjs";
import {isPublicUploadImageFilename} from "../src/Middlewares/PublicImages.mjs";

test("isSafeUploadFilename accepts generated upload names", () => {
    assert.equal(isSafeUploadFilename("a76e4c72-9b5c-4dd3-a5d4-0e65d14b93df.PNG"), true);
    assert.equal(isSafeUploadFilename("document_2026-04-22.pdf"), true);
});

test("isSafeUploadFilename rejects traversal and unsafe names", () => {
    assert.equal(isSafeUploadFilename("../secret.env"), false);
    assert.equal(isSafeUploadFilename("nested/file.pdf"), false);
    assert.equal(isSafeUploadFilename(""), false);
    assert.equal(isSafeUploadFilename(".hidden"), false);
});

test("getUploadFilePath resolves inside server uploads directory", () => {
    const filePath = getUploadFilePath("document.pdf");

    assert.equal(filePath.endsWith(path.join("server", "uploads", "document.pdf")), true);
});

test("isPublicUploadImageFilename only accepts safe public image names", () => {
    assert.equal(isPublicUploadImageFilename("photo.PNG"), true);
    assert.equal(isPublicUploadImageFilename("photo.jpg"), true);
    assert.equal(isPublicUploadImageFilename("photo.webp"), true);
    assert.equal(isPublicUploadImageFilename("document.pdf"), false);
    assert.equal(isPublicUploadImageFilename("active.svg"), false);
    assert.equal(isPublicUploadImageFilename("../photo.png"), false);
});
