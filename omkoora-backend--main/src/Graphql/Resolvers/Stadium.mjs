import { ApolloError } from 'apollo-server-express';
import sequelize from 'sequelize';
import dotenv from 'dotenv'

import logger from "../../Config/logger.mjs";
import dayjs from 'dayjs';
import {Club, Team, Stadium, Reservations, User, Notification, Permission} from '../../Models/index.mjs';
import {hashPassword, alreadyExistUser} from "../../Helpers/index.mjs";
import {sendPushToUser} from "../../Config/firebase.mjs";
import {v4 as UUID} from "uuid";

const STADIUM_OWNER_ROLE = "6";
const SUPER_ADMIN_ROLE = "1";
const FULL_GRANT = "1,2,3,4,5,6,7,8,9,10";

// A stadium owner (role 6) may only modify/delete a stadium they own.
// Other authenticated roles (team/club/super-admin) are left as-is.
const assertOwnsStadium = async (context, stadiumId) => {
    const u = context?.user;
    if (u && u.role === STADIUM_OWNER_ROLE) {
        const st = await Stadium.findByPk(stadiumId, { attributes: ["id", "id_user"] });
        if (!st || st.id_user !== u.id) {
            throw new ApolloError("غير مصرّح: هذا الملعب ليس ملكك", "FORBIDDEN");
        }
    }
};

// Parse "HH:MM" or "HH:MM:SS" (DB TIME values come back with seconds) to
// minutes since midnight (null if invalid).
const toMinutes = (t) => {
    const m = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(String(t || "").trim());
    if (!m) return null;
    return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
};
import path from "path";
import {__dirname} from "../../app.mjs";
import {createWriteStream} from "fs";
import {bookingPrice, buildTimeSlots, durationMinutes} from "../../Helpers/timeSlots.mjs";

dotenv.config();

const {Op, col} = sequelize;

