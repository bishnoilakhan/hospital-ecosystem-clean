const analyzeSymptoms = (symptoms = "") => {
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

  let priorityScore = 2;
  if (urgency === "High") priorityScore = 8;
  if (urgency === "Medium") priorityScore = 5;

  return { department, urgency, priorityScore };
};

module.exports = { analyzeSymptoms };
