// Access control model for patient-hospital permissions
const mongoose = require("mongoose");

const accessControlSchema = new mongoose.Schema(
  {
    patientHealthId: {
      type: String,
      required: true,
      trim: true
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true
    },
    granted: {
      type: Boolean,
      default: false
    },
    grantedBy: {
      type: String,
      enum: ["system", "patient", null],
      default: null
    },
    expiresAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AccessControl", accessControlSchema);
