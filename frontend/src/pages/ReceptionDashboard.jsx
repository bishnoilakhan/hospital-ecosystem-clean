import { useEffect, useState } from "react";
import {
  createAppointment,
  checkInPatient,
  getReceptionStats,
  getDoctors,
  registerPatientByReception,
  searchPatients,
  getTodayAppointments,
  getHospitalById
} from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import StatsCard from "../components/StatsCard";
import StatsSkeleton from "../components/StatsSkeleton";
import { formatDepartment, formatDoctorName, formatName } from "../utils/format";
import { getSymptomText } from "../utils/symptoms";
import socket from "../socket";
import EmergencyBadge from "../components/EmergencyBadge";
import { getPriorityColor, getPriorityLabel, isEmergency } from "../utils/priority";

const ReceptionDashboard = () => {
  const { token, hospitalId } = useAuth();
  const [patientQuery, setPatientQuery] = useState("");
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [appointmentForm, setAppointmentForm] = useState({
    patientHealthId: "",
    doctorId: "",
    date: "",
    symptoms: ""
  });
  const [doctorQuery, setDoctorQuery] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [doctorSuggestions, setDoctorSuggestions] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [priority, setPriority] = useState("5");
  const [registerForm, setRegisterForm] = useState({
    name: "",
    age: "",
    gender: "",
    bloodGroup: "",
    phone: ""
  });
  const [stats, setStats] = useState({
    totalAppointments: "—",
    appointmentsToday: "—",
    checkedIn: "—",
    waiting: "—"
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [hospitalName, setHospitalName] = useState("");

  const sortedTodayAppointments = [...todayAppointments].sort(
    (a, b) => (a.queueNumber || 0) - (b.queueNumber || 0)
  );

  const fetchStats = async () => {
    if (!token) return;
    setStatsLoading(true);
    try {
      const data = await getReceptionStats(token);
      setStats({
        totalAppointments: data.totalAppointments,
        appointmentsToday: data.appointmentsToday,
        checkedIn: data.checkedIn,
        waiting: data.waiting
      });
    } catch (error) {
      toast.error("Failed to load stats");
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchLoading(true);
    try {
      if (!query.trim()) {
        setPatients([]);
        return;
      }
      const data = await searchPatients(token, query);
      setPatients(data.data || data.patients || []);
    } catch (error) {
      toast.error("Failed to fetch patient");
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchDoctors = async () => {
    if (!token) return;
    try {
      const data = await getDoctors(token);
      setDoctors(data.data || data || []);
    } catch (error) {
      toast.error("Failed to load doctors");
    }
  };

  const fetchTodayAppointments = async () => {
    if (!token) return;
    try {
      const data = await getTodayAppointments(token);
      setTodayAppointments(data.data || data.appointments || []);
    } catch (error) {
      toast.error("Failed to load today's appointments");
    }
  };

  const fetchHospitalName = async () => {
    if (!token || !hospitalId) return;
    try {
      const data = await getHospitalById(hospitalId, token);
      setHospitalName(data.data?.name || "");
    } catch (error) {
      toast.error("Failed to load hospital");
    }
  };

  const handleAppointmentChange = (event) => {
    setAppointmentForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleCreateAppointment = async (event) => {
    if (event?.preventDefault) {
      event.preventDefault();
    }
    if (!selectedPatient || !selectedDoctor || !appointmentForm.date) {
      toast.error("Select patient, doctor, and date");
      return;
    }
    if (!appointmentForm.symptoms.trim()) {
      toast.error("Symptoms are required");
      return;
    }
    setCreating(true);
    try {
      const payload = {
        patientHealthId: appointmentForm.patientHealthId,
        doctorId: appointmentForm.doctorId,
        date: new Date(appointmentForm.date).toISOString(),
        priorityScore: Number(priority),
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
      fetchTodayAppointments();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setCreating(false);
    }
  };

  const handleRegisterChange = (event) => {
    const { name, value } = event.target;
    const nextValue = name === "bloodGroup" ? value.toUpperCase() : value;
    setRegisterForm((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleRegisterPatient = async (event) => {
    event.preventDefault();
    const { name, age, gender, bloodGroup, phone } = registerForm;
    if (!name || !age || !gender || !bloodGroup || !phone) {
      toast.error("Missing required fields");
      return;
    }
    setRegistering(true);
    try {
      const payload = {
        name,
        age: Number(age),
        gender,
        bloodGroup,
        phone
      };
      const data = await registerPatientByReception(payload, token);
      const patientData = data.patient || { name, healthId: data.healthId, phone };
      const healthId = patientData.healthId;
      toast.success("Patient registered");
      setSelectedPatient({
        name: patientData.name,
        healthId,
        phone: patientData.phone || phone
      });
      setPatientQuery(formatName(patientData.name || ""));
      setPatients([]);
      setAppointmentForm((prev) => ({
        ...prev,
        patientHealthId: healthId
      }));
      setRegisterForm({
        name: "",
        age: "",
        gender: "",
        bloodGroup: "",
        phone: ""
      });
    } catch (error) {
      toast.error("Registration failed");
    } finally {
      setRegistering(false);
    }
  };

  const handleCheckInAppointment = async (appointmentId) => {
    setCheckingIn(true);
    try {
      await checkInPatient(appointmentId, token);
      toast.success("Patient checked in");
      fetchStats();
      fetchTodayAppointments();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setCheckingIn(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchDoctors();
    fetchTodayAppointments();
    fetchHospitalName();
  }, [token]);

  useEffect(() => {
    const handleConnect = () => {
      console.log("Socket connected:", socket.id);
    };

    const handleAppointmentCreated = (data) => {
      if (!hospitalId || !data?.hospitalId) {
        fetchTodayAppointments();
        fetchStats();
        return;
      }
      if (data.hospitalId === hospitalId) {
        fetchTodayAppointments();
        fetchStats();
      }
    };

    const handleAppointmentCheckedIn = (data) => {
      if (!hospitalId || !data?.hospitalId) {
        fetchTodayAppointments();
        fetchStats();
        return;
      }
      if (data.hospitalId === hospitalId) {
        fetchTodayAppointments();
        fetchStats();
      }
    };

    socket.on("connect", handleConnect);
    socket.on("appointmentCreated", handleAppointmentCreated);
    socket.on("appointmentCheckedIn", handleAppointmentCheckedIn);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("appointmentCreated", handleAppointmentCreated);
      socket.off("appointmentCheckedIn", handleAppointmentCheckedIn);
    };
  }, [hospitalId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (patientQuery.trim().length > 2) {
        handleSearch(patientQuery);
      } else {
        setPatients([]);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [patientQuery]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (doctorQuery.trim().length > 2) {
        const filtered = doctors.filter(
          (doctor) =>
            doctor.userId?.name?.toLowerCase().includes(doctorQuery.toLowerCase()) ||
            doctor.department?.toLowerCase().includes(doctorQuery.toLowerCase())
        );
        setDoctorSuggestions(filtered);
      } else {
        setDoctorSuggestions([]);
      }
    }, 200);
    return () => clearTimeout(timeout);
  }, [doctorQuery, doctors]);

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setPatientQuery(formatName(patient.name || ""));
    setAppointmentForm((prev) => ({
      ...prev,
      patientHealthId: patient.healthId
    }));
    setPatients([]);
  };

  const handleSelectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setDoctorQuery(
      `${formatDoctorName(doctor.userId?.name || "")} - ${formatDepartment(
        doctor.department || ""
      )}`
    );
    setAppointmentForm((prev) => ({
      ...prev,
      doctorId: doctor._id
    }));
    setDoctorSuggestions([]);
  };

  const clearSelectedPatient = () => {
    setSelectedPatient(null);
    setPatientQuery("");
    setPatients([]);
    setAppointmentForm((prev) => ({ ...prev, patientHealthId: "" }));
  };

  const clearSelectedDoctor = () => {
    setSelectedDoctor(null);
    setDoctorQuery("");
    setDoctorSuggestions([]);
    setAppointmentForm((prev) => ({ ...prev, doctorId: "" }));
  };

  const formatTime = (value) =>
    new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const getStatusStyle = (status) => {
    switch (status) {
      case "scheduled":
        return "bg-gray-100 text-gray-700";
      case "checked-in":
        return "bg-yellow-100 text-yellow-700";
      case "completed":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <DashboardLayout title="Reception Dashboard">
      <div className="container mx-auto grid gap-6">
        {!token && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Please log in as a receptionist to manage appointments.
          </div>
        )}
        {hospitalName && (
          <div className="text-xl font-bold mb-4 text-slate-900">
            {hospitalName.toUpperCase()}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {statsLoading ? (
            <>
              <StatsSkeleton />
              <StatsSkeleton />
              <StatsSkeleton />
              <StatsSkeleton />
            </>
          ) : (
            <>
              <StatsCard title="Total Appointments" value={stats.totalAppointments} />
              <StatsCard title="Appointments Today" value={stats.appointmentsToday} />
              <StatsCard title="Checked-In Patients" value={stats.checkedIn} />
              <StatsCard title="Waiting Patients" value={stats.waiting} />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-3">Search Patient</h2>
            <div className="grid gap-3">
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Search patient by name or health ID"
                value={patientQuery}
                onChange={(event) => setPatientQuery(event.target.value)}
              />
              <div className="border rounded-lg p-3">
                {searchLoading ? (
                  <div className="text-sm text-gray-500">Searching...</div>
                ) : patients.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    {patientQuery.length > 2 ? "No patients found." : "Start typing to search."}
                  </div>
                ) : (
                  patients.map((patient) => (
                    <button
                      key={patient.healthId}
                      type="button"
                      onClick={() => handleSelectPatient(patient)}
                      className="flex w-full items-center justify-between py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <span className="font-medium">{formatName(patient.name || "Unknown")}</span>
                      <span className="text-xs text-gray-500">{patient.healthId}</span>
                    </button>
                  ))
                )}
              </div>
              {selectedPatient && (
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                  <span>
                    Selected:{" "}
                    <span className="font-semibold text-slate-800">
                      {formatName(selectedPatient.name || "Unknown")}
                    </span>{" "}
                    — {selectedPatient.healthId}
                  </span>
                  <button
                    type="button"
                    className="text-xs font-semibold text-blue-600 hover:underline"
                    onClick={clearSelectedPatient}
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-3">Register Walk-in Patient</h2>
            <form onSubmit={handleRegisterPatient} className="grid gap-3">
              <input
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Full name"
                name="name"
                value={registerForm.name}
                onChange={handleRegisterChange}
                required
              />
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Age"
                  name="age"
                  type="number"
                  min="0"
                  value={registerForm.age}
                  onChange={handleRegisterChange}
                  required
                />
                <input
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Gender"
                  name="gender"
                  value={registerForm.gender}
                  onChange={handleRegisterChange}
                  required
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Blood Group"
                  name="bloodGroup"
                  value={registerForm.bloodGroup}
                  onChange={handleRegisterChange}
                  required
                />
                <input
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Phone"
                  name="phone"
                  value={registerForm.phone}
                  onChange={handleRegisterChange}
                  required
                />
              </div>
              <button
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                disabled={registering}
              >
                {registering ? (
                  <div className="mx-auto h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                ) : (
                  "Register Patient"
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-3">Create Appointment</h2>
          <div className="grid gap-3">
            <div className="text-sm text-slate-600">
              Patient:{" "}
              <span className="font-semibold text-slate-800">
                {selectedPatient ? formatName(selectedPatient.name) : "Not selected"}
              </span>
            </div>
            {!doctors || doctors.length === 0 ? (
              <p className="text-sm text-gray-500 mt-2">
                No doctors available in your hospital
              </p>
            ) : null}
            <div className="relative">
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Search doctor by name or department"
                value={doctorQuery}
                onChange={(event) => setDoctorQuery(event.target.value)}
              />
              {doctorSuggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded border border-slate-200 bg-white shadow">
                  {doctorSuggestions.map((doctor) => (
                    <button
                      key={doctor._id}
                      type="button"
                      onClick={() => handleSelectDoctor(doctor)}
                      className="block w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-gray-100"
                    >
                      {formatDoctorName(doctor.userId?.name || "Unknown")} —{" "}
                      {formatDepartment(doctor.department || "N/A")}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedDoctor && (
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                <span>
                  Selected Doctor:{" "}
                  <span className="font-semibold text-slate-800">
                    {formatDoctorName(selectedDoctor.userId?.name || "Unknown")}
                  </span>{" "}
                  — {formatDepartment(selectedDoctor.department || "N/A")}
                </span>
                <button
                  type="button"
                  className="text-xs font-semibold text-blue-600 hover:underline"
                  onClick={clearSelectedDoctor}
                >
                  Clear
                </button>
              </div>
            )}
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
            <select
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
            >
              <option value="2">Low</option>
              <option value="5">Medium</option>
              <option value="8">High</option>
              <option value="10">Emergency</option>
            </select>
            <button
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                !selectedPatient || !selectedDoctor
                  ? "cursor-not-allowed bg-gray-300 text-gray-600"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
              disabled={creating || !selectedPatient || !selectedDoctor}
              onClick={handleCreateAppointment}
              type="button"
            >
              {creating ? (
                <div className="mx-auto h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
              ) : (
                "Create Appointment"
              )}
            </button>
            {!selectedPatient || !selectedDoctor ? (
              <p className="text-xs text-slate-500">Select patient and doctor to continue.</p>
            ) : null}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Today's Queue</h2>
          {sortedTodayAppointments.length === 0 ? (
            <p className="text-sm text-slate-500">No appointments scheduled today.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-slate-500">
                    <th className="py-2">Time</th>
                    <th className="py-2">Patient</th>
                    <th className="py-2">Doctor</th>
                    <th className="py-2">Symptoms</th>
                    <th className="py-2">Department</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Queue</th>
                    <th className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTodayAppointments.map((appointment) => {
                    const symptomText = getSymptomText(appointment);
                    return (
                    <tr key={appointment._id} className="border-b last:border-b-0">
                      <td className="py-2">{formatTime(appointment.time)}</td>
                      <td
                        className={`py-2 ${
                          isEmergency(appointment.priorityScore || 0)
                            ? "bg-red-50 border-l-4 border-red-400 pl-3"
                            : ""
                        }`}
                      >
                        {formatName(appointment.patientName || "Unknown")}
                        <EmergencyBadge priorityScore={appointment.priorityScore || 0} />
                      </td>
                      <td className="py-2">
                        {formatDoctorName(appointment.doctorName || "Unknown")}
                      </td>
                      <td className="py-2 text-sm text-gray-600">
                        {symptomText !== "N/A" ? (
                          <div
                            className="cursor-pointer"
                            title={appointment.rawSymptoms || appointment.symptoms || symptomText}
                          >
                            {symptomText.length > 30
                              ? `${symptomText.slice(0, 30)}...`
                              : symptomText}
                          </div>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td className="py-2 text-sm text-gray-600">
                        {appointment.department || "General Medicine"}
                      </td>
                      <td className="py-2">
                        <span
                          className={`px-2 py-1 rounded text-xs ${getStatusStyle(
                            appointment.status
                          )}`}
                        >
                          {appointment.status}
                        </span>
                        {appointment.status === "checked-in" && (
                          <span className="ml-2 rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                            Checked-in
                          </span>
                        )}
                        <span
                          className={`ml-2 px-2 py-1 rounded text-xs text-white ${getPriorityColor(
                            appointment.priorityScore || 0
                          )}`}
                        >
                          {getPriorityLabel(appointment.priorityScore || 0)}
                        </span>
                        <EmergencyBadge priorityScore={appointment.priorityScore || 0} />
                      </td>
                      <td className="py-2">Queue #{appointment.queueNumber || "—"}</td>
                      <td className="py-2">
                        <button
                          className={`rounded px-3 py-1 text-xs font-semibold ${
                            appointment.status !== "scheduled"
                              ? "cursor-not-allowed bg-gray-200 text-gray-500"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          }`}
                          disabled={checkingIn || appointment.status !== "scheduled"}
                          onClick={() => handleCheckInAppointment(appointment._id)}
                          type="button"
                        >
                          {checkingIn ? "Checking..." : "Check-in"}
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReceptionDashboard;
