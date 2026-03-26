// seedData.js

import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

import User from "./models/User.js";
import Hospital from "./models/Hospital.js";
import Appointment from "./models/Appointment.js";
import MedicalRecord from "./models/MedicalRecord.js";

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    // -------- CLEAR EVERYTHING --------
    await User.deleteMany();
    await Hospital.deleteMany();
    await Appointment.deleteMany();
    await MedicalRecord.deleteMany();

    console.log("All old data cleared");

    // -------- CREATE ONLY SYSTEM ADMIN --------
    const hashedPassword = await bcrypt.hash("123456", 10);

    await User.create({
      name: "System Admin",
      email: "sysadmin@health.com",
      password: hashedPassword,
      role: "system_admin"
    });

    console.log("\n✅ CLEAN SETUP READY");
    console.log("Login Credentials:");
    console.log("System Admin → sysadmin@health.com / 123456");

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedData();