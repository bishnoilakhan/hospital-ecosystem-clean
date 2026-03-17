import { isEmergency } from "../utils/priority";

const EmergencyBadge = ({ priorityScore }) => {
  if (!isEmergency(priorityScore)) return null;

  return (
    <span className="ml-2 rounded bg-red-600 px-2 py-1 text-xs text-white">
      EMERGENCY
    </span>
  );
};

export default EmergencyBadge;
