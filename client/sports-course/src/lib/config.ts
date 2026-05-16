const defaultApiBaseUrl =
    import.meta.env.MODE === "development"
        ? "http://localhost:7001"
        : "https://api.omkooora.com";

const defaultPrintUrl =
    import.meta.env.MODE === "development"
        ? "http://localhost:3000"
        : "https://print.omkooora.com";

export const apiBaseUrl =
    import.meta.env.VITE_API_URL ||
    defaultApiBaseUrl;

export const printUrl =
    import.meta.env.VITE_PRINT_URL ||
    defaultPrintUrl;
