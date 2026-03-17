export const getPriorityLabel = (score = 0) => {
  if (score >= 10) return "Emergency";
  if (score >= 7) return "High";
  if (score >= 4) return "Medium";
  return "Low";
};

export const getPriorityColor = (score = 0) => {
  if (score >= 10) return "bg-red-500";
  if (score >= 7) return "bg-orange-400";
  if (score >= 4) return "bg-blue-500";
  return "bg-gray-400";
};

export const isEmergency = (score = 0) => score === 10;
