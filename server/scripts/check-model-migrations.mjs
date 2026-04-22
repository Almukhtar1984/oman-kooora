import {execFileSync} from "child_process";

const runGit = (args) => {
    return execFileSync("git", args, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"]
    }).trim();
}

const repoRoot = runGit(["rev-parse", "--show-toplevel"]);
const baseRef = process.env.MODEL_MIGRATION_BASE_REF;

const getDiffFiles = () => {
    const args = baseRef
        ? ["-C", repoRoot, "diff", "--name-only", "--diff-filter=ACMRTUB", `${baseRef}...HEAD`, "--", "server/src/Models", "server/migrations"]
        : ["-C", repoRoot, "diff", "--name-only", "--diff-filter=ACMRTUB", "HEAD", "--", "server/src/Models", "server/migrations"];

    return runGit(args).split("\n").filter(Boolean);
}

const getUntrackedFiles = () => {
    return runGit([
        "-C",
        repoRoot,
        "ls-files",
        "--others",
        "--exclude-standard",
        "--",
        "server/src/Models",
        "server/migrations"
    ]).split("\n").filter(Boolean);
}

const changedFiles = new Set([
    ...getDiffFiles(),
    ...getUntrackedFiles()
]);

const modelFiles = [...changedFiles].filter((file) => {
    return file.startsWith("server/src/Models/")
        && file.endsWith(".mjs")
        && file !== "server/src/Models/index.mjs";
});

const migrationFiles = [...changedFiles].filter((file) => {
    return file.startsWith("server/migrations/") && file.endsWith(".mjs");
});

if (modelFiles.length > 0 && migrationFiles.length === 0) {
    console.error("Model changes require a matching migration file.");
    console.error("Changed model files:");
    for (const file of modelFiles) console.error(`- ${file}`);
    console.error("Add a migration under server/migrations before merging.");
    process.exit(1);
}

console.log("Model migration check passed.");
