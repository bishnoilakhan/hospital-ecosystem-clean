import { NavLink } from "react-router-dom";

const NavItem = ({ to, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `px-3 py-2 text-sm font-medium transition ${
        isActive ? "text-slate-900" : "text-slate-500 hover:text-slate-900"
      }`
    }
  >
    {label}
  </NavLink>
);

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-slate-900 text-white grid place-items-center font-semibold">
            H
          </div>
          <div>
            <p className="text-sm text-slate-500">Hospital Ecosystem</p>
            <p className="text-lg font-semibold text-slate-900">Care Console</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <NavItem to="/" label="Login" />
          <NavItem to="/register" label="Register" />
          <NavItem to="/patient" label="Patient" />
          <NavItem to="/doctor" label="Doctor" />
          <NavItem to="/reception" label="Reception" />
          <NavItem to="/admin" label="Admin" />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
