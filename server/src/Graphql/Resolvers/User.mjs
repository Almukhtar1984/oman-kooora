import { ApolloError, AuthenticationError } from 'apollo-server-express';
import sequelize from 'sequelize';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv'
import { v4 as UUID } from 'uuid';

import logger from "../../Config/logger.mjs";

import {AuthToken, createMail, RefreshToken, VerifyToken, sameUserAgent, isExistUser, comparePassword, hashPassword, alreadyExistUser} from '../../Helpers/index.mjs';
import {
    User, Person, Club, Team, ClubManagement, Members, Players, TechnicalApparatus, Permission
} from '../../Models/index.mjs';
import { format as formatDate } from 'date-fns'
import {saveImageUpload} from "../../Helpers/Upload.mjs";

dotenv.config();

const { hash, compare } = bcrypt;
const SECRET = process.env.SECRET_JWT

const NODE_ENV = process.env.NODE_ENV
const ADMIN_URL = process.env.ADMIN_URL
const EMPLOYEE_URL = process.env.EMPLOYEE_URL
const SUPERVISOR_URL = process.env.SUPERVISOR_URL
const CUSTOMER_URL = process.env.CUSTOMER_URL

const {Op, col} = sequelize;

const parsePositiveInt = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const MAX_FAILED_LOGIN_ATTEMPTS = parsePositiveInt(process.env.MAX_FAILED_LOGIN_ATTEMPTS, 5);
const LOGIN_LOCK_DURATION_MS = parsePositiveInt(process.env.LOGIN_LOCK_MINUTES, 15) * 60 * 1000;
const REFRESH_COOKIE_NAME = "__tomoh";
const REFRESH_TOKEN_DAYS = 7;

const MANAGEMENT_ROLES = new Set([
    "1",
    "2",
    "3",
    "admin",
    "super-admin",
    "super_admin",
    "superadmin",
    "adminclub",
    "admin_club",
    "adminteam",
    "admin_team",
    "employee",
    "supervisor"
]);

const normalizeRole = (role) => `${role || ""}`.trim().toLowerCase().replace(/\s+/g, "_");

const assertManagementUser = ({isAuth, user}) => {
    if (!isAuth || !user) {
        throw new AuthenticationError("You must be the authenticated user to get this information");
    }

    if (!MANAGEMENT_ROLES.has(normalizeRole(user.role))) {
        throw new ApolloError("You do not have permission to manage users", "FORBIDDEN");
    }
}

const getAssignableUserRole = (role) => {
    const currentRole = normalizeRole(role);

    if (["1", "admin", "super-admin", "super_admin", "superadmin"].includes(currentRole)) {
        return "2";
    }

    if (["2", "adminclub", "admin_club"].includes(currentRole)) {
        return "2";
    }

    if (["3", "adminteam", "admin_team", "employee", "supervisor"].includes(currentRole)) {
        return "3";
    }

    return "4";
}

const getLockedUntilTime = (user) => {
    if (!user?.locked_until) return 0;

    const lockedUntil = new Date(user.locked_until).getTime();
    return Number.isFinite(lockedUntil) ? lockedUntil : 0;
}

const isAccountLocked = (user) => {
    return getLockedUntilTime(user) > Date.now();
}

const buildLoginFailedError = () => {
    return new ApolloError("Invalid credentials or account is unavailable", "AUTHENTICATION_FAILED");
}

const resetLoginFailures = async (user) => {
    if (!user.failed_login_attempts && !user.locked_until && !user.last_failed_login_at) return;

    await user.update({
        failed_login_attempts: 0,
        locked_until: null,
        last_failed_login_at: null
    });
}

const clearExpiredLoginLock = async (user) => {
    if (!user.locked_until) return;

    if (getLockedUntilTime(user) <= Date.now()) {
        await resetLoginFailures(user);
    }
}

const registerFailedLogin = async (user) => {
    const failedAttempts = Number(user.failed_login_attempts || 0) + 1;
    const lockedUntil = failedAttempts >= MAX_FAILED_LOGIN_ATTEMPTS
        ? new Date(Date.now() + LOGIN_LOCK_DURATION_MS)
        : null;

    await user.update({
        failed_login_attempts: failedAttempts,
        locked_until: lockedUntil,
        last_failed_login_at: new Date()
    });

    if (lockedUntil) {
        return new ApolloError("Account temporarily locked", "ACCOUNT_LOCKED", {
            lockedUntil
        });
    }

    return buildLoginFailedError();
}

const getRefreshCookieOptions = (maxAge = 3600000 * 24 * REFRESH_TOKEN_DAYS) => ({
    maxAge,
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: "lax"
});

const createRefreshSession = async (user, useragent) => {
    const refreshTokenId = UUID();
    const refreshTokenVersion = Number(user.refresh_token_version || 0) + 1;

    await user.update({
        refresh_token_id: refreshTokenId,
        refresh_token_version: refreshTokenVersion
    });

    return await RefreshToken({
        id: user.id,
        useragent,
        tokenId: refreshTokenId,
        tokenVersion: refreshTokenVersion
    }, REFRESH_TOKEN_DAYS);
}

const isRefreshSessionValid = (user, decodedToken) => {
    if (!decodedToken?.tokenId || decodedToken?.tokenVersion === undefined) return false;

    return `${user.refresh_token_id || ""}` === `${decodedToken.tokenId}`
        && Number(user.refresh_token_version || 0) === Number(decodedToken.tokenVersion);
}

