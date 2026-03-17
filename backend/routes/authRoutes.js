// Auth routes for registration and login
const express = require("express");
const { registerUser, loginUser, activatePatient } = require("../controllers/authController");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/activate-patient", activatePatient);

module.exports = router;
