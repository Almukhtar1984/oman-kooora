import path from "path";

import {getUploadFilePath, isSafeUploadFilename} from "./PrivateFiles.mjs";

const PUBLIC_IMAGE_EXTENSIONS = new Set([".jpeg", ".jpg", ".png", ".webp"]);

export const isPublicUploadImageFilename = (filename) => {
    if (!isSafeUploadFilename(filename)) return false;

    return PUBLIC_IMAGE_EXTENSIONS.has(path.extname(filename).toLowerCase());
}

export const publicUploadImageMiddleware = () => (req, res) => {
    const {filename} = req.params;

    if (!isPublicUploadImageFilename(filename)) {
        return res.sendStatus(404);
    }

    const filePath = getUploadFilePath(filename);
    if (!filePath) {
        return res.sendStatus(404);
    }

    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");

    return res.sendFile(filePath, (error) => {
        if (!error || res.headersSent) return;

        return res.sendStatus(404);
    });
}
