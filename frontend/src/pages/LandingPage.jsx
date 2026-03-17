import { Link } from "react-router-dom";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-12 text-center">
        <p className="text-sm font-semibold tracking-[0.4em] text-slate-500">
          HOSPITAL ECOSYSTEM
        </p>
        <h1 className="mt-4 text-4xl font-bold text-slate-900 md:text-6xl">
          HOSPITAL ECOSYSTEM
        </h1>
        <p className="mt-4 text-lg text-slate-600 md:text-xl">
          Smart Digital Healthcare Platform
        </p>

        <div className="mt-8 grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Patient Portal", to: "/login" },
            { label: "Doctor Login", to: "/login" },
            { label: "Reception Login", to: "/login" },
            { label: "Admin Login", to: "/login" }
          ].map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="mt-12 w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Platform Highlights</h2>
          <ul className="mt-4 grid gap-3 text-left text-sm text-slate-600 sm:grid-cols-2">
            <li className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
              Digital Medical Vault
            </li>
            <li className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
              AI Symptom Triage
            </li>
            <li className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
              Appointment Management
            </li>
            <li className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
              Role-Based Hospital Dashboards
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
