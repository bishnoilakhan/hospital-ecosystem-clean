// Medical record routes (Digital Medical Vault)
const express = require("express");
const { addMedicalRecord, getPatientRecords } = require("../controllers/medicalRecordController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
  "/medical-record/add",
  protect,
  authorizeRoles("doctor"),
  addMedicalRecord
);
router.get(
  "/patient/records",
  protect,
  authorizeRoles("doctor", "patient"),
  getPatientRecords
);

module.exports = router;
