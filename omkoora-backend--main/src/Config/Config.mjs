import dotenv from 'dotenv'
dotenv.config();

export default {
  development: {
    username: process.env.DB_DEV_USERNAME,
    password: process.env.DB_DEV_PASSWORD,
    database: process.env.DB_DEV_DATABASE,
    logging: true
  },
  production: {
    username: process.env.DB_PRO_USERNAME,
    password: process.env.DB_PRO_PASSWORD,
    database: process.env.DB_PRO_DATABASE,
    logging: false
  }
}