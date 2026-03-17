// Patient routes
const express = require("express");
const {
  getPatients,
  getPatientByHealthId,
  getPatientProfile,
  createPatient,
  registerPatientByReception,
  updatePatient,
  deletePatient
} = require("../controllers/patientController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", protect, authorizeRoles("admin", "receptionist", "doctor"), getPatients);
router.get("/profile", protect, authorizeRoles("patient"), getPatientProfile);
router.post(
  "/reception/register",
  protect,
  authorizeRoles("receptionist"),
  registerPatientByReception
);
router.get("/:healthId", protect, authorizeRoles("admin", "receptionist", "doctor", "patient"), getPatientByHealthId);
router.post("/", protect, authorizeRoles("admin", "receptionist"), createPatient);
router.put("/:healthId", protect, authorizeRoles("admin", "receptionist"), updatePatient);
router.delete("/:healthId", protect, authorizeRoles("admin"), deletePatient);

module.exports = router;
