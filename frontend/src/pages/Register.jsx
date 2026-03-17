import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { registerUser } from "../services/api";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    age: "",
    gender: "",
    bloodGroup: "",
    allergies: "",
    chronicDiseases: "",
    phone: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const isFormValid =
    form.name &&
    form.email &&
    form.password &&
    form.age &&
    form.gender &&
    form.bloodGroup &&
    form.phone;
  const isValidBloodGroup = (value) => /^(A|B|AB|O)[+-]$/i.test(value.trim());

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextValue = name === "bloodGroup" ? value.toUpperCase() : value;
    setForm((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.bloodGroup) {
      toast.error("Blood group is required");
      return;
    }
    if (!isValidBloodGroup(form.bloodGroup)) {
      toast.error("Invalid blood group format (e.g., A+, O-, AB+)");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: "patient"
      };

      payload.age = Number(form.age);
      payload.gender = form.gender;
      payload.bloodGroup = form.bloodGroup;
      payload.allergies = form.allergies ? form.allergies.split(",").map((item) => item.trim()) : [];
      payload.chronicDiseases = form.chronicDiseases
        ? form.chronicDiseases.split(",").map((item) => item.trim())
        : [];
      payload.phone = form.phone;

      await registerUser(payload);
      toast.success("Registration successful");
      navigate("/");
    } catch (error) {
      toast.error("Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-3xl rounded-lg bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-semibold text-slate-900">Create an account</h1>
        <p className="mt-1 text-sm text-slate-500">
          Register patients or staff with role-based details.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-600">
              Name
              <input
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-base text-slate-900"
                name="name"
                value={form.name}
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
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm text-slate-600">
              Age
              <input
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-base text-slate-900"
                name="age"
                value={form.age}
                onChange={handleChange}
                type="number"
                min="0"
                required
              />
            </label>
            <label className="text-sm text-slate-600">
              Gender
              <input
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-base text-slate-900"
                name="gender"
                value={form.gender}
                onChange={handleChange}
                required
              />
            </label>
            <label className="text-sm text-slate-600">
              Blood Group
              <input
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-base text-slate-900"
                name="bloodGroup"
                value={form.bloodGroup}
                onChange={handleChange}
                required
              />
            </label>
            <label className="text-sm text-slate-600 md:col-span-2">
              Allergies (comma separated)
              <input
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-base text-slate-900"
                name="allergies"
                value={form.allergies}
                onChange={handleChange}
              />
            </label>
            <label className="text-sm text-slate-600">
              Chronic Diseases
              <input
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-base text-slate-900"
                name="chronicDiseases"
                value={form.chronicDiseases}
                onChange={handleChange}
              />
            </label>
            <label className="text-sm text-slate-600 md:col-span-3">
              Phone
              <input
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-base text-slate-900"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          <button
            className="rounded-lg bg-blue-600 px-4 py-3 text-base font-semibold text-white hover:bg-blue-700"
            type="submit"
            disabled={submitting || !isFormValid}
          >
            {submitting ? (
              <div className="mx-auto h-5 w-5 animate-spin rounded-full border-b-2 border-white" />
            ) : (
              "Register"
            )}
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-500">
          Staff accounts are created by administrators.
        </p>
      </div>
    </div>
  );
};

export default Register;
