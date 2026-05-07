import {ApolloError} from "apollo-server-express";
import {createWriteStream} from "fs";
import {mkdir, unlink} from "fs/promises";
import path from "path";
import {Transform} from "stream";
import {pipeline} from "stream/promises";
import {fileURLToPath} from "url";
import {v4 as UUID} from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, "../../uploads");

const IMAGE_MIME_TYPES = {
    JPEG: ["image/jpeg"],
    JPG: ["image/jpeg"],
    PNG: ["image/png"]
};

const IMAGE_SIGNATURES = {
    JPEG: [[0xFF, 0xD8, 0xFF]],
    JPG: [[0xFF, 0xD8, 0xFF]],
    PNG: [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]]
};

// PDF
const PDF_MIME_TYPES = ["application/pdf"];
const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46]; // %PDF

// General document types for mixed attachments
const DOCUMENT_TYPES = {
    JPEG: { mime: ["image/jpeg"], signatures: [[0xFF, 0xD8, 0xFF]] },
    JPG:  { mime: ["image/jpeg"], signatures: [[0xFF, 0xD8, 0xFF]] },
    PNG:  { mime: ["image/png"],  signatures: [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]] },
    PDF:  { mime: ["application/pdf"], signatures: [[0x25, 0x50, 0x44, 0x46]] },
    // OLE compound (old binary office)
    DOC:  { mime: ["application/msword", "application/octet-stream"], signatures: [[0xD0, 0xCF, 0x11, 0xE0]] },
    XLS:  { mime: ["application/vnd.ms-excel", "application/octet-stream"], signatures: [[0xD0, 0xCF, 0x11, 0xE0]] },
    PPT:  { mime: ["application/vnd.ms-powerpoint", "application/octet-stream"], signatures: [[0xD0, 0xCF, 0x11, 0xE0]] },
    // ZIP-based (new office formats)
    DOCX: { mime: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/zip", "application/octet-stream"], signatures: [[0x50, 0x4B, 0x03, 0x04], [0x50, 0x4B, 0x05, 0x06]] },
    XLSX: { mime: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/zip", "application/octet-stream"], signatures: [[0x50, 0x4B, 0x03, 0x04], [0x50, 0x4B, 0x05, 0x06]] },
    PPTX: { mime: ["application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/zip", "application/octet-stream"], signatures: [[0x50, 0x4B, 0x03, 0x04], [0x50, 0x4B, 0x05, 0x06]] },
    ZIP:  { mime: ["application/zip", "application/x-zip-compressed", "application/octet-stream"], signatures: [[0x50, 0x4B, 0x03, 0x04], [0x50, 0x4B, 0x05, 0x06]] },
    // Text-based — no reliable magic bytes
    CSV:  { mime: ["text/csv", "text/plain", "application/csv", "application/octet-stream"], signatures: null },
};

const getExtension = (filename) => {
    return path.extname(filename || "").replace(".", "").toUpperCase();
}

const minSignatureLength = (extension) => {
    return Math.max(...IMAGE_SIGNATURES[extension].map((signature) => signature.length));
}

const hasExpectedSignature = (extension, buffer) => {
    return IMAGE_SIGNATURES[extension].some((signature) => {
        return signature.every((byte, index) => buffer[index] === byte);
    });
}

const assertImageMetadata = ({filename, mimetype}) => {
    const extension = getExtension(filename);

    if (!IMAGE_MIME_TYPES[extension]) {
        throw new ApolloError("This file is not an allowed image", "INVALID_UPLOAD_TYPE");
    }

    if (!IMAGE_MIME_TYPES[extension].includes(mimetype)) {
        throw new ApolloError("This file MIME type is not allowed", "INVALID_UPLOAD_MIME");
    }

    return extension;
}

const createMagicBytesValidator = (extension) => {
    let checked = false;
    let header = Buffer.alloc(0);
    const requiredLength = minSignatureLength(extension);

    return new Transform({
        transform(chunk, encoding, callback) {
            if (!checked) {
                header = Buffer.concat([header, chunk]);

                if (header.length >= requiredLength) {
                    checked = true;

                    if (!hasExpectedSignature(extension, header)) {
                        callback(new ApolloError("This file content is not an allowed image", "INVALID_UPLOAD_CONTENT"));
                        return;
                    }
                }
            }

            callback(null, chunk);
        },

        flush(callback) {
            if (!checked || !hasExpectedSignature(extension, header)) {
                callback(new ApolloError("This file content is not an allowed image", "INVALID_UPLOAD_CONTENT"));
                return;
            }

            callback();
        }
    });
}

export const saveImageUpload = async (upload) => {
    const {createReadStream, filename, mimetype} = await upload;
    const extension = assertImageMetadata({filename, mimetype});
    const storedFilename = `${UUID()}.${extension}`;
    const destination = path.join(uploadDir, storedFilename);

    await mkdir(uploadDir, {recursive: true});

    try {
        await pipeline(
            createReadStream(),
            createMagicBytesValidator(extension),
            createWriteStream(destination)
        );
    } catch (error) {
        await unlink(destination).catch(() => {});

        if (error instanceof ApolloError) throw error;
        throw new ApolloError("Unable to save uploaded file", "UPLOAD_FAILED");
    }

    return storedFilename;
}

// ─── PDF upload ───────────────────────────────────────────────────────────────

const createPdfValidator = () => {
    let checked = false;
    let header = Buffer.alloc(0);
    const requiredLength = PDF_SIGNATURE.length;

    return new Transform({
        transform(chunk, encoding, callback) {
            if (!checked) {
                header = Buffer.concat([header, chunk]);

                if (header.length >= requiredLength) {
                    checked = true;
                    const match = PDF_SIGNATURE.every((byte, i) => header[i] === byte);
                    if (!match) {
                        callback(new ApolloError("This file content is not a valid PDF", "INVALID_UPLOAD_CONTENT"));
                        return;
                    }
                }
            }
            callback(null, chunk);
        },

        flush(callback) {
            if (!checked || !PDF_SIGNATURE.every((byte, i) => header[i] === byte)) {
                callback(new ApolloError("This file content is not a valid PDF", "INVALID_UPLOAD_CONTENT"));
                return;
            }
            callback();
        }
    });
};

export const savePdfUpload = async (upload) => {
    const {createReadStream, filename, mimetype} = await upload;
    const extension = getExtension(filename);

    if (extension !== "PDF") {
        throw new ApolloError("Only PDF files are allowed", "INVALID_UPLOAD_TYPE");
    }

    if (!PDF_MIME_TYPES.includes(mimetype)) {
        throw new ApolloError("This file MIME type is not allowed", "INVALID_UPLOAD_MIME");
    }

    const storedFilename = `${UUID()}.PDF`;
    const destination = path.join(uploadDir, storedFilename);

    await mkdir(uploadDir, {recursive: true});

    try {
        await pipeline(
            createReadStream(),
            createPdfValidator(),
            createWriteStream(destination)
        );
    } catch (error) {
        await unlink(destination).catch(() => {});

        if (error instanceof ApolloError) throw error;
        throw new ApolloError("Unable to save uploaded file", "UPLOAD_FAILED");
    }

    return storedFilename;
};

// ─── Generic document upload (mixed types) ────────────────────────────────────

const createDocumentValidator = (extension, signatures) => {
    if (!signatures) {
        // No magic bytes available for this type (e.g. CSV); skip content check
        return new Transform({
            transform(chunk, encoding, callback) { callback(null, chunk); },
            flush(callback) { callback(); }
        });
    }

    const requiredLength = Math.max(...signatures.map((sig) => sig.length));
    let checked = false;
    let header = Buffer.alloc(0);

    return new Transform({
        transform(chunk, encoding, callback) {
            if (!checked) {
                header = Buffer.concat([header, chunk]);

                if (header.length >= requiredLength) {
                    checked = true;
                    const match = signatures.some((sig) => sig.every((byte, i) => header[i] === byte));
                    if (!match) {
                        callback(new ApolloError(`This file content does not match the expected ${extension} format`, "INVALID_UPLOAD_CONTENT"));
                        return;
                    }
                }
            }
            callback(null, chunk);
        },

        flush(callback) {
            if (signatures && (!checked || !signatures.some((sig) => sig.every((byte, i) => header[i] === byte)))) {
                callback(new ApolloError(`This file content does not match the expected ${extension} format`, "INVALID_UPLOAD_CONTENT"));
                return;
            }
            callback();
        }
    });
};

export const saveDocumentUpload = async (upload) => {
    const {createReadStream, filename, mimetype} = await upload;
    const extension = getExtension(filename);
    const typeConfig = DOCUMENT_TYPES[extension];

    if (!typeConfig) {
        throw new ApolloError("This file type is not allowed", "INVALID_UPLOAD_TYPE");
    }

    if (!typeConfig.mime.includes(mimetype)) {
        throw new ApolloError("This file MIME type is not allowed", "INVALID_UPLOAD_MIME");
    }

    const storedFilename = `${UUID()}.${extension}`;
    const destination = path.join(uploadDir, storedFilename);

    await mkdir(uploadDir, {recursive: true});

    try {
        await pipeline(
            createReadStream(),
            createDocumentValidator(extension, typeConfig.signatures),
            createWriteStream(destination)
        );
    } catch (error) {
        await unlink(destination).catch(() => {});

        if (error instanceof ApolloError) throw error;
        throw new ApolloError("Unable to save uploaded file", "UPLOAD_FAILED");
    }

    return storedFilename;
};
