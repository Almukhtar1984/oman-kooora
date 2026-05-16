#!/usr/bin/env node
/**
 * Schema-shape test for the bulk changeStatus mutations.
 *
 * Loads the typeDefs of Members/Players/TechnicalApparatus + the root
 * schema (where `bulkStatusResult` is declared) and walks the AST to
 * assert the new mutations + result type exist with the expected
 * signature. Pure static check — no server, no DB.
 *
 *   node tests/test-schema-bulk.mjs
 */

import {typeDefs as membersTypeDefs}  from "../src/Graphql/Schemas/Members.mjs";
import {typeDefs as playersTypeDefs}  from "../src/Graphql/Schemas/Players.mjs";
import {typeDefs as techTypeDefs}     from "../src/Graphql/Schemas/TechnicalApparatus.mjs";

import {readFileSync} from "fs";
import {dirname, resolve} from "path";
import {fileURLToPath} from "url";
import {parse, print} from "graphql";

const __dirname = dirname(fileURLToPath(import.meta.url));

const c = {reset: "\x1b[0m", green: "\x1b[32m", red: "\x1b[31m", yellow: "\x1b[33m", cyan: "\x1b[36m", dim: "\x1b[2m"};
const ok  = (m) => console.log(`${c.green}✓${c.reset} ${m}`);
const bad = (m) => console.log(`${c.red}✗${c.reset} ${m}`);

let failures = 0;
function assert(cond, msg) {
    if (cond) ok(msg);
    else { bad(msg); failures++; }
}

/** Find an extension/declaration of a given object type in a typeDefs Document. */
function findObjectTypeNames(doc, typeName) {
    const out = [];
    for (const def of doc.definitions) {
        if (
            (def.kind === "ObjectTypeDefinition" || def.kind === "ObjectTypeExtension") &&
            def.name.value === typeName
        ) {
            out.push(def);
        }
    }
    return out;
}

/** Pull all fields of `Mutation` (both declarations and extensions) from a typeDefs Document. */
function collectMutationFields(doc) {
    const fields = [];
    for (const def of findObjectTypeNames(doc, "Mutation")) {
        for (const f of def.fields || []) fields.push(f);
    }
    return fields;
}

function fieldByName(fields, name) {
    return fields.find((f) => f.name.value === name);
}

function typeToString(typeNode) {
    if (typeNode.kind === "NonNullType") return `${typeToString(typeNode.type)}!`;
    if (typeNode.kind === "ListType") return `[${typeToString(typeNode.type)}]`;
    return typeNode.name.value;
}

function checkBulkMutation(doc, label, mutationName) {
    console.log(`\n${c.yellow}▶${c.reset} ${label} — ${mutationName}`);
    const fields = collectMutationFields(doc);
    const field = fieldByName(fields, mutationName);
    assert(!!field, `mutation '${mutationName}' is declared`);
    if (!field) return;

    const args = Object.fromEntries((field.arguments || []).map((a) => [a.name.value, typeToString(a.type)]));

    assert(args.ids === "[ID!]!",     `arg ids: [ID!]!  (got ${args.ids})`);
    assert(args.status === "String!", `arg status: String! (got ${args.status})`);
    assert(args.note === "String",    `arg note: String (got ${args.note})`);
    assert(typeToString(field.type) === "bulkStatusResult", `returns bulkStatusResult (got ${typeToString(field.type)})`);
}

function checkBulkResultType() {
    console.log(`\n${c.yellow}▶${c.reset} root schema — type bulkStatusResult`);
    const rootSrc = readFileSync(resolve(__dirname, "../src/Graphql/index.mjs"), "utf8");
    // Extract the gql template literal that contains the root typeDefs.
    const m = rootSrc.match(/const\s+typeDefs\s*=\s*gql`([\s\S]*?)`/);
    assert(!!m, "found root typeDefs literal in Graphql/index.mjs");
    if (!m) return;

    const rootDoc = parse(m[1]);
    const decls = findObjectTypeNames(rootDoc, "bulkStatusResult");
    assert(decls.length >= 1, "type 'bulkStatusResult' is declared in the root schema");
    if (!decls.length) return;

    const fieldNames = Object.fromEntries(decls[0].fields.map((f) => [f.name.value, typeToString(f.type)]));
    assert(fieldNames.success === "Int", `success: Int  (got ${fieldNames.success})`);
    assert(fieldNames.total   === "Int", `total: Int    (got ${fieldNames.total})`);
}

(async () => {
    console.log(`${c.cyan}Bulk changeStatus — schema-shape check${c.reset}`);

    checkBulkResultType();

    checkBulkMutation(membersTypeDefs, "Members",            "changeStatusMembersBulk");
    checkBulkMutation(playersTypeDefs, "Players",            "changeStatusPlayersBulk");
    checkBulkMutation(techTypeDefs,    "TechnicalApparatus", "changeStatusTechnicalApparatusBulk");

    console.log("");
    if (failures === 0) {
        console.log(`${c.green}━━━ All schema assertions passed ━━━${c.reset}`);
        process.exit(0);
    } else {
        console.log(`${c.red}━━━ ${failures} assertion(s) failed ━━━${c.reset}`);
        process.exit(1);
    }
})().catch((e) => {
    bad(e.message);
    console.error(e.stack);
    process.exit(1);
});
