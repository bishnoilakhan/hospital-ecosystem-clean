require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const connectDB = require("./config/db");

const User = require("./models/User");
const Patient = require("./models/Patient");
const Doctor = require("./models/Doctor");
const Hospital = require("./models/Hospital");
const Appointment = require("./models/Appointment");
const MedicalRecord = require("./models/MedicalRecord");

const seed = async () => {
  try {
    await connectDB();

    console.log("🧹 Resetting DB...");

    await Promise.all([
      User.deleteMany({}),
      Patient.deleteMany({}),
      Doctor.deleteMany({}),
      Hospital.deleteMany({}),
      Appointment.deleteMany({}),
      MedicalRecord.deleteMany({})
    ]);

    const password = await bcrypt.hash("123456", 10);

    console.log("🏥 Creating hospitals...");

    const hospitals = await Hospital.insertMany([
      { name: "CITY HOSPITAL", address: "Delhi", phone: "1111111111" },
      { name: "METRO CARE", address: "Mumbai", phone: "2222222222" },
      { name: "HEALTH PLUS", address: "Jaipur", phone: "3333333333" }
    ]);

    console.log("👑 Creating system admin...");

    const systemAdmin = await User.create({
      name: "SYSTEM ADMIN",
      email: "system@hospital.com",
      password,
      role: "system_admin",
      active: true
    });

    console.log("🏥 Creating hospital admins...");

    const hospitalAdmins = [];

    for (let i = 0; i < hospitals.length; i++) {
      hospitalAdmins.push({
        name: `Admin ${i + 1}`,
        email: `admin${i + 1}@hospital.com`,
        password,
        role: "admin",
        hospitalId: hospitals[i]._id,
        active: true
      });
    }

    await User.insertMany(hospitalAdmins);

    console.log("🧑‍💼 Creating receptionists...");

    const receptionists = [];

    for (let i = 0; i < 3; i++) {
      receptionists.push({
        name: `Reception ${i + 1}`,
        email: `reception${i + 1}@hospital.com`,
        password,
        role: "receptionist",
        hospitalId: hospitals[i]._id,
        active: true
      });
    }

    await User.insertMany(receptionists);

    console.log("👨‍⚕️ Creating doctors...");

    const doctorUsers = [];

    for (let i = 0; i < 10; i++) {
      doctorUsers.push({
        name: `Dr Doctor ${i + 1}`,
        email: `doctor${i + 1}@hospital.com`,
        password,
        role: "doctor",
        hospitalId: hospitals[i % hospitals.length]._id,
        active: true
      });
    }

    const createdDoctorUsers = await User.insertMany(doctorUsers);

    const departments = ["CARDIOLOGY", "ORTHOPEDICS", "DERMATOLOGY", "NEUROLOGY"];

    const doctors = createdDoctorUsers.map((user, i) => ({
      userId: user._id,
      hospitalId: user.hospitalId,
      department: departments[i % departments.length],
      experience: 5 + i,
      availability: "Mon-Fri"
    }));

    const createdDoctors = await Doctor.insertMany(doctors);

    console.log("👤 Creating patients...");

    const patients = [];

    for (let i = 0; i < 12; i++) {
      const healthId = `HID-${Math.floor(100000 + Math.random() * 900000)}`;

      const patient = await Patient.create({
        name: `Patient ${i + 1}`,
        healthId,
        age: 20 + i,
        gender: i % 2 === 0 ? "Male" : "Female",
        bloodGroup: ["A+", "B+", "O+", "AB+"][i % 4],
        phone: `99900000${i}`
      });

      await User.create({
        name: `Patient ${i + 1}`,
        email: `patient${i}@mail.com`,
        password,
        role: "patient",
        healthId,
        active: true
      });

      patients.push(patient);
    }

    console.log("📅 Creating appointments...");

    const appointments = [];

    for (let i = 0; i < 20; i++) {
      const patient = patients[i % patients.length];
      const doctor = createdDoctors[i % createdDoctors.length];

      appointments.push({
        patientHealthId: patient.healthId,
        doctorId: doctor._id,
        hospitalId: doctor.hospitalId,
        date: new Date(),
        status: "scheduled"
      });
    }

    const createdAppointments = await Appointment.insertMany(appointments);

    console.log("📄 Creating medical records...");

    const records = createdAppointments.slice(0, 15).map(appt => ({
      patientHealthId: appt.patientHealthId,
      doctorId: appt.doctorId,
      hospitalId: appt.hospitalId,
      diagnosis: "General Checkup",
      prescription: [
        { medicine: "Paracetamol", dose: "500mg", frequency: "2x", duration: "5 days" }
      ],
      notes: "Routine check",
      date: new Date()
    }));

    await MedicalRecord.insertMany(records);

    console.log("✅ SEED COMPLETE");

    console.log("\n🔑 LOGIN CREDENTIALS:");
    console.log("System Admin → system@hospital.com / 123456");
    console.log("Hospital Admin → admin1@hospital.com / 123456");
    console.log("Doctor → doctor1@hospital.com / 123456");
    console.log("Reception → reception1@hospital.com / 123456");
    console.log("Patient → patient0@mail.com / 123456");

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();