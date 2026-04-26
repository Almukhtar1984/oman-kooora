import path from "path";

import {getUploadFilePath, isSafeUploadFilename} from "./PrivateFiles.mjs";

const PUBLIC_IMAGE_EXTENSIONS = new Set([".jpeg", ".jpg", ".png", ".webp"]);

export const isPublicUploadImageFilename = (filename) => {
    if (!isSafeUploadFilename(filename)) return false;

    return PUBLIC_IMAGE_EXTENSIONS.has(path.extname(filename).toLowerCase());
}

const PUBLIC_PATH_SEGMENT_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

export const isSafePublicImagePath = (filename) => {
    if (!filename || typeof filename !== "string") return false;
    if (filename.includes("\\") || filename.includes("\0")) return false;

    const normalized = path.posix.normalize(filename);
    if (normalized !== filename || normalized.startsWith("../") || normalized.includes("/../")) {
        return false;
    }

    const segments = filename.split("/");
    if (segments.length === 0 || segments.some((segment) => !PUBLIC_PATH_SEGMENT_PATTERN.test(segment))) {
        return false;
    }

    return PUBLIC_IMAGE_EXTENSIONS.has(path.extname(segments[segments.length - 1]).toLowerCase());
}

export const publicUploadImageMiddleware = () => (req, res) => {
    const filename = req.params.filename || req.params[0];

    if (!isPublicUploadImageFilename(filename) && !isSafePublicImagePath(filename)) {
        return res.sendStatus(404);
    }

    const filePath = getUploadFilePath(filename);
    if (!filePath) {
        return res.sendStatus(404);
    }

    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("X-Content-Type-Options", "nosniff");

    return res.sendFile(filePath, (error) => {
        if (!error || res.headersSent) return;

        return res.sendStatus(404);
    });
}
