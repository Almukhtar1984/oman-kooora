import Sequelize from 'sequelize';
import Config from './Config.mjs';
import dotenv from 'dotenv'
dotenv.config();

const NODE_ENV = process.env.NODE_ENV


const dbConfig = NODE_ENV === "development" ? Config.development : Config.production;
const toNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

export default new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
        host: NODE_ENV === "development" ? "localhost" : (process.env.DB_PRO_HOST || "localhost"),
        dialect: 'mysql',
        timezone: "+02:00",
        benchmark: true,
        logging: (process.env.DB_LOGGING === 'true' || dbConfig.logging) ? console.log : false,
        pool: {
            max: toNumber(process.env.DB_POOL_MAX, 10),
            min: toNumber(process.env.DB_POOL_MIN, 0),
            acquire: toNumber(process.env.DB_POOL_ACQUIRE_MS, 30000),
            idle: toNumber(process.env.DB_POOL_IDLE_MS, 10000)
        }
    }
);
