import { loadStoredToken } from "./authToken";

// The print app authenticates with a short-lived token we hand it in the URL.
// Base URL is overridable for non-prod; default matches the historical links.
const PRINT_BASE = process.env.NEXT_PUBLIC_PRINT_URL || "https://print.omkooora.com";

const PRINT_TOKEN_QUERY = "query PrintToken { printToken }";

// Ask the API for a fresh, short-lived access token scoped for printing.
async function fetchPrintToken(): Promise<string | null> {
    try {
        const auth = loadStoredToken();
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/graphql`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "x-apollo-operation-name": "PrintToken",
                "apollo-require-preflight": "true",
                ...(auth ? { authorization: auth } : {}),
            },
            body: JSON.stringify({ query: PRINT_TOKEN_QUERY }),
        });
        const json = await res.json();
        return json?.data?.printToken ?? null;
    } catch {
        return null;
    }
}

/**
 * Open the print app at `path` (e.g. "/players/12/team" or "/<playerId>") in a
 * new tab, carrying a fresh short-lived token so the protected API serves the
 * print queries. If the token can't be fetched it still opens the print tab —
 * print's public endpoints keep working as a fallback.
 */
export async function openPrint(path: string): Promise<void> {
    if (typeof window === "undefined") return;

    const normalized = path && path.startsWith("/") ? path : `/${path || ""}`;

    // Guard against opening the print app with a missing id (e.g. "/undefined"),
    // which would just leave the print tab stuck with no card to load.
    const firstSegment = normalized.split("?")[0].replace(/^\/+/, "").split("/")[0];
    if (!firstSegment || firstSegment === "undefined" || firstSegment === "null") {
        // eslint-disable-next-line no-console
        console.warn("openPrint: missing target id — print tab not opened");
        return;
    }

    // Open synchronously so the browser treats it as a user-initiated popup.
    const win = window.open("", "_blank");

    const token = await fetchPrintToken();
    const sep = normalized.includes("?") ? "&" : "?";
    const url = token
        ? `${PRINT_BASE}/#${normalized}${sep}token=${encodeURIComponent(token)}`
        : `${PRINT_BASE}/#${normalized}`;

    if (win) win.location.href = url;
    else window.open(url, "_blank");
}
