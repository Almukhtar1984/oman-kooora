import { defineConfig } from "vitest/config";

// Component tests only (tests/unit/**). The older tests/*.mjs files are
// standalone node scripts and are deliberately not picked up here.
export default defineConfig({
    esbuild: {
        jsx: "automatic",
    },
    test: {
        environment: "jsdom",
        globals: true,
        include: ["tests/unit/**/*.test.{ts,tsx}"],
        setupFiles: ["./tests/unit/setup.ts"],
    },
});
