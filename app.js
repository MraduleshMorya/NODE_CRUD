
//  Main file that configure's the project and start's the server

const express = require("express");
const app = express();
const body_parser = require("body-parser");
var cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
var device = require('express-device');
const morgan = require('morgan');
const { debugLogger, infoLogger } = require('./src/utilities/logger-functions/fileBasedLoggers')


// checking environment to choose configuration detail file 
if (process.env.NODE_ENV == "production") {
  dotenv.config({
    path: path.resolve(__dirname, '.env' + '.prod')
  });
} else if (process.env.NODE_ENV == "development") {
  dotenv.config({
    path: path.resolve(__dirname, '.env' + '.dev')
  });
} else if (process.env.NODE_ENV == "local" || process.env.NODE_ENV == undefined) {
  dotenv.config({
    path: path.resolve(__dirname, '.env' + '.local')
  });
}

app.use(cors({
  origin: '*'
}));

// for parsing application/json data 
app.use(express.json());

// for parsing application/x-www-form-urlencoded data 
app.use(express.urlencoded({ extended: true }));

app.use(body_parser.urlencoded({ extended: true }));
app.use(body_parser.json());

// imports 
const { requestLogger } = require("./src/utilities/logger-functions/requestLogger");
const { router } = require("./src/routes/routes");

const PORT = process.env.serverPort;
const HOST = process.env.host || '192.168.50.126';

app.use(device.capture());
app.use(morgan(requestLogger));

//  file based logging configurations 
app.use((req, res, next) => {
  infoLogger.info(`info log on entry `, { meta: { req } });
  next();
});


// routing configurations 
app.use(router);

// code to start the server at the defined port in env file
app.listen(PORT, () => {
  console.log( "---------------------------------------------------------------------------------------------" );
  console.log("Project Name :- Love After Provider Backend");
  console.log("Project Environment :-", process.env.NODE_ENV);
  console.log(`Server Started On Port Number :- `, PORT);
  console.log("---------------------------------------------------------------------------------------------");
})
