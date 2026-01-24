const { userSchema } = require("../validation/userSchema");
const { StatusCodes } = require("http-status-codes");
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const prisma = require("../db/prisma"); // added for assignment 6b logon

//added for week 10 (assignment 8)
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");

const cookieFlags = (req) => {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // only when HTTPS is available
    sameSite: "Strict",
  };
};

const setJwtCookie = (req, res, user) => {
  // Sign JWT
  const payload = { id: user.id, csrfToken: randomUUID() };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }); // 1 hour expiration
  // Set cookie, the cookie flags have to be different in production and in test.
  res.cookie("jwt", token, { ...cookieFlags(req), maxAge: 3600000 }); // 1 hour expiration
  return payload.csrfToken; // this is needed in the body returned by logon() or register()
};

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
    delete value.password;
  
    // updated register to use prisma week 8 (assignment 6b) 
    try {
      const normalizedEmail = value.email.toLowerCase();
    
      // store hashed password under the Prisma field name
      const hashedPassword = value.hashed_password;


      const result = await prisma.$transaction(async (tx) => {
        // create user
        const newUser = await tx.user.create({
          data: {
            email: normalizedEmail,
            name: value.name,
            hashedPassword: hashedPassword, 
          },
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        });
      
        // create 3 welcome tasks (exact titles + priorities)
        const welcomeTaskData = [
          { title: "Complete your profile", userId: newUser.id, priority: "medium" },
          { title: "Add your first task", userId: newUser.id, priority: "high" },
          { title: "Explore the app", userId: newUser.id, priority: "low" },
        ];
      
        await tx.task.createMany({ data: welcomeTaskData });
      
        // fetch tasks to return
        const welcomeTasks = await tx.task.findMany({
          where: {
            userId: newUser.id,
            title: { in: welcomeTaskData.map((t) => t.title) },
          },
          select: {
            id: true,
            title: true,
            isCompleted: true,
            userId: true,
            priority: true,
          },
          orderBy: { id: "asc" }, // makes response stable
        });
      
        return { user: newUser, welcomeTasks };
      });

      //global.user_id = result.user.id;
      
      // modified for week 10 (assignment 8)
      const csrfToken = setJwtCookie(req, res, result.user);

      return res.status(201).json({
        name: result.user.name,
        email: result.user.email,
        csrfToken,
        user: result.user,
        welcomeTasks: result.welcomeTasks,
        transactionStatus: "success",
      });
    
    } catch (err) {
      if (err.code === "P2002") {
        return res.status(400).json({ error: "Email already registered" });
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
  select: {
    id: true,
    name: true,
    email: true,
    hashedPassword: true, // needed ONLY to verify password
  },

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
  
      //global.user_id = user.id;
      
      // modified for week 10 (assignment 8)
      const csrfToken = setJwtCookie(req, res, user);
  
      return res.status(StatusCodes.OK).json({
        name: user.name,
        email: user.email,
        csrfToken,
      });
    } catch (err) {
      return next(err);
    }
  };


const logoff = (req, res) => {
  //global.user_id = null;

  //modified (for week 10, assignment 8) to clear the cookie
  res.clearCookie("jwt", cookieFlags(req));
  // no body needed
  return res.sendStatus(StatusCodes.OK);
};

module.exports = {
  register,
  logon,
  logoff,
};