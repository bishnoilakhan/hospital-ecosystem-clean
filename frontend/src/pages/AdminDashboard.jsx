import { useEffect, useState } from "react";
import {
  createDoctorProfile,
  getAdminStats,
  getDoctorUsersWithoutProfile,
  getUsers,
  updateUser
} from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import DashboardCard from "../components/DashboardCard";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import StatsCard from "../components/StatsCard";
import StatsSkeleton from "../components/StatsSkeleton";
import { formatDoctorName, formatName } from "../utils/format";

const AdminDashboard = () => {
  const { token } = useAuth();
  const [form, setForm] = useState({
    userId: "",
    department: "",
    experience: "",
    availability: ""
  });
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "doctor"
  });
  const [submitting, setSubmitting] = useState(false);
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "patient",
    active: true
  });
  const [updatingUser, setUpdatingUser] = useState(false);
  const [stats, setStats] = useState({
    totalDoctors: "—",
    totalPatients: "—",
    appointmentsToday: "—",
    medicalRecords: "—"
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleStaffChange = (event) => {
    setStaffForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleEditChange = (event) => {
    const { name, value, type, checked } = event.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        userId: selectedDoctor,
        department: form.department,
        experience: Number(form.experience),
        availability: form.availability
      };
      const data = await createDoctorProfile(payload, token);
      toast.success("Doctor profile created");
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateStaff = async (event) => {
    event.preventDefault();
    setCreatingStaff(true);
    try {
      const response = await fetch(
        "https://hospital-ecosystem-clean-backend.onrender.com/api/admin/create-staff",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(staffForm)
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Failed to create staff user");
      toast.success("Staff user created");
      setStaffForm({ name: "", email: "", password: "", role: "doctor" });
    } catch (error) {
      toast.error("Failed to create staff user");
    } finally {
      setCreatingStaff(false);
    }
  };

  const fetchStats = async () => {
    if (!token) return;
    setStatsLoading(true);
    try {
      const data = await getAdminStats(token);
      setStats({
        totalDoctors: data.totalDoctors,
        totalPatients: data.totalPatients,
        appointmentsToday: data.appointmentsToday,
        medicalRecords: data.medicalRecords
      });
    } catch (error) {
      toast.error("Failed to load stats");
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchDoctors = async () => {
    if (!token) return;
    try {
      const data = await getDoctorUsersWithoutProfile(token);
      setDoctors(data.doctors || []);
    } catch (error) {
      toast.error("Failed to load doctors");
    }
  };

  const fetchUsers = async () => {
    if (!token) return;
    try {
      const data = await getUsers(token);
      setUsers(data.users || []);
    } catch (error) {
      toast.error("Failed to load users");
    }
  };

  const openEditUser = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "patient",
      active: user.active !== false
    });
  };

  const closeEditUser = () => {
    setEditingUser(null);
  };

  const handleUpdateUser = async (event) => {
    event.preventDefault();
    if (!editingUser) return;
    setUpdatingUser(true);
    try {
      await updateUser(editingUser._id, editForm, token);
      toast.success("User updated");
      await fetchUsers();
      setEditingUser(null);
    } catch (error) {
      toast.error("Failed to update user");
    } finally {
      setUpdatingUser(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchDoctors();
    fetchUsers();
  }, [token]);

  const filteredUsers = users.filter((user) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      (user.name || "").toLowerCase().includes(query) ||
      (user.email || "").toLowerCase().includes(query)
    );
  });

  const doctorUsers = filteredUsers.filter((user) => user.role === "doctor");
  const patientUsers = filteredUsers.filter((user) => user.role === "patient");
  const receptionistUsers = filteredUsers.filter((user) => user.role === "receptionist");
  const adminUsers = filteredUsers.filter((user) => user.role === "admin");

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="container mx-auto grid gap-6">
        {!token && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Please log in as an admin to create doctor profiles.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {statsLoading ? (
            <>
              <StatsSkeleton />
              <StatsSkeleton />
              <StatsSkeleton />
              <StatsSkeleton />
            </>
          ) : (
            <>
              <StatsCard title="Total Doctors" value={stats.totalDoctors} />
              <StatsCard title="Total Patients" value={stats.totalPatients} />
              <StatsCard title="Appointments Today" value={stats.appointmentsToday} />
              <StatsCard title="Medical Records" value={stats.medicalRecords} />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <DashboardCard
            title="Create Staff Account"
            description="Create doctor or receptionist login credentials."
          >
            <form onSubmit={handleCreateStaff} className="grid gap-4">
              <label className="text-sm text-slate-600">
                Name
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 text-slate-900"
                  name="name"
                  value={staffForm.name}
                  onChange={handleStaffChange}
                  required
                />
              </label>
              <label className="text-sm text-slate-600">
                Email
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 text-slate-900"
                  name="email"
                  type="email"
                  value={staffForm.email}
                  onChange={handleStaffChange}
                  required
                />
              </label>
              <label className="text-sm text-slate-600">
                Password
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 text-slate-900"
                  name="password"
                  type="password"
                  value={staffForm.password}
                  onChange={handleStaffChange}
                  required
                />
              </label>
              <label className="text-sm text-slate-600">
                Role
                <select
                  className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 text-slate-900"
                  name="role"
                  value={staffForm.role}
                  onChange={handleStaffChange}
                >
                  <option value="doctor">Doctor</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <button
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                disabled={creatingStaff}
              >
                {creatingStaff ? (
                  <div className="mx-auto h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                ) : (
                  "Create Staff"
                )}
              </button>
            </form>
          </DashboardCard>
          <DashboardCard
            title="Create Doctor Profile"
            description="Link a doctor user with their department and availability."
          >
            <form onSubmit={handleSubmit} className="grid gap-4">
              <label className="text-sm text-slate-600">
                Select Doctor
                <select
                  className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 text-slate-900"
                  value={selectedDoctor}
                  onChange={(event) => setSelectedDoctor(event.target.value)}
                  required
                >
                  <option value="">Select Doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor._id} value={doctor._id}>
                      {formatDoctorName(doctor.name || "Unknown")} — {doctor.email}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-600">
                Department
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 text-slate-900"
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="text-sm text-slate-600">
                Experience (years)
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 text-slate-900"
                  type="number"
                  min="0"
                  name="experience"
                  value={form.experience}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="text-sm text-slate-600">
                Availability
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 text-slate-900"
                  name="availability"
                  value={form.availability}
                  onChange={handleChange}
                  required
                />
              </label>
              <button
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                disabled={submitting || !selectedDoctor}
              >
                {submitting ? (
                  <div className="mx-auto h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                ) : (
                  "Create Profile"
                )}
              </button>
            </form>
          </DashboardCard>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold">User Management</h2>
          </div>

          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="mb-6 w-full rounded border border-slate-200 p-2 text-sm"
          />

          <div className="grid gap-6">
            <div>
              <h3 className="text-base font-semibold mb-3">Doctors</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-slate-500">
                      <th className="py-2">Name</th>
                      <th className="py-2">Role</th>
                      <th className="py-2">Email</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctorUsers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-4 text-sm text-slate-500">
                          No doctors found.
                        </td>
                      </tr>
                    ) : (
                      doctorUsers.map((user) => (
                        <tr key={user._id} className="border-b last:border-b-0">
                          <td className="py-2">{formatName(user.name || "Unknown")}</td>
                          <td className="py-2">{(user.role || "—").toUpperCase()}</td>
                          <td className="py-2">{user.email || "—"}</td>
                          <td className="py-2">{user.active === false ? "Disabled" : "Active"}</td>
                          <td className="py-2">
                            <button
                              className="text-blue-600 hover:underline"
                              onClick={() => openEditUser(user)}
                              type="button"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-base font-semibold mb-3">Patients</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-slate-500">
                      <th className="py-2">Name</th>
                      <th className="py-2">Role</th>
                      <th className="py-2">Email</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientUsers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-4 text-sm text-slate-500">
                          No patients found.
                        </td>
                      </tr>
                    ) : (
                      patientUsers.map((user) => (
                        <tr key={user._id} className="border-b last:border-b-0">
                          <td className="py-2">{formatName(user.name || "Unknown")}</td>
                          <td className="py-2">{(user.role || "—").toUpperCase()}</td>
                          <td className="py-2">{user.email || "—"}</td>
                          <td className="py-2">{user.active === false ? "Disabled" : "Active"}</td>
                          <td className="py-2">
                            <button
                              className="text-blue-600 hover:underline"
                              onClick={() => openEditUser(user)}
                              type="button"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-base font-semibold mb-3">Receptionists</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-slate-500">
                      <th className="py-2">Name</th>
                      <th className="py-2">Role</th>
                      <th className="py-2">Email</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receptionistUsers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-4 text-sm text-slate-500">
                          No receptionists found.
                        </td>
                      </tr>
                    ) : (
                      receptionistUsers.map((user) => (
                        <tr key={user._id} className="border-b last:border-b-0">
                          <td className="py-2">{formatName(user.name || "Unknown")}</td>
                          <td className="py-2">{(user.role || "—").toUpperCase()}</td>
                          <td className="py-2">{user.email || "—"}</td>
                          <td className="py-2">{user.active === false ? "Disabled" : "Active"}</td>
                          <td className="py-2">
                            <button
                              className="text-blue-600 hover:underline"
                              onClick={() => openEditUser(user)}
                              type="button"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-base font-semibold mb-3">Admins</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-slate-500">
                      <th className="py-2">Name</th>
                      <th className="py-2">Role</th>
                      <th className="py-2">Email</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-4 text-sm text-slate-500">
                          No admins found.
                        </td>
                      </tr>
                    ) : (
                      adminUsers.map((user) => (
                        <tr key={user._id} className="border-b last:border-b-0">
                          <td className="py-2">{formatName(user.name || "Unknown")}</td>
                          <td className="py-2">{(user.role || "—").toUpperCase()}</td>
                          <td className="py-2">{user.email || "—"}</td>
                          <td className="py-2">{user.active === false ? "Disabled" : "Active"}</td>
                          <td className="py-2">
                            <button
                              className="text-blue-600 hover:underline"
                              onClick={() => openEditUser(user)}
                              type="button"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit User</h3>
              <button
                type="button"
                className="text-sm text-slate-500 hover:text-slate-700"
                onClick={closeEditUser}
              >
                Close
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="grid gap-4">
              <label className="text-sm text-slate-600">
                Name
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 text-slate-900"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  required
                />
              </label>
              <label className="text-sm text-slate-600">
                Email
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 text-slate-900"
                  name="email"
                  type="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  required
                />
              </label>
              <label className="text-sm text-slate-600">
                Role
                <select
                  className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 text-slate-900"
                  name="role"
                  value={editForm.role}
                  onChange={handleEditChange}
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  name="active"
                  checked={editForm.active}
                  onChange={handleEditChange}
                />
                Active
              </label>
              <div className="flex gap-3">
                <button
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  disabled={updatingUser}
                  type="submit"
                >
                  {updatingUser ? (
                    <div className="mx-auto h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                  ) : (
                    "Save Changes"
                  )}
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                  onClick={closeEditUser}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;
