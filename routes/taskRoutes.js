const express = require("express");
const router = express.Router();

const {
  create,
  index,
  show,
  update,
  deleteTask,
} = require("../controllers/taskController");

// /api/tasks
router.route("/")
  .get(index)   // GET /api/tasks
  .post(create); // POST /api/tasks

// /api/tasks/:id
router.route("/:id")
  .get(show)       // GET /api/tasks/:id
  .patch(update)   // PATCH /api/tasks/:id
  .delete(deleteTask); // DELETE /api/tasks/:id

module.exports = router;