import { ApolloError, AuthenticationError } from 'apollo-server-express';
import sequelize from 'sequelize';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv'
import path from "path";
import { v4 as UUID } from 'uuid';

import logger from "../../Config/logger.mjs";
import {
    refreshCookieOptions,
    refreshCookieName,
    LEGACY_REFRESH_COOKIE,
    getAppKeyFromOrigin,
} from "../../Config/runtime.mjs";

import {AuthToken, createMail, RefreshToken, VerifyToken, sameUserAgent, isExistUser, comparePassword, hashPassword, alreadyExistUser} from '../../Helpers/index.mjs';
import {
    User, Person, Club, Team, ClubManagement, Members, Players, TechnicalApparatus, Permission
} from '../../Models/index.mjs';
import {createWriteStream} from "fs";
import {__dirname} from "../../app.mjs";
import { format as formatDate } from 'date-fns'

dotenv.config();

const { hash, compare } = bcrypt;
const SECRET = process.env.SECRET_JWT

const {Op, col} = sequelize;

const PWD_UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const PWD_LOWER = "abcdefghijkmnpqrstuvwxyz";
const PWD_DIGIT = "23456789";
const generateRandomPassword = (length = 10) => {
    const all = PWD_UPPER + PWD_LOWER + PWD_DIGIT;
    const pick = (pool) => pool[Math.floor(Math.random() * pool.length)];
    const chars = [pick(PWD_UPPER), pick(PWD_LOWER), pick(PWD_DIGIT)];
    while (chars.length < length) chars.push(pick(all));
    return chars.sort(() => Math.random() - 0.5).join("");
};

