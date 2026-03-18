// Medical record controller for the Digital Medical Vault
const { isValidObjectId } = require("mongoose");
const MedicalRecord = require("../models/MedicalRecord");
const Doctor = require("../models/Doctor");
const User = require("../models/User");
const Patient = require("../models/Patient");
const Hospital = require("../models/Hospital");
const AccessControl = require("../models/AccessControl");

const addMedicalRecord = async (req, res) => {
  try {
    const { patientHealthId, diagnosis, prescription, notes = "", reports = [] } = req.body;

    if (!patientHealthId || !diagnosis || !prescription) {
      return res
        .status(400)
        .json({ message: "patientHealthId, diagnosis, and prescription are required" });
    }
    if (Array.isArray(prescription) && prescription.length === 0) {
      return res
        .status(400)
        .json({ message: "patientHealthId, diagnosis, and prescription are required" });
    }

    if (!isValidObjectId(req.user.id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
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

    const access = await AccessControl.findOne({
      patientHealthId,
      hospitalId: resolvedHospitalId,
      granted: true,
      expiresAt: { $gt: new Date() }
    });

    if (!access) {
      return res.status(403).json({ message: "Access required to add medical records" });
    }

    const patient = await Patient.findOne({ healthId: patientHealthId }).select("healthId");
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const record = await MedicalRecord.create({
      patientHealthId,
      doctorId: doctor._id,
      hospitalId: resolvedHospitalId,
      diagnosis,
      prescription,
      notes,
      reports
    });

    return res.status(201).json({
      message: "Medical record added",
      record
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to add medical record", error: error.message });
  }
};

const getPatientRecords = async (req, res) => {
  try {
    let { patientHealthId } = req.query;

    if (req.user.role === "patient") {
      if (!isValidObjectId(req.user.id)) {
        return res.status(400).json({ message: "Invalid id" });
      }

      const user = await User.findById(req.user.id).select("healthId");
      if (!user || !user.healthId) {
        return res.status(403).json({ message: "Access denied" });
      }
      if (patientHealthId && user.healthId !== patientHealthId) {
        return res.status(403).json({ message: "Access denied" });
      }
      patientHealthId = user.healthId;
    } else if (!patientHealthId) {
      return res.status(400).json({ message: "patientHealthId is required" });
    }

    if (req.user.role === "doctor") {
      if (!isValidObjectId(req.user.id)) {
        return res.status(400).json({ message: "Invalid id" });
      }

      const doctor = await Doctor.findOne({ userId: req.user.id }).select("hospitalId");
      if (!doctor || !doctor.hospitalId) {
        return res.status(404).json({ message: "Doctor profile not found" });
      }

      const access = await AccessControl.findOne({
        patientHealthId,
        hospitalId: doctor.hospitalId,
        granted: true,
        expiresAt: { $gt: new Date() }
      });

      if (!access) {
        return res.status(403).json({ message: "Access required to view medical records" });
      }
    }

    const records = await MedicalRecord.find({ patientHealthId }).sort({ date: -1 });

    const doctorIds = records.map((record) => record.doctorId).filter(Boolean);
    const hospitalIds = records.map((record) => record.hospitalId).filter(Boolean);

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

    const formatted = records.map((record) => ({
      ...record.toObject(),
      doctorName: doctorMap[record.doctorId?.toString()] || "Unknown",
      hospitalName: record.hospitalId
        ? hospitalMap[record.hospitalId.toString()] || "Unknown"
        : "Unknown"
    }));

    return res.status(200).json({
      message: "Medical records fetched",
      data: formatted,
      records: formatted
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch medical records", error: error.message });
  }
};

module.exports = {
  addMedicalRecord,
  getPatientRecords
};
