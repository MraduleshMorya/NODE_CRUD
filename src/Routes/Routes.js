const express = require("express");
const routers = express.Router();
const {getData,postData, updateData,deleteData,loginuser} = require('../Controller/Usercontroller');
const {auth,auth2} = require("../Controller/auth")
const express_obj = express();
express_obj.use(express.json());

routers.get("/getdata",[auth,auth2],getData);
routers.post("/postdata", [auth, auth2], postData);
routers.put("/updatedata", [auth, auth2], updateData);
routers.delete("/deletedata", [auth, auth2], deleteData);
routers.post("/login",loginuser);
routers.post("/uploadimage", loginuser);

module.exports = routers;