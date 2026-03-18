export const PrimaryButton = ({ children, className = "", ...props }) => (
  <button
    className={`bg-blue-600 hover:bg-blue-700 active:scale-95 transition text-white px-4 py-2 rounded-xl font-medium shadow-sm disabled:opacity-50 ${className}`}
    {...props}
  >
    {children}
  </button>
);

export const SecondaryButton = ({ children, className = "", ...props }) => (
  <button
    className={`bg-gray-100 hover:bg-gray-200 active:scale-95 transition text-gray-800 px-4 py-2 rounded-xl ${className}`}
    {...props}
  >
    {children}
  </button>
);

export const Input = ({ className = "", ...props }) => (
  <input
    className={`w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    {...props}
  />
);

export const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl shadow-sm p-5 ${className}`}>{children}</div>
);

export const Badge = ({ children, color = "gray" }) => {
  const colors = {
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700"
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-full ${colors[color]}`}>
      {children}
    </span>
  );
};