export const resolvers = {
    Query: {
        user: async (obj, {id}, context, info) =>  {
            try {
                return await User.findByPk(id)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allUser: async (obj, {}, context, info) =>  {
            try {
                return await User.findAll()
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        person: async (obj, {cardNumber}, context, info) =>  {
            try {
                return await Person.findOne({
                    where: {
                        card_number: cardNumber
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        personExternal: async (obj, { cardNumber, phone }, context, info) => {
            try {
              // Check if either cardNumber or phone is provided
              if (!cardNumber && !phone) {
                throw new ApolloError("You must provide either cardNumber or phone to query.");
              }
      
              // Find person based on cardNumber or phone
              const person = await Person.findOne({
                where: {
                  ...(cardNumber && { card_number: cardNumber }),  // Include card_number condition if provided
                  ...(phone && { phone: phone }),  // Include phone condition if provided
                }
              });
      
              // If no person is found, throw an error
              if (!person) {
                throw new ApolloError("There is no person with the provided card number or phone.");
              }
              

      
              // Return the found person
              return person;
      
            } catch (error) {
              logger.error("Error fetching personExternal: ", error);
              throw new ApolloError(error.message);
            }
          },

        currentUser: async (obj, args, {isAuth, user}, info) => {
            try {
                if (isAuth) {
                    return user
                }
                return new AuthenticationError("You must be the authenticated user to get this information")
            } catch (error) {
                logger.error("User file | Query type | get current User function | lines between [ 40 - 50 ]")
                throw new ApolloError(error)
            }
        },

        refreshToken: async (obj, args, context, info) => {
            const { refreshToken, appKey } = context;
            try {
                if (!refreshToken || refreshToken === "") {
                    return null;
                }

                let decodedToken = await VerifyToken(refreshToken);

                if (!decodedToken) {
                    return null;
                }

                // Reject a refresh attempt that uses a cookie issued for a
                // different frontend (cross-app session reuse).
                if (decodedToken.aud && decodedToken.aud !== appKey) {
                    return null;
                }

                let isExist = await isExistUser(decodedToken.id);
                if (!isExist) {
                    return null;
                }

                let token = await AuthToken({id: isExist.id}, undefined, appKey);

                context.res.cookie(refreshCookieName(appKey), refreshToken, refreshCookieOptions);
                // Best-effort cleanup of the pre-split shared cookie so it
                // stops lingering in the browser after a few visits.
                context.res.cookie(LEGACY_REFRESH_COOKIE, '', { ...refreshCookieOptions, maxAge: 0 });

                return {
                    token
                }
            } catch (error) {
                logger.error(`Refresh token error: ${error.message}`)
                return null;
            }
        },
    },

    User: {
        person: async ({id_person}, {}, context, info) =>  {
            try {
                return await Person.findByPk(id_person)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        permission: async ({id}, {}, context, info) =>  {
            try {
                return await Permission.findOne({
                    where: {
                        id_user: id
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
    },

    Person: {
        team: async ({id_team}, {}, context, info) =>  {
            try {
                return await Team.findByPk(id_team)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        member: async ({id}, {}, context, info) =>  {
            try {
                return await Members.findOne({
                    where: {
                        id_person: id
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        player: async ({id}, {}, context, info) =>  {
            try {
                return await Players.findOne({
                    where: {
                        id_person: id
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        technicalApparatus: async ({id}, {}, context, info) =>  {
            try {
                return await TechnicalApparatus.findOne({
                    where: {
                        id_person: id
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        clubManagement: async ({id}, {}, context, info) =>  {
            try {
                return await ClubManagement.findOne({
                    where: {
                        id_person: id
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        user: async ({id}, {}, context, info) =>  {
            try {
                return await User.findOne({
                    where: {
                        id_person: id
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
    },

    Mutation: {
        authenticateUser: async (obj, {content}, context, info) => {
            try {
                const { appKey } = context;

                const user = await User.findOne({
                    where: { email: content.email }
                });

                // User is existed
                if (!user) {
                    return new ApolloError('User not found', 'USER_NOT_EXIST');
                }

                let isMatch = await comparePassword(content.password, user.password);

                if (!isMatch) {
                    return new ApolloError("Password not incorrect", "PASSWORD_INCORRECT");
                }

                if (!user.email_verify) {
                    return new ApolloError("Email not verify", "EMAIL_NOT_VERIFY");
                }

                if (!user.activation) {
                    return new ApolloError("Account is not active", "ACCOUNT_NOT_ACTIVE");
                }

                // Issue access + refresh tokens scoped to the calling frontend.
                // Each app stores its own cookie so a login here cannot revive
                // a session on a sibling app and a logout there cannot kill
                // this one.
                let token = await AuthToken({id: user.id}, undefined, appKey);
                let refreshToken = await RefreshToken({id: user.id, useragent: context.req.useragent}, appKey);

                if (refreshToken !== null && refreshToken !== "") {
                    context.res.cookie(refreshCookieName(appKey), refreshToken, refreshCookieOptions);
                }
                // Drop any pre-split shared cookie this browser still carries.
                context.res.cookie(LEGACY_REFRESH_COOKIE, '', { ...refreshCookieOptions, maxAge: 0 });

                return {
                    token,
                    user
                }
            } catch (error) {
                logger.error(`Authenticate user error: ${error.message}`)
                throw new ApolloError(error)
            }
        },

        createUser: async (obj, {content}, context, info) =>  {
            try {
                let alreadyExist = await alreadyExistUser(content.email);

                if (alreadyExist !== false) {
                    return new ApolloError(alreadyExist.message, alreadyExist.code)
                }

                let password = await hashPassword(content.password);

                let user = await User.create({
                    ...content,
                    role: content.role,
                    password,
                    activation: true,
                    email_verify: true
                })

                // let token = await AuthToken({id: user.id}, 5);

                return user
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        addPersonImage: async (obj, {id, image}, context, info) => {
            try {
                const listType = ["JPEG", "JPG", "PNG"]

                const { createReadStream, filename, mimetype, encoding } = await image;

                const imgType = filename.split(".")[filename.split(".").length-1].toUpperCase()

                const isImage = listType.indexOf(imgType) !== -1

                if(!isImage) { return new ApolloError("This file is not image") }

                const imgUniqName = `${UUID()}.${imgType}`;
                const pathName = path.join(__dirname,   `./../uploads/${imgUniqName}`);

                const stream = createReadStream();
                await stream.pipe( createWriteStream(pathName) );

                await Person.update({personal_picture: imgUniqName}, { where: { id } })

                return {
                    url: imgUniqName
                }
            } catch (error) {
                throw new ApolloError(error)
            }
        },

        updateUser: async (obj, {id, content}, context, info) =>  {
            try {
                let result = null;

                let user = await isExistUser(id);

                if (!user) {
                    return new ApolloError('User not found', 'USER_NOT_EXIST');
                }

                const person = await Person.update({...content.person}, { where: { id: user.id_person } })

                let password = null;

                if (content.password && content.password !== "") {
                    password = await hashPassword(content.newPassword);
                }

                if (password !== null) {
                    result = await User.update({...content, password}, { where: { id } })
                } else {
                    delete content.password

                    result = await User.update({...content}, { where: { id } })
                }

                return {
                    status: person[0] === 1 || result[0] === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        updateAnyUser: async (obj, {id, content}, context, info) =>  {
            try {
                let result = null;

                let user = await isExistUser(id);

                if (!user) {
                    return new ApolloError('User not found', 'USER_NOT_EXIST');
                }

                let password = null;

                if (content.newPassword && content.newPassword !== "") {
                    password = await hashPassword(content.newPassword);
                }

                if (password !== null) {
                    result = await User.update({...content, password}, { where: { id } })
                } else {
                    delete content.newPassword

                    result = await User.update({...content}, { where: { id } })
                }

                if (content.id_street && content.id_street.length > 0) {
                    await UserStreet.destroy({ where: { id_user: id } })

                    const streets = content.id_street
                    for (let i = 0; i < streets.length; i++) {
                        await UserStreet.create({id_user: user.id, id_street: streets[i]})
                    }
                }

                return {
                    status: result[0] === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        deleteUser: async (obj, {id}, context, info) =>  {
            try {
                const user = await User.destroy({ where: { id } })

                return {
                    status: user === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        emailVerification: async (obj, {token}, context, info) => {
            try {
                if (!token || token === "") {
                    return  new ApolloError("Token invalid or expired");
                }

                // Verify the extracted token
                let decodedToken = await VerifyToken(token);

                // If decoded token is null then set authentication of the request false
                if (!decodedToken) {
                    return  new ApolloError("Token invalid or expired");
                }

                // If the user has valid token then Find the user by decoded token's id
                let isExist = await isExistUser(decodedToken.id);
                if (!isExist) {
                    return new ApolloError("User Does not exist");
                }

                let user = await User.update({'activation': true, 'email_verify': true }, { where: { id: isExist.id } })

                return {
                    status: user[0] === 1
                }

            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        resendVerificationEmail: async (obj, {email}, context, info) => {
            try {
                let user =  await User.findOne({where: { email  }});

                // Person is not exist
                if (!user) { return new ApolloError('User not found', 'USER_NOT_EXIST');}

                let token = await AuthToken({id: user.id}, 5);

                await createMail ({
                    type: "Verification",
                    to: email,
                    subject: "Email Verification",
                    token: token.split(" ")[1]
                });

                return {
                    status: true
                }

            }  catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        forgetPassword: async (obj, {email}, context, info) => {
            try {
                let user = await User.findOne({
                    where: { email },
                    logging: (msg, time) => console.log({query : msg, time: `${time} ms`}),
                });

                // console.log({user})
                // Person is not exist
                if (!user) { return new ApolloError('User not found', 'USER_NOT_EXIST');}

                let token = await AuthToken({id: user.id, email: user.email}, 5);

                const createdMail = await createMail ({
                    type: "Forget",
                    to: email,
                    subject: "Forget your password",
                    role: user.role,
                    token: token.split(" ")[1]
                });

                return {
                    status: true
                }

            }  catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        changePassword: async (obj, {content}, context, info) => {
            try {
                const {token, password, confirmPassword} = content;

                if (!token || token === "") {
                    return  new ApolloError("Token invalid or expired");
                }

                if (password !== confirmPassword) {
                    return  new ApolloError("Password not incorrect", "PASSWORD_INCORRECT");
                }

                // Verify the extracted token
                let decodedToken = await VerifyToken(token);

                // If decoded token is null then set authentication of the request false
                if (!decodedToken) {
                    return  new ApolloError("Token invalid or expired");
                }

                let isExist = await isExistUser(decodedToken.id);

                if (!isExist) {
                    return new AuthenticationError("User Does not exist");
                }

                // Hash the user password
                let hash = await hashPassword(password);

                let user = await User.update({ password: hash }, { where: { id: isExist.id } })

                return {
                    status: user[0] === 1
                }

            }  catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        activeUser: async (obj, {id, activation}, context, info) => {
            try {
                let user = await User.update({activation}, { where: { id } })

                return {
                    status: user[0] === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        logOut: async (obj, {}, context, info) => {
            try {
                const { appKey } = context;
                const expired = { ...refreshCookieOptions, maxAge: 0 };

                // Only clear this frontend's cookie. Sibling apps keep their
                // own session cookies untouched.
                context.res.cookie(refreshCookieName(appKey), '', expired);
                // Also evict the legacy shared cookie so users carried over
                // from the pre-split deploy don't keep a stray session.
                context.res.cookie(LEGACY_REFRESH_COOKIE, '', expired);

                return {
                    status: true,
                };
            } catch (error) {
                throw new ApolloError(error);
            }
        },

        resetTeamPassword: async (obj, { idTeam }, context, info) => {
            const { user, isAuth } = context;
            if (!isAuth || !user) {
                return new AuthenticationError("Authentication required");
            }
            if (user.role !== "1" && user.role !== "2") {
                return new ApolloError("Only super-admin or club admin can reset team passwords", "FORBIDDEN_ROLE");
            }

            const team = await Team.findByPk(idTeam);
            if (!team) {
                return new ApolloError("Team not found", "TEAM_NOT_FOUND");
            }

            // Club admin (role 2) can only reset for teams inside their own club.
            if (user.role === "2") {
                const callerMgmt = await ClubManagement.findOne({ where: { id_person: user.id_person } });
                if (!callerMgmt || callerMgmt.id_club !== team.id_club) {
                    return new ApolloError("Team does not belong to your club", "FORBIDDEN_TEAM");
                }
            }

            // Locate the team-manager User via the Member row created alongside it.
            const member = await Members.findOne({
                where: { id_team: idTeam, classification: 'manager' }
            });
            if (!member) {
                return new ApolloError("No manager set for this team", "TEAM_MANAGER_NOT_FOUND");
            }
            const targetUser = await User.findOne({
                where: { id_person: member.id_person, role: '3' }
            });
            if (!targetUser) {
                return new ApolloError("Manager has no login account", "USER_NOT_EXIST");
            }

            const newPassword = generateRandomPassword(10);
            const hashed = await hashPassword(newPassword);
            await User.update({ password: hashed }, { where: { id: targetUser.id } });

            return { email: targetUser.email, password: newPassword };
        },
        deletePerson: async (obj, { id }, context, info) => {
            try {
                // Find the person before deleting
                const person = await Person.findByPk(id);
        
                if (!person) {
                    throw new ApolloError("Person not found", "PERSON_NOT_FOUND");
                }
        
                // Check if the person is linked to any user, player, or technical apparatus
                const isUser = await User.findOne({ where: { id_person: id } });
                const isPlayer = await Players.findOne({ where: { id_person: id } });
                const isTechnical = await TechnicalApparatus.findOne({ where: { id_person: id } });
        
                if (isUser || isPlayer || isTechnical) {
                    throw new ApolloError("Cannot delete person with associated records", "PERSON_HAS_DEPENDENCIES");
                }
        
                // Delete the person
                const result = await Person.destroy({ where: { id }, force: true });
        
                return {
                    status: result === 1
                };
            } catch (error) {
                logger.error("Error deleting person:", error);
                throw new ApolloError(error.message || "An unexpected error occurred");
            }
        }
        
    }
}
