// Doctor routes
const express = require("express");
const {
  getDoctors,
  getDoctorById,
  createDoctorProfile,
  getDoctorUsersWithoutProfile,
  updateDoctor,
  deleteDoctor
} = require("../controllers/doctorController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/doctors", protect, authorizeRoles("admin", "receptionist", "doctor", "patient"), getDoctors);
router.get("/doctors/:id", protect, authorizeRoles("admin", "receptionist", "doctor", "patient"), getDoctorById);
router.post("/admin/create-doctor", protect, authorizeRoles("admin"), createDoctorProfile);
router.get(
  "/admin/doctor-users",
  protect,
  authorizeRoles("admin"),
  getDoctorUsersWithoutProfile
);
router.put("/doctors/:id", protect, authorizeRoles("admin"), updateDoctor);
router.delete("/doctors/:id", protect, authorizeRoles("admin"), deleteDoctor);

module.exports = router;
