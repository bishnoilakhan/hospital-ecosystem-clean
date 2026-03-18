import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const Login = () => {
  const navigate = useNavigate();
  const auth = useAuth() || {};
  const login = auth.login || (() => {});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const data = await loginUser({ email, password });
      console.log("Login response:", data);

      if (!data?.role) {
        console.error("Role missing in response");
        toast.error("Login failed: role missing");
        return;
      }

      const role = (data?.role || "").toLowerCase();
      login(data?.token, role, data?.hospitalId);
      toast.success("Login successful");

      if (role === "system_admin") navigate("/system-admin");
      else if (role === "admin") navigate("/admin");
      else if (role === "doctor") navigate("/doctor");
      else if (role === "receptionist") navigate("/reception");
      else if (role === "patient") navigate("/patient");
      else {
        console.error("Unknown role:", role);
        toast.error("Invalid role");
      }
    } catch (error) {
      console.error("Login error:", error);
      if (error?.status === 401) {
        toast.error("Invalid email or password");
      } else {
        toast.error("Server error. Please try again later.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!email && !password) {
    // state is initialized but keep a safe fallback
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-semibold text-slate-900">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-500">
          Sign in to access your hospital dashboard.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <label className="text-sm text-slate-600">
            Email
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-base text-slate-900"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              required
            />
          </label>
          <label className="text-sm text-slate-600">
            Password
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-base text-slate-900"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
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
              "Login"
            )}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-medium text-blue-600 hover:underline">
            Register here
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-gray-600">
          <Link to="/activate-account" className="font-medium text-blue-600 hover:underline">
            Activate Patient Portal
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Login;
