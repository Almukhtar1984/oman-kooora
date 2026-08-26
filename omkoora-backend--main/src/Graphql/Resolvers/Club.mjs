import { ApolloError } from 'apollo-server-express';
import sequelize from 'sequelize';
import dotenv from 'dotenv'
import path from "path";
import { v4 as UUID } from 'uuid';
import xlsx from 'xlsx';
import fs from 'fs';
import logger from "../../Config/logger.mjs";;
import {Club, ClubManagement, Members, Person, Team, User, Players, Assembly} from '../../Models/index.mjs';
import {createWriteStream} from "fs";
import {__dirname} from "../../app.mjs";


dotenv.config();

function normalizeDate(raw) {
  if (!raw) return "";
  let [d, m, y] = (raw + "").split(/[\/\-]/).map(s => s.trim());
  if (!d || !m || !y) return raw;
  if (y.length === 2) {
    const yNum = parseInt(y, 10);
    y = yNum < 30 ? "20" + y : "19" + y; // 00-29 => 2000+, else 1900+
  }
  // Pad month and day
  if (d.length === 1) d = "0" + d;
  if (m.length === 1) m = "0" + m;
  return `${y}-${m}-${d}`;
}

// --- Helpers for the assembly-register Excel import (اللائحة/الجمعية العمومية) ---
const NAME_TITLES = new Set(["الشيخ", "السيد", "الدكتور", "الاستاذ", "الأستاذ", "المهندس", "الحاج", "المكرم", "معالي", "سعادة", "د", "م", "أ"]);
// Split an Arabic full name into [first, second, third, tribe], بن/ابن aware.
function splitArabicName(raw) {
  if (!raw) return ["", "", "", ""];
  let toks = ("" + raw).replace(/[\/.]/g, " ").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  while (toks.length && NAME_TITLES.has(toks[0])) toks.shift();
  if (!toks.length) return ["", "", "", ""];
  const first = toks[0];
  const tribe = toks.length > 1 ? toks.pop() : "";
  const rest = toks.slice(1);
  const take = () => {
    if (rest.length >= 2 && (rest[0] === "بن" || rest[0] === "ابن")) return rest.splice(0, 2).join(" ");
    if (rest.length) return rest.shift();
    return "";
  };
  const second = take();
  const third = take();
  const cap = (s) => (s || "").slice(0, 20);
  return [cap(first), cap(second), cap(third), cap(tribe)];
}
// Only return a date the DB will accept; anything else → null (so a bad
// value never fails the whole insert). Bare years become YYYY-01-01.
function _validDate(y, m, d) {
  const yi = parseInt(y, 10), mi = parseInt(m, 10), di = parseInt(d, 10);
  if (!(yi >= 1300 && yi <= 2100)) return null;
  if (!(mi >= 1 && mi <= 12)) return null;
  if (!(di >= 1 && di <= 31)) return null;
  const pad = (n) => ("0" + n).slice(-2);
  return `${yi}-${pad(mi)}-${pad(di)}`;
}
function toDateOnly(raw) {
  if (raw === null || raw === undefined) return null;
  let s = ("" + raw).replace(/[مهـ]/g, "").trim();
  if (!s) return null;
  if (/[\/\-]/.test(s)) {
    const p = s.split(/[\/\-]/).map((x) => x.trim()).filter(Boolean);
    if (p.length >= 3) {
      let y, m, d;
      if (p[0].length === 4) { [y, m, d] = p; } else { [d, m, y] = p; }
      if (/^\d{2}$/.test(y)) { const n = parseInt(y, 10); y = n < 30 ? "20" + y : "19" + y; }
      if (!/^\d{4}$/.test(y)) return null;
      return _validDate(y, m, d);
    }
  }
  let m4 = s.match(/^(\d{4})$/); if (m4) return _validDate(m4[1], 1, 1);
  let m2 = s.match(/^(\d{2})$/); if (m2) { const n = parseInt(m2[1], 10); return _validDate(`${n < 30 ? "20" : "19"}${m2[1]}`, 1, 1); }
  return null;
}
const ASSEMBLY_TYPES = { "عامل": "عامل", "منتسب": "منتسب", "منتنسب": "منتسب", "نتسب": "منتسب", "انتساب": "منتسب", "رائد": "رائد", "رياضي": "رياضي" };
function normAssemblyType(v) {
  if (v === null || v === undefined) return null;
  const s = ("" + v).trim();
  if (!s) return null;
  return ASSEMBLY_TYPES[s] || (s.length <= 20 ? s : null);
}
function cleanPhone(v) {
  if (v === null || v === undefined) return null;
  const s = ("" + v).trim();
  if (!/\d/.test(s)) return null; // drop non-numeric junk (e.g. "متوفي")
  return s.slice(0, 20);
}
// Find a column index by any of the accepted header labels.
function findHeaderCol(headerRow, names) {
  for (const n of names) {
    const i = headerRow.findIndex((h) => ("" + (h ?? "")).trim() === n);
    if (i >= 0) return i;
  }
  return -1;
}

