import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { activatePatient } from "../services/api";
import { formatLabel } from "../utils/format";

const ActivateAccount = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    healthId: "",
    email: "",
    password: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleActivate = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await activatePatient({
        healthId: form.healthId.trim(),
        email: form.email.trim(),
        password: form.password
      });
      toast.success("Account activated");
      navigate("/login");
    } catch (error) {
      toast.error("Activation failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-semibold text-slate-900">
          {formatLabel("Activate Patient Portal")}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Use your Health ID to create a login account.
        </p>

        <form onSubmit={handleActivate} className="mt-6 grid gap-4">
          <label className="text-sm text-slate-600">
            Health ID
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-base text-slate-900"
              name="healthId"
              value={form.healthId}
              onChange={handleChange}
              required
            />
          </label>
          <label className="text-sm text-slate-600">
            Email
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-base text-slate-900"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </label>
          <label className="text-sm text-slate-600">
            Password
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-base text-slate-900"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </label>
          <button
            className="rounded-lg bg-blue-600 px-4 py-3 text-base font-semibold text-white hover:bg-blue-700"
            type="submit"
            disabled={submitting}
          >
            {submitting ? (
              <div className="mx-auto h-5 w-5 animate-spin rounded-full border-b-2 border-white" />
            ) : (
              "Activate Account"
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already activated?{" "}
          <Link to="/login" className="font-medium text-blue-600 hover:underline">
            Go to login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ActivateAccount;
