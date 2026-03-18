export const getSymptomText = (appointment) => {
  if (!appointment) return "N/A";

  if (appointment.structuredSymptoms?.length) {
    return appointment.structuredSymptoms.join(", ");
  }

  return appointment.rawSymptoms || appointment.symptoms || "N/A";
};
