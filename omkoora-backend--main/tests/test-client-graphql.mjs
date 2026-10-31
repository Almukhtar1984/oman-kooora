// كل استعلام ترسله اللوحات يقبله الخادم.
//
// العميل في الاجتماع: «أي أيقونات ما شغّالة… تعمل رفض، رفض، رفض، مش شغّالة».
// زرٌّ يرسل حقلاً أو وسيطاً لا يعرفه الخادم يفشل بصمت أمام المستخدم، ولا يراه
// أحد حتى يُضغط. هذا الاختبار يبني المخطّط من تعريفاته وحدها (بلا قاعدة بيانات
// ولا خادم) ويتحقّق من كل وثيقة gql`` في لوحات النادي والفريق والمشرف — فيكشف
// الانحراف بين الخادم والواجهة قبل أن يصل إلى زرّ.
//
//   node tests/test-client-graphql.mjs

import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { parse, validate, Kind } from "graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";

const backend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APPS = ["omkoora-club--main", "omkoora-team--main", "super-admin"]
    .map((name) => path.resolve(backend, "../client", name));

// المخطّط من تعريفاته كما يجمعها الخادم (makeExecutableSchema يدمج الأنواع المكرّرة).
const schemaDir = path.join(backend, "src/Graphql/Schemas");
const docs = [];
for (const file of readdirSync(schemaDir).filter((name) => name.endsWith(".mjs"))) {
    const mod = await import(pathToFileURL(path.join(schemaDir, file)).href);
    for (const value of Object.values(mod)) if (value?.kind === Kind.DOCUMENT) docs.push(value);
}
const base = readFileSync(path.join(backend, "src/Graphql/index.mjs"), "utf8").match(/const typeDefs\s*=\s*gql`([\s\S]*?)`;/);
docs.unshift(parse(base[1]));
const schema = makeExecutableSchema({ typeDefs: docs });

const walk = (dir, out = []) => {
    for (const name of readdirSync(dir)) {
        if (["node_modules", ".next", "tests", "public"].includes(name)) continue;
        const full = path.join(dir, name);
        if (statSync(full).isDirectory()) walk(full, out);
        else if (/\.(tsx?|jsx?)$/.test(name)) out.push(full);
    }
    return out;
};

let checked = 0;
const problems = [];
for (const app of APPS.filter(existsSync)) {
    for (const file of walk(app)) {
        const source = readFileSync(file, "utf8");
        for (const [, body] of source.matchAll(/gql\s*`([\s\S]*?)`/g)) {
            if (body.includes("${")) continue;          // مقاطع مركّبة لا تُحلَّل وحدها
            let doc;
            try { doc = parse(body); } catch (error) {
                problems.push(`${path.relative(path.dirname(app), file)}: ${error.message}`);
                continue;
            }
            checked++;
            for (const error of validate(schema, doc)) {
                const name = doc.definitions.find((d) => d.name)?.name?.value || "?";
                problems.push(`${path.relative(path.dirname(app), file)} (${name}): ${error.message}`);
            }
        }
    }
}

if (problems.length) {
    problems.forEach((line) => console.log(`\x1b[31m✗\x1b[0m ${line}`));
    console.log(`\n\x1b[31m${problems.length} مشكلة في ${checked} وثيقة\x1b[0m`);
    process.exit(1);
}
console.log(`\x1b[32mAll passed\x1b[0m (${checked} وثيقة يقبلها الخادم)`);
