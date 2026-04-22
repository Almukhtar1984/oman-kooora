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
