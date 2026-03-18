const extractSymptoms = (text = "") => {
  return text
    .split(/[,;.\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

module.exports = { extractSymptoms };
