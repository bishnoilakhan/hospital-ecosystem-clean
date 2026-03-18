// Doctor controller for profile and staff operations
const { isValidObjectId } = require("mongoose");
const Doctor = require("../models/Doctor");
const User = require("../models/User");
const Hospital = require("../models/Hospital");

const getDoctors = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "patient") {
      query = {};
    } else if (req.user.hospitalId) {
      query = { hospitalId: req.user.hospitalId };
    } else {
      return res.status(400).json({ message: "User hospital not found" });
    }

    const doctors = await Doctor.find(query).populate("userId", "name");

    return res.status(200).json({ data: doctors });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

const getDoctorById = async (req, res) => {
  res.status(200).json({ message: "Get doctor by ID placeholder" });
};

const createDoctorProfile = async (req, res) => {
  try {
    const { userId, department, experience, availability, hospitalId } = req.body;

    if (!userId || !department || !experience || !availability) {
      return res
        .status(400)
        .json({ message: "userId, department, experience, and availability are required" });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const user = await User.findById(userId).select("role");
    if (!user || user.role !== "doctor") {
      return res.status(400).json({ message: "User must have doctor role" });
    }

    const existingDoctor = await Doctor.findOne({ userId });
    if (existingDoctor) {
      return res.status(409).json({ message: "Doctor profile already exists for this user" });
    }

    let resolvedHospitalId = hospitalId;
    if (!resolvedHospitalId) {
      const defaultHospital = await Hospital.findOne().select("_id");
      if (defaultHospital) {
        resolvedHospitalId = defaultHospital._id;
      }
    }

    if (!resolvedHospitalId) {
      return res.status(400).json({ message: "hospitalId is required" });
    }

    if (!isValidObjectId(resolvedHospitalId)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const hospital = await Hospital.findById(resolvedHospitalId).select("_id");
    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    const doctor = await Doctor.create({
      userId,
      department,
      experience,
      availability,
      hospitalId: resolvedHospitalId
    });

    return res.status(201).json({
      message: "Doctor profile created",
      doctor
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create doctor profile", error: error.message });
  }
};

const getDoctorUsersWithoutProfile = async (req, res) => {
  try {
    const doctorUsers = await User.find({ role: "doctor" }).select("name email");
    const doctorProfiles = await Doctor.find().select("userId");
    const usedUserIds = doctorProfiles.map((doc) => doc.userId.toString());

    const availableDoctors = doctorUsers.filter(
      (user) => !usedUserIds.includes(user._id.toString())
    );

    return res.status(200).json({ data: availableDoctors, doctors: availableDoctors });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch available doctors", error: error.message });
  }
};

const updateDoctor = async (req, res) => {
  res.status(200).json({ message: "Update doctor placeholder" });
};

const deleteDoctor = async (req, res) => {
  res.status(200).json({ message: "Delete doctor placeholder" });
};

module.exports = {
  getDoctors,
  getDoctorById,
  createDoctorProfile,
  getDoctorUsersWithoutProfile,
  updateDoctor,
  deleteDoctor
};
