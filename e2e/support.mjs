// What the audit and the journeys share: the local stack and its seed accounts.
// Local only — anything but localhost is refused, so neither can log in to
// production or write a screenshot of real members' data.

export const API_URL = process.env.API_URL || "http://localhost:7001";

export const APPS = {
    club: {
        url: process.env.CLUB_URL || "http://localhost:3050",
        email: process.env.CLUB_EMAIL || "clubadmin@tomoh.local",
        password: process.env.CLUB_PASSWORD || "Club@1234",
    },
    team: {
        url: process.env.TEAM_URL || "http://localhost:3053",
        email: process.env.TEAM_EMAIL || "demo@tomoh.local",
        password: process.env.TEAM_PASSWORD || "Demo@1234",
    },
};

const assertLocal = (raw) => {
    const { hostname } = new URL(raw);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(hostname) && !hostname.endsWith(".localhost")) {
        console.error(`✗ ${raw}: the audit runs against a local stack only.`);
        process.exit(2);
    }
};
[API_URL, ...Object.values(APPS).map((app) => app.url)].forEach(assertLocal);

export const login = async (app) => {
    const res = await fetch(`${API_URL}/graphql`, {
        method: "POST",
        // The app's own Origin, so the token carries that app's audience.
        headers: { "content-type": "application/json", Origin: app.url },
        body: JSON.stringify({
            query: "mutation($c: loginInfo){ authenticateUser(content: $c){ token } }",
            variables: { c: { email: app.email, password: app.password } },
        }),
    });
    const body = await res.json();
    const token = body?.data?.authenticateUser?.token;
    if (!token) throw new Error(`login ${app.email}: ${JSON.stringify(body?.errors?.[0]?.message || body)}`);
    return token;
};

/** A logged-in page in the given app, at desktop width unless told otherwise. */
export const openApp = async (browser, app, viewport = { width: 1440, height: 900 }) => {
    const token = await login(app);
    const context = await browser.newContext({ viewport, locale: "ar" });
    await context.addInitScript((t) => localStorage.setItem("omkoora.auth.token", t), token);
    return { context, page: await context.newPage() };
};
