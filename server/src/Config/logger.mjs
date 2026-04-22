import winston from 'winston';
const { createLogger, format, transports, add } = winston;
const { combine, timestamp, label, printf } = format;
import WinstonNodemailer  from './WinstonNodemailer.mjs'

const logger = createLogger({
    level: 'info',
    format: combine(
        timestamp({format: 'MMM-DD-YYYY HH:mm:ss'}),
        printf(info => `${info.level}: ${[info.timestamp]}: ${info.message}`)
    ),
    defaultMeta: { service: 'user-service' },
    transports: [
        new transports.File({ filename: 'logs/error.log', level: 'error' }),
        new transports.File({ filename: 'logs/combined.log', level: 'info'  }),
        new transports.Console(),
        // new WinstonNodemailer()
    ]
});

export default logger;