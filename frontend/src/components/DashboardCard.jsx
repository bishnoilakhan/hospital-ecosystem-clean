import { formatLabel } from "../utils/format";

const DashboardCard = ({ title, description, buttonText, onClick, children }) => {
  const formattedTitle = typeof title === "string" ? formatLabel(title) : title;
  const formattedButtonText =
    typeof buttonText === "string" ? formatLabel(buttonText) : buttonText;

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{formattedTitle}</h3>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
        {formattedButtonText && (
          <button
            onClick={onClick}
            className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
            type="button"
          >
            {formattedButtonText}
          </button>
        )}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
};

export default DashboardCard;
