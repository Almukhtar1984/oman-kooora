import {migrator} from "../src/Database/migrator.mjs";

await migrator.up();
await import("../src/app.mjs");
