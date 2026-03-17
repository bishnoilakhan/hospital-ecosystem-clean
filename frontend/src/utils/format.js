export const formatName = (name = "") =>
  name
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export const formatDoctorName = (name = "") =>
  `DR. ${formatName(name.replace(/^dr\.?\s*/i, ""))}`.trim();

export const formatDepartment = (dept = "") => dept.toUpperCase();

export const formatMedicine = (name = "") => formatName(name);

export const formatLabel = (text = "") =>
  text
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
