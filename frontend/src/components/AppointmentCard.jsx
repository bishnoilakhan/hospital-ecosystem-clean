import { formatLabel, formatName } from "../utils/format";
import { getSymptomText } from "../utils/symptoms";

const AppointmentCard = ({
  appointment,
  onComplete,
  disableComplete,
  onOpenConsultation
}) => {
  if (!appointment) return null;

  const patientName = formatName(appointment.patient?.name || "Unknown") || "Unknown";
  const patientAge = appointment.patient?.age || "N/A";
  const patientBloodGroup = appointment.patient?.bloodGroup || "N/A";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            {formatLabel("Patient")}
          </p>
          <p className="text-sm font-semibold text-slate-900">{patientName}</p>
          <p className="text-xs text-slate-500">
            {patientAge} · {patientBloodGroup}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {appointment.status}
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-500">
        {appointment.date ? new Date(appointment.date).toLocaleString() : "Date not set"}
      </p>
      <p className="mt-1 text-sm text-gray-600">
        <span className="font-medium">Symptoms:</span>{" "}
        {getSymptomText(appointment)}
      </p>
      <p className="mt-1 text-sm text-gray-600">
        <span className="font-medium">Department:</span>{" "}
        {appointment.department || "GENERAL"}
      </p>
      <div className="mt-4 grid gap-2">
        {onOpenConsultation && (
          <button
            className="w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            onClick={onOpenConsultation}
          >
            Open Consultation
          </button>
        )}
        {onComplete && (
          <button
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onComplete}
            disabled={disableComplete}
          >
            Complete Appointment
          </button>
        )}
      </div>
    </div>
  );
};

export default AppointmentCard;
