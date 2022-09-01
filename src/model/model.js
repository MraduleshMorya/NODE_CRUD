const { Pool, Client } = require('pg')
const config = require("config");

const prod_pool = new Pool({
    database:"test_db",
    user:"postgres",
    password:"root@123",
    host:"localhost",
    port:"5432"
});

const test_pool = new Pool({
  database: "test_db2",
  user: "postgres",
  password: "root@123",
  host: "localhost",
  port: "5432",
});

const dev_pool = new Pool({
  database: "test_db",
  user: "postgres",
  password: "root@123",
  host: "localhost",
  port: "5432",
});


try{
    if (config.get("environment") === "production") {
        console.log("production environment pool ");
      module.exports.pool = prod_pool;
    } else if (config.get("environment") === "development"){
        console.log("development environment pool ");
      module.exports.pool = dev_pool;
    }else{
        console.log("test environment pool ");
        module.exports.pool = test_pool;
    }
}
catch(error){
  module.exports.pool = test_pool;  
}


// pool.query('SELECT NOW()', (err, res) => {
//   console.log(err, res)
//   pool.end()
// })