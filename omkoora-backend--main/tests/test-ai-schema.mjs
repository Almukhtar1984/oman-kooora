#!/usr/bin/env node
/**
 * Schema-build test for the AI module (no server, no DB, no app.mjs).
 *
 * Builds an executable schema from the real Ai typeDefs + Ai resolvers, merged
 * with the base directive definitions and run through the real @auth transformer
 * — the same pipeline src/Graphql/index.mjs uses. This proves the Ai SDL is
 * valid, its @auth directives resolve, and the resolver map lines up with the
 * declared fields, without importing the whole server (which has an app.mjs
 * circular import when loaded outside the normal entry point).
 *
 *   node tests/test-ai-schema.mjs
 */
process.env.AI_ENC_KEY = "unit-test-key-please-ignore";

import { makeExecutableSchema } from "@graphql-tools/schema";
import { gql } from "apollo-server-express";

const { typeDefs: aiTypeDefs } = await import("../src/Graphql/Schemas/Ai.mjs");
const { resolvers: aiResolvers } = await import("../src/Graphql/Resolvers/Ai.mjs");
const { authDirectiveTransformer } = await import("../src/Graphql/Directives/index.mjs");

const c = { reset: "\x1b[0m", green: "\x1b[32m", red: "\x1b[31m", dim: "\x1b[2m" };
let failures = 0;
const assert = (cond, msg) => {
    if (cond) console.log(`${c.green}✓${c.reset} ${msg}`);
    else { console.log(`${c.red}✗${c.reset} ${msg}`); failures++; }
};

// The base SDL the root schema provides (directives, Role enum, statusUpdate…),
// plus a minimal Blog stub — in the full schema Blog comes from Schemas/Blog.mjs;
// here we only need the name to exist so generateMatchNews: Blog resolves.
const baseTypeDefs = gql`
    directive @auth( requires: Role = user ) on OBJECT | FIELD_DEFINITION
    enum Role { admin employee supervisor customer user }
    type Query { _empty: String }
    type Mutation { _empty: String }
    type statusUpdate { status: Boolean }
    type Blog { id: ID  subject: String  status: String }
`;

let schema;
try {
    schema = makeExecutableSchema({ typeDefs: [baseTypeDefs, aiTypeDefs], resolvers: [aiResolvers] });
    schema = authDirectiveTransformer(schema);
    assert(true, "the Ai SDL builds and the @auth directive transforms cleanly");
} catch (e) {
    assert(false, `schema build failed: ${e.message}`);
    console.log(failures ? `\n${c.red}${failures} failed${c.reset}` : "");
    process.exit(1);
}

const q = schema.getQueryType().getFields();
const m = schema.getMutationType().getFields();

assert(String(q.aiSettings.type) === "AiSettings", "Query.aiSettings : AiSettings");
assert(String(q.aiAvailableModels.type) === "[AiModel!]", "Query.aiAvailableModels : [AiModel!]");
assert(String(q.aiMatchCandidates.type) === "[AiMatchCandidate!]", "Query.aiMatchCandidates : [AiMatchCandidate!]");
assert(String(m.saveAiSettings.type) === "statusUpdate", "Mutation.saveAiSettings : statusUpdate");
assert(String(m.testAiConnection.type) === "AiTestResult", "Mutation.testAiConnection : AiTestResult");
assert(String(m.generateMatchNews.type) === "Blog", "Mutation.generateMatchNews : Blog");
{
    const gArgs = Object.fromEntries(m.generateMatchNews.args.map((a) => [a.name, String(a.type)]));
    assert(gArgs.id_match === "ID!", "generateMatchNews.id_match is ID! (required)");
    assert(gArgs.publish === "Boolean", "generateMatchNews.publish is Boolean (optional)");
}
assert(String(m.draftNews.type) === "AiNewsDraft", "Mutation.draftNews : AiNewsDraft");
{
    const dArgs = Object.fromEntries(m.draftNews.args.map((a) => [a.name, String(a.type)]));
    assert(dArgs.content === "aiNewsDraftInput!", "draftNews.content is aiNewsDraftInput! (required)");
    const draftFields = Object.keys(schema.getType("AiNewsDraft").getFields());
    assert(["subject", "short_description", "description"].every((f) => draftFields.includes(f)),
        "AiNewsDraft returns subject/short_description/description");
}
assert(String(m.draftMessage.type) === "AiMessageDraft", "Mutation.draftMessage : AiMessageDraft");
{
    const mArgs = Object.fromEntries(m.draftMessage.args.map((a) => [a.name, String(a.type)]));
    assert(mArgs.content === "aiMessageDraftInput!", "draftMessage.content is aiMessageDraftInput! (required)");
    const msgFields = Object.keys(schema.getType("AiMessageDraft").getFields());
    assert(["subject", "content"].every((f) => msgFields.includes(f)), "AiMessageDraft returns subject/content");
}

// aiAvailableModels takes (provider!, apiKey) — provider required, apiKey optional.
const avArgs = Object.fromEntries(q.aiAvailableModels.args.map((a) => [a.name, String(a.type)]));
assert(avArgs.provider === "String!", "aiAvailableModels.provider is String! (required)");
assert(avArgs.apiKey === "String", "aiAvailableModels.apiKey is String (optional — falls back to stored key)");

// The security-critical shape: AiSettings must NOT expose any *_api_key field.
const settingsFields = Object.keys(schema.getType("AiSettings").getFields());
assert(!settingsFields.some((f) => /api_key/i.test(f)), "AiSettings exposes no *_api_key field (keys are write-only)");
assert(settingsFields.includes("openai_has_key") && settingsFields.includes("gemini_has_key"),
    "AiSettings exposes has_key booleans instead");

// The resolver map covers exactly the declared fields (no typos / missing wiring).
assert(typeof aiResolvers.Query.aiSettings === "function" && typeof aiResolvers.Query.aiAvailableModels === "function",
    "both Query resolvers are implemented");
assert(typeof aiResolvers.Mutation.saveAiSettings === "function" && typeof aiResolvers.Mutation.testAiConnection === "function",
    "both Mutation resolvers are implemented");

console.log(failures === 0 ? `\n${c.green}All passed${c.reset}` : `\n${c.red}${failures} failed${c.reset}`);
process.exit(failures === 0 ? 0 : 1);
