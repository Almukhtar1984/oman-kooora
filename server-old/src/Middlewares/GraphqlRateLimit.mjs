const DEFAULT_WINDOW_MS = 15 * 60 * 1000;

const OPERATION_LIMITS = {
    authenticateUser: {limit: 10, windowMs: DEFAULT_WINDOW_MS},
    forgetPassword: {limit: 5, windowMs: 60 * 60 * 1000},
    resendVerificationEmail: {limit: 5, windowMs: 60 * 60 * 1000},
    changePassword: {limit: 10, windowMs: DEFAULT_WINDOW_MS},
    refreshToken: {limit: 60, windowMs: DEFAULT_WINDOW_MS}
};

const buckets = new Map();

const normalizeIp = (req) => {
    return req.ip || req.socket?.remoteAddress || "unknown";
}

const detectOperation = (body) => {
    const operationName = body?.operationName;
    if (operationName && OPERATION_LIMITS[operationName]) {
        return operationName;
    }

    const query = typeof body?.query === "string" ? body.query : "";
    return Object.keys(OPERATION_LIMITS).find((operation) => query.includes(operation));
}

const cleanExpiredBuckets = (now) => {
    for (const [key, bucket] of buckets.entries()) {
        if (bucket.resetAt <= now) buckets.delete(key);
    }
}

export const graphqlSensitiveRateLimit = () => (req, res, next) => {
    if (req.method !== "POST") return next();

    const operation = detectOperation(req.body);
    if (!operation) return next();

    const now = Date.now();
    cleanExpiredBuckets(now);

    const config = OPERATION_LIMITS[operation];
    const key = `${normalizeIp(req)}:${operation}`;
    const current = buckets.get(key);
    const bucket = current && current.resetAt > now
        ? current
        : {count: 0, resetAt: now + config.windowMs};

    bucket.count += 1;
    buckets.set(key, bucket);

    if (bucket.count <= config.limit) return next();

    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    res.setHeader("Retry-After", `${retryAfter}`);

    return res.status(429).json({
        errors: [{
            message: "Too many requests",
            extensions: {
                code: "RATE_LIMITED",
                operation,
                retryAfter
            }
        }]
    });
}