const revokeRefreshSession = async (user) => {
    await user.update({
        refresh_token_id: null,
        refresh_token_version: Number(user.refresh_token_version || 0) + 1
    });
}

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

        refreshToken: async (obj, args, {refreshToken, req, res}, info) => {
            try {
                if (!refreshToken || refreshToken === "") {
                    return new AuthenticationError( "Refresh token does not exist" );
                }

                let decodedToken = await VerifyToken(refreshToken);

                // If decoded token is null then set authentication of the request false
                if (!decodedToken) {
                    return new AuthenticationError("Refresh token invalid or expired")
                }

                if (!sameUserAgent(decodedToken.useragent, req.useragent)) {
                    return new AuthenticationError("The user is not properly logged in")
                }

                let isExist = await isExistUser(decodedToken.id);
                if (!isExist) {
                    return new AuthenticationError("User Does not exist");
                }

                if (!isRefreshSessionValid(isExist, decodedToken)) {
                    return new AuthenticationError("Refresh token has been revoked");
                }

                let token = await AuthToken({id: isExist.id}, 5);
                let newRefreshToken = await createRefreshSession(isExist, req.useragent);

                res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, getRefreshCookieOptions());

                return {
                    token
                }
            } catch (error) {
                logger.error("")
                return new ApolloError(error)
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
                const origin = context.req.header('Origin');

                let role = origin === ADMIN_URL ? "admin"
                    : origin === CUSTOMER_URL ? "customer"
                        : origin === SUPERVISOR_URL ? "supervisor"
                            : origin === EMPLOYEE_URL ? "employee" : ""

                let user = null;
                if(role === "" && NODE_ENV === "development") {
                    user = await User.findOne({
                        where: { email: content.email }
                    });
                } else {
                    user = await User.findOne({
                        where: { email: content.email, role }
                    });
                }

                // User is existed
                if (!user) {
                    return buildLoginFailedError();
                }

                await clearExpiredLoginLock(user);

                if (isAccountLocked(user)) {
                    return new ApolloError("Account temporarily locked", "ACCOUNT_LOCKED", {
                        lockedUntil: user.locked_until
                    });
                }

                let isMatch = await comparePassword(content.password, user.password);

                // If Password don't match
                if (!isMatch) {
                    return await registerFailedLogin(user);
                }

                await resetLoginFailures(user);

                // If Password don't match
                if (!user.email_verify) {
                    return buildLoginFailedError();
                }

                // If Password don't match
                if (!user.activation) {
                    return buildLoginFailedError();
                }

                if(NODE_ENV === "development") {
                    const clubManagement = await ClubManagement.findOne({
                        where: {
                            id_person: user.id_person
                        },
                        include: {
                            model: Club,
                            as: "club",
                            required: true,
                            right: true
                        }
                    })

                    if (clubManagement) {
                        if(!clubManagement.club.account_status) {
                            return new ApolloError("Club is not active", "CLUB_NOT_ACTIVE");
                        }

                        const membershipDateEnd = clubManagement.membership_date_end
                        const dateNow = formatDate(new Date(), "yyyy-MM-dd")

                        if(membershipDateEnd <= dateNow) {
                            return new ApolloError("Membership Date End", "MEMBERSHIP_DATE_END");
                        }
                    }
                }

                // Issue Token
                let token = await AuthToken({id: user.id}, 5);

                let refreshToken = await createRefreshSession(user, context.req.useragent);

                if (refreshToken !== null && refreshToken !== "") {
                    context.res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions())
                }

                return {
                    token,
                    user
                }
            } catch (error) {
                logger.error("User authentication failed")
                throw new ApolloError(error)
            }
        },

        createUser: async (obj, {content}, context, info) =>  {
            try {
                assertManagementUser(context);

                let alreadyExist = await alreadyExistUser(content.email);

                if (alreadyExist !== false) {
                    return new ApolloError(alreadyExist.message, alreadyExist.code)
                }

                let password = await hashPassword(content.password);
                const role = getAssignableUserRole(context.user.role);

                let user = await User.create({
                    id_person: content.id_person,
                    email: content.email,
                    role,
                    password,
                    activation: true,
                    email_verify: false
                })

                let token = await AuthToken({id: user.id, email: user.email}, 5);
                await createMail ({
                    type: "Verification",
                    to: user.email,
                    subject: "Email Verification",
                    role,
                    token: token.split(" ")[1]
                });

                return user
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        },

        addPersonImage: async (obj, {id, image}, context, info) => {
            try {
                const imgUniqName = await saveImageUpload(image);

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
                });

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
                assertManagementUser(context);

                let user = await User.update({activation}, { where: { id } })

                return {
                    status: user[0] === 1
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        },

        logOut: async (obj, {}, context, info) => {
            try {
                const decodedToken = context.refreshToken ? await VerifyToken(context.refreshToken) : null;
                if (decodedToken?.id) {
                    const user = await User.findByPk(decodedToken.id);
                    if (user && isRefreshSessionValid(user, decodedToken)) {
                        await revokeRefreshSession(user);
                    }
                }

                context.res.cookie(REFRESH_COOKIE_NAME, '', getRefreshCookieOptions(0));


                return {
                    status: true,
                };
            } catch (error) {
                throw new ApolloError(error);
            }
        },
    }
}
