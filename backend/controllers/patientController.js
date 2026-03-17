// Patient controller for patient search and operations
const { isValidObjectId } = require("mongoose");
const User = require("../models/User");
const Patient = require("../models/Patient");
const createPatientWithUniqueHealthId = require("../utils/createPatientWithUniqueHealthId");

const getPatients = async (req, res) => {
  try {
    const { search } = req.query;
    if (!search || !search.trim()) {
      return res.status(200).json({ patients: [] });
    }

    const regex = new RegExp(search.trim(), "i");
    const users = await User.find({
      role: "patient",
      $or: [{ name: regex }, { healthId: regex }]
    }).select("name healthId");

    const healthIds = users.map((user) => user.healthId).filter(Boolean);
    if (healthIds.length === 0) {
      return res.status(200).json({ patients: [] });
    }

    const patientProfiles = await Patient.find({ healthId: { $in: healthIds } }).select(
      "healthId phone"
    );
    const phoneByHealthId = patientProfiles.reduce((acc, patient) => {
      acc[patient.healthId] = patient.phone;
      return acc;
    }, {});

    const patients = users.map((user) => ({
      name: user.name,
      healthId: user.healthId,
      phone: phoneByHealthId[user.healthId] || "N/A"
    }));

    return res.status(200).json({ patients });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch patients", error: error.message });
  }
};

const getPatientByHealthId = async (req, res) => {
  res.status(200).json({ message: "Get patient by Health ID placeholder" });
};

const getPatientProfile = async (req, res) => {
  try {
    if (!isValidObjectId(req.user.id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const user = await User.findById(req.user.id).select("name email healthId role");
    if (!user || user.role !== "patient" || !user.healthId) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    const patient = await Patient.findOne({ healthId: user.healthId }).select(
      "age gender bloodGroup phone healthId"
    );
    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    return res.status(200).json({
      name: user.name,
      email: user.email,
      healthId: user.healthId,
      age: patient.age,
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
      phone: patient.phone
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch patient profile", error: error.message });
  }
};

const createPatient = async (req, res) => {
  res.status(201).json({ message: "Create patient placeholder" });
};

const registerPatientByReception = async (req, res) => {
  try {
    const { name, age, gender, bloodGroup, phone } = req.body;

    if (!name || !age || !gender || !bloodGroup || !phone) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existingPatient = await Patient.findOne({ phone }).select("name healthId phone");
    if (existingPatient) {
      return res.status(409).json({
        message: "Patient with this phone number already exists",
        patient: {
          name: existingPatient.name,
          healthId: existingPatient.healthId,
          phone: existingPatient.phone
        }
      });
    }

    const patient = await createPatientWithUniqueHealthId({
      name,
      age,
      gender,
      bloodGroup,
      phone
    });

    return res.status(201).json({
      message: "Patient registered",
      patient: {
        name: patient.name,
        healthId: patient.healthId,
        phone: patient.phone
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Patient with this phone number already exists"
      });
    }
    return res.status(500).json({ message: "Failed to register patient", error: error.message });
  }
};

const updatePatient = async (req, res) => {
  res.status(200).json({ message: "Update patient placeholder" });
};

const deletePatient = async (req, res) => {
  res.status(200).json({ message: "Delete patient placeholder" });
};

module.exports = {
  getPatients,
  getPatientByHealthId,
  getPatientProfile,
  createPatient,
  registerPatientByReception,
  updatePatient,
  deletePatient
};
