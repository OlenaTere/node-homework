const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
//const pool = require("../db/pg-pool"); // DB pool
const prisma = require("../db/prisma"); // added for assignment 6b

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
        priority: value.priority, 
        userId: req.user.id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true, // added for assignment 7 
      },
    });

    return res.status(201).json(task);
  } catch (err) {
    return next(err);
  }
};

// Get all tasks for the currently logged-on user
const index = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 10;
if (page < 1) {
  return res.status(400).json({ message: "page must be >= 1" });
}

if (limit < 1 || limit > 100) {
  return res.status(400).json({ message: "limit must be between 1 and 100" });
}

const skip = (page - 1) * limit;
const whereClause = { userId: req.user.id };

if (req.query.find) {
  whereClause.title = {
    contains: req.query.find,
    mode: "insensitive",
  };
}

  try {
    const tasks = await prisma.task.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      skip: skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });
    const total = await prisma.task.count({
      where: whereClause,
    });
    const pages = Math.ceil(total / limit);

const pagination = {
  page,
  limit,
  total,
  pages,
  hasNext: page * limit < total,
  hasPrev: page > 1,
};

    // if (tasks.length === 0) {
    //   return res.status(404).json({ message: "That task was not found" });
    // }

    return res.status(200).json({ tasks, pagination });
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
          userId: req.user.id,
        },
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        User: {
          select: {
            name: true,
            email: true,
          },
        },
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

  // Validate ID
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
  if (value.priority !== undefined) taskChange.priority = value.priority;

  // If nothing to update, return the current task
  if (Object.keys(taskChange).length === 0) {
    try {
      const task = await prisma.task.findUnique({
        where: {
          id_userId: {
            id: taskToFind,
            userId: req.user.id,
          },
        },
        select: { id: true, title: true, isCompleted: true, priority: true, },
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
          userId: req.user.id,
        },
      },
      select: { id: true, title: true, isCompleted: true, priority: true, },
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
          userId: req.user.id,
        },
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
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

const bulkCreate = async (req, res, next) => {
  const { tasks } = req.body || {};

  // Validate the tasks array
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({
      error: "Invalid request data. Expected an array of tasks.",
    });
  }

  // Validate all tasks before insertion
  const validTasks = [];
  for (const task of tasks) {
    const { error, value } = taskSchema.validate(task, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details,
      });
    }

    validTasks.push({
      title: value.title,
      isCompleted: value.isCompleted ?? value.is_completed ?? false,
      priority: value.priority ?? "medium",
      userId: req.user.id,
    });
  }

  // Bulk insert
  try {
    const result = await prisma.task.createMany({
      data: validTasks,
      skipDuplicates: false,
    });

    return res.status(201).json({
      message: "Bulk task creation successful",
      tasksCreated: result.count,
      totalRequested: validTasks.length,
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  create,
  index,
  show,
  update,
  deleteTask,
  bulkCreate,
};