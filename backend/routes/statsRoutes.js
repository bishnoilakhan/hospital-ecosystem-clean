// Role-based stats routes
const express = require("express");
const {
  getPatientStats,
  getDoctorStats,
  getReceptionStats
} = require("../controllers/statsController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/patient/stats", protect, authorizeRoles("patient"), getPatientStats);
router.get("/doctor/stats", protect, authorizeRoles("doctor"), getDoctorStats);
router.get("/reception/stats", protect, authorizeRoles("receptionist"), getReceptionStats);

module.exports = router;
