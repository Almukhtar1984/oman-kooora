import { ApolloError } from 'apollo-server-express';
import sequelize from 'sequelize';
import dotenv from 'dotenv'
import path from "path";
import { v4 as UUID } from 'uuid';
import xlsx from 'xlsx';
import fs from 'fs';
import logger from "../../Config/logger.mjs";;
import {Club, ClubManagement, Members, Person, Team, User, Players} from '../../Models/index.mjs';
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
    if (!file) throw new ApolloError("لم يتم رفع أي ملف", "NO_FILE");
    if (!teamId) throw new ApolloError("لم يتم اختيار الفريق", "NO_TEAM");

    const { createReadStream } = await file;
    const stream = createReadStream();
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const sheetArr = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: false });

    // Find header row index (look for "اسم العضو")
    let headerRowIdx = -1;
    for (let i = 0; i < sheetArr.length; i++) {
      if (sheetArr[i].includes("اسم العضو")) {
        headerRowIdx = i;
        break;
      }
    }
    if (headerRowIdx === -1) throw new ApolloError("لم يتم العثور على صف العناوين الصحيح في الملف.");

    // Map columns to keys
    const headerRow = sheetArr[headerRowIdx];
    const idxMemberName = headerRow.indexOf("اسم العضو");
    const idxCivilId = headerRow.indexOf("الرقم المدني");
    const idxBirthDate = headerRow.indexOf("تاريخ الميلاد");
    const idxClubName = headerRow.indexOf("اسم النادي");

    // Build data rows under header
    const dataRows = [];
    for (let i = headerRowIdx + 1; i < sheetArr.length; i++) {
      const row = sheetArr[i];
      if (!row || row.length === 0) continue;
      dataRows.push({
        memberName: row[idxMemberName] || "",
        civilId: row[idxCivilId] || "",
        birthDate: row[idxBirthDate] || "",
        clubName: row[idxClubName] || ""
      });
    }

    let created = 0;
    let refused = 0;

    for (const row of dataRows) {
      const civilId = (row.civilId || "").trim();
      if (!civilId) continue;

      // 1. Check if الرقم المدني exists in Person
      const personExists = await Person.findOne({ where: { card_number: civilId } });
      if (personExists) {
        refused++;
        continue;
      }

      // 2. Split name
      const nameRaw = (row.memberName || "").trim();
      let [first_name = "", second_name = "", third_name = "", tribe = ""] = nameRaw.split(" ");
      [first_name, second_name, third_name, tribe] = [first_name, second_name, third_name, tribe].map(x => x || "");

      // 3. Create new Person
      const newPerson = await Person.create({
        first_name,
        second_name,
        third_name,
        tribe,
        card_number: civilId,
        phone: "",
        date_birth: normalizeDate(row.birthDate),
      });

      // 4. Create Player for that person
      await Players.create({
        id_person: newPerson.id,
        id_team: teamId,
        activity: "",
        player_center: "",
        job: "",
        type: "internal",
      });

      created++;
    }

    return {
      numberOfPersonCreated: created,
      numberOfPersonRefused: refused
    };

  } catch (error) {
    console.error(error);
    throw new ApolloError(error?.message || "خطأ أثناء معالجة الملف");
  }
}


,
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
