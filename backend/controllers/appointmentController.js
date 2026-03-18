// Appointment controller for scheduling and lifecycle updates
const { isValidObjectId } = require("mongoose");
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const User = require("../models/User");
const Patient = require("../models/Patient");
const Hospital = require("../models/Hospital");
const AccessControl = require("../models/AccessControl");
const { getIO } = require("../socket");
const { analyzeSymptoms } = require("../utils/triage");
const { extractSymptomsAI } = require("../utils/aiSymptomParser");
const { extractSymptoms } = require("../utils/symptomParser");

const createAppointment = async (req, res) => {
  try {
    const { patientHealthId, doctorId, date, symptoms } = req.body;

    if (!symptoms || symptoms.trim() === "") {
      return res.status(400).json({
        message: "Symptoms are required for appointment"
      });
    }

    if (!doctorId || !date) {
      return res.status(400).json({ message: "doctorId and date are required" });
    }

    if (req.user.role !== "patient" && !patientHealthId) {
      return res.status(400).json({ message: "patientHealthId is required" });
    }

    if (!isValidObjectId(doctorId)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    let resolvedPatientHealthId = patientHealthId;

    if (req.user.role === "patient") {
      if (!isValidObjectId(req.user.id)) {
        return res.status(400).json({ message: "Invalid id" });
      }

      const user = await User.findById(req.user.id).select("healthId");
      if (!user || !user.healthId) {
        return res.status(403).json({ message: "Access denied" });
      }

      resolvedPatientHealthId = user.healthId;
      if (patientHealthId && patientHealthId !== user.healthId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const patient = await Patient.findOne({ healthId: user.healthId }).select("healthId");
      if (!patient || patient.healthId !== user.healthId) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    if (req.user.role !== "patient") {
      const patient = await Patient.findOne({ healthId: resolvedPatientHealthId }).select(
        "healthId"
      );
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
    }

    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ message: "Invalid appointment date" });
    }

    if (appointmentDate < new Date()) {
      return res.status(400).json({ message: "Appointment date must be in the future" });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    let resolvedHospitalId = doctor.hospitalId;
    if (!resolvedHospitalId) {
      const defaultHospital = await Hospital.findOne().select("_id");
      if (defaultHospital) {
        resolvedHospitalId = defaultHospital._id;
        doctor.hospitalId = resolvedHospitalId;
        await doctor.save();
      }
    }

    if (!resolvedHospitalId) {
      return res.status(400).json({ message: "Doctor hospital not set" });
    }

    const dayStart = new Date(appointmentDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(appointmentDate);
    dayEnd.setHours(23, 59, 59, 999);

    const lastAppointment = await Appointment.findOne({
      doctorId,
      date: { $gte: dayStart, $lte: dayEnd }
    }).sort({ queueNumber: -1 });

    const queueNumber = lastAppointment ? lastAppointment.queueNumber + 1 : 1;

    const rawSymptoms = symptoms.trim();
    let structuredSymptoms = await extractSymptomsAI(rawSymptoms);
    if (!structuredSymptoms || !structuredSymptoms.length) {
      structuredSymptoms = extractSymptoms(rawSymptoms);
    }

    const triageData = analyzeSymptoms(rawSymptoms);
    const derivedDepartment = triageData.department || "General Medicine";
    const derivedPriorityScore =
      typeof triageData.priorityScore === "number" ? triageData.priorityScore : 5;

    const appointment = await Appointment.create({
      patientHealthId: resolvedPatientHealthId,
      doctorId,
      date: appointmentDate,
      status: "scheduled",
      hospitalId: resolvedHospitalId,
      queueNumber,
      priorityScore: derivedPriorityScore,
      symptoms: rawSymptoms,
      rawSymptoms,
      structuredSymptoms,
      department: derivedDepartment
    });

    const existingAccess = await AccessControl.findOne({
      patientHealthId: resolvedPatientHealthId,
      hospitalId: resolvedHospitalId
    });

    if (!existingAccess) {
      await AccessControl.create({
        patientHealthId: resolvedPatientHealthId,
        hospitalId: resolvedHospitalId,
        granted: true,
        grantedBy: "system",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
    }

    const io = getIO();
    io.emit("appointmentCreated", {
      appointmentId: appointment._id,
      doctorId: appointment.doctorId,
      hospitalId: appointment.hospitalId,
      patientId: resolvedPatientHealthId
    });

    return res.status(201).json({
      message: "Appointment created",
      appointment
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create appointment", error: error.message });
  }
};

const getDoctorAppointments = async (req, res) => {
  try {
    if (!isValidObjectId(req.user.id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const appointments = await Appointment.find({ doctorId: doctor._id })
      .populate({
        path: "doctorId",
        populate: { path: "userId", model: "User", select: "name" }
      })
      .select(
        "patientHealthId status date doctorId hospitalId queueNumber priorityScore symptoms rawSymptoms structuredSymptoms department"
      );
    const healthIds = appointments.map((appointment) => appointment.patientHealthId).filter(Boolean);
    const doctorIds = appointments
      .map((appointment) => appointment.doctorId?._id || appointment.doctorId)
      .filter(Boolean);
    const hospitalIds = appointments.map((appointment) => appointment.hospitalId).filter(Boolean);
    const patients = await Patient.find({ healthId: { $in: healthIds } }).select(
      "healthId name age bloodGroup phone"
    );
    const doctors = await Doctor.find({ _id: { $in: doctorIds } })
      .populate("userId", "name")
      .select("userId");
    const hospitals = await Hospital.find({ _id: { $in: hospitalIds } }).select("name");
    const patientByHealthId = patients.reduce((acc, patient) => {
      acc[patient.healthId] = patient;
      return acc;
    }, {});
    const doctorMap = doctors.reduce((acc, doc) => {
      acc[doc._id.toString()] = doc.userId?.name || "Unknown";
      return acc;
    }, {});
    const hospitalMap = hospitals.reduce((acc, hospital) => {
      acc[hospital._id.toString()] = hospital.name || "Unknown";
      return acc;
    }, {});

    const formatted = appointments.map((appointment) => ({
      _id: appointment._id,
      doctorId: appointment.doctorId?._id || appointment.doctorId,
      date: appointment.date,
      status: appointment.status,
      queueNumber: appointment.queueNumber,
      priorityScore: appointment.priorityScore,
      symptoms: appointment.symptoms || "",
      rawSymptoms: appointment.rawSymptoms || appointment.symptoms || "",
      structuredSymptoms: appointment.structuredSymptoms || [],
      doctorName:
        doctorMap[(appointment.doctorId?._id || appointment.doctorId)?.toString()] || "Unknown",
      department: appointment.department || appointment.doctorId?.department || "N/A",
      hospitalId: appointment.hospitalId || appointment.doctorId?.hospitalId || null,
      hospitalName: appointment.hospitalId
        ? hospitalMap[appointment.hospitalId.toString()] || "Unknown"
        : "Unknown",
      patient: {
        healthId: appointment.patientHealthId,
        name: patientByHealthId[appointment.patientHealthId]?.name || "Unknown",
        age: patientByHealthId[appointment.patientHealthId]?.age || "N/A",
        bloodGroup: patientByHealthId[appointment.patientHealthId]?.bloodGroup || "N/A",
        phone: patientByHealthId[appointment.patientHealthId]?.phone || "N/A"
      }
    }));

    return res.status(200).json({
      message: "Doctor appointments fetched",
      data: formatted,
      appointments: formatted
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch appointments", error: error.message });
  }
};

const checkInPatient = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (req.user.role === "receptionist") {
      if (
        !req.user.hospitalId ||
        appointment.hospitalId.toString() !== req.user.hospitalId.toString()
      ) {
        return res.status(403).json({
          message: "Not authorized for this hospital"
        });
      }
    }

    if (appointment.status !== "scheduled") {
      return res.status(400).json({ message: "Appointment cannot be checked-in" });
    }

    appointment.status = "checked-in";
    await appointment.save();

    const io = getIO();
    io.emit("appointmentCheckedIn", {
      appointmentId: appointment._id,
      doctorId: appointment.doctorId,
      hospitalId: appointment.hospitalId
    });

    return res.status(200).json({
      message: "Patient checked in",
      appointment
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to check in patient", error: error.message });
  }
};

const completeAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.status !== "checked-in") {
      return res
        .status(400)
        .json({ message: "Appointment must be checked-in before completion" });
    }

    appointment.status = "completed";
    await appointment.save();

    const io = getIO();
    io.emit("appointmentCompleted", {
      appointmentId: appointment._id,
      doctorId: appointment.doctorId,
      hospitalId: appointment.hospitalId
    });

    return res.status(200).json({
      message: "Appointment completed",
      appointment
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to complete appointment", error: error.message });
  }
};

const updatePriority = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { priorityScore } = req.body;

    if (!isValidObjectId(appointmentId)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (!isValidObjectId(req.user.id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const doctor = await Doctor.findOne({ userId: req.user.id }).select("_id");
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    if (appointment.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    appointment.priorityScore = Number(priorityScore);
    await appointment.save();

    return res.status(200).json({
      message: "Priority updated",
      appointment
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const callNextPatient = async (req, res) => {
  try {
    if (!isValidObjectId(req.user.id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const doctor = await Doctor.findOne({ userId: req.user.id }).select("_id");
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const nextAppointment = await Appointment.findOne({
      doctorId: doctor._id,
      status: "scheduled",
      date: { $gte: today, $lt: tomorrow }
    }).sort({ queueNumber: 1 });

    if (!nextAppointment) {
      return res.status(404).json({ message: "No patients in queue" });
    }

    nextAppointment.status = "checked-in";
    await nextAppointment.save();

    const patient = await Patient.findOne({ healthId: nextAppointment.patientHealthId }).select(
      "name"
    );

    const io = getIO();
    io.emit("appointmentCheckedIn", {
      appointmentId: nextAppointment._id,
      doctorId: nextAppointment.doctorId,
      hospitalId: nextAppointment.hospitalId
    });

    return res.status(200).json({
      message: "Next patient called",
      appointment: {
        ...nextAppointment.toObject(),
        patientName: patient?.name || "Patient"
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getTodayAppointments = async (req, res) => {
  try {
    const filter = {};

    if (req.user.role === "receptionist") {
      if (!req.user.hospitalId) {
        return res.status(400).json({ message: "Hospital not found" });
      }
      filter.hospitalId = req.user.hospitalId;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      date: { $gte: todayStart, $lte: todayEnd },
      ...filter
    })
      .populate({
        path: "doctorId",
        select: "department userId",
        populate: { path: "userId", select: "name" }
      })
      .select(
        "patientHealthId date status doctorId hospitalId queueNumber priorityScore symptoms rawSymptoms structuredSymptoms department"
      );

    const healthIds = appointments.map((appointment) => appointment.patientHealthId).filter(Boolean);
    const doctorIds = appointments
      .map((appointment) => appointment.doctorId?._id || appointment.doctorId)
      .filter(Boolean);
    const hospitalIds = appointments.map((appointment) => appointment.hospitalId).filter(Boolean);
    const patients = await Patient.find({ healthId: { $in: healthIds } }).select(
      "healthId name age bloodGroup phone"
    );
    const doctors = await Doctor.find({ _id: { $in: doctorIds } })
      .populate("userId", "name")
      .select("userId");
    const hospitals = await Hospital.find({ _id: { $in: hospitalIds } }).select("name");
    const patientMap = {};
    patients.forEach((patient) => {
      patientMap[patient.healthId] = patient;
    });
    const doctorMap = doctors.reduce((acc, doc) => {
      acc[doc._id.toString()] = doc.userId?.name || "Unknown";
      return acc;
    }, {});
    const hospitalMap = hospitals.reduce((acc, hospital) => {
      acc[hospital._id.toString()] = hospital.name || "Unknown";
      return acc;
    }, {});

    const formatted = appointments.map((appointment) => {
      const patient = patientMap[appointment.patientHealthId];
      const doctorKey = (appointment.doctorId?._id || appointment.doctorId)?.toString();
      return {
        _id: appointment._id,
        patientName: patient?.name || "Unknown",
        patientHealthId: appointment.patientHealthId,
        doctorName: doctorMap[doctorKey] || "Unknown",
        doctorId: appointment.doctorId?._id,
        hospitalId: appointment.hospitalId || appointment.doctorId?.hospitalId || null,
        hospitalName: appointment.hospitalId
          ? hospitalMap[appointment.hospitalId.toString()] || "Unknown"
          : "Unknown",
        queueNumber: appointment.queueNumber,
        priorityScore: appointment.priorityScore,
        symptoms: appointment.symptoms || "",
        rawSymptoms: appointment.rawSymptoms || appointment.symptoms || "",
        structuredSymptoms: appointment.structuredSymptoms || [],
        department: appointment.department || appointment.doctorId?.department || "N/A",
        time: appointment.date,
        status: appointment.status
      };
    });

    return res.status(200).json({ data: formatted, appointments: formatted });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch today's appointments", error: error.message });
  }
};

const getPatientAppointments = async (req, res) => {
  try {
    if (!isValidObjectId(req.user.id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const user = await User.findById(req.user.id).select("healthId");
    if (!user || !user.healthId) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    const appointments = await Appointment.find({ patientHealthId: user.healthId })
      .sort({ date: -1 })
      .populate({
        path: "doctorId",
        select: "department userId",
        populate: { path: "userId", select: "name" }
      })
      .select(
        "date status doctorId hospitalId queueNumber priorityScore symptoms rawSymptoms structuredSymptoms department"
      );

    const doctorIds = appointments
      .map((appointment) => appointment.doctorId?._id || appointment.doctorId)
      .filter(Boolean);
    const hospitalIds = appointments.map((appointment) => appointment.hospitalId).filter(Boolean);
    const doctors = await Doctor.find({ _id: { $in: doctorIds } })
      .populate("userId", "name")
      .select("userId");
    const hospitals = await Hospital.find({ _id: { $in: hospitalIds } }).select("name");
    const doctorMap = doctors.reduce((acc, doc) => {
      acc[doc._id.toString()] = doc.userId?.name || "Unknown";
      return acc;
    }, {});
    const hospitalMap = hospitals.reduce((acc, hospital) => {
      acc[hospital._id.toString()] = hospital.name || "Unknown";
      return acc;
    }, {});

    const formatted = appointments.map((appointment) => ({
      doctorName:
        doctorMap[(appointment.doctorId?._id || appointment.doctorId)?.toString()] || "Unknown",
      department: appointment.department || appointment.doctorId?.department || "N/A",
      hospitalId: appointment.hospitalId || appointment.doctorId?.hospitalId || null,
      hospitalName: appointment.hospitalId
        ? hospitalMap[appointment.hospitalId.toString()] || "Unknown"
        : "Unknown",
      queueNumber: appointment.queueNumber,
      priorityScore: appointment.priorityScore,
      symptoms: appointment.symptoms || "",
      rawSymptoms: appointment.rawSymptoms || appointment.symptoms || "",
      structuredSymptoms: appointment.structuredSymptoms || [],
      date: appointment.date,
      status: appointment.status
    }));

    return res.status(200).json({ data: formatted, appointments: formatted });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch patient appointments",
      error: error.message
    });
  }
};

module.exports = {
  createAppointment,
  getDoctorAppointments,
  checkInPatient,
  completeAppointment,
  updatePriority,
  callNextPatient,
  getTodayAppointments,
  getPatientAppointments
};
