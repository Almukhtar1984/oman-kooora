#!/usr/bin/env node
/**
 * Guards for technical-staff attachments (إضافة مرفقات للجهاز الفني): upload,
 * store, review, delete — mirroring the player attachment feature and reusing
 * the safe saveUpload helper (behaviourally covered by test-attachment-upload).
 *
 *   node tests/test-technical-attachments.mjs
 */

import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const c = { reset: "\x1b[0m", green: "\x1b[32m", red: "\x1b[31m", cyan: "\x1b[36m" };
const ok  = (m) => console.log(`${c.green}✓${c.reset} ${m}`);
const bad = (m) => console.log(`${c.red}✗${c.reset} ${m}`);
let failures = 0;
const assert = (cond, msg) => { if (cond) ok(msg); else { bad(msg); failures++; } };

const root = resolve(__dirname, "..", "..");
const read = (...p) => { try { return readFileSync(resolve(root, ...p), "utf8"); } catch { return ""; } };
const BE = "omkoora-backend--main";
const TEAM = "client/omkoora-team--main";

console.log(`${c.cyan}▶ Backend schema${c.reset}`);
{
    const s = read(BE, "src", "Graphql", "Schemas", "TechnicalApparatus.mjs");
    assert(/addAttachmentTechnical \(idTechnical: ID!, attachments: \[Upload!\]\): \[AttachmentTechnical\] @auth/.test(s),
        "addAttachmentTechnical mutation exists and is @auth-protected");
    assert(/deleteAttachmentTechnical \( id: ID! \): statusDelete @auth/.test(s), "deleteAttachmentTechnical is @auth-protected");
    assert(/attachmentsTechnical: \[AttachmentTechnical\]/.test(s), "TechnicalApparatus exposes attachmentsTechnical");
    assert(/type AttachmentTechnical \{[\s\S]*id:[\s\S]*content:/.test(s), "AttachmentTechnical type exists");
}

console.log(`${c.cyan}▶ Backend resolver + model${c.reset}`);
{
    const r = read(BE, "src", "Graphql", "Resolvers", "TechnicalApparatus.mjs");
    assert(/import \{saveUpload\}/.test(r), "resolver imports the safe saveUpload helper");
    assert(/addAttachmentTechnical: async/.test(r), "addAttachmentTechnical resolver exists");
    assert(/saveUpload\(upload\)/.test(r), "writes each file via saveUpload (awaited, in order)");
    assert(/AttachmentPerson\.create\(\{ id_technical_apparatus: idTechnical/.test(r), "stores by id_technical_apparatus");
    assert(/ATTACHMENT_UPLOAD_FAILED/.test(r), "surfaces a real error on failure");
    assert(/attachmentsTechnical: async/.test(r) && /id_technical_apparatus: parent\.id/.test(r),
        "attachmentsTechnical field resolver reads by id_technical_apparatus");
    assert(/deleteAttachmentTechnical: async/.test(r) && /AttachmentPerson\.destroy/.test(r), "delete removes the row + file");

    const m = read(BE, "src", "Models", "index.mjs");
    assert(/AttachmentPerson\.belongsTo\(TechnicalApparatus, \{ foreignKey: \{ name: 'id_technical_apparatus'/.test(m),
        "AttachmentPerson is associated to TechnicalApparatus");
}

console.log(`${c.cyan}▶ Migration${c.reset}`);
{
    const mig = read("deploy", "sql", "2026-07-08_add_technical_attachments.sql");
    assert(mig !== "", "migration file exists");
    assert(/ADD COLUMN `id_technical_apparatus`/.test(mig), "adds the id_technical_apparatus column");
}

console.log(`${c.cyan}▶ Team app — graphql${c.reset}`);
{
    assert(/addAttachmentTechnical\(idTechnical: \$idTechnical, attachments: \$attachments\)/.test(read(TEAM, "graphql", "queries", "technical", "AddAttachmentTechnical.tsx")),
        "AddAttachmentTechnical mutation defined");
    assert(/deleteAttachmentTechnical\(id: \$id\)/.test(read(TEAM, "graphql", "queries", "technical", "DeleteAttachmentTechnical.tsx")),
        "DeleteAttachmentTechnical mutation defined");
    assert(/AddAttachmentTechnical/.test(read(TEAM, "graphql", "queries", "technical", "index.ts")), "mutations exported from barrel");
    assert(/attachmentsTechnical \{[\s\S]*id[\s\S]*content/.test(read(TEAM, "graphql", "queries", "technical", "AllTechnicals.tsx")),
        "AllTechnicals query fetches attachmentsTechnical");
}

console.log(`${c.cyan}▶ Team app — upload + review${c.reset}`);
{
    const add = read(TEAM, "components", "Modal", "AddAttachmentTechnicalModal.tsx");
    assert(/useAddAttachmentTechnical/.test(add) && /idTechnical: props\.id/.test(add), "upload modal sends idTechnical");
    assert(/refetchQueries: \[AllTechnicals\]/.test(add) && /notyf\.success/.test(add), "refreshes + confirms on success");
    assert(/!attachments\.length/.test(add), "blocks submit with no file");

    const show = read(TEAM, "components", "Modal", "ShowAttachmentsTechnical.tsx");
    assert(/data\?\.attachmentsTechnical/.test(show), "review modal lists the saved attachments");
    assert(/useDeleteAttachmentTechnical/.test(show) && /window\.confirm/.test(show), "can delete an attachment (with confirm)");
    assert(/getImageUrl\(item\.content\)/.test(show), "each attachment opens its file");
}

console.log(`${c.cyan}▶ Team app — wiring${c.reset}`);
{
    const table = read(TEAM, "components", "Tables", "TechnicalsTable.tsx");
    assert(/إضافة مرفقات/.test(table) && /openModelAddAttachment\(item\?\.id\)/.test(table), "menu: add attachments");
    assert(/المرفقات/.test(table) && /openModelShowAttachments\(item\)/.test(table), "menu: review attachments");

    const page = read(TEAM, "pages", "technicalApparatus.tsx");
    assert(/<AddAttachmentTechnicalModal[\s\S]*id=\{selectedData\}/.test(page), "page mounts the upload modal");
    assert(/<ShowAttachmentsTechnical[\s\S]*data=\{selectedTechnical\}/.test(page), "page mounts the review modal");
}

console.log(`${c.cyan}▶ Team app — home page cards (the primary staff view)${c.reset}`);
{
    // The home dashboard shows technical staff as MemberCards; the attachment
    // actions must be there too (not just the /technicalApparatus table).
    const card = read(TEAM, "components", "Card", "MemberCard.tsx");
    assert(/type === 'technical' && hasPermission\("3"\)[\s\S]*?onAddAttachment && onAddAttachment\(data\?\.id\)/.test(card),
        "MemberCard technical block has 'إضافة مرفقات'");
    assert(/type === 'technical' && data\?\.attachmentsTechnical\?\.length > 0[\s\S]*onShowAttachments && onShowAttachments\(data\)/.test(card),
        "MemberCard technical block has 'المرفقات' (shown when there are any)");

    const home = read(TEAM, "pages", "index.tsx");
    assert(/onAddAttachment=\{handleAddAttachmentTechnical\}/.test(home) && /onShowAttachments=\{handleShowAttachmentsTechnical\}/.test(home),
        "home passes the technical attachment handlers to the technical section");
    assert(/<AddAttachmentTechnicalModal[\s\S]*opened=\{openAddAttachmentTechnicalModal\}/.test(home), "home mounts the technical upload modal");
    assert(/<ShowAttachmentsTechnical[\s\S]*opened=\{openShowAttachmentTechnicalModal\}/.test(home), "home mounts the technical review modal");
}

console.log("");
if (failures === 0) {
    console.log(`${c.green}All technical-attachment guards passed.${c.reset}`);
    process.exit(0);
} else {
    console.log(`${c.red}${failures} technical-attachment guard(s) failed.${c.reset}`);
    process.exit(1);
}
