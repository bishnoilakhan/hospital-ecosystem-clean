import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const SidebarLink = ({ to, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `block rounded-lg px-4 py-2 text-sm font-medium transition ${
        isActive
          ? "bg-blue-600 text-white"
          : "text-slate-100 hover:bg-blue-700 hover:text-white"
      }`
    }
  >
    {label}
  </NavLink>
);

const DashboardLayout = ({ title, children }) => {
  const navigate = useNavigate();
  const { role, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen flex-col md:flex-row">
        <aside className="w-full bg-slate-900 px-6 py-8 text-white md:w-64">
          <div className="mb-8">
            <h2 className="text-xl font-semibold">Hospital Ecosystem</h2>
            <p className="mt-1 text-xs text-blue-200">Care Console</p>
          </div>
          <nav className="flex flex-col gap-2">
            {role === "system_admin" ? (
              <SidebarLink to="/system-admin" label="System Dashboard" />
            ) : (
              <>
                {role === "patient" && <SidebarLink to="/patient" label="Patient Dashboard" />}
                {role === "doctor" && <SidebarLink to="/doctor" label="Doctor Dashboard" />}
                {role === "receptionist" && (
                  <SidebarLink to="/reception" label="Reception Dashboard" />
                )}
                {role === "admin" && <SidebarLink to="/admin" label="Admin Dashboard" />}
              </>
            )}
          </nav>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Dashboard</p>
              <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                Role: {role || "guest"}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Logout
              </button>
            </div>
          </header>

          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
