const { Pool } = require("pg");
const dotenv = require('dotenv');
dotenv.config();

// configuring the database connection details to use them in the code by pulling the pool anywhere in the code 
const dbPool = new Pool({
    database: process.env.dbName,
    user: process.env.dbUser,
    password: process.env.dbPassword,
    host: process.env.dbHost,
    port: process.env.dbPort,
    max: 1500, // maximum no of connection allowed to create
    idleTimeoutMillis: 3000, // time in milliseconds to release the connection if tis idle for that much time
    connectionTimeoutMillis: 5000, // timeout value to release the connection process if it doesn't connect 
    acquireTimeoutMillis: 5000, // timeout value to acquire the connection it doesn't connect
});

module.exports = dbPool;