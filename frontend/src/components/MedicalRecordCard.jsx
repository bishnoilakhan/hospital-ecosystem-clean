const MedicalRecordCard = ({ record }) => {
  if (!record) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Diagnosis</p>
          <p className="text-sm font-semibold text-slate-900">{record.diagnosis}</p>
        </div>
        <span className="text-xs text-slate-400">
          {record.date ? new Date(record.date).toLocaleDateString() : "N/A"}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        <span className="font-medium text-slate-700">Prescription:</span> {record.prescription}
      </p>
      {record.notes && (
        <p className="mt-2 text-sm text-slate-500">
          <span className="font-medium text-slate-700">Notes:</span> {record.notes}
        </p>
      )}
    </div>
  );
};

export default MedicalRecordCard;
