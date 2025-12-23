
module.exports = (req, res, next) => {
    // Check if there is a logged on User
    if (global.user_id == null) {
      // No user -> return 401 Unauthorized and STOP
      return res.status(401).json({ message: "unauthorized" });
    }
  
    // User exists -> pass control to the next middleware / controller
    next();
  };