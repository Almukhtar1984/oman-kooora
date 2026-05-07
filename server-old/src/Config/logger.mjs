import winston from 'winston';
const { createLogger, format, transports, add } = winston;
const { combine, timestamp, label, printf } = format;
import WinstonNodemailer  from './WinstonNodemailer.mjs'

const redactSensitiveValue = (message) => String(message)
    .replace(/(authorization|access[_-]?token|refresh[_-]?token|token|password|secret|api[_-]?key)(["'\s:=]+)([^"'\s,}]+)/gi, "$1$2[REDACTED]")
    .replace(/(Bearer\s+)[A-Za-z0-9._-]+/gi, "$1[REDACTED]");

const logger = createLogger({
    level: 'info',
    format: combine(
        timestamp({format: 'MMM-DD-YYYY HH:mm:ss'}),
        printf(info => `${info.level}: ${[info.timestamp]}: ${redactSensitiveValue(info.message)}`)
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
