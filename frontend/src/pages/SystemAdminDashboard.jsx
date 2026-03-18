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
import { PrimaryButton, SecondaryButton, Input, Card, Badge } from "../components/ui";

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
  const [loading, setLoading] = useState(true);

  const fetchHospitals = async () => {
    if (!token) return;
    setLoadingHospitals(true);
    try {
      const data = await getHospitals(token);
      setHospitals(data.data || data.hospitals || []);
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
      const allUsers = data.data || data.users || [];
      setAdmins(allUsers.filter((user) => user.role === "admin"));
    } catch (error) {
      toast.error("Failed to load admins");
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadDashboard = async () => {
      if (!token) {
        if (isMounted) setLoading(false);
        return;
      }
      setLoading(true);
      await Promise.all([fetchHospitals(), fetchAdmins()]);
      if (isMounted) setLoading(false);
    };
    loadDashboard();
    return () => {
      isMounted = false;
    };
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

  if (loading) {
    return (
      <DashboardLayout title="System Admin Dashboard">
        <div className="min-h-screen bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 py-6">
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            </div>
            <div className="space-y-3">
              <div className="h-6 w-1/3 animate-pulse rounded bg-gray-200" />
              <div className="h-24 animate-pulse rounded bg-gray-200" />
              <div className="h-24 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="System Admin Dashboard">
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          </div>
          <div className="grid gap-6 transition-all duration-200">
            <div className="container mx-auto grid gap-6 transition-all duration-200">
        <Card className="mb-4">
          <h2 className="text-lg font-semibold mb-3">Create Hospital</h2>
          <form onSubmit={handleCreateHospital} className="grid gap-3">
            <Input
              className="text-sm"
              placeholder="Hospital name"
              name="name"
              value={hospitalForm.name}
              onChange={handleHospitalChange}
              required
            />
            <Input
              className="text-sm"
              placeholder="Address"
              name="address"
              value={hospitalForm.address}
              onChange={handleHospitalChange}
            />
            <Input
              className="text-sm"
              placeholder="Phone"
              name="phone"
              value={hospitalForm.phone}
              onChange={handleHospitalChange}
            />
            <PrimaryButton className="text-sm" disabled={creatingHospital}>
              {creatingHospital ? "Processing..." : "Create Hospital"}
            </PrimaryButton>
          </form>
        </Card>

        <Card className="mb-4">
          <h2 className="text-lg font-semibold mb-3">Hospital List</h2>
          {loadingHospitals ? (
            <p className="text-sm text-slate-500">Loading hospitals...</p>
          ) : hospitals.length === 0 ? (
            <p className="text-sm text-gray-400">No hospitals created yet</p>
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
        </Card>

        <Card className="mb-4">
          <h2 className="text-lg font-semibold mb-3">Create Hospital Admin</h2>
          <form onSubmit={handleCreateHospitalAdmin} className="grid gap-3">
            <Input
              className="text-sm"
              placeholder="Full name"
              name="name"
              value={adminForm.name}
              onChange={handleAdminChange}
              required
            />
            <Input
              className="text-sm"
              placeholder="Email"
              type="email"
              name="email"
              value={adminForm.email}
              onChange={handleAdminChange}
              required
            />
            <Input
              className="text-sm"
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
            <SecondaryButton className="text-sm" disabled={creatingAdmin}>
              {creatingAdmin ? "Processing..." : "Create Hospital Admin"}
            </SecondaryButton>
          </form>
        </Card>

        <Card className="mb-4">
          <h2 className="text-lg font-semibold mb-3">Admin List</h2>
          {admins.length === 0 ? (
            <p className="text-sm text-gray-400">No hospital admins yet</p>
          ) : (
            <div className="grid gap-3">
              {admins.map((admin) => (
                <div key={admin._id} className="border-b pb-3">
                  <p className="font-semibold text-slate-900">
                    {formatName(admin.name || "Unknown")}
                  </p>
                  <Badge color="blue">Admin</Badge>
                  <p className="text-sm text-slate-600">{admin.email}</p>
                  <p className="text-sm text-slate-600">
                    {admin.hospitalId ? hospitalNameById(admin.hospitalId) : "Unknown Hospital"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SystemAdminDashboard;