export const resolvers = {
    Query: {
        stadium: async (obj, {id}, context, info) =>  {
            try {
                return await Stadium.findByPk(id)
            } catch (error) {
                logger.error(`Stadium.stadium: ${error?.message || error}`)
                throw new ApolloError(error)
            }
        },

        allStadiumsTeam: async (obj, {idTeam}, context, info) =>  {
            if (!idTeam) return []   // team-scoped: no team → no rows (avoids the undefined-where crash)
            try {
                return await Stadium.findAll({
                    where: {
                        id_team: idTeam
                    }
                })
            } catch (error) {
                logger.error(`Stadium.allStadiumsTeam: ${error?.message || error}`)
                throw new ApolloError(error)
            }
        },

        allStadiums: async (obj, {idTeam}, context, info) =>  {
            try {
                return await Stadium.findAll()
            } catch (error) {
                logger.error(`Stadium.allStadiums: ${error?.message || error}`)
                throw new ApolloError(error)
            }
        },

        // Stadium-owner dashboard: the signed-in owner's own stadiums.
        myStadiums: async (obj, {}, context, info) =>  {
            try {
                const user = context?.user
                if (!context?.isAuth || !user) return []
                return await Stadium.findAll({ where: { id_user: user.id } })
            } catch (error) {
                logger.error(`myStadiums: ${error?.message}`)
                throw new ApolloError(error)
            }
        },

        // Bookings across all of the signed-in owner's stadiums.
        myStadiumReservations: async (obj, {}, context, info) =>  {
            try {
                const user = context?.user
                if (!context?.isAuth || !user) return []
                const stadiums = await Stadium.findAll({ where: { id_user: user.id }, attributes: ["id"], raw: true })
                const ids = stadiums.map((s) => s.id)
                if (ids.length === 0) return []
                return await Reservations.findAll({ where: { id_stadium: { [Op.in]: ids } }, order: [["createdAt", "DESC"]] })
            } catch (error) {
                logger.error(`myStadiumReservations: ${error?.message}`)
                throw new ApolloError(error)
            }
        },

        allReservations: async (obj, {idStadium}, context, info) =>  {
            try {
                return await Reservations.findAll({
                    where: {
                        id_stadium: idStadium
                    }
                })
            } catch (error) {
                logger.error(`Stadium.allReservations: ${error?.message || error}`)
                throw new ApolloError(error)
            }
        },
        reservationsByTeam: async (obj, { idTeam }, context, info) => {
            try {
                // Find all stadiums where the team ID matches
                const stadiums = await Stadium.findAll({
                    where: { id_team: idTeam },
                    attributes: ['id'],  // Only fetch the ID of the stadiums
                });

                // Extract the stadium IDs
                const stadiumIds = stadiums.map(stadium => stadium.id);

                // Find all reservations for the extracted stadiums
                const reservations = await Reservations.findAll({
                    where: {
                        id_stadium: {
                            [Op.in]: stadiumIds,  // Use IN operator to match any of the stadiums
                        },
                    }
                    
                });

                return reservations;
            } catch (error) {
                console.error(error);
                throw new ApolloError("Error fetching reservations by team", "RESERVATION_FETCH_FAILED");
            }
        },
        // Every slot of the day with its state and price — the mobile app greys
        // out the taken ones instead of only listing the free times.
        availableTimeSlots: async (obj, { idStadium, booking_date }) => {
            try {
                const stadium = await Stadium.findByPk(idStadium);
                if (!stadium) {
                    throw new ApolloError("Stadium not found", "STADIUM_NOT_FOUND");
                }

                const reservations = await Reservations.findAll({
                    where: { id_stadium: idStadium, booking_date },
                    order: [["booking_start", "ASC"]],
                });

                return buildTimeSlots(stadium, reservations);
            } catch (error) {
                logger.error(`availableTimeSlots: ${error?.message}`);
                throw new ApolloError("Error fetching available time slots", "TIME_SLOT_ERROR");
            }
        },
    },

    Stadium: {
        // Falls back to the slot length the generator uses.
        min_booking_minutes: ({ min_booking_minutes }) => min_booking_minutes || 60,
        team: async ({id_team}, {}, context, info) =>  {
            try {
                return await Team.findByPk(id_team)
            } catch (error) {
                logger.error(`Stadium.team: ${error?.message || error}`)
                throw new ApolloError(error)
            }
        },
        owner: async ({id_user}, {}, context, info) =>  {
            try {
                return id_user ? await User.findByPk(id_user) : null
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        }
    },

    Reservations: {
        stadium: async ({id_stadium}, {}, context, info) =>  {
            try {
                return await Stadium.findByPk(id_stadium)
            } catch (error) {
                logger.error(`Stadium.stadium: ${error?.message || error}`)
                throw new ApolloError(error)
            }
        },
        // Derived — nothing extra is stored on the booking itself.
        duration_minutes: ({ booking_start, booking_end }) =>
            durationMinutes(booking_start, booking_end),
        total_price: async ({ id_stadium, booking_start, booking_end }) => {
            try {
                const minutes = durationMinutes(booking_start, booking_end);
                if (minutes === null) return null;
                const stadium = await Stadium.findByPk(id_stadium);
                return bookingPrice(stadium?.rent, minutes);
            } catch (error) {
                logger.error(`total_price: ${error?.message}`);
                return null;
            }
        }
    },

    Mutation: {
        // Super-admin provisions a stadium-owner login (role 6). If the email
        // already belongs to a role-6 account, its password is reset instead.
        provisionStadiumOwner: async (obj, {email, password}, context, info) =>  {
            try {
                const caller = context?.user
                if (!context?.isAuth || !caller) return new ApolloError("Authentication required", "AUTH_REQUIRED")
                if (caller.role !== SUPER_ADMIN_ROLE) {
                    return new ApolloError("غير مصرّح: السوبر أدمن فقط", "FORBIDDEN")
                }
                const normalizedEmail = String(email || "").trim().toLowerCase()
                if (!normalizedEmail) return new ApolloError("البريد مطلوب", "EMAIL_REQUIRED")
                if (!password || password.length < 6) return new ApolloError("كلمة المرور قصيرة جدًا", "PASSWORD_TOO_SHORT")

                const existing = await User.findOne({ where: { email: normalizedEmail } })
                if (existing) {
                    if (existing.role !== STADIUM_OWNER_ROLE) {
                        return new ApolloError("البريد مستخدم لحساب آخر", "EMAIL_TAKEN")
                    }
                    existing.password = await hashPassword(password)
                    existing.activation = true
                    existing.email_verify = true
                    await existing.save()
                    return existing
                }

                const user = await User.create({
                    email: normalizedEmail,
                    password: await hashPassword(password),
                    role: STADIUM_OWNER_ROLE,
                    activation: true,
                    email_verify: true,
                })
                // Seed a full permission row so the owner dashboard renders.
                await Permission.create({ id_user: user.id, teams: FULL_GRANT })
                return user
            } catch (error) {
                logger.error(`provisionStadiumOwner: ${error?.message}`)
                throw new ApolloError(error)
            }
        },

        createStadium: async (obj, {content}, context, info) =>  {
            try {
                // A stadium owner (role 6) can only create stadiums owned by
                // themselves — never assign to another owner/team.
                if (context?.user?.role === STADIUM_OWNER_ROLE) {
                    content = { ...content, id_user: context.user.id, id_team: null }
                }
                const images = await content.images;
                delete content.images

                let stadium = await Stadium.create({...content, image: ""})

                if (stadium && images && images.length > 0) {
                    const listType = ["JPEG", "JPG", "PNG"]
                    let imagesUpload = [];

                    for (let i = 0; i < images.length; i++) {
                        const { createReadStream, filename, mimetype, encoding } = await images[i];

                        const imgType = filename.split(".")[filename.split(".").length-1].toUpperCase()

                        const isImage = listType.indexOf(imgType) !== -1

                        if(!isImage) { return new ApolloError("This file is not image") }

                        const imgUniqName = `${UUID()}.${imgType}`;
                        const pathName = path.join(__dirname,   `./../uploads/${imgUniqName}`);

                        const stream = createReadStream();
                        await stream.pipe( createWriteStream(pathName) );

                        imagesUpload.push(imgUniqName)
                    }

                    await Stadium.update({images: imagesUpload.join(",")}, {where: {id: stadium.id}})
                }

                return stadium
            } catch (error) {
                console.log(error)
                // logger.error(`Stadium.createStadium: ${error?.message || error}`)
                throw new ApolloError(error)
            }
        },

        updateStadium: async (obj, {id, content}, context, info) =>  {
            try {
                await assertOwnsStadium(context, id)
                const images = await content.images;
                delete content.images
                // Owners cannot reassign a stadium away from themselves.
                if (context?.user?.role === STADIUM_OWNER_ROLE) {
                    delete content.id_user; delete content.id_team
                }

                let result = await Stadium.update({...content}, { where: { id } })

                if (images && images.length > 0) {
                    const listType = ["JPEG", "JPG", "PNG"]
                    let imagesUpload = [];

                    for (let i = 0; i < images.length; i++) {
                        const { createReadStream, filename, mimetype, encoding } = await images[i];

                        const imgType = filename.split(".")[filename.split(".").length-1].toUpperCase()

                        const isImage = listType.indexOf(imgType) !== -1

                        if(!isImage) { return new ApolloError("This file is not image") }

                        const imgUniqName = `${UUID()}.${imgType}`;
                        const pathName = path.join(__dirname,   `./../uploads/${imgUniqName}`);

                        const stream = createReadStream();
                        await stream.pipe( createWriteStream(pathName) );

                        imagesUpload.push(imgUniqName)
                    }

                    await Stadium.update({images: imagesUpload.join(",")}, {where: {id}})
                }

                return {
                    status: result[0] === 1
                }
            } catch (error) {
                logger.error(`Stadium.updateStadium: ${error?.message || error}`)
                throw new ApolloError(error)
            }
        },

        deleteStadium: async (obj, {id}, context, info) =>  {
            try {
                await assertOwnsStadium(context, id)
                const meeting = await Stadium.destroy({ where: { id } })

                return {
                    status: meeting === 1
                }
            } catch (error) {
                logger.error(`Stadium.deleteStadium: ${error?.message || error}`)
                throw new ApolloError(error)
            }
        },

        createReservations: async (obj, { content }, context, info) => {
         
              // Find existing reservations for the same stadium and booking date
              const reservations = await Reservations.findAll({
                where: {
                  id_stadium: content.id_stadium, // Matching the stadium
                  booking_date: content.booking_date, // Matching the date
                }
              });
          
              // Check if there are any overlapping reservations
              /*if (reservations.length > 0) {
                for (const element of reservations) {
                  // Log the raw booking start and end times
                  console.log("Raw booking start: ", content.booking_start);
                  console.log("Raw booking end: ", content.booking_end);
              
                  // Validate if the booking times are in correct format
                  const isValidStartTime = /^\d{2}:\d{2}$/.test(content.booking_start);
                  const isValidEndTime = /^\d{2}:\d{2}$/.test(content.booking_end);
              
                  if (!isValidStartTime || !isValidEndTime) {
                    return new ApolloError("Invalid booking times format", "INVALID_TIME_FORMAT");
                  }
              
                  // Combine the time with a date
                  const today = dayjs().format("YYYY-MM-DD");
                  const newStart = dayjs(`${today} ${content.booking_start}`);
                  const newEnd = dayjs(`${today} ${content.booking_end}`);
              
                  console.log("========================");
                  console.log("New Start:", newStart.format()); // Log formatted date
                  console.log("New End:", newEnd.format()); // Log formatted date
                  console.log("=======================");
              
                  // Convert existing times to dayjs objects for comparison
                  const existingStart = dayjs(`${today} ${element.booking_start}`);
                  const existingEnd = dayjs(`${today} ${element.booking_end}`);
              
                  console.log("========================");
                  console.log("Old Start:", existingStart.format()); // Log formatted date
                  console.log("Old End:", existingEnd.format()); // Log formatted date
                  console.log("=======================");
              
                  // Check for overlaps
                  const isStartOverlap = newStart.isBetween(existingStart, existingEnd, null, '[]');
                  const isEndOverlap = newEnd.isBetween(existingStart, existingEnd, null, '[]');
              
                  // If either start or end overlaps, throw an error
                  if (isStartOverlap || isEndOverlap) {
                    return new ApolloError("This time is reserved", "TIME_IS_RESERVED");
                  }
                }
              }*/
              
              
          
              // Prevent double-booking: reject if the requested slot overlaps an
              // existing ACTIVE (non-cancelled) reservation on the same stadium/date.
              const ns = toMinutes(content.booking_start);
              const ne = toMinutes(content.booking_end);
              if (ns !== null && ne !== null && ne > ns) {
                  const clash = reservations.some((r) => {
                      if (r.status === "cancel") return false;
                      const es = toMinutes(r.booking_start);
                      const ee = toMinutes(r.booking_end);
                      if (es === null || ee === null) return false;
                      return ns < ee && es < ne; // half-open overlap
                  });
                  if (clash) {
                      return new ApolloError("هذا الوقت محجوز بالفعل", "TIME_IS_RESERVED");
                  }
              }

              // Create the reservation
              const newReservation = await Reservations.create({ ...content });

              // Notify the stadium's owner (if the stadium has one) about the new booking.
              try {
                  const stadium = await Stadium.findByPk(content.id_stadium, { attributes: ["id", "name", "id_user"] });
                  if (stadium?.id_user) {
                      const who = content.full_name || content.phone || "عميل";
                      const body = `حجز جديد على ملعب ${stadium.name || ""} من ${who} بتاريخ ${content.booking_date || ""} (${content.booking_start || ""}–${content.booking_end || ""})`;
                      await Notification.create({ body, id_user: stadium.id_user });
                      // Best-effort push (no-op until FIREBASE creds are set).
                      sendPushToUser(stadium.id_user, { title: "حجز جديد", body }).catch(() => {});
                  }
              } catch (notifyErr) {
                  logger.error(`createReservations notify: ${notifyErr?.message}`);
              }

              return newReservation;
          },
        updateReservationStatus: async (_, { id, status }, { db }) => {
           console.log(id)

            try {
                // Find the reservation by ID
                const reservation = await Reservations.findByPk(id);
               
                // Check if the reservation exists
                if (!reservation) {
                  throw new ApolloError("Reservation not found", "RESERVATION_NOT_FOUND");
                }
                
                // Update the status of the reservation
                const result = await Reservations.update(
                  { status }, // Update only the status field
                  { where: { id } } // Find the reservation by id
                );
            
                // Check if the update was successful
                return {
                    status: result[0] === 1
                }
              } catch (error) {

                console.error("Error updating reservation status:", error);
                throw new ApolloError("Error updating reservation status", "STATUS_UPDATE_FAILED", { error });
              }
          },
        deleteReservation: async (obj, {id}, context, info) => {
           

            try {
                const result = await Reservations.destroy({ where: { id } })

                return {
                    status: result === 1
                }
            } catch (error) {
                logger.error(`Stadium.deleteReservation: ${error?.message || error}`)
                throw new ApolloError(error)
            }
            
          },
    }
}
