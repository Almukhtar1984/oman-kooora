import Sequelize from 'sequelize';
import Config from './Config.mjs';
import dotenv from 'dotenv'
dotenv.config();

const NODE_ENV = process.env.NODE_ENV


const dbConfig = NODE_ENV === "development" ? Config.development : Config.production;

export default new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
        host: NODE_ENV === "development" ? "localhost" : (process.env.DB_PRO_HOST || "localhost"),
        dialect: 'mysql',
        timezone: "+02:00",
        benchmark: true,
        logging: dbConfig.logging,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);