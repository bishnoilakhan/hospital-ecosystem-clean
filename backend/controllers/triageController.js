// Symptom triage controller using simple rule-based matching
const { analyzeSymptoms: analyzeSymptomsUtil } = require("../utils/triage");

const analyzeSymptoms = async (req, res) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms || typeof symptoms !== "string") {
      return res.status(400).json({ message: "symptoms is required" });
    }

    const result = analyzeSymptomsUtil(symptoms);

    return res.status(200).json({
      department: result.department,
      urgency: result.urgency,
      priorityScore: result.priorityScore
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to analyze symptoms", error: error.message });
  }
};

module.exports = { analyzeSymptoms };
