const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

// Closure to generate unique task IDs
const taskCounter = (() => {
    let lastTaskNumber = 0;
    return () => {
      lastTaskNumber += 1;
      return lastTaskNumber;
    };
  })();
  
  // Create a new task for the currently logged-on user
  const create = (req, res) => {
    if (!req.body) req.body = {};

const { error, value } = taskSchema.validate(req.body, { abortEarly: false });

if (error) {
  return res.status(400).json({ message: error.message });
}
    const newTask = {
      ...value,
      id: taskCounter(),
      userId: global.user_id.email,
    };
  
    global.tasks.push(newTask);
  
    // remove userId before returning task
    const { userId, ...sanitizedTask } = newTask;
  
    // 201 created
    res.status(201).json(sanitizedTask);
  };

  // Get all tasks for the currently logged-on user
const index = (req, res) => {
    // Only tasks belonging to this user
    const userTasks = global.tasks.filter(
      (task) => task.userId === global.user_id.email
    );

    // If the user has no tasks, return 404 (as the tests expect)
  if (userTasks.length === 0) {
    return res.status(404).json({ message: "That task was not found" });
  }
  
    // make copies without userId
    const sanitizedTasks = userTasks.map((task) => {
        const { userId, ...sanitizedTask } = task;
    return sanitizedTask;
    });
    
    return res.json(sanitizedTasks);
  };
  
  // Get a single task by ID for the currently logged-on User
  const show = (req, res) => {
    const taskToFind = parseInt(req.params?.id);
  
    // Validate ID
    if (!taskToFind) {
      return res
        .status(400)
        .json({ message: "The task ID passed is not valid." });
    }
  
    // Find the task that belongs to this User
    const task = global.tasks.find(
      (t) => t.id === taskToFind && t.userId === global.user_id.email
    );
  
    if (!task) {
      return res
        .status(404)
        .json({ message: "That task was not found" });
    }
  
    // Remove userId before returning
    const { userId, ...sanitizedTask } = task;
  
    return res.json(sanitizedTask);
  };
  
  // Update a task by ID for the currently logged-on User
  const update = (req, res) => {
    const taskToFind = parseInt(req.params?.id);
  
    // Validate ID
    if (!taskToFind) {
      return res
        .status(400)
        .json({ message: "The task ID passed is not valid." });
    }
  
    // Find index of the task that belongs to this User
    const taskIndex = global.tasks.findIndex(
      (task) => task.id === taskToFind && task.userId === global.user_id.email
    );
  
    if (taskIndex === -1) {
      return res
        .status(404)
        .json({ message: "That task was not found" });
    }
  
    const currentTask = global.tasks[taskIndex];

    if (!req.body) req.body = {};

const { error, value } = patchTaskSchema.validate(req.body, { abortEarly: false });

if (error) {
  return res.status(400).json({ message: error.message });
}

    // PATCH-style update: mutate the existing task in place
    Object.assign(currentTask, value);
  
    // make a copy without userId for the response
    const { userId, ...sanitizedTask } = currentTask;
  
    return res.json(sanitizedTask);
  };
  

  // Delete a task owned by the logged-in User
const deleteTask = (req, res) => {
    // Convert route param to integer
    const taskToFind = parseInt(req.params?.id);
  
    // Validate ID
    if (!taskToFind) {
      return res
        .status(400)
        .json({ message: "The task ID passed is not valid." });
    }
  
    // Find the task index that belongs to the logged-in User
    const taskIndex = global.tasks.findIndex(
      (task) => task.id === taskToFind && task.userId === global.user_id.email
    );
  
    // If no task found (404)
    if (taskIndex === -1) {
      return res
        .status(404)
        .json({ message: "That task was not found" });
    }
  
    // Copy task without userId before deleting
    const { userId, ...sanitizedTask } = global.tasks[taskIndex];
  
    // Delete it
    global.tasks.splice(taskIndex, 1);
  
    // Return deleted task
    return res.json(sanitizedTask);
  };
  

  module.exports = {
    create,
    index,
    show,
    update,
    deleteTask,
  };