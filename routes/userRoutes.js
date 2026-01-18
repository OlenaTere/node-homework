const express = require("express");

const router = express.Router();
const { register, logon, logoff } = require("../controllers/userController");

// week 10 (assignment 8)
const jwtMiddleware = require("../middleware/jwtMiddleware");

router.route("/register").post(register);
router.route("/logon").post(logon);
router.route("/logoff").post(jwtMiddleware, logoff);

module.exports = router;