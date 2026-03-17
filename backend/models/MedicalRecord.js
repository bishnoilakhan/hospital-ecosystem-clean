// Medical record model representing the Digital Medical Vault
const mongoose = require("mongoose");

const medicalRecordSchema = new mongoose.Schema(
  {
    patientHealthId: {
      type: String,
      required: true,
      trim: true
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true
    },
    diagnosis: {
      type: String,
      required: true,
      trim: true
    },
    prescription: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    notes: {
      type: String,
      default: "",
      trim: true
    },
    reports: {
      type: [String],
      default: []
    },
    date: {
      type: Date,
      default: Date.now
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);
