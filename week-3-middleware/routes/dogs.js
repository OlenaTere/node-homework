const express = require("express");
const router = express.Router();
const dogs = require("../dogData.js");
const { ValidationError, NotFoundError } = require("../errors");

router.get("/dogs", (req, res) => {
	res.json(dogs);
});

// router.post("/adopt", (req, res) => {
//     const { name, address, email, dogName } = req.body;
//     if (!name || !email || !dogName) {
//         return res.status(400).json({ error: "All fields are required" });
//     }

//     return res.status(201).json({
//         message: `Adoption request received. We will contact you at ${email} for further details.`,
//     });
// });
router.post("/adopt", (req, res) => {
    const { name, address, email, dogName } = req.body;
  
    // 1) Required fields check
    if (!name || !email || !dogName) {
      // Must match /Missing required fields/
      throw new ValidationError("Missing required fields");
    }
  
    // 2) Dog existence / availability check
    const dog = dogs.find((d) => d.name === dogName);
  
    if (!dog || dog.status !== "available") {
      // Must match /not found or not available/
      throw new NotFoundError("Dog not found or not available");
    }
  
    // 3) Success response – keep our original success message
    return res.status(201).json({
      message: `Adoption request received. We will contact you at ${email} for further details.`,
    });
  });


router.get("/error", (req, res) => {
	throw new Error("Test error");
});

module.exports = router;
