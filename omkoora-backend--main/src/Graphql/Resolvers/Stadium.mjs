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
        availableTimeSlots: async (obj, { idStadium, booking_date }, context, info) => {
            try {
              // Get the stadium's working hours (start_time and end_time)
              const stadium = await Stadium.findByPk(idStadium);
              if (!stadium) {
                throw new ApolloError("Stadium not found", "STADIUM_NOT_FOUND");
              }
          
              // Parse the start and end time for the stadium as dayjs objects
              const startTime = dayjs(`${booking_date} ${stadium.start_time}`, "YYYY-MM-DD HH:mm:ss");
              const endTime = dayjs(`${booking_date} ${stadium.end_time}`, "YYYY-MM-DD HH:mm:ss");
          
              // Fetch existing reservations for the given stadium and booking date
              const reservations = await Reservations.findAll({
                where: {
                  id_stadium: idStadium,
                  booking_date: booking_date
                },
                order: [['booking_start', 'ASC']] // Ensure reservations are sorted by start time
              });
          
          
              // Generate all time slots (e.g., every 1 hour) between start and end time
              const availableSlots = [];
              let currentTime = startTime;
          
              // Generate slots every 1 hour from start_time to end_time
              while (currentTime.add(1, 'hour').isBefore(endTime) || currentTime.isSame(endTime)) {
                availableSlots.push(currentTime.format("HH:mm"));
                currentTime = currentTime.add(1, 'hour');
              }
          
          
              // Filter out the slots that are already reserved
              reservations.forEach((reservation, index) => {
          
                // Combine booking_date with the time to create a valid date-time string for parsing
                const reservedStart = dayjs(`${booking_date} ${reservation.booking_start}`, "YYYY-MM-DD HH:mm:ss");
                const reservedEnd = dayjs(`${booking_date} ${reservation.booking_end}`, "YYYY-MM-DD HH:mm:ss");
          
                // Debugging invalid dates
                if (!reservedStart.isValid() || !reservedEnd.isValid()) {
                  //console.log(`Invalid reservation times detected for reservation ${index + 1}.`);
                  return;
                }
          
                // Remove any slot that falls between the reserved times by manually comparing
                for (let i = availableSlots.length - 1; i >= 0; i--) {
                  const slotTime = dayjs(`${booking_date} ${availableSlots[i]}`, "YYYY-MM-DD HH:mm");
          
                  // Manually compare slotTime to check if it overlaps with the reserved time
                  if (slotTime.isValid() && 
                      (slotTime.isSame(reservedStart) || 
                       slotTime.isAfter(reservedStart)) && 
                      (
                       slotTime.isBefore(reservedEnd))) {
                    console.log(`Slot ${availableSlots[i]} is reserved and will be removed.`);
                    availableSlots.splice(i, 1); // Remove the unavailable slot
                  }
                }
              });
          
          
              return availableSlots;
            } catch (error) {
              console.error(error);
              throw new ApolloError("Error fetching available time slots", "TIME_SLOT_ERROR");
            }
          }
          
          
          
          
          
          
    },

    Stadium: {
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
