const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
//const pool = require("../db/pg-pool"); // DB pool
const prisma = require("../db/prisma"); // NEW (assignment 6b)

// Create a new task for the currently logged-on user
const create = async (req, res, next) => {
  if (!req.body) req.body = {};

  const { error, value } = taskSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  try {
    const isCompleted = value.isCompleted ?? value.is_completed ?? false;

    const task = await prisma.task.create({
      data: {
        title: value.title,
        isCompleted: isCompleted,
        userId: global.user_id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    return res.status(201).json(task);
  } catch (err) {
    return next(err);
  }
};

// Get all tasks for the currently logged-on user
const index = async (req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: global.user_id },
      select: { id: true, title: true, isCompleted: true },
      orderBy: { id: "asc" },
    });

    if (tasks.length === 0) {
      return res.status(404).json({ message: "That task was not found" });
    }

    return res.json(tasks);
  } catch (err) {
    return next(err);
  }
};

// Get a single task by ID for the currently logged-on User
const show = async (req, res, next) => {
  const taskToFind = parseInt(req.params?.id);

  // Validate ID (keep existing behavior)
  if (!taskToFind) {
    return res
      .status(400)
      .json({ message: "The task ID passed is not valid." });
  }

  try {
    const task = await prisma.task.findUnique({
      where: {
        id_userId: {
          id: taskToFind,
          userId: global.user_id,
        },
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    if (!task) {
      return res.status(404).json({ message: "That task was not found" });
    }

    return res.json(task);
  } catch (err) {
    return next(err);
  }
};

// Update a task by ID for the currently logged-on User
const update = async (req, res, next) => {
  const taskToFind = parseInt(req.params?.id);

  // Validate ID (keep same behavior)
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

  // Build the update payload using Prisma field names
  const taskChange = {};
  if (value.title !== undefined) taskChange.title = value.title;

  const incomingIsCompleted =
    value.isCompleted ?? value.is_completed;

  if (incomingIsCompleted !== undefined) {
    taskChange.isCompleted = incomingIsCompleted;
  }

  // If nothing to update, return the current task (your existing behavior)
  if (Object.keys(taskChange).length === 0) {
    try {
      const task = await prisma.task.findUnique({
        where: {
          id_userId: {
            id: taskToFind,
            userId: global.user_id,
          },
        },
        select: { id: true, title: true, isCompleted: true },
      });

      if (!task) {
        return res.status(404).json({ message: "That task was not found" });
      }

      return res.json(task);
    } catch (err) {
      return next(err);
    }
  }

  // Prisma update (catch P2025 when not found)
  try {
    const task = await prisma.task.update({
      data: taskChange,
      where: {
        id_userId: {
          id: taskToFind,
          userId: global.user_id,
        },
      },
      select: { id: true, title: true, isCompleted: true },
    });

    return res.json(task);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "The task was not found." });
    }
    return next(err);
  }
};

// Delete a task owned by the logged-in User
const deleteTask = async (req, res, next) => {
  const taskToFind = parseInt(req.params?.id);

  // Validate ID (kept exactly)
  if (!taskToFind) {
    return res
      .status(400)
      .json({ message: "The task ID passed is not valid." });
  }

  try {
    const deletedTask = await prisma.task.delete({
      where: {
        id_userId: {
          id: taskToFind,
          userId: global.user_id,
        },
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    return res.json(deletedTask);
  } catch (err) {
    // Prisma throws this when delete() doesn't find a row
    if (err.code === "P2025") {
      return res.status(404).json({ message: "That task was not found" });
    }
    return next(err);
  }
};

module.exports = {
  create,
  index,
  show,
  update,
  deleteTask,
};