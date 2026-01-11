const express = require("express");
const app = express();

// globals for week 4
global.user_id = null;
global.users = [];
global.tasks = [];

// Parse JSON request bodies
app.use(express.json({ limit: "1kb" }));

//Logging Middleware
app.use((req, res, next) => {
    console.log("Method:", req.method);
    console.log("Path:", req.path);
    console.log("Query:", req.query);
    next();
  });

  // Controller require
const { register } = require("./controllers/userController");
const userRouter = require("./routes/userRoutes");

// FOR WEEK 5 – AUTH MIDDLEWARE + TASK ROUTER
const authMiddleware = require("./middleware/auth");
const taskRouter = require("./routes/taskRoutes");

//week 6
//const pool = require("./db/pg-pool");

//week 8 (assignment 6b)
const prisma = require("./db/prisma");

//week 9 (assignment 7)
const analyticsRouter = require("./routes/analyticsRoutes");

  //routes
app.get("/", (req, res) => {
  res.json({ message: "Hello, World!" });
});

app.post("/testpost", (req, res) => {
  res.json({ message: "POST request received at /testpost" });
});

// replaced health check verifies DB connectivity - week 8 (assignment 6b)
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res
      .status(500)
      .json({ status: "error", db: "not connected", error: err.message });
  }
});

// User Registration Route
app.use("/api/users", userRouter);

// Task routes (protected — require authentication)
app.use("/api/tasks", authMiddleware, taskRouter);

app.use("/api/analytics", authMiddleware, analyticsRouter);


//Middleware
const notFound = require("./middleware/not-found");
const errorHandler = require("./middleware/error-handler");

app.use(notFound);
app.use(errorHandler);

//server
const port = process.env.PORT || 3000;
const server = app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`),
    );
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.error(`Port ${port} is already in use.`);
        } else {
          console.error('Server error:', err);
        }
        process.exit(1);
      });
      
      let isShuttingDown = false;
      async function shutdown(code = 0) {
        if (isShuttingDown) return;
        isShuttingDown = true;
        console.log('Shutting down gracefully...');
        try {
          await new Promise(resolve => server.close(resolve));
          console.log('HTTP server closed.');

          // Close all DB pool connections - week 6
    //await pool.end();

    // Disconnect Prisma - assignment 6b
    await prisma.$disconnect();
    console.log("Prisma disconnected");

          
        } catch (err) {
          console.error('Error during shutdown:', err);
          code = 1;
        } finally {
          console.log('Exiting process...');
          process.exit(code);
        }
      }
      
      process.on('SIGINT', () => shutdown(0));  // ctrl+c
      process.on('SIGTERM', () => shutdown(0)); // e.g. `docker stop`
      process.on('uncaughtException', (err) => {
        console.error('Uncaught exception:', err);
        shutdown(1);
      });
      process.on('unhandledRejection', (reason) => {
        console.error('Unhandled rejection:', reason);
        shutdown(1);
      });
module.exports = { app, server} ;


