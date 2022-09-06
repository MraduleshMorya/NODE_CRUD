const express = require('express');
express_obj = express();
const config = require("config")
const {pool} = require("../model/model")
const jwt = require("jsonwebtoken");
express_obj.use(express.json());
const Joi = require("joi");

module.exports.getData = async(request,response) => {
    try{
        search_query = `select * from public.users`
        const temp = request.query
        if('username' in temp){
            if(temp.hasOwnProperty('username')){
                search_query += ` where username = '${temp.username}';`;
            }
        }
        const data = await pool.query(search_query,[]);
        if ((data.rows).length === 0){
            throw new Error("Not Found")
        }
        response.json({status:200,
                data:data.rows})
    }   
    catch(err){
        console.log(err)
        response.json({status:404,message:err.message});
    }
}

module.exports.postData = async(request,response) => {
    try{
        const data = request.body;
        console.log(data);
        const schema = Joi.object({
          fname: Joi.string()
            .alphanum()
            .min(3)
            .max(30)
            .required(),

          lname: Joi.string()
            .alphanum()
            .min(3)
            .max(30)
            .required(),

          username: Joi.string()
            .alphanum()
            .min(3)
            .max(30)
            .required(),

          password: Joi.string().max(30).required(),
        });

        const result = schema.validate(data);
        if(result.error){
            throw new Error((result.error.details[0].message))
        }

        insert_query = `insert into public.users (fname,lname,username,password) values('${data.fname}','${data.lname}','${data.username}','${data.password}')`;
        result = await pool.query(insert_query,[]);
        response.json({status:201});
    }   
    catch(err){
        response
          .status(400)
          .send({ status: 400, message: err.message.replace(/"/gi, "'") });
    }
}

module.exports.updateData = async(request,response) => {
    try{
        update_query = `update public.users set `
        const temp = request.body
        var temp2 = 0;
        if('username' in request.query){
            console.log("pass1");
            if(temp.hasOwnProperty('fname')){
                update_query += ` fname ='${temp.fname}'`;
                console.log(update_query);
                temp2 +=1;
            }
            if(temp.hasOwnProperty('lname')){
                if(temp2!==0){ update_query += `,`}
                update_query += ` lname ='${temp.lname}'`;
                console.log(update_query);
                temp2 += 1;
            }
            if(temp.hasOwnProperty('password')){
                if(temp2!==0){ update_query += `, `}
                update_query += ` password ='${temp.password}'`;
                console.log(update_query);
            }
            update_query += ` where username = '${request.query.username}';`
            console.log(update_query);
            const data = await pool.query(update_query,[]);
            if(data.rowCount !== 0){
                response.json({status:200,
                    message:`updated ${data.rowCount} row`});
            }
            else{
                throw new Error("Wrong username")
            }
        }
        else{
            throw new Error("Username required")
        }
    }   
    catch(err){
        console.log(err);
        response.json({status:400,message:err.message});
    }
}

module.exports.deleteData = async(request,response) => {
    try{
        const temp = request.query;
        console.log(temp);
        if('username' in temp){
            delete_query = `delete from public.users where username = '${temp.username}'`;
            const data = await pool.query(delete_query,[]);
            // console.log(data)
            if(data.rowCount !== 0){
                response.json({status:200,
                    message:`deleted ${data.rowCount} row`});
            }
            else{
                throw new Error("Wrong username")
            }
        }   
        else{
                throw new Error("username required")
        }
    }
    catch(err){
        // console.log(err);
        response.json({status:400,message:err.message});
    }

}

module.exports.loginuser = async(request,resposne) =>{
    const data = request.body
    try{
        if(data.hasOwnProperty("username") && data.hasOwnProperty("password")){
            const auth_query = `select * from public.users where username = '${data.username}' and password = '${data.password}';`
            
            result =await pool.query(auth_query,[]);
            if(result.rowCount !== 0){
                console.log(result.rows);
                const token = jwt.sign({first_name:`${result.rows[0].fname}`,last_name:""},config.get("token_secret"))
                console.log(token)
                console.log(config.get("token_secret"));
                resposne.json({status:200,token:token})
                
            }
            else(
                resposne.status(404).json({status:404,massage:"data doesn't match"})
            )
        }
    }
    catch(err){
        console.log(err.message)
    }
}

module.exports.uploadimage = async(request,response) =>{
    
}