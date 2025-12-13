const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const dogsRouter = require('./routes/dogs');
const {
    ValidationError,
    NotFoundError,
    UnauthorizedError,
  } = require('./errors');

const app = express();

// Your middleware here
// 1) Request ID middleware - Adds req.requestId - Sets X-Request-Id response header
app.use((req, res, next) => {
  const requestId = uuidv4();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
});


// 2) Logging middleware Format: [timestamp]: METHOD PATH (requestId)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}]: ${req.method} ${req.path} (${req.requestId})`);
  next();
});


// 3) Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});


// 4) Body parsing with size limit - Required for POST /adopt
app.use(express.json({ limit: '1mb' }));


// 5) Content-Type validation for POST requests Only POST, must be application/json On error: 400, JSON { error, requestId }
app.use((req, res, next) => {
  if (req.method === 'POST') {
    const contentType = req.get('Content-Type');

    if (!contentType || !contentType.toLowerCase().includes('application/json')) {
      return res.status(400).json({
        error: 'Content-Type must be application/json',
        requestId: req.requestId,
      });
    }
  }
  next();
});


//6) Static images Assuming file at public/images/dachshund.png GET /images/dachshund.png
app.use(
  '/images',
  express.static(path.join(__dirname, 'public', 'images'))
);


 // 7) Routes (must keep this line)
app.use('/', dogsRouter); // Do not remove this line

/**
 * 8) Error handling middleware
 * - Handles ValidationError, NotFoundError, UnauthorizedError, and default Error
 * - Logs WARN: for 4xx, ERROR: for 5xx
 * - Always includes requestId in JSON
 */
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
  
    // Logging with correct severity
    if (statusCode >= 400 && statusCode < 500) {
      // 4xx errors → WARN
      console.warn(`WARN: ${err.name || 'Error'} ${err.message}`);
    } else {
      // 5xx errors → ERROR
      console.error(`ERROR: Error ${err.message}`);
    }
  
    // Message rules: - For 500, assignment wants "Internal Server Error" - For 4xx, use the actual err.message
    const message =
      statusCode >= 500
        ? 'Internal Server Error'
        : err.message || 'Internal Server Error';
  
    res.status(statusCode).json({
      error: message,
      requestId: req.requestId,
    });
  });
  

// 9) 404 handler (last middleware) - Unmatched routes
  app.use((req, res) => {
    res.status(404).json({
      error: 'Route not found',
      requestId: req.requestId,
    });
  });
const server =	app.listen(3000, () => console.log("Server listening on port 3000"));
module.exports = server;