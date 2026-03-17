// Symptom triage routes
const express = require("express");
const { analyzeSymptoms } = require("../controllers/triageController");

const router = express.Router();

router.post("/triage", analyzeSymptoms);

module.exports = router;
