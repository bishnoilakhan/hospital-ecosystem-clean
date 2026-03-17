// Appointment routes
const express = require("express");
const {
  createAppointment,
  getDoctorAppointments,
  checkInPatient,
  completeAppointment,
  callNextPatient,
  updatePriority,
  getTodayAppointments,
  getPatientAppointments
} = require("../controllers/appointmentController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
  "/appointment/create",
  protect,
  authorizeRoles("patient", "receptionist"),
  createAppointment
);
router.get(
  "/doctor/appointments",
  protect,
  authorizeRoles("doctor"),
  getDoctorAppointments
);
router.put(
  "/appointment/checkin/:id",
  protect,
  authorizeRoles("receptionist"),
  checkInPatient
);
router.put(
  "/appointment/complete/:id",
  protect,
  authorizeRoles("doctor"),
  completeAppointment
);
router.put(
  "/appointment/call-next",
  protect,
  authorizeRoles("doctor"),
  callNextPatient
);
router.put(
  "/appointment/priority/:appointmentId",
  protect,
  authorizeRoles("doctor"),
  updatePriority
);
router.get(
  "/appointments/today",
  protect,
  authorizeRoles("receptionist"),
  getTodayAppointments
);
router.get(
  "/patient/appointments",
  protect,
  authorizeRoles("patient"),
  getPatientAppointments
);

module.exports = router;
