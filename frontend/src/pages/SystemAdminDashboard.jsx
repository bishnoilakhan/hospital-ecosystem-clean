import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import {
  createHospital,
  getHospitals,
  createHospitalAdmin,
  getUsers
} from "../services/api";
import { formatName } from "../utils/format";

const SystemAdminDashboard = () => {
  const { token } = useAuth();
  const [hospitalForm, setHospitalForm] = useState({
    name: "",
    address: "",
    phone: ""
  });
  const [adminForm, setAdminForm] = useState({
    name: "",
    email: "",
    password: "",
    hospitalId: ""
  });
  const [hospitals, setHospitals] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [creatingHospital, setCreatingHospital] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  const fetchHospitals = async () => {
    if (!token) return;
    setLoadingHospitals(true);
    try {
      const data = await getHospitals(token);
      setHospitals(data.data || []);
    } catch (error) {
      toast.error("Failed to load hospitals");
    } finally {
      setLoadingHospitals(false);
    }
  };

  const fetchAdmins = async () => {
    if (!token) return;
    try {
      const data = await getUsers(token);
      const allUsers = data.users || [];
      setAdmins(allUsers.filter((user) => user.role === "admin"));
    } catch (error) {
      toast.error("Failed to load admins");
    }
  };

  useEffect(() => {
    fetchHospitals();
    fetchAdmins();
  }, [token]);

  const handleHospitalChange = (event) => {
    setHospitalForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleAdminChange = (event) => {
    setAdminForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleCreateHospital = async (event) => {
    event.preventDefault();
    setCreatingHospital(true);
    try {
      await createHospital(hospitalForm, token);
      toast.success("Hospital created");
      setHospitalForm({ name: "", address: "", phone: "" });
      fetchHospitals();
    } catch (error) {
      toast.error("Failed to create hospital");
    } finally {
      setCreatingHospital(false);
    }
  };

  const handleCreateHospitalAdmin = async (event) => {
    event.preventDefault();
    setCreatingAdmin(true);
    try {
      await createHospitalAdmin(adminForm, token);
      toast.success("Hospital admin created");
      setAdminForm({ name: "", email: "", password: "", hospitalId: "" });
      fetchAdmins();
    } catch (error) {
      toast.error("Failed to create hospital admin");
    } finally {
      setCreatingAdmin(false);
    }
  };

  const hospitalNameById = (id) =>
    hospitals.find((hospital) => hospital._id === id)?.name || "Unknown Hospital";

  return (
    <DashboardLayout title="System Admin Dashboard">
      <div className="container mx-auto grid gap-6">
        <div className="bg-white shadow rounded-lg p-4 mb-4">
          <h2 className="text-lg font-semibold mb-3">Create Hospital</h2>
          <form onSubmit={handleCreateHospital} className="grid gap-3">
            <input
              className="rounded border border-slate-200 px-3 py-2 text-sm"
              placeholder="Hospital name"
              name="name"
              value={hospitalForm.name}
              onChange={handleHospitalChange}
              required
            />
            <input
              className="rounded border border-slate-200 px-3 py-2 text-sm"
              placeholder="Address"
              name="address"
              value={hospitalForm.address}
              onChange={handleHospitalChange}
            />
            <input
              className="rounded border border-slate-200 px-3 py-2 text-sm"
              placeholder="Phone"
              name="phone"
              value={hospitalForm.phone}
              onChange={handleHospitalChange}
            />
            <button
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              disabled={creatingHospital}
            >
              {creatingHospital ? "Creating..." : "Create Hospital"}
            </button>
          </form>
        </div>

        <div className="bg-white shadow rounded-lg p-4 mb-4">
          <h2 className="text-lg font-semibold mb-3">Hospital List</h2>
          {loadingHospitals ? (
            <p className="text-sm text-slate-500">Loading hospitals...</p>
          ) : hospitals.length === 0 ? (
            <p className="text-sm text-slate-500">No hospitals created yet.</p>
          ) : (
            <div className="grid gap-3">
              {hospitals.map((hospital) => (
                <div key={hospital._id} className="border-b pb-3">
                  <p className="font-semibold text-slate-900">{hospital.name}</p>
                  <p className="text-sm text-slate-600">{hospital.address || "No address"}</p>
                  <p className="text-sm text-slate-600">{hospital.phone || "No phone"}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-4 mb-4">
          <h2 className="text-lg font-semibold mb-3">Create Hospital Admin</h2>
          <form onSubmit={handleCreateHospitalAdmin} className="grid gap-3">
            <input
              className="rounded border border-slate-200 px-3 py-2 text-sm"
              placeholder="Full name"
              name="name"
              value={adminForm.name}
              onChange={handleAdminChange}
              required
            />
            <input
              className="rounded border border-slate-200 px-3 py-2 text-sm"
              placeholder="Email"
              type="email"
              name="email"
              value={adminForm.email}
              onChange={handleAdminChange}
              required
            />
            <input
              className="rounded border border-slate-200 px-3 py-2 text-sm"
              placeholder="Password"
              type="password"
              name="password"
              value={adminForm.password}
              onChange={handleAdminChange}
              required
            />
            <select
              className="rounded border border-slate-200 px-3 py-2 text-sm"
              name="hospitalId"
              value={adminForm.hospitalId}
              onChange={handleAdminChange}
              required
            >
              <option value="">Select Hospital</option>
              {hospitals.map((hospital) => (
                <option key={hospital._id} value={hospital._id}>
                  {hospital.name}
                </option>
              ))}
            </select>
            <button
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              disabled={creatingAdmin}
            >
              {creatingAdmin ? "Creating..." : "Create Hospital Admin"}
            </button>
          </form>
        </div>

        <div className="bg-white shadow rounded-lg p-4 mb-4">
          <h2 className="text-lg font-semibold mb-3">Admin List</h2>
          {admins.length === 0 ? (
            <p className="text-sm text-slate-500">No hospital admins yet.</p>
          ) : (
            <div className="grid gap-3">
              {admins.map((admin) => (
                <div key={admin._id} className="border-b pb-3">
                  <p className="font-semibold text-slate-900">
                    {formatName(admin.name || "Unknown")}
                  </p>
                  <p className="text-sm text-slate-600">{admin.email}</p>
                  <p className="text-sm text-slate-600">
                    {admin.hospitalId ? hospitalNameById(admin.hospitalId) : "Unknown Hospital"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SystemAdminDashboard;
