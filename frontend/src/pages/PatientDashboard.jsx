import { useEffect, useState } from "react";
import {
  createAppointment,
  getDoctors,
  getPatientAppointments,
  getPatientProfile,
  getPatientRecords,
  getPatientStats,
  triageSymptoms,
  getAccessRequests,
  approveAccessRequest,
  rejectAccessRequest,
  getHospitals
} from "../services/api";
import MedicalTimeline from "../components/MedicalTimeline";
import DashboardLayout from "../components/DashboardLayout";
import DashboardCard from "../components/DashboardCard";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import StatsCard from "../components/StatsCard";
import StatsSkeleton from "../components/StatsSkeleton";
import { formatDepartment, formatDoctorName, formatLabel, formatName } from "../utils/format";
import { getSymptomText } from "../utils/symptoms";
import EmergencyBadge from "../components/EmergencyBadge";
import { getPriorityColor, getPriorityLabel, isEmergency } from "../utils/priority";

const PatientDashboard = () => {
  const { token } = useAuth();
  const [appointmentForm, setAppointmentForm] = useState({
    doctorId: "",
    date: "",
    symptoms: ""
  });
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState("");
  const [records, setRecords] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [triageInput, setTriageInput] = useState("");
  const [triageResult, setTriageResult] = useState(null);
  const [booking, setBooking] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [triaging, setTriaging] = useState(false);
  const [stats, setStats] = useState({
    appointments: "—",
    records: "—",
    upcoming: "—"
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const getStatusStyle = (status) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-700";
      case "checked-in":
        return "bg-yellow-100 text-yellow-700";
      case "completed":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const upcomingAppointments = appointments.filter(
    (appointment) => new Date(appointment.date) >= new Date()
  );
  const pastAppointments = appointments.filter(
    (appointment) => new Date(appointment.date) < new Date()
  );

  const fetchStats = async () => {
    if (!token) return;
    setStatsLoading(true);
    try {
      const data = await getPatientStats(token);
      setStats({
        appointments: data.appointments,
        records: data.medicalRecords,
        upcoming: data.upcomingVisits
      });
    } catch (error) {
      toast.error("Failed to load stats");
    } finally {
      setStatsLoading(false);
    }
  };

  const handleAppointmentChange = (event) => {
    setAppointmentForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const fetchProfile = async () => {
    if (!token) {
      setProfile(null);
      return;
    }
    try {
      const data = await getPatientProfile(token);
      setProfile(data || null);
    } catch (error) {
      toast.error("Failed to load profile");
    }
  };

  const handleCreateAppointment = async (event) => {
    event.preventDefault();
    setBooking(true);
    try {
      const payload = {
        doctorId: appointmentForm.doctorId,
        date: new Date(appointmentForm.date).toISOString(),
        symptoms: appointmentForm.symptoms
      };
      const data = await createAppointment(payload, token);
      const assignedDepartment =
        data.appointment?.department || data.department || "General Medicine";
      const assignedPriority =
        typeof data.appointment?.priorityScore === "number"
          ? data.appointment.priorityScore
          : data.priorityScore;
      const priorityLabel =
        assignedPriority >= 7 ? "High Priority" : assignedPriority >= 5 ? "Medium Priority" : "Low Priority";
      toast.success(`Assigned to ${assignedDepartment} (${priorityLabel})`);
      fetchStats();
      fetchMedicalRecords();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setBooking(false);
    }
  };

  const fetchMedicalRecords = async () => {
    if (!token) {
      setRecords([]);
      return;
    }
    setLoadingRecords(true);
    try {
      const data = await getPatientRecords(token);
      setRecords(data.records || []);
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoadingRecords(false);
    }
  };

  const fetchAccessRequests = async () => {
    if (!token) {
      setAccessRequests([]);
      return;
    }
    setLoadingRequests(true);
    try {
      const data = await getAccessRequests(token);
      setAccessRequests(data.data || []);
    } catch (error) {
      toast.error("Failed to load access requests");
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      await approveAccessRequest(requestId, token);
      setAccessRequests((prev) => prev.filter((request) => request._id !== requestId));
      toast.success("Access granted");
    } catch (error) {
      toast.error("Failed to approve request");
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await rejectAccessRequest(requestId, token);
      setAccessRequests((prev) => prev.filter((request) => request._id !== requestId));
      toast.success("Access rejected");
    } catch (error) {
      toast.error("Failed to reject request");
    }
  };

  const fetchAppointments = async () => {
    if (!token) {
      setAppointments([]);
      return;
    }
    try {
      const data = await getPatientAppointments(token);
      setAppointments(data.appointments || []);
    } catch (error) {
      toast.error("Failed to load appointments");
    }
  };

  const handleFetchRecords = async (event) => {
    event.preventDefault();
    fetchMedicalRecords();
  };

  const fetchDoctors = async () => {
    if (!token) return;
    try {
      const data = await getDoctors(token);
      setDoctors(data.data || []);
      if (!appointmentForm.doctorId && data.data?.length) {
        setAppointmentForm((prev) => ({ ...prev, doctorId: data.data[0]._id }));
      }
    } catch (error) {
      toast.error("Failed to load doctors");
    }
  };

  const fetchHospitals = async () => {
    if (!token) return;
    try {
      const data = await getHospitals(token);
      setHospitals(data.data || []);
      if (!selectedHospital && data.data?.length) {
        setSelectedHospital(data.data[0]._id);
        fetchDoctors();
      }
    } catch (error) {
      toast.error("Failed to load hospitals");
    }
  };

  const handleHospitalChange = async (event) => {
    const hospitalId = event.target.value;
    setSelectedHospital(hospitalId);
    setAppointmentForm((prev) => ({ ...prev, doctorId: "" }));
    await fetchDoctors();
  };

  useEffect(() => {
    fetchProfile();
    fetchStats();
    fetchHospitals();
    fetchMedicalRecords();
    fetchAppointments();
    fetchAccessRequests();
  }, [token]);

  const handleTriage = async (event) => {
    event.preventDefault();
    setTriaging(true);
    try {
      const data = await triageSymptoms({ symptoms: triageInput });
      setTriageResult(data);
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setTriaging(false);
    }
  };

  return (
    <DashboardLayout title="Patient Dashboard">
      <div className="container mx-auto grid gap-6">
        {!token && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Please log in to book appointments or view records.
          </div>
        )}

        {profile && (
          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              {formatLabel("Patient Profile")}
            </h2>
            <div className="grid gap-1 text-sm text-slate-600">
              <p>
                <span className="font-semibold text-slate-700">Name:</span>{" "}
                {formatName(profile.name || "Unknown")}
              </p>
              <p>
                <span className="font-semibold text-slate-700">Health ID:</span>{" "}
                {profile.healthId}
              </p>
              <p>
                <span className="font-semibold text-slate-700">Email:</span> {profile.email}
              </p>
              <p>
                <span className="font-semibold text-slate-700">Phone:</span> {profile.phone}
              </p>
              <p>
                <span className="font-semibold text-slate-700">Age:</span> {profile.age}
              </p>
              <p>
                <span className="font-semibold text-slate-700">Gender:</span> {profile.gender}
              </p>
              <p>
                <span className="font-semibold text-slate-700">Blood Group:</span>{" "}
                {profile.bloodGroup}
              </p>
            </div>
          </div>
        )}

        <div className="rounded-lg bg-white p-4 shadow">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            {formatLabel("Access Requests")}
          </h2>
          {loadingRequests ? (
            <p className="text-sm text-slate-500">Loading access requests...</p>
          ) : accessRequests.length === 0 ? (
            <p className="text-sm text-slate-500">No pending access requests</p>
          ) : (
            <div className="grid gap-3">
              {accessRequests.map((request) => (
                <div
                  key={request._id}
                  className="rounded bg-white p-4 shadow"
                >
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold">Hospital:</span>{" "}
                    {request.hospitalName || "Unknown Hospital"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Requested{" "}
                    {request.createdAt
                      ? new Date(request.createdAt).toLocaleString()
                      : "Date not set"}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                      onClick={() => handleApproveRequest(request._id)}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="rounded border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-slate-300"
                      onClick={() => handleRejectRequest(request._id)}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg bg-white p-4 shadow">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            {formatLabel("Upcoming Appointments")}
          </h2>
          {upcomingAppointments.length === 0 ? (
            <p className="text-sm text-slate-500">No appointments yet.</p>
          ) : (
            <div className="grid gap-3">
              {upcomingAppointments.map((appointment, index) => (
                <div
                  key={`${appointment.date}-${index}`}
                  className={
                    isEmergency(appointment.priorityScore || 0)
                      ? "rounded border border-red-200 bg-red-50 p-3"
                      : "border-b border-slate-100 pb-3"
                  }
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {formatDoctorName(appointment.doctorName || "Unknown")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatLabel("Hospital")}: {appointment.hospitalName || "Unknown"}
                  </p>
                  <p className="text-sm text-slate-600">
                    {appointment.department
                      ? formatDepartment(appointment.department)
                      : "N/A"}
                  </p>
                  <p className="text-sm text-slate-600">
                    {appointment.date
                      ? new Date(appointment.date).toLocaleString()
                      : "Date not set"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatLabel("Your position in queue")}: Queue #
                    {appointment.queueNumber || "—"}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Symptoms:</span>{" "}
                    {getSymptomText(appointment)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Department:</span>{" "}
                    {appointment.department || "GENERAL"}
                  </p>
                  <span
                    className={`inline-block rounded px-2 py-1 text-xs font-semibold ${getStatusStyle(
                      appointment.status
                    )}`}
                  >
                    {appointment.status}
                  </span>
                  <span
                    className={`ml-2 inline-block rounded px-2 py-1 text-xs text-white ${getPriorityColor(
                      appointment.priorityScore || 0
                    )}`}
                  >
                    {getPriorityLabel(appointment.priorityScore || 0)}
                  </span>
                  <EmergencyBadge priorityScore={appointment.priorityScore || 0} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg bg-white p-4 shadow">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            {formatLabel("Past Appointments")}
          </h2>
          {pastAppointments.length === 0 ? (
            <p className="text-sm text-slate-500">No past appointments yet.</p>
          ) : (
            <div className="grid gap-3">
              {pastAppointments.map((appointment, index) => (
                <div
                  key={`${appointment.date}-${index}`}
                  className={
                    isEmergency(appointment.priorityScore || 0)
                      ? "rounded border border-red-200 bg-red-50 p-3"
                      : "border-b border-slate-100 pb-3"
                  }
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {formatDoctorName(appointment.doctorName || "Unknown")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatLabel("Hospital")}: {appointment.hospitalName || "Unknown"}
                  </p>
                  <p className="text-sm text-slate-600">
                    {appointment.department
                      ? formatDepartment(appointment.department)
                      : "N/A"}
                  </p>
                  <p className="text-sm text-slate-600">
                    {appointment.date
                      ? new Date(appointment.date).toLocaleString()
                      : "Date not set"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatLabel("Your position in queue")}: Queue #
                    {appointment.queueNumber || "—"}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Symptoms:</span>{" "}
                    {getSymptomText(appointment)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Department:</span>{" "}
                    {appointment.department || "GENERAL"}
                  </p>
                  <span
                    className={`inline-block rounded px-2 py-1 text-xs font-semibold ${getStatusStyle(
                      appointment.status
                    )}`}
                  >
                    {appointment.status}
                  </span>
                  <span
                    className={`ml-2 inline-block rounded px-2 py-1 text-xs text-white ${getPriorityColor(
                      appointment.priorityScore || 0
                    )}`}
                  >
                    {getPriorityLabel(appointment.priorityScore || 0)}
                  </span>
                  <EmergencyBadge priorityScore={appointment.priorityScore || 0} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {statsLoading ? (
            <>
              <StatsSkeleton />
              <StatsSkeleton />
              <StatsSkeleton />
            </>
          ) : (
            <>
              <StatsCard title="Appointments" value={stats.appointments} />
              <StatsCard title="Medical Records" value={stats.records} />
              <StatsCard title="Upcoming Visits" value={stats.upcoming} />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <DashboardCard
            title="Book Appointment"
            description="Schedule a visit with the right specialist."
          >
            <form onSubmit={handleCreateAppointment} className="grid gap-3">
              <select
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={selectedHospital}
                onChange={handleHospitalChange}
                required
                disabled={hospitals.length === 0}
              >
                {hospitals.length === 0 ? (
                  <option>No hospitals available</option>
                ) : (
                  hospitals.map((hospital) => (
                    <option key={hospital._id} value={hospital._id}>
                      {hospital.name}
                    </option>
                  ))
                )}
              </select>
              {!doctors || doctors.length === 0 ? (
                <p className="text-sm text-gray-500 mt-2">
                  No doctors available in your hospital
                </p>
              ) : null}
              <select
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                name="doctorId"
                value={appointmentForm.doctorId}
                onChange={handleAppointmentChange}
                required
                disabled={doctors.length === 0}
              >
                {doctors.length === 0 ? (
                  <option>No doctors available</option>
                ) : (
                  doctors.map((doctor) => (
                    <option key={doctor._id} value={doctor._id}>
                      {formatDoctorName(doctor.userId?.name || "Unknown")} -{" "}
                      {doctor.department ? formatDepartment(doctor.department) : "N/A"}
                    </option>
                  ))
                )}
              </select>
              <input
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                type="datetime-local"
                name="date"
                value={appointmentForm.date}
                onChange={handleAppointmentChange}
                required
              />
              <textarea
                className="min-h-[90px] rounded-lg border border-slate-200 px-3 py-2 text-sm"
                name="symptoms"
                value={appointmentForm.symptoms}
                onChange={handleAppointmentChange}
                required
                placeholder="Enter patient symptoms..."
              />
              <button
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                disabled={booking}
              >
                {booking ? (
                  <div className="mx-auto h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                ) : (
                  "Book Appointment"
                )}
              </button>
            </form>
          </DashboardCard>

          <DashboardCard
            title="View Medical Records"
            description="See your latest consultations and prescriptions."
          >
            <form onSubmit={handleFetchRecords} className="grid gap-3">
              <button
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                disabled={loadingRecords}
              >
                {loadingRecords ? (
                  <div className="mx-auto h-4 w-4 animate-spin rounded-full border-b-2 border-slate-700" />
                ) : (
                  "View Records"
                )}
              </button>
            </form>
            <div className="mt-4">
              <MedicalTimeline records={records} />
            </div>
          </DashboardCard>

          <DashboardCard
            title="Symptom Triage"
            description="Get a quick recommendation before you visit."
          >
            <form onSubmit={handleTriage} className="grid gap-3">
              <textarea
                className="min-h-[120px] rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Describe symptoms (e.g., fever headache cough)"
                value={triageInput}
                onChange={(event) => setTriageInput(event.target.value)}
                required
              />
              <button
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                disabled={triaging}
              >
                {triaging ? (
                  <div className="mx-auto h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                ) : (
                  "Analyze Symptoms"
                )}
              </button>
            </form>
            {triageResult && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                <p className="text-slate-600">
                  {formatLabel("Department")}:{" "}
                  <span className="font-semibold">
                    {formatDepartment(triageResult.department || "")}
                  </span>
                </p>
                <p className="text-slate-600">
                  {formatLabel("Urgency")}:{" "}
                  <span className="font-semibold">
                    {formatLabel(triageResult.urgency || "")}
                  </span>
                </p>
              </div>
            )}
          </DashboardCard>
          </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientDashboard;
