// Authentication controller for registration and login
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Patient = require("../models/Patient");
const createPatientWithUniqueHealthId = require("../utils/createPatientWithUniqueHealthId");

const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = "patient",
      age,
      gender,
      bloodGroup,
      allergies = [],
      chronicDiseases = [],
      phone
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, and password are required" });
    }

    const allowedRoles = ["patient", "doctor", "receptionist", "admin"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (role !== "patient") {
      return res.status(403).json({ message: "Only patients can self-register" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (role === "patient") {
      if (!age || !gender || !phone || !bloodGroup) {
        return res.status(400).json({
          message: "age, gender, phone and bloodGroup are required for patients"
        });
      }

      const existingPatient = await Patient.findOne({ phone }).select("healthId");
      if (existingPatient) {
        return res.status(409).json({
          message: "Patient already exists. Use Health ID to activate portal.",
          healthId: existingPatient.healthId
        });
      }

      try {
        const patient = await createPatientWithUniqueHealthId({
          name,
          age,
          gender,
          bloodGroup,
          allergies,
          chronicDiseases,
          phone
        });

        await User.create({
          name,
          email,
          password: hashedPassword,
          role: "patient",
          healthId: patient.healthId
        });

        return res.status(201).json({
          message: "Patient registered successfully",
          healthId: patient.healthId
        });
      } catch (error) {
        if (error.code === 11000 && error.keyPattern?.phone) {
          return res
            .status(409)
            .json({ message: "Patient with this phone number already exists" });
        }
        throw error;
      }
    }

    await User.create({
      name,
      email,
      password: hashedPassword,
      role
    });

    return res.status(201).json({
      message: "User created successfully"
    });
  } catch (error) {
    return res.status(500).json({ message: "Registration failed", error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.active === false) {
      return res.status(403).json({ message: "Account is disabled. Contact administrator." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      role: user.role,
      hospitalId: user.hospitalId || null
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed", error: error.message });
  }
};

const activatePatient = async (req, res) => {
  try {
    const { healthId, email, password, name } = req.body;

    if (!healthId || !email || !password) {
      return res.status(400).json({ message: "healthId, email, and password are required" });
    }

    const patient = await Patient.findOne({ healthId });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ message: "User already exists with this email" });
    }

    const existingPatientUser = await User.findOne({ healthId });
    if (existingPatientUser) {
      return res.status(409).json({ message: "Patient account already activated" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: patient.name,
      email,
      password: hashedPassword,
      role: "patient",
      healthId
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      message: "Patient account activated",
      token,
      role: user.role
    });
  } catch (error) {
    return res.status(500).json({ message: "Activation failed", error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  activatePatient
};
