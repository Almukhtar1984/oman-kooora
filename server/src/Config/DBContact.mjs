import Sequelize from 'sequelize';
import Config from './Config.mjs';
import dotenv from 'dotenv'
dotenv.config();

const NODE_ENV = process.env.NODE_ENV

const configDB = {
    database: NODE_ENV === "development" ? Config.development.database : Config.production.database,
    username: NODE_ENV === "development" ? Config.development.username : Config.production.username,
    password: NODE_ENV === "development" ? Config.development.password : Config.production.password,
    logging: NODE_ENV === "development" ? Config.development.logging : Config.production.logging,
}

export default new Sequelize(
    configDB.database,
    configDB.username,
    configDB.password,
    {
        host: 'localhost',
        dialect: 'mysql',
        timezone: "+02:00",
        benchmark: true,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        logging: false
    }
);
