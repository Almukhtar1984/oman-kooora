import path from "path";
import {fileURLToPath} from "url";

import {User} from "../Models/index.mjs";
import {sameUserAgent} from "../Helpers/Check.mjs";
import {serializeUser, VerifyToken} from "../Helpers/JWT.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, "../../uploads");
const REFRESH_COOKIE_NAME = "__tomoh";

const FILENAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

export const isSafeUploadFilename = (filename) => {
    if (!filename || typeof filename !== "string") return false;
    if (filename !== path.basename(filename)) return false;
    if (!FILENAME_PATTERN.test(filename)) return false;

    return true;
}

export const getUploadFilePath = (filename) => {
    const filePath = path.resolve(uploadsDir, filename);

    if (!filePath.startsWith(`${uploadsDir}${path.sep}`)) {
        return null;
    }

    return filePath;
}

const isRefreshSessionValid = (user, decodedToken) => {
    if (!decodedToken?.tokenId || decodedToken?.tokenVersion === undefined) return false;

    return `${user.refresh_token_id || ""}` === `${decodedToken.tokenId}`
        && Number(user.refresh_token_version || 0) === Number(decodedToken.tokenVersion);
}

const authenticateWithRefreshCookie = async (req) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!refreshToken) return false;

    const decodedToken = await VerifyToken(refreshToken);
    if (!decodedToken?.id) return false;

    if (!sameUserAgent(decodedToken.useragent, req.useragent)) {
        return false;
    }

    const user = await User.findByPk(decodedToken.id);
    if (!user || !isRefreshSessionValid(user, decodedToken)) {
        return false;
    }

    req.isAuth = true;
    req.user = serializeUser(user);

    return true;
}

export const privateUploadFileMiddleware = () => async (req, res) => {
    const isCookieAuthenticated = req.isAuth && req.user
        ? true
        : await authenticateWithRefreshCookie(req);

    if (!isCookieAuthenticated) {
        return res.status(401).json({
            errors: [{
                message: "Authentication required",
                extensions: {code: "UNAUTHENTICATED"}
            }]
        });
    }

    const {filename} = req.params;
    if (!isSafeUploadFilename(filename)) {
        return res.status(400).json({
            errors: [{
                message: "Invalid file name",
                extensions: {code: "INVALID_FILE_NAME"}
            }]
        });
    }

    const filePath = getUploadFilePath(filename);
    if (!filePath) {
        return res.status(400).json({
            errors: [{
                message: "Invalid file path",
                extensions: {code: "INVALID_FILE_PATH"}
            }]
        });
    }

    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");

    return res.sendFile(filePath, (error) => {
        if (!error || res.headersSent) return;

        if (error.code === "ENOENT") {
            return res.status(404).json({
                errors: [{
                    message: "File not found",
                    extensions: {code: "FILE_NOT_FOUND"}
                }]
            });
        }

        return res.status(500).json({
            errors: [{
                message: "Unable to read file",
                extensions: {code: "FILE_READ_FAILED"}
            }]
        });
    });
}
