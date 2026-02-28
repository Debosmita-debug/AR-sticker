import pino from 'pino';

const level = process.env.LOG_LEVEL || 'info';

let logger;

if (process.env.NODE_ENV === 'production') {
  logger = pino({ level });
} else {
  logger = pino(
    { level },
    pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname'
      }
    })
  );
}

export default logger;
