import { formatDoctorName, formatLabel, formatMedicine } from "../utils/format";

const MedicalTimeline = ({ records = [] }) => {
  const sortedRecords = [...records].sort((a, b) => {
    const dateA = new Date(a.date || 0).getTime();
    const dateB = new Date(b.date || 0).getTime();
    return dateB - dateA;
  });

  if (sortedRecords.length === 0) {
    return <p className="text-sm text-slate-500">No records loaded yet.</p>;
  }

  return (
    <div className="space-y-6 border-l-2 border-gray-300 pl-6">
      {sortedRecords.map((record) => (
        <div key={record._id || record.date} className="relative">
          <span className="absolute left-0 top-3 h-3 w-3 -translate-x-1/2 rounded-full bg-blue-600" />
          <div className="relative rounded-lg bg-white p-4 shadow">
            <p className="text-xs text-slate-400">
              {record.date ? new Date(record.date).toLocaleDateString() : "N/A"}
            </p>
            <h4 className="mt-2 text-sm font-semibold text-slate-900">
              {record.diagnosis || "Diagnosis"}
            </h4>
            <p className="mt-2 text-sm text-gray-600">
              {formatLabel("Doctor")}:{" "}
              <span className="font-medium text-slate-700">
                {record.doctorName ? formatDoctorName(record.doctorName) : "Unknown"}
              </span>
            </p>
            <p className="text-sm text-gray-600">
              {formatLabel("Hospital")}:{" "}
              <span className="font-medium text-slate-700">
                {record.hospitalName || "Unknown"}
              </span>
            </p>
            <div className="mt-2 text-sm text-slate-600">
              <span className="font-medium text-slate-700">
                {formatLabel("Prescription")}:
              </span>{" "}
              {Array.isArray(record.prescription) ? (
                <ul className="mt-1 list-disc pl-4 text-sm text-slate-600">
                  {record.prescription.map((med, index) => (
                    <li key={`${med.medicine || "med"}-${index}`}>
                      {formatMedicine(med.medicine || "")} {med.dose ? `- ${med.dose}` : ""}{" "}
                      {med.frequency ? `(${med.frequency})` : ""}{" "}
                      {med.duration ? `for ${med.duration}` : ""}
                    </li>
                  ))}
                </ul>
              ) : (
                <span>{record.prescription || "Not available"}</span>
              )}
            </div>
            {record.notes && (
              <p className="mt-2 text-sm text-slate-500">
                <span className="font-medium text-slate-700">
                  {formatLabel("Notes")}:
                </span>{" "}
                {record.notes}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MedicalTimeline;
