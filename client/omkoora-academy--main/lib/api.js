// Tiny GraphQL client over fetch. Sends the stored Bearer token so the backend
// resolves the signed-in academy owner. API URL comes from NEXT_PUBLIC_API_URL.

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.omkooora.com/graphql";

export const IMAGES_BASE =
  process.env.NEXT_PUBLIC_IMAGES_BASE || "https://api.omkooora.com/images";

export const TOKEN_KEY = "academy_token";

export function getToken() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function clearToken() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

// Full URL for a stored image name (logo / news image / academy image).
export function imageUrl(name) {
  if (!name) return null;
  if (/^https?:\/\//i.test(name)) return name;
  return `${IMAGES_BASE}/${name}`;
}

// Run a GraphQL operation (JSON). Throws on GraphQL/network errors.
export async function gql(query, variables = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = token; // token already includes "Bearer "

  const res = await fetch(API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json();
  if (body.errors && body.errors.length) {
    const msg = body.errors.map((e) => e.message).join(" · ");
    const err = new Error(msg);
    err.graphQLErrors = body.errors;
    throw err;
  }
  return body.data;
}

// Run a GraphQL operation that carries file uploads, following the
// graphql-multipart-request-spec. `files` is an array of { path, file } where
// `path` is the dotted location in `variables` the file belongs to, e.g.
// "content.logo" or "content.images.0". The matching spots in `variables` must
// be null (scalar) / contain nulls (list). CSRF prevention on the server needs
// the Apollo-Require-Preflight header for multipart requests.
export async function gqlUpload(query, variables = {}, files = []) {
  const form = new FormData();
  form.append("operations", JSON.stringify({ query, variables }));

  const map = {};
  files.forEach((_, i) => {
    map[i] = [`variables.${files[i].path}`];
  });
  form.append("map", JSON.stringify(map));
  files.forEach((entry, i) => form.append(String(i), entry.file, entry.file.name));

  const headers = { "Apollo-Require-Preflight": "true" };
  const token = getToken();
  if (token) headers["Authorization"] = token;

  const res = await fetch(API_URL, { method: "POST", headers, body: form });
  const body = await res.json();
  if (body.errors && body.errors.length) {
    const msg = body.errors.map((e) => e.message).join(" · ");
    const err = new Error(msg);
    err.graphQLErrors = body.errors;
    throw err;
  }
  return body.data;
}

// Oman's governorates — the محافظة <select> options (mirrors the stadium app).
export const OMAN_GOVERNORATES = [
  "مسقط", "ظفار", "مسندم", "البريمي", "الداخلية",
  "شمال الباطنة", "جنوب الباطنة", "شمال الشرقية", "جنوب الشرقية",
  "الظاهرة", "الوسطى",
];
