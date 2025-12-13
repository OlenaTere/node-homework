// const { StatusCodes } = require("http-status-codes");

// module.exports = (req, res) => {
//   res
//     .status(StatusCodes.NOT_FOUND)
//     .send(`You can't do a ${req.method} for ${req.url}`);
// };

const { StatusCodes } = require("http-status-codes");

module.exports = (req, res) => {
  res
    .status(StatusCodes.NOT_FOUND)
    .json({ message: `You can't do a ${req.method} for ${req.url}` });
};