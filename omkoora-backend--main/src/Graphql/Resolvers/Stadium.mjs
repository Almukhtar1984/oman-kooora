import { ApolloError } from 'apollo-server-express';
import sequelize from 'sequelize';
import dotenv from 'dotenv'

import logger from "../../Config/logger.mjs";
import dayjs from 'dayjs';
import {Club, Team, Stadium, Reservations} from '../../Models/index.mjs';
import {v4 as UUID} from "uuid";
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
                logger.error("")
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
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allStadiums: async (obj, {idTeam}, context, info) =>  {
            try {
                return await Stadium.findAll()
            } catch (error) {
                logger.error("")
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
                logger.error("")
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
                logger.error("")
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
        createStadium: async (obj, {content}, context, info) =>  {
            try {
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
                // logger.error("")
                throw new ApolloError(error)
            }
        },

        updateStadium: async (obj, {id, content}, context, info) =>  {
            try {
                const images = await content.images;
                delete content.images

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
                logger.error("")
                throw new ApolloError(error)
            }
        },

        deleteStadium: async (obj, {id}, context, info) =>  {
            try {
                const meeting = await Stadium.destroy({ where: { id } })

                return {
                    status: meeting === 1
                }
            } catch (error) {
                logger.error("")
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
              
              
          
              // If no overlapping reservations, create a new reservation
              const newReservation = await Reservations.create({ ...content });
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
                logger.error("")
                throw new ApolloError(error)
            }
            
          },
    }
}
