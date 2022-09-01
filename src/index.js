const express = require("express");
const routes = require("./Routes/Routes");
const config = require("config");

const express_obj = express();
express_obj.use(express.json());
express_obj.use("/",routes);


const server_obj = express_obj.listen(8000,'192.168.50.67',()=>{ console.log("started on port 8000")});
console.log(config.get("environment"));
module.exports = server_obj;
