import winston from "winston";
import { isProduction } from "./is-production";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      filename: "./persist/error.log",
      level: "error",
      
    }),
    new winston.transports.File({
      filename: "./persist/combined.log",
    }),
  ],
});

if (!isProduction()) {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}


export { logger };