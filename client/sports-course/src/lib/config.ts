const defaultApiBaseUrl =
    import.meta.env.MODE === "development"
        ? "http://localhost:7001"
        : "https://api.omkooora.com";

export const apiBaseUrl =
    import.meta.env.VITE_API_URL ||
    defaultApiBaseUrl;
