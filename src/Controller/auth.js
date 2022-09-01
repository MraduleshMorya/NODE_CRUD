const express = require("express");
const express_obj = express();
const jwt = require("jsonwebtoken");
express_obj.use(express.json());

function auth(request, response, next) {
  const token =
    request.header("x_auth_token") || request.header("x-auth-token");
  try {
    if (!token) {
      throw new Error("Token required");
    } else {
      const temp = jwt.verify(token, "token_secret");
      next();
    }
  } catch (err) {;
    response.status(400).json({ status: 400, message: err.message });
  }
}

function auth2(request, response, next) {
  try {
    next();
  } catch (err) {
    response.status(400).json({ status: 400, message: err.message });
  }
}

module.exports.auth = auth;
module.exports.auth2 = auth2;
