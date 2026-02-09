const express = require("express");
const router = express.Router();

const {
  create,
  index,
  show,
  update,
  deleteTask,
  bulkCreate,
  overdue,
} = require("../controllers/taskController");

// /api/tasks
router.route("/").get(index).post(create);

router.post("/bulk", bulkCreate);

router.get("/overdue", (req, res, next) => {
  console.log("HIT /api/tasks/overdue route");
  return overdue(req, res, next);
});

// /api/tasks/:id
router
  .route("/:id")
  .get(show) // GET /api/tasks/:id
  .patch(update) // PATCH /api/tasks/:id
  .delete(deleteTask); // DELETE /api/tasks/:id

module.exports = router;
