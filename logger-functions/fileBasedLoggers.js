// this file provides the function to the main controller function to enable file based logging
// there are 3 types of logging 
// 1. info logging
// 2. debug logging
// 3. error logging 

const winston = require('winston');
const { createLogger, format, transports } = winston;
const { combine, timestamp, printf } = format;
const DailyRotateFile = require('winston-daily-rotate-file');
const { dirname } = require('path');
const appDir = dirname(require.main.filename);
const path = require('path');

// Define log format
const logFormat = printf(({ level, message, timestamp, meta }) => {

  let endpoint = '';
  let data = {};

  if (meta?.req) {
    endpoint += `Method :--  ${meta.req.method}  URL :-- ${meta.req.originalUrl} `;
  }
  if (level == 'debug') {

    data = JSON.parse(JSON.stringify({
      headers: meta?.req?.headers || {},
      body: meta?.req?.body || {},
      query_params: meta?.req?.query || {},
      data: meta?.data || {},
      requestStatus: meta?.requestStatus || 'Failed',
      requestFailedReason: meta?.requestFailedReason,
      error: meta?.requestFailedReason ? "Error" : "Success",
    }));

  } else if (level == 'error') {

    data = JSON.parse(JSON.stringify({
      headers: meta?.req?.headers || {},
      body: meta?.req?.body || {},
      query_params: meta?.req?.query || {},
      error: meta?.error,
      requestStatus: 'Failed',
      requestFailedReason: meta?.requestFailedReason,
      error: meta?.requestFailedReason ? "Error" : "Success",
    }));

  }

  if (data?.body?.password) {
    delete data.body.password;
  }

  return `-${endpoint} Status :- ${data.error} \n --${timestamp} [${level.toUpperCase()}] - process id :- ${process.pid} --  message : ${message} , data : ${meta ? JSON.stringify(data) : ''}`;
});

// Function to create a logger with specified options
const createCustomLogger = (level, dirname) => {
  return createLogger({
    level,
    format: combine(timestamp(), logFormat),
    transports: [
      new DailyRotateFile({
        level,
        filename: path.join('/var/log/lead-generation/', `provider/${dirname}/${level}-${Date.now()}.log`),
        datePattern: 'YYYY-MM-DD',
        maxSize: '10m', // 10MB
            // maxFiles: null,
        maxFiles: '15d', // Retain logs for the last 15 days
      })
    ]
  });
};

// Create loggers for different log levels
const errorLogger = createCustomLogger('error', 'error');
const debugLogger = createCustomLogger('debug', 'debug');
const infoLogger = createCustomLogger('info', 'info');

// Create loggers for different log levels and exports named exports
exports.errorLogger = errorLogger;
exports.debugLogger = debugLogger
exports.infoLogger = infoLogger;
