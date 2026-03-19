// Hospital routes for admin management and listing
const express = require("express");
const { createHospital, getHospitals, getHospitalById } = require("../controllers/hospitalController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/admin/hospitals", protect, authorizeRoles("system_admin", "admin"), createHospital);
router.get("/hospitals", protect, getHospitals);
router.get("/hospitals/:id", protect, getHospitalById);

module.exports = router;
