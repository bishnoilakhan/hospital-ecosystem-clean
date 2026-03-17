// Symptom triage controller using simple rule-based matching
const analyzeSymptoms = async (req, res) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms || typeof symptoms !== "string") {
      return res.status(400).json({ message: "symptoms is required" });
    }

    const normalized = symptoms.toLowerCase();

    let department = "General Medicine";
    let urgency = "Low";

    if (normalized.includes("chest pain")) {
      department = "Cardiology";
      urgency = "High";
    } else if (normalized.includes("skin rash")) {
      department = "Dermatology";
      urgency = "Low";
    } else if (normalized.includes("headache")) {
      department = "Neurology";
      urgency = "Medium";
    } else if (normalized.includes("fever")) {
      department = "General Medicine";
      urgency = "Medium";
    } else if (normalized.includes("stomach pain")) {
      department = "Gastroenterology";
      urgency = "Medium";
    } else if (normalized.includes("cough")) {
      department = "Pulmonology";
      urgency = "Medium";
    }

    return res.status(200).json({ department, urgency });
  } catch (error) {
    return res.status(500).json({ message: "Failed to analyze symptoms", error: error.message });
  }
};

module.exports = { analyzeSymptoms };
