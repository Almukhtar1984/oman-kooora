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