const {Op, col} = sequelize;

export const resolvers = {
    Query: {
        club: async (obj, {id}, context, info) =>  {
            try {
                return await Club.findByPk(id)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allClub: async (obj, {}, context, info) =>  {
            try {
                return await Club.findAll()
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        }
    },

    Club: {
        admin: async ({id}, {}, context, info) =>  {
            try {
                return await User.findOne({
                    include: {
                        model: Person,
                        as: "person",
                        required: true,
                        right: true,
                        include: {
                            model: ClubManagement,
                            as: "club_management",
                            required: true,
                            right: true,
                            where: {
                                id_club: id
                            }
                        }
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        teams: async ({id}, {}, context, info) =>  {
            try {
                return await Team.findAll({
                    where: {
                        id_club: id
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
    },

    Mutation: {
uploadPlayersSheet: async (obj, { file, teamId }, context, info) => {
  try {
    const { user, isAuth } = context;
    if (!isAuth || !user) throw new ApolloError("Authentication required", "UNAUTHENTICATED");
    if (!file) throw new ApolloError("لم يتم رفع أي ملف", "NO_FILE");
    if (!teamId) throw new ApolloError("لم يتم اختيار الفريق", "NO_TEAM");

    const { createReadStream } = await file;
    const stream = createReadStream();
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: false });

    // Locate the header row (must contain a name column of some kind).
    let headerIdx = -1;
    for (let i = 0; i < Math.min(rows.length, 15); i++) {
      const r = (rows[i] || []).map((c) => ("" + (c ?? "")).trim());
      if (r.includes("الاسم") || r.includes("اسم العضو") || r.includes("الاسم الكامل") || r.includes("الاسم الأول")) { headerIdx = i; break; }
    }
    if (headerIdx === -1) throw new ApolloError('لم يتم العثور على صف العناوين (يجب أن يحتوي عمود "الاسم").', "NO_HEADER");
    const header = (rows[headerIdx] || []).map((c) => ("" + (c ?? "")).trim());

    const idxFull   = findHeaderCol(header, ["الاسم", "اسم العضو", "الاسم الكامل"]);
    const idxFirst  = findHeaderCol(header, ["الاسم الأول"]);
    const idxSecond = findHeaderCol(header, ["الاسم الثاني"]);
    const idxThird  = findHeaderCol(header, ["الاسم الثالث"]);
    const idxTribe  = findHeaderCol(header, ["القبيلة"]);
    const idxCivil  = findHeaderCol(header, ["الرقم المدني"]);
    const idxBirth  = findHeaderCol(header, ["تاريخ الميلاد"]);
    const idxPhone  = findHeaderCol(header, ["رقم الهاتف", "الهاتف", "رقم الاتف", "الجوال", "رقم الجوال"]);
    if (idxFull === -1 && idxFirst === -1) throw new ApolloError('لم يتم العثور على عمود "الاسم" في الملف.', "NO_NAME_COL");

    const cap = (v, n) => ("" + (v ?? "")).trim().slice(0, n);
    const val = (row, idx) => (idx >= 0 && row[idx] !== undefined && row[idx] !== null ? ("" + row[idx]).trim() : "");

    // Rows with no civil id can't be deduped by card_number, so match them on the
    // full name of the players already in this team — otherwise re-importing the
    // same file creates a fresh copy of every id-less row.
    const nameKey = (a, b, c, d) =>
      [a, b, c, d].map((x) => ("" + (x ?? "")).replace(/\s+/g, " ").trim()).join("|");
    const teamPlayers = await Players.findAll({
      where: { id_team: teamId },
      include: { model: Person, required: true },
    });
    const existingNames = new Set(
      teamPlayers
        .filter((p) => !p.person?.card_number)
        .map((p) => nameKey(p.person?.first_name, p.person?.second_name, p.person?.third_name, p.person?.tribe))
    );

    // Skip civil ids already present so re-runs don't duplicate people.
    let created = 0, duplicates = 0, failed = 0, total = 0;

    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row = rows[i] || [];
      // Resolve name parts: prefer explicit split columns, else split the full name.
      let first_name, second_name, third_name, tribe;
      if (idxFirst >= 0) {
        first_name = cap(val(row, idxFirst), 20); second_name = cap(val(row, idxSecond), 20);
        third_name = cap(val(row, idxThird), 20); tribe = cap(val(row, idxTribe), 20);
      } else {
        [first_name, second_name, third_name, tribe] = splitArabicName(val(row, idxFull));
      }
      const civil = cap(val(row, idxCivil), 50) || null;
      if (!first_name && !civil) continue; // empty row
      total++;

      if (civil) {
        const exists = await Person.findOne({ where: { card_number: civil } });
        if (exists) { duplicates++; continue; }
      } else if (existingNames.has(nameKey(first_name, second_name, third_name, tribe))) {
        duplicates++; continue;
      }

      try {
        const person = await Person.create({
          first_name: first_name || "", second_name: second_name || "", third_name: third_name || "", tribe: tribe || "",
          card_number: civil,
          phone: cap(cleanPhone(val(row, idxPhone)) || "", 15),
          date_birth: (toDateOnly(val(row, idxBirth)) || ""),
        });
        await Players.create({ id_person: person.id, id_team: teamId, activity: "", player_center: "", job: "", type: "internal" });
        created++;
      } catch (rowErr) {
        logger.error(`uploadPlayersSheet row failed: ${rowErr.message}`);
        failed++;
      }
    }

    logger.info(`uploadPlayersSheet: created ${created}, duplicates ${duplicates}, failed ${failed}, total ${total}`);
    return {
      numberOfPersonCreated: created,
      numberOfPersonRefused: duplicates + failed,
      created, duplicates, failed, total,
    };
  } catch (error) {
    logger.error(`uploadPlayersSheet error: ${error?.message}`);
    throw new ApolloError(error?.message || "خطأ أثناء معالجة الملف", "PLAYERS_SHEET_FAILED");
  }
}


,
        uploadAssemblySheet: async (obj, { file, idClub }, context, info) => {
            try {
                const { user, isAuth } = context;
                if (!isAuth || !user) throw new ApolloError("Authentication required", "UNAUTHENTICATED");
                if (!file) throw new ApolloError("لم يتم رفع أي ملف", "NO_FILE");

                // A club admin (role "2") is scoped to their own club.
                let targetClubId = idClub;
                if (user.role === "2") {
                    const cm = await ClubManagement.findOne({ where: { id_person: user.id_person } });
                    if (cm) targetClubId = cm.id_club;
                }
                if (!targetClubId) throw new ApolloError("لم يتم تحديد النادي", "NO_CLUB");

                const { createReadStream } = await file;
                const stream = createReadStream();
                const chunks = [];
                for await (const chunk of stream) chunks.push(chunk);
                const buffer = Buffer.concat(chunks);

                const workbook = xlsx.read(buffer, { type: "buffer" });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: false });

                // Locate the header row (must contain a name column).
                let headerIdx = -1;
                for (let i = 0; i < Math.min(rows.length, 15); i++) {
                    const r = (rows[i] || []).map((c) => ("" + (c ?? "")).trim());
                    if (r.includes("الاسم") || r.includes("اسم العضو") || r.includes("الاسم الكامل")) { headerIdx = i; break; }
                }
                if (headerIdx === -1) throw new ApolloError('لم يتم العثور على صف العناوين (يجب أن يحتوي على عمود "الاسم").', "NO_HEADER");
                const header = (rows[headerIdx] || []).map((c) => ("" + (c ?? "")).trim());

                const idxName  = findHeaderCol(header, ["الاسم", "اسم العضو", "الاسم الكامل"]);
                const idxMem   = findHeaderCol(header, ["رقم العضوية"]);
                const idxCivil = findHeaderCol(header, ["الرقم المدني"]);
                const idxBirth = findHeaderCol(header, ["تاريخ الميلاد"]);
                const idxPhone = findHeaderCol(header, ["رقم الهاتف", "الهاتف", "رقم الاتف", "الجوال", "رقم الجوال"]);
                const idxType  = findHeaderCol(header, ["نوع العضوية"]);
                const idxJoin  = findHeaderCol(header, ["تاريخ الانتساب"]);
                if (idxName === -1) throw new ApolloError('لم يتم العثور على عمود "الاسم" في الملف.', "NO_NAME_COL");

                // Preload existing keys for this club to skip duplicates on re-import.
                const existing = await Assembly.findAll({ where: { id_club: targetClubId }, attributes: ["membership_number", "card_number"], paranoid: false });
                const seen = new Set();
                for (const e of existing) {
                    if (e.membership_number) seen.add("m:" + ("" + e.membership_number).trim());
                    if (e.card_number) seen.add("c:" + ("" + e.card_number).trim());
                }

                const val = (row, idx) => (idx >= 0 && row[idx] !== undefined && row[idx] !== null ? ("" + row[idx]).trim() : "");
                const records = [];
                let totalRows = 0, duplicates = 0, skipped = 0;

                for (let i = headerIdx + 1; i < rows.length; i++) {
                    const row = rows[i] || [];
                    const name = val(row, idxName);
                    if (!name) continue;
                    totalRows++;

                    const memnum = val(row, idxMem);
                    const civil = val(row, idxCivil);
                    const keyM = memnum ? "m:" + memnum : null;
                    const keyC = civil ? "c:" + civil : null;
                    if ((keyM && seen.has(keyM)) || (keyC && seen.has(keyC))) { duplicates++; continue; }
                    if (keyM) seen.add(keyM);
                    if (keyC) seen.add(keyC);

                    const [first_name, second_name, third_name, tribe] = splitArabicName(name);
                    const membership_date = toDateOnly(val(row, idxJoin));
                    records.push({
                        first_name, second_name, third_name, tribe,
                        card_number: civil || null,
                        membership_number: memnum || null,
                        phone: cleanPhone(val(row, idxPhone)),
                        date_birth: toDateOnly(val(row, idxBirth)),
                        type: normAssemblyType(val(row, idxType)),
                        membership_date,
                        subscription_date: membership_date,
                        gender: "male",
                        id_club: targetClubId,
                    });
                }

                let created = 0;
                const CHUNK = 500;
                for (let i = 0; i < records.length; i += CHUNK) {
                    const slice = records.slice(i, i + CHUNK);
                    try {
                        const res = await Assembly.bulkCreate(slice, { validate: false });
                        created += res.length;
                    } catch (e) {
                        for (const rec of slice) {
                            try { await Assembly.create(rec); created++; } catch (_) { skipped++; }
                        }
                    }
                }

                return {
                    created,
                    skipped,
                    duplicates,
                    totalRows,
                    message: `تم استيراد ${created} عضو في الجمعية العمومية`
                        + (duplicates ? ` — تم تخطّي ${duplicates} مكرّر` : "")
                        + (skipped ? ` — تعذّر إدخال ${skipped}` : ""),
                };
            } catch (error) {
                logger.error(`uploadAssemblySheet error: ${error?.message}`);
                throw new ApolloError(error?.message || "خطأ أثناء معالجة الملف", "ASSEMBLY_SHEET_FAILED");
            }
        },
        createClub: async (obj, {content}, context, info) =>  {
            try {
                let club = await Club.create({
                    name:           content.name,
                    governorate:    content.governorate,
                    phone:          content.phone
                })
                let imgUniqName = "";

                if (club && content.logo) {
                    const listType = ["JPEG", "JPG", "PNG"]

                    const { createReadStream, filename, mimetype, encoding } = await content.logo;

                    const imgType = filename.split(".")[filename.split(".").length-1].toUpperCase()

                    const isImage = listType.indexOf(imgType) !== -1

                    if(!isImage) { return new ApolloError("This file is not image") }

                    imgUniqName = `${UUID()}.${imgType}`;
                    const pathName = path.join(__dirname,   `./../uploads/${imgUniqName}`);

                    const stream = createReadStream();
                    await stream.pipe( createWriteStream(pathName) );

                    await Club.update({logo: imgUniqName}, { where: { id: club.id } })
                }

                return {
                    ...club.dataValues,
                    logo: imgUniqName
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        updateClub: async (obj, {id, content}, context, info) =>  {
            try {
                let result = null;

                if (content.account_status !== null && content.account_status !== undefined) {
                    result = await Club.update({
                        name:           content.name,
                        governorate:    content.governorate,
                        phone:          content.phone,
                        account_status: content.account_status
                    }, { where: { id } })
                } else {
                    result = await Club.update({
                        name:           content.name,
                        governorate:    content.governorate,
                        phone:          content.phone
                    }, { where: { id } })
                }

                if (content && "logo" in content && content.logo) {
                    const listType = ["JPEG", "JPG", "PNG"]

                    const { createReadStream, filename, mimetype, encoding } = await content.logo;

                    const imgType = filename.split(".")[filename.split(".").length-1].toUpperCase()

                    const isImage = listType.indexOf(imgType) !== -1

                    if(!isImage) { return new ApolloError("This file is not image") }

                    const imgUniqName = `${UUID()}.${imgType}`;
                    const pathName = path.join(__dirname,   `./../uploads/${imgUniqName}`);

                    const stream = createReadStream();
                    await stream.pipe( createWriteStream(pathName) );

                    await Club.update({logo: imgUniqName}, { where: { id } })
                }

                return {
                    status: result[0] === 1
                }
            } catch (error) {
                console.log(error)
                logger.error("")
                throw new ApolloError(error)
            }
        },

        deleteClub: async (obj, {id}, context, info) =>  {
            try {
                const club = await Club.destroy({ where: { id } })

                return {
                    status: club === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
    }
}
