const { userSchema } = require("../validation/userSchema");
const { StatusCodes } = require("http-status-codes");
const pool = require("../db/pg-pool");
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash) {
  const [salt, key] = storedHash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scrypt(inputPassword, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

// UPDATED (per Assignment 5b 3b): register now writes to DB
const register = async (req, res, next) => {
    if (!req.body) req.body = {};
  
    const { error, value } = userSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        message: "Validation failed",
        details: error.details,
      });
    }
  
    value.hashed_password = await hashPassword(value.password);
  
    try {
      const result = await pool.query(
        `INSERT INTO users (email, name, hashed_password)
         VALUES ($1, $2, $3)
         RETURNING id, email, name`,
        [value.email.toLowerCase(), value.name, value.hashed_password]
      );
  
      const user = result.rows[0];
      global.user_id = user.id;
  
      return res.status(StatusCodes.CREATED).json({
        name: user.name,
        email: user.email,
      });
    } catch (e) {
      if (e.code === "23505") {
        return res.status(400).json({ message: "Email already registered" });
      }
      return next(e);
    }
  };

// UPDATED (per Assignment 5b 3a): logon now authenticates via DB
const logon = async (req, res, next) => {
    if (!req.body) req.body = {};
  
    const { email, password } = req.body;
  
    try {
      const result = await pool.query("SELECT * FROM users WHERE email = $1", [
        (email || "").toLowerCase(),
      ]);
  
      if (result.rows.length === 0) {
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ message: "Authentication Failed" });
      }
  
      const user = result.rows[0];
  
      const passwordsMatch = await comparePassword(
        password,
        user.hashed_password
      );
  
      if (!passwordsMatch) {
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ message: "Authentication Failed" });
      }
  
      global.user_id = user.id;
  
      return res.status(StatusCodes.OK).json({
        name: user.name,
        email: user.email,
      });
    } catch (err) {
      return next(err);
    }
  };


const logoff = (req, res) => {
  global.user_id = null;
  // no body needed
  return res.sendStatus(StatusCodes.OK);
};

module.exports = {
  register,
  logon,
  logoff,
};