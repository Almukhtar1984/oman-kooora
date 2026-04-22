const defaultApiBaseUrl =
    process.env.NODE_ENV === "development"
        ? "http://localhost:7001"
        : "https://api.omkooora.com";

export const apiBaseUrl =
    process.env.REACT_APP_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    defaultApiBaseUrl;
