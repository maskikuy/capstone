import winston from "winston";

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

const httpFilter = winston.format((info, opts) => {
  return info.context === 'HTTP' ? info : false;
});

const formatConsole = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => {
        const context = info.context ? ` [${info.context}]` : '';
        return `${info.timestamp} [${info.level}]${context}: ${info.message}`;
    }
  )
);

const formatFile = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

const logger = winston.createLogger({
  level: 'debug',
  levels,
  transports: [
    new winston.transports.Console({
      format: formatConsole,
    }),
    
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: formatFile,
    }),

    new winston.transports.File({
      filename: 'logs/app.log',
      format: formatFile,
    }),

    new winston.transports.File({
      filename: 'logs/http.log',
      level: 'debug',
      format: winston.format.combine(
        httpFilter(),
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
  ],
});

export default logger;