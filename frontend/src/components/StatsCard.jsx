import { formatLabel } from "../utils/format";

const StatsCard = ({ title, value, icon }) => {
  const formattedTitle = typeof title === "string" ? formatLabel(title) : title;
  return (
    <div className="flex flex-col items-center justify-center rounded-lg bg-white p-4 text-center shadow">
      {icon && <div className="mb-2 text-2xl">{icon}</div>}
      <h3 className="text-sm text-gray-500">{formattedTitle}</h3>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
};

export default StatsCard;
