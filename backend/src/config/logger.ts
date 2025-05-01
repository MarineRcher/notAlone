import winston from "winston";

const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({
            filename: "/app/logs/security.log",
            level: "info",
        }),
        new winston.transports.Console(),
    ],
});

export default logger;
