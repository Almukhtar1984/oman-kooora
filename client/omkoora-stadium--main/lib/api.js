// Tiny GraphQL client over fetch. Sends the stored Bearer token so the backend
// resolves the signed-in stadium owner. API URL comes from NEXT_PUBLIC_API_URL.

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.omkooora.com/graphql";

export const IMAGES_BASE =
  process.env.NEXT_PUBLIC_IMAGES_BASE || "https://api.omkooora.com/images";

export const TOKEN_KEY = "stadium_token";

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

// Run a GraphQL operation. Throws on GraphQL/network errors.
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

// GraphQL with file uploads (graphql-upload multipart spec). `files` is an array
// of { path, file } where path is the variable dot-path (e.g.
// "variables.content.images.0") and file is a browser File.
export async function gqlUpload(query, variables, files = []) {
  const form = new FormData();
  form.append("operations", JSON.stringify({ query, variables }));
  const map = {};
  files.forEach((f, i) => { map[String(i)] = [f.path]; });
  form.append("map", JSON.stringify(map));
  files.forEach((f, i) => form.append(String(i), f.file, f.file.name));

  const headers = { "Apollo-Require-Preflight": "true" }; // let the browser set the multipart boundary
  const token = getToken();
  if (token) headers["Authorization"] = token;

  const res = await fetch(API_URL, { method: "POST", headers, body: form });
  const body = await res.json();
  if (body.errors && body.errors.length) {
    const err = new Error(body.errors.map((e) => e.message).join(" · "));
    err.graphQLErrors = body.errors;
    throw err;
  }
  return body.data;
}

export const OMAN_GOVERNORATES = [
  "مسقط", "ظفار", "مسندم", "البريمي", "الداخلية",
  "شمال الباطنة", "جنوب الباطنة", "شمال الشرقية", "جنوب الشرقية",
  "الظاهرة", "الوسطى",
];
