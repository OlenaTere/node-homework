const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const pool = require("../db/pg-pool"); // ✅ NEW: DB pool

// Create a new task for the currently logged-on user
const create = async (req, res) => { // ✅ CHANGED: async
  if (!req.body) req.body = {};

  const { error, value } = taskSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  // ✅ CHANGED: map camelCase to DB column name
  const isCompleted = value.isCompleted ?? value.is_completed ?? false;

  const result = await pool.query(
    `INSERT INTO tasks (title, is_completed, user_id)
     VALUES ($1, $2, $3)
     RETURNING id, title, is_completed`,
    [value.title, isCompleted, global.user_id]
  );

  // ✅ CHANGED: return DB row (no user_id)
  return res.status(201).json(result.rows[0]);
};

// Get all tasks for the currently logged-on user
const index = async (req, res) => { // ✅ CHANGED: async
  const result = await pool.query(
    "SELECT id, title, is_completed FROM tasks WHERE user_id = $1 ORDER BY id",
    [global.user_id]
  );

  // Keep your existing behavior: 404 if none
  if (result.rows.length === 0) {
    return res.status(404).json({ message: "That task was not found" });
  }

  return res.json(result.rows);
};

// Get a single task by ID for the currently logged-on User
const show = async (req, res) => { // ✅ CHANGED: async
  const taskToFind = parseInt(req.params?.id);

  // Validate ID (kept exactly)
  if (!taskToFind) {
    return res
      .status(400)
      .json({ message: "The task ID passed is not valid." });
  }

  const result = await pool.query(
    "SELECT id, title, is_completed FROM tasks WHERE id = $1 AND user_id = $2",
    [taskToFind, global.user_id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: "That task was not found" });
  }

  return res.json(result.rows[0]);
};

// Update a task by ID for the currently logged-on User
const update = async (req, res) => { // ✅ CHANGED: async
  const taskToFind = parseInt(req.params?.id);

  // Validate ID (kept exactly)
  if (!taskToFind) {
    return res
      .status(400)
      .json({ message: "The task ID passed is not valid." });
  }

  if (!req.body) req.body = {};

  const { error, value } = patchTaskSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  // ✅ CHANGED: build DB update object using DB column names
  const taskChange = {};
  if (value.title !== undefined) taskChange.title = value.title;
  if (value.isCompleted !== undefined) taskChange.is_completed = value.isCompleted;
  if (value.is_completed !== undefined) taskChange.is_completed = value.is_completed;

  const keys = Object.keys(taskChange);

  // If nothing to update, return current task (no extra behavior added—just safe SQL)
  if (keys.length === 0) {
    const current = await pool.query(
      "SELECT id, title, is_completed FROM tasks WHERE id = $1 AND user_id = $2",
      [taskToFind, global.user_id]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ message: "That task was not found" });
    }

    return res.json(current.rows[0]);
  }

  // ✅ CHANGED: correct SQL includes SET + filters by id AND user_id
  const setClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
  const idParm = `$${keys.length + 1}`;
  const userParm = `$${keys.length + 2}`;

  const updated = await pool.query(
    `UPDATE tasks SET ${setClauses}
     WHERE id = ${idParm} AND user_id = ${userParm}
     RETURNING id, title, is_completed`,
    [...Object.values(taskChange), taskToFind, global.user_id]
  );

  if (updated.rows.length === 0) {
    return res.status(404).json({ message: "That task was not found" });
  }

  return res.json(updated.rows[0]);
};

// Delete a task owned by the logged-in User
const deleteTask = async (req, res) => { // ✅ CHANGED: async
  const taskToFind = parseInt(req.params?.id);

  // Validate ID (kept exactly)
  if (!taskToFind) {
    return res
      .status(400)
      .json({ message: "The task ID passed is not valid." });
  }

  const deleted = await pool.query(
    "DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id, title, is_completed",
    [taskToFind, global.user_id]
  );

  if (deleted.rows.length === 0) {
    return res.status(404).json({ message: "That task was not found" });
  }

  return res.json(deleted.rows[0]);
};

module.exports = {
  create,
  index,
  show,
  update,
  deleteTask,
};