// Patient profile model for demographic and health information
const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    healthId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    age: {
      type: Number,
      required: true
    },
    gender: {
      type: String,
      required: true,
      trim: true
    },
    bloodGroup: {
      type: String,
      required: true,
      trim: true
    },
    allergies: {
      type: [String],
      default: []
    },
    chronicDiseases: {
      type: [String],
      default: []
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Patient", patientSchema);
