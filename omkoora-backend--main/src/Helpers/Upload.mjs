import { createWriteStream, promises as fsPromises } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as UUID } from "uuid";
import { ApolloError } from "apollo-server-express";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// src/Helpers -> ../../uploads == omkoora-backend--main/uploads, the same folder
// the /images static route serves from in app.mjs.
export const UPLOADS_DIR = path.join(__dirname, "../../uploads");

export const DEFAULT_ALLOWED_TYPES = [
    "JPEG", "JPG", "PNG", "PDF", "DOC", "DOCX", "XLS", "XLSX", "PPT", "PPTX", "CSV", "ZIP",
];

export const fileExtension = (filename = "") => {
    const parts = String(filename).split(".");
    return parts.length > 1 ? parts.pop().toUpperCase() : "";
};

/**
 * Persist a single graphql-upload file to disk and resolve to the stored name.
 *
 * The old code did `await stream.pipe(createWriteStream(path))`, but `pipe()`
 * returns the destination stream, not a promise — so the resolver continued
 * (and returned "success") before the bytes were written, write errors were
 * emitted asynchronously and swallowed, and for multi-file uploads the next
 * file's stream was read before the previous one finished, which breaks the
 * graphql-upload/busboy ordering. This helper AWAITS completion, rejects on
 * error, and ensures the target directory exists.
 */
export const saveUpload = async (upload, { dir = UPLOADS_DIR, allowed = DEFAULT_ALLOWED_TYPES } = {}) => {
    const file = await upload;
    if (!file || typeof file.createReadStream !== "function") {
        throw new ApolloError("ملف غير صالح", "INVALID_UPLOAD");
    }

    const { createReadStream, filename } = file;
    const ext = fileExtension(filename);

    if (!allowed.includes(ext)) {
        throw new ApolloError(`نوع الملف غير مدعوم: ${ext || "غير معروف"}`, "UNSUPPORTED_FILE_TYPE");
    }

    await fsPromises.mkdir(dir, { recursive: true });

    const storedName = `${UUID()}.${ext}`;
    const target = path.join(dir, storedName);

    await new Promise((resolve, reject) => {
        const readStream = createReadStream();
        const writeStream = createWriteStream(target);
        readStream.on("error", reject);
        writeStream.on("error", reject);
        writeStream.on("finish", resolve);
        readStream.pipe(writeStream);
    });

    return storedName;
};
