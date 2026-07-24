#!/usr/bin/env node
/**
 * Export the full GraphQL SDL to docs/API/schema.graphql.
 *
 * Imports the typeDefs (DocumentNodes only — NO resolvers, so no DB) and prints
 * them, preserving the @auth / @date / @imgUrl annotations that document which
 * fields need a token. Re-run after schema changes:  npm run schema:export
 */

import { print } from "graphql";
import { writeFileSync, mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

import * as schemas from "../src/Graphql/Schemas/index.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

// The root SDL lives inline in Graphql/index.mjs (which imports resolvers/DB),
// so it is replicated here. Keep in sync if the base types change.
const BASE = `# ============================================================================
#  Tomoh / omkooora GraphQL API — root schema
#  Endpoint (prod): https://api.omkooora.com/graphql
#  Auth: send an access token in the "Authorization" header. Fields marked
#        @auth(requires: ...) need a valid token; fields without it are public.
# ============================================================================

directive @date(format: String = "dd/mm/yyyy HH:MM:ss") on FIELD_DEFINITION
directive @auth(requires: Role = user) on OBJECT | FIELD_DEFINITION
directive @imgUrl on FIELD_DEFINITION

scalar Date
scalar Upload
scalar Time

type File { filename: String!  url: String! }
type Files { filesname: [String!]  url: String! }

enum Role { admin employee supervisor customer user }
enum Gander { male female }
enum Activation { Active Desactive }

type Query { _empty: String }
type Mutation {
    _empty: String
    singleUpload(file: Upload): File @auth(requires: user)
}

type statusUpdate { status: Boolean }
type statusDelete { status: Boolean }
type bulkStatusResult { success: Int  total: Int }`;

const parts = [BASE];
for (const [name, doc] of Object.entries(schemas)) {
    if (doc && doc.kind === "Document") {
        const label = name.replace(/^typeDefs/, "");
        parts.push(`# ===================== ${label} =====================\n${print(doc)}`);
    }
}

const sdl = parts.join("\n\n") + "\n";
const outDir = resolve(__dirname, "..", "..", "docs", "API");
mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, "schema.graphql"), sdl);

const ops = (sdl.match(/^\s{4}\w+\s*\(/gm) || []).length;
console.log(`Wrote docs/API/schema.graphql (${sdl.split("\n").length} lines, ~${ops} operations).`);
