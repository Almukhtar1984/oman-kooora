import decode from "jwt-decode";
import useStore from "../../store/useStore";

// Survives reloads so the user is not bounced to /login on F5 or a fresh
// tab. The refresh cookie is httpOnly (server side); persisting the access
// token here gives the client the same continuity without exposing the
// long-lived secret.
const STORAGE_KEY = "omkoora.auth.token";

// Refresh this far ahead of the JWT `exp` so a slow network never serves a
// request with a token that died mid-flight.
const REFRESH_LEAD_MS = 2 * 60 * 1000;

// Even with a multi-day access token, fire a heartbeat refresh every
// 24 hours so a tab left open for weeks never serves stale claims.
const MAX_TIMEOUT_MS = 24 * 60 * 60 * 1000;

type RefreshFn = () => Promise<string | null>;

let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let inflight: Promise<string | null> | null = null;
let visibilityAttached = false;
let registeredRefreshFn: RefreshFn | null = null;
let onUnauthenticatedCb: (() => void) | null = null;

const stripBearer = (raw?: string | null): string | null =>
    !raw ? null : raw.startsWith("Bearer ") ? raw.slice(7) : raw;

export const decodeExpiryMs = (token?: string | null): number | null => {
    const t = stripBearer(token);
    if (!t) return null;
    try {
        const decoded: any = decode(t);
        return decoded?.exp ? decoded.exp * 1000 : null;
    } catch {
        return null;
    }
};

// A member-portal token (phone + civil ID sign-in) carries `kind: "portal"`
// instead of a user id. It has no refresh cookie behind it, so the session
// simply ends when the token expires and the member signs in again.
export const isPortalToken = (token?: string | null): boolean => {
    const t = stripBearer(token);
    if (!t) return false;
    try {
        const decoded: any = decode(t);
        return decoded?.kind === "portal";
    } catch {
        return false;
    }
};

export const loadStoredToken = (): string | null => {
    if (typeof window === "undefined") return null;
    try {
        return window.localStorage.getItem(STORAGE_KEY);
    } catch {
        return null;
    }
};

const persist = (token?: string | null) => {
    if (typeof window === "undefined") return;
    try {
        if (token) window.localStorage.setItem(STORAGE_KEY, token);
        else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
        /* private mode / quota — non-fatal */
    }
};

const clearTimer = () => {
    if (refreshTimer) {
        clearTimeout(refreshTimer);
        refreshTimer = null;
    }
};

const scheduleNext = (token: string, fn: RefreshFn) => {
    clearTimer();
    if (typeof window === "undefined") return;
    const exp = decodeExpiryMs(token);
    const delay = exp
        ? Math.max(1_000, Math.min(MAX_TIMEOUT_MS, exp - Date.now() - REFRESH_LEAD_MS))
        : MAX_TIMEOUT_MS;
    refreshTimer = setTimeout(() => {
        runRefresh(fn).catch(() => {});
    }, delay);
};

const attachVisibility = (fn: RefreshFn) => {
    if (visibilityAttached || typeof document === "undefined") return;
    visibilityAttached = true;
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState !== "visible") return;
        const token = (useStore.getState() as any).token || loadStoredToken();
        if (!token) return;
        const exp = decodeExpiryMs(token);
        if (!exp || exp - Date.now() <= REFRESH_LEAD_MS) {
            runRefresh(fn).catch(() => {});
        } else {
            scheduleNext(token, fn);
        }
    });
};

export const registerRefreshFn = (fn: RefreshFn) => {
    registeredRefreshFn = fn;
};

export const setUnauthenticatedHandler = (cb: () => void) => {
    onUnauthenticatedCb = cb;
};

export const applyNewToken = (token: string) => {
    useStore.setState({ isAuth: true, token });
    persist(token);
    if (isPortalToken(token)) return;
    if (registeredRefreshFn) {
        scheduleNext(token, registeredRefreshFn);
        attachVisibility(registeredRefreshFn);
    }
};

export const clearAuth = () => {
    useStore.setState({ isAuth: false, token: "", userData: {} });
    persist(null);
    clearTimer();
};

const forceLogout = () => {
    clearAuth();
    onUnauthenticatedCb?.();
};

// Single-flight: every concurrent caller awaits the same network round-trip,
// so a burst of 10 expired requests triggers exactly one refresh.
export const runRefresh = (fn?: RefreshFn): Promise<string | null> => {
    // Portal sessions have nothing to refresh against; treat the current token
    // as final rather than forcing a logout the member cannot recover from.
    const current = (useStore.getState() as any).token || loadStoredToken();
    if (isPortalToken(current)) {
        const exp = decodeExpiryMs(current);
        if (exp && exp > Date.now()) return Promise.resolve(current);
        forceLogout();
        return Promise.resolve(null);
    }

    if (inflight) return inflight;
    const effective = fn || registeredRefreshFn;
    if (!effective) return Promise.resolve(null);

    inflight = (async () => {
        try {
            const next = await effective();
            if (!next) {
                forceLogout();
                return null;
            }
            applyNewToken(next);
            return next;
        } catch {
            forceLogout();
            return null;
        } finally {
            inflight = null;
        }
    })();
    return inflight;
};

// Pull the persisted token into the Zustand store on first client render.
// Returns whether a usable token is now in memory (it may still be expired —
// caller should kick off a refresh if so).
export const hydrateAuthFromStorage = (): string | null => {
    if (typeof window === "undefined") return null;
    const current = (useStore.getState() as any).token;
    if (current) {
        if (isPortalToken(current)) return current;
        if (registeredRefreshFn) {
            scheduleNext(current, registeredRefreshFn);
            attachVisibility(registeredRefreshFn);
        }
        return current;
    }
    const stored = loadStoredToken();
    if (!stored) return null;
    useStore.setState({ token: stored, isAuth: true });
    if (isPortalToken(stored)) return stored;
    if (registeredRefreshFn) {
        scheduleNext(stored, registeredRefreshFn);
        attachVisibility(registeredRefreshFn);
    }
    return stored;
};
