// Access controller for doctor requests and patient approvals
const { isValidObjectId } = require("mongoose");
const AccessControl = require("../models/AccessControl");
const Doctor = require("../models/Doctor");
const User = require("../models/User");
const { getIO } = require("../socket");

const requestAccess = async (req, res) => {
  try {
    const { patientHealthId } = req.body;

    if (!patientHealthId) {
      return res.status(400).json({ message: "patientHealthId is required" });
    }

    if (!isValidObjectId(req.user.id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const doctor = await Doctor.findOne({ userId: req.user.id }).select("hospitalId");
    if (!doctor || !doctor.hospitalId) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const existingAccess = await AccessControl.findOne({
      patientHealthId,
      hospitalId: doctor.hospitalId,
      doctorId: req.user.id
    });

    if (existingAccess) {
      return res.status(200).json({ message: "Access already exists or pending" });
    }

    await AccessControl.create({
      patientHealthId,
      hospitalId: doctor.hospitalId,
      doctorId: req.user.id,
      granted: false,
      grantedBy: null
    });

    const io = getIO();
    io.emit("accessRequested", {
      patientHealthId,
      hospitalId: doctor.hospitalId,
      doctorId: req.user.id
    });

    return res.status(201).json({ message: "Access request sent" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to request access", error: error.message });
  }
};

const getAccessRequests = async (req, res) => {
  try {
    if (!isValidObjectId(req.user.id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const user = await User.findById(req.user.id).select("healthId");
    if (!user || !user.healthId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const requests = await AccessControl.find({
      patientHealthId: user.healthId,
      granted: false
    })
      .populate("hospitalId", "name")
      .sort({ createdAt: -1 });

    const formatted = requests.map((access) => ({
      ...access.toObject(),
      hospitalName: access.hospitalId?.name || "Unknown Hospital"
    }));

    return res.status(200).json({ message: "Access requests fetched", data: formatted });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch access requests", error: error.message });
  }
};

const approveAccess = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const access = await AccessControl.findById(id);
    if (!access) {
      return res.status(404).json({ message: "Access request not found" });
    }

    if (!isValidObjectId(req.user.id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const user = await User.findById(req.user.id).select("healthId");
    if (!user || !user.healthId || user.healthId !== access.patientHealthId) {
      return res.status(403).json({ message: "Access denied" });
    }

    await AccessControl.findByIdAndUpdate(id, {
      granted: true,
      grantedBy: "patient",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    const io = getIO();
    io.emit("accessGranted", {
      patientHealthId: access.patientHealthId,
      hospitalId: access.hospitalId
    });
    io.emit("accessApproved", {
      patientHealthId: access.patientHealthId,
      hospitalId: access.hospitalId,
      doctorId: access.doctorId || null
    });

    return res.status(200).json({ message: "Access granted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to approve access", error: error.message });
  }
};

const rejectAccess = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const access = await AccessControl.findById(id);
    if (!access) {
      return res.status(404).json({ message: "Access request not found" });
    }

    if (!isValidObjectId(req.user.id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const user = await User.findById(req.user.id).select("healthId");
    if (!user || !user.healthId || user.healthId !== access.patientHealthId) {
      return res.status(403).json({ message: "Access denied" });
    }

    await AccessControl.findByIdAndDelete(id);

    return res.status(200).json({ message: "Access request rejected" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to reject access", error: error.message });
  }
};

module.exports = {
  requestAccess,
  getAccessRequests,
  approveAccess,
  rejectAccess
};
