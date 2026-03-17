const Patient = require("../models/Patient");
const generateHealthId = require("./generateHealthId");

const createPatientWithUniqueHealthId = async (data) => {
  let attempts = 0;

  while (attempts < 5) {
    const healthId = generateHealthId();

    try {
      const patient = await Patient.create({
        ...data,
        healthId
      });
      return patient;
    } catch (error) {
      if (error.code === 11000 && error.keyPattern?.healthId) {
        attempts += 1;
        continue;
      }
      throw error;
    }
  }

  throw new Error("Failed to generate unique healthId after multiple attempts");
};

module.exports = createPatientWithUniqueHealthId;
