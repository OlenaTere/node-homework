const { userSchema } = require("../validation/userSchema");
const { StatusCodes } = require("http-status-codes");
//const pool = require("../db/pg-pool");
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const prisma = require("../db/prisma"); // added for assignment 6b logon

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

// (Assignment 5b 3b): register now writes to DB
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
  
    // updated register to use prisma week 8 (assignment 6b) 
    try {
      const normalizedEmail = value.email.toLowerCase();
    
      // store hashed password under the Prisma field name
      const hashedPassword = value.hashed_password;
    
      const user = await prisma.user.create({
        data: {
          name: value.name,
          email: normalizedEmail,
          hashedPassword: hashedPassword,
        },
        select: { id: true, name: true, email: true },
      });
    
      global.user_id = user.id;
    
      return res.status(StatusCodes.CREATED).json({
        name: user.name,
        email: user.email,
      });
    } catch (err) {
      if (err.name === "PrismaClientKnownRequestError" && err.code === "P2002") {
        return res.status(400).json({ message: "Email already registered" });
      }
      return next(err);
    }
  };

// (Assignment 5b 3a): logon now authenticates via DB
const logon = async (req, res, next) => {
    if (!req.body) req.body = {};
  
    const { email, password } = req.body;
  
    try {
      const normalizedEmail = (email || "").toLowerCase();

const user = await prisma.user.findUnique({
  where: { email: normalizedEmail },
});

if (!user) {
  return res
    .status(StatusCodes.UNAUTHORIZED)
    .json({ message: "Authentication Failed" });
}
  
      const passwordsMatch = await comparePassword(
        password,
        user.hashedPassword
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