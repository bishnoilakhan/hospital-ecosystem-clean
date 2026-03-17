// Admin controller for managing staff accounts and system stats
const bcrypt = require("bcryptjs");
const { isValidObjectId } = require("mongoose");
const User = require("../models/User");
const Appointment = require("../models/Appointment");
const MedicalRecord = require("../models/MedicalRecord");
const AuditLog = require("../models/AuditLog");
const Hospital = require("../models/Hospital");

const createStaffUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "name, email, password, and role are required" });
    }

    const requester = await User.findById(req.user.id).select("role hospitalId");
    if (!requester) {
      return res.status(404).json({ message: "Requesting user not found" });
    }

    const allowedRoles = ["doctor", "receptionist", "admin"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid staff role" });
    }

    if (requester.role === "admin" && role === "admin") {
      return res.status(403).json({ message: "Hospital admins cannot create admin users" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let resolvedHospitalId = null;
    if (requester.role === "admin") {
      if (!requester.hospitalId) {
        return res.status(400).json({ message: "Admin hospital not set" });
      }
      resolvedHospitalId = requester.hospitalId;
    } else if (requester.role === "system_admin") {
      if (role === "admin" || role === "doctor" || role === "receptionist") {
        resolvedHospitalId = req.body.hospitalId || null;
        if (!resolvedHospitalId) {
          return res.status(400).json({ message: "hospitalId is required" });
        }
      }
    }

    if (resolvedHospitalId) {
      if (!isValidObjectId(resolvedHospitalId)) {
        return res.status(400).json({ message: "Invalid id" });
      }
      const hospital = await Hospital.findById(resolvedHospitalId).select("_id");
      if (!hospital) {
        return res.status(404).json({ message: "Hospital not found" });
      }
    }

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      hospitalId: resolvedHospitalId
    });

    return res.status(201).json({
      message: "Staff user created",
      userId: user._id
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create staff user", error: error.message });
  }
};

const createHospitalAdmin = async (req, res) => {
  try {
    const { name, email, password, hospitalId } = req.body;

    if (!name || !email || !password || !hospitalId) {
      return res.status(400).json({
        message: "name, email, password, and hospitalId are required"
      });
    }

    if (!isValidObjectId(hospitalId)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const hospital = await Hospital.findById(hospitalId).select("_id");
    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
      hospitalId
    });

    return res.status(201).json({
      message: "Hospital admin created",
      userId: user._id
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create hospital admin", error: error.message });
  }
};

const getSystemStats = async (req, res) => {
  try {
    const totalPatients = await User.countDocuments({ role: "patient" });
    const totalDoctors = await User.countDocuments({ role: "doctor" });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const appointmentsToday = await Appointment.countDocuments({
      date: { $gte: todayStart, $lte: todayEnd }
    });
    const medicalRecords = await MedicalRecord.countDocuments();

    return res.json({
      totalPatients,
      totalDoctors,
      appointmentsToday,
      medicalRecords
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch system stats", error: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const requester = await User.findById(req.user.id).select("role hospitalId");
    if (!requester) {
      return res.status(404).json({ message: "Requesting user not found" });
    }

    const filter =
      requester.role === "system_admin"
        ? {}
        : { hospitalId: requester.hospitalId || null };

    const users = await User.find(filter)
      .select("name email role active hospitalId")
      .sort({ createdAt: -1 });

    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch users", error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const targetUser = await User.findById(id).select("role email hospitalId");
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const requester = await User.findById(req.user.id).select("role hospitalId");
    if (!requester) {
      return res.status(404).json({ message: "Requesting user not found" });
    }

    if (requester.role === "admin") {
      if (!requester.hospitalId) {
        return res.status(403).json({ message: "Admin hospital not set" });
      }
      if (targetUser.hospitalId?.toString() !== requester.hospitalId.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    if (
      targetUser.role === "admin" &&
      requester.role === "admin" &&
      targetUser._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message: "Admin accounts cannot edit other admin accounts."
      });
    }

    const { name, email, role, active } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (role !== undefined) {
      const allowedRoles = ["patient", "doctor", "receptionist", "admin"];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      updates.role = role;
    }
    if (active !== undefined) updates.active = active;

    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return res.status(409).json({ message: "User already exists with this email" });
      }
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true }).select(
      "name email role active"
    );

    await AuditLog.create({
      adminId: req.user.id,
      action: "UPDATE_USER",
      targetUserId: targetUser._id
    });

    return res.status(200).json({ message: "User updated", user });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "User already exists with this email" });
    }
    return res.status(500).json({ message: "Failed to update user", error: error.message });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .sort({ timestamp: -1 })
      .select("adminId action targetUserId timestamp");

    return res.status(200).json({ logs });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch audit logs", error: error.message });
  }
};

module.exports = {
  createStaffUser,
  createHospitalAdmin,
  getSystemStats,
  getUsers,
  updateUser,
  getAuditLogs
};
