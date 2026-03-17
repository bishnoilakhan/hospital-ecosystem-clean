// Stats controller for role-based dashboard summaries
const { isValidObjectId } = require("mongoose");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const MedicalRecord = require("../models/MedicalRecord");

const getTodayRange = () => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  return { todayStart, todayEnd };
};

const getPatientStats = async (req, res) => {
  try {
    if (!isValidObjectId(req.user.id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const user = await User.findById(req.user.id).select("healthId");
    if (!user || !user.healthId) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    const healthId = user.healthId;
    const now = new Date();

    const appointments = await Appointment.countDocuments({ patientHealthId: healthId });
    const medicalRecords = await MedicalRecord.countDocuments({ patientHealthId: healthId });
    const upcomingVisits = await Appointment.countDocuments({
      patientHealthId: healthId,
      date: { $gte: now },
      status: { $in: ["scheduled", "checked-in"] }
    });

    return res.status(200).json({
      appointments,
      medicalRecords,
      upcomingVisits
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch patient stats", error: error.message });
  }
};

const getDoctorStats = async (req, res) => {
  try {
    if (!isValidObjectId(req.user.id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const { todayStart, todayEnd } = getTodayRange();

    const todaysAppointments = await Appointment.countDocuments({
      doctorId: doctor._id,
      date: { $gte: todayStart, $lte: todayEnd }
    });
    const completedToday = await Appointment.countDocuments({
      doctorId: doctor._id,
      status: "completed",
      date: { $gte: todayStart, $lte: todayEnd }
    });
    const totalPatients = (await Appointment.distinct("patientHealthId", { doctorId: doctor._id }))
      .length;

    return res.status(200).json({
      todaysAppointments,
      completedToday,
      totalPatients
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch doctor stats", error: error.message });
  }
};

const getReceptionStats = async (req, res) => {
  try {
    const { todayStart, todayEnd } = getTodayRange();

    const totalAppointments = await Appointment.countDocuments();
    const appointmentsToday = await Appointment.countDocuments({
      date: { $gte: todayStart, $lte: todayEnd }
    });
    const checkedIn = await Appointment.countDocuments({
      status: "checked-in"
    });
    const waiting = await Appointment.countDocuments({
      status: "scheduled"
    });

    return res.status(200).json({
      totalAppointments,
      appointmentsToday,
      checkedIn,
      waiting
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch reception stats", error: error.message });
  }
};

module.exports = {
  getPatientStats,
  getDoctorStats,
  getReceptionStats
};
