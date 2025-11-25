const EventEmitter = require("events");

const emitter = new EventEmitter();

// Listener for the 'time' event
emitter.on("time", (currentTime) => {
  console.log("Time received:", currentTime);
});

// Emit a 'time' event every 5 seconds
setInterval(() => {
  const now = new Date().toString();
  emitter.emit("time", now);
}, 5000);