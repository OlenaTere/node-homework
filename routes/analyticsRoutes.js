const express = require("express");
const router = express.Router();

const {
  userAnalytics,
  usersWithTaskCounts,
  taskSearch,
} = require("../controllers/analyticsController");

router.get("/users/:id", userAnalytics);
router.get("/users", usersWithTaskCounts);
router.get("/tasks/search", taskSearch);

module.exports = router;