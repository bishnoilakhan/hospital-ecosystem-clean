// Admin routes
const express = require("express");
const {
  createStaffUser,
  createHospitalAdmin,
  getSystemStats,
  getUsers,
  updateUser,
  getAuditLogs
} = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/admin/create-staff", protect, authorizeRoles("admin", "system_admin"), createStaffUser);
router.post(
  "/admin/create-hospital-admin",
  protect,
  authorizeRoles("system_admin"),
  createHospitalAdmin
);
router.get("/admin/stats", protect, authorizeRoles("admin", "system_admin"), getSystemStats);
router.get("/admin/users", protect, authorizeRoles("admin", "system_admin"), getUsers);
router.put("/admin/users/:id", protect, authorizeRoles("admin", "system_admin"), updateUser);
router.get("/admin/audit-logs", protect, authorizeRoles("admin", "system_admin"), getAuditLogs);

module.exports = router;
