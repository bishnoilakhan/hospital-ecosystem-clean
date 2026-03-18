import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import socket from "../socket";
import {
  addMedicalRecord,
  callNextPatient,
  completeAppointment,
  getDoctorStats,
  getPatientRecords,
  searchPatients,
  requestAccess,
  updateAppointmentPriority
} from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import DashboardCard from "../components/DashboardCard";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import StatsCard from "../components/StatsCard";
import StatsSkeleton from "../components/StatsSkeleton";
import {
  formatDepartment,
  formatLabel,
  formatMedicine,
  formatName
} from "../utils/format";
import { getSymptomText } from "../utils/symptoms";
import EmergencyBadge from "../components/EmergencyBadge";
import { getPriorityColor, getPriorityLabel, isEmergency } from "../utils/priority";

const API_BASE_URL = "https://hospital-ecosystem-clean-backend.onrender.com/api";

const DoctorDashboard = () => {
  const { token } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [consultationMode, setConsultationMode] = useState(false);
  const [activeTab, setActiveTab] = useState("today");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [medicines, setMedicines] = useState([]);
  const [medicineForm, setMedicineForm] = useState({
    medicine: "",
    dose: "",
    frequency: "",
    duration: ""
  });
  const [selectedPriority, setSelectedPriority] = useState(5);
  const [originalPriority, setOriginalPriority] = useState(null);
  const [isUpdatingPriority, setIsUpdatingPriority] = useState(false);
  const [records, setRecords] = useState([]);
  const [showRecords, setShowRecords] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [accessRequired, setAccessRequired] = useState(null);
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [waitingLong, setWaitingLong] = useState(false);
  const accessIntervalRef = useRef(null);
  const accessTimeoutRef = useRef(null);
  const prevCheckedInCount = useRef(null);
  const doctorIdRef = useRef(null);
  const emergencyAlertRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingRecord, setSubmittingRecord] = useState(false);
  const [completingId, setCompletingId] = useState(null);
  const [stats, setStats] = useState({
    todaysAppointments: "—",
    completedToday: "—",
    totalPatients: "—"
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const isPriorityChanged = selectedPriority !== originalPriority;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const todayDateString = today.toDateString();

  const todaysAppointments = appointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.date);
    return appointmentDate >= today && appointmentDate < tomorrow;
  });
  const upcomingAppointments = appointments.filter(
    (appointment) =>
      new Date(appointment.date) > today &&
      new Date(appointment.date).toDateString() !== todayDateString
  );
  const pastAppointments = appointments.filter(
    (appointment) => new Date(appointment.date) < today
  );
  const sortedPastAppointments = [...pastAppointments].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
  const todaysAppointmentsSorted = [...todaysAppointments].sort((a, b) => {
    const priorityDiff = (b.priorityScore || 0) - (a.priorityScore || 0);
    if (priorityDiff !== 0) return priorityDiff;
    return (a.queueNumber || 0) - (b.queueNumber || 0);
  });
  const hasCurrentPatient = todaysAppointments.some(
    (appointment) => appointment.status === "checked-in"
  );
  const hasWaitingPatients = todaysAppointments.some(
    (appointment) => appointment.status === "scheduled"
  );
  const disableCallNext = hasCurrentPatient || !hasWaitingPatients;
  const currentPatientInQueue = [...todaysAppointments]
    .filter((appointment) => appointment.status === "checked-in")
    .sort((a, b) => {
      const priorityDiff = (b.priorityScore || 0) - (a.priorityScore || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return (a.queueNumber || 0) - (b.queueNumber || 0);
    })[0];
  const nextPatientInQueue = [...todaysAppointments]
    .filter((appointment) => appointment.status === "scheduled")
    .sort((a, b) => {
      const priorityDiff = (b.priorityScore || 0) - (a.priorityScore || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return (a.queueNumber || 0) - (b.queueNumber || 0);
    })[0];

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

  const formatTime = (date) =>
    date
      ? new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "Time not set";

  const resetAccessState = () => {
    setRequestSent(false);
    setCheckingAccess(false);
    setWaitingLong(false);
    if (accessIntervalRef.current) {
      clearInterval(accessIntervalRef.current);
      accessIntervalRef.current = null;
    }
    if (accessTimeoutRef.current) {
      clearTimeout(accessTimeoutRef.current);
      accessTimeoutRef.current = null;
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    resetAccessState();
  };

  const fetchAppointments = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/doctor/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Failed to fetch appointments");
      const appointmentsList = data.data || data.appointments || [];
      setAppointments(appointmentsList);
      if (appointmentsList.length) {
        doctorIdRef.current = appointmentsList[0]?.doctorId || doctorIdRef.current;
      }
      const checkedInCount = appointmentsList.filter(
        (appointment) => appointment.status === "checked-in"
      ).length;
      if (
        prevCheckedInCount.current !== null &&
        checkedInCount > prevCheckedInCount.current
      ) {
        toast.success("New patient checked-in");
      }
      prevCheckedInCount.current = checkedInCount;
      fetchStats();
      return appointmentsList;
    } catch (error) {
      toast.error("Something went wrong");
      return [];
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAppointments();
      fetchStats();
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    if (search.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const fetchResults = async () => {
      try {
        const data = await searchPatients(token, search.trim());
        setSearchResults(data.data || data.patients || []);
      } catch (error) {
        toast.error("Failed to load patients");
      }
    };

    fetchResults();
  }, [search, token]);

  useEffect(() => {
    if (consultationMode || !appointments.length) return;
    const checkedInPatient = appointments.find(
      (appointment) => appointment.status === "checked-in"
    );
    setCurrentPatient(checkedInPatient || null);
  }, [appointments, consultationMode]);

  useEffect(() => {
    const emergencyPatient = appointments.find(
      (appointment) =>
        isEmergency(appointment.priorityScore || 0) && appointment.status !== "completed"
    );

    if (emergencyPatient && emergencyPatient._id !== emergencyAlertRef.current) {
      toast.error("Emergency patient in queue!");
      emergencyAlertRef.current = emergencyPatient._id;
    }

    if (!emergencyPatient) {
      emergencyAlertRef.current = null;
    }
  }, [appointments]);

  useEffect(() => {
    if (consultationMode) return;
    if (activeTab === "today") return;
    if (appointments.some((appointment) => appointment.status === "checked-in")) {
      setActiveTab("today");
    }
  }, [appointments, consultationMode, activeTab]);

  useEffect(() => {
    resetAccessState();
  }, [selectedAppointment]);

  useEffect(() => {
    if (!accessRequired) return;
    resetAccessState();
  }, [accessRequired]);

  useEffect(() => {
    const handleAppointmentCheckedIn = (data) => {
      const doctorId = doctorIdRef.current;
      if (!doctorId || !data?.doctorId) {
        fetchAppointments();
        return;
      }
      if (String(data.doctorId) === String(doctorId)) {
        fetchAppointments();
      }
    };

    const handleAppointmentCreated = (data) => {
      const doctorId = doctorIdRef.current;
      if (!doctorId || !data?.doctorId) {
        fetchAppointments();
        return;
      }
      if (String(data.doctorId) === String(doctorId)) {
        fetchAppointments();
      }
    };

    const handleAccessApproved = (data) => {
      const targetHealthId =
        data?.patientHealthId ||
        accessRequired ||
        selectedAppointment?.patient?.healthId ||
        currentPatient?.patient?.healthId;
      if (targetHealthId) {
        handleViewRecord(targetHealthId);
      }
    };

    socket.on("appointmentCheckedIn", handleAppointmentCheckedIn);
    socket.on("appointmentCreated", handleAppointmentCreated);
    socket.on("accessApproved", handleAccessApproved);
    const handleAppointmentCompleted = (data) => {
      const doctorId = doctorIdRef.current;
      if (!doctorId || !data?.doctorId) {
        fetchAppointments();
        return;
      }
      if (String(data.doctorId) === String(doctorId)) {
        fetchAppointments();
      }
    };

    socket.on("appointmentCompleted", handleAppointmentCompleted);

    return () => {
      socket.off("appointmentCheckedIn", handleAppointmentCheckedIn);
      socket.off("appointmentCreated", handleAppointmentCreated);
      socket.off("accessApproved", handleAccessApproved);
      socket.off("appointmentCompleted", handleAppointmentCompleted);
    };
  }, [accessRequired, selectedAppointment, currentPatient]);

  useEffect(() => {
    if (!requestSent || !accessRequired) return;

    const tryFetchRecords = async () => {
      try {
        const data = await getPatientRecords(token, accessRequired);
        setRecords(data.data || data.records || []);
        setShowRecords(true);
        setAccessRequired(null);
        resetAccessState();
      } catch (error) {
        if (error?.status && error.status !== 403) {
          toast.error("Failed to load medical records");
        }
      }
    };

    setCheckingAccess(true);
    setWaitingLong(false);
    accessTimeoutRef.current = setTimeout(() => {
      setWaitingLong(true);
    }, 30000);
    accessIntervalRef.current = setInterval(tryFetchRecords, 10000);

    return () => {
      if (accessIntervalRef.current) {
        clearInterval(accessIntervalRef.current);
        accessIntervalRef.current = null;
      }
      if (accessTimeoutRef.current) {
        clearTimeout(accessTimeoutRef.current);
        accessTimeoutRef.current = null;
      }
      setCheckingAccess(false);
      setWaitingLong(false);
    };
  }, [requestSent, accessRequired, token]);

  const handleAddRecord = async (event) => {
    event.preventDefault();
    if (!selectedAppointment) {
      toast.error("Select an appointment to start consultation");
      return;
    }
    setSubmittingRecord(true);
    try {
      const payload = {
        patientHealthId: selectedAppointment.patient?.healthId,
        diagnosis,
        prescription: medicines,
        notes
      };
      const data = await addMedicalRecord(payload, token);
      toast.success("Medical record added");
      setDiagnosis("");
      setNotes("");
      setMedicines([]);
      setMedicineForm({ medicine: "", dose: "", frequency: "", duration: "" });
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setSubmittingRecord(false);
    }
  };

  const handleMedicineChange = (event) => {
    setMedicineForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleAddMedicine = () => {
    if (!medicineForm.medicine) return;
    setMedicines((prev) => [...prev, medicineForm]);
    setMedicineForm({ medicine: "", dose: "", frequency: "", duration: "" });
  };

  const removeMedicine = (index) => {
    setMedicines((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleOpenConsultation = (appointment) => {
    setSelectedAppointment(appointment);
    setCurrentPatient(appointment);
    setConsultationMode(true);
    setDiagnosis("");
    setNotes("");
    setMedicines([]);
    setMedicineForm({ medicine: "", dose: "", frequency: "", duration: "" });
    const initialPriority = appointment.priorityScore ?? 5;
    setSelectedPriority(initialPriority);
    setOriginalPriority(initialPriority);
  };

  const handleCompleteAppointment = async (appointmentId) => {
    if (!appointmentId) return;
    setCompletingId(appointmentId);
    try {
      await completeAppointment(appointmentId, token);
      toast.success("Appointment completed");
      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment._id === appointmentId
            ? { ...appointment, status: "completed" }
            : appointment
        )
      );
      fetchStats();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setCompletingId(null);
    }
  };

  const handleCompleteConsultation = async () => {
    if (!currentPatient?._id) return;
    try {
      await completeAppointment(currentPatient._id, token);
      const updatedAppointments = await fetchAppointments();
      const nextPatient = updatedAppointments.find(
        (appointment) => appointment.status === "checked-in"
      );
      toast.success("Consultation completed");
      setSelectedAppointment(null);
      setConsultationMode(false);
      if (nextPatient) {
        setCurrentPatient(nextPatient);
      } else {
        setCurrentPatient(null);
      }
    } catch (error) {
      toast.error("Failed to complete consultation");
    }
  };

  const handleUpdatePriority = async () => {
    if (!selectedAppointment?._id) return;
    try {
      setIsUpdatingPriority(true);
      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment._id === selectedAppointment._id
            ? { ...appointment, priorityScore: selectedPriority }
            : appointment
        )
      );
      setOriginalPriority(selectedPriority);
      await updateAppointmentPriority(selectedAppointment._id, selectedPriority, token);
      toast.success("Priority updated");
    } catch (error) {
      toast.error(error?.message || "Failed to update priority");
      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment._id === selectedAppointment._id
            ? { ...appointment, priorityScore: originalPriority }
            : appointment
        )
      );
    } finally {
      setIsUpdatingPriority(false);
    }
  };

  const handleCallNext = async () => {
    try {
      const data = await callNextPatient(token);
      const patientName = data?.appointment?.patientName || "Patient";
      toast.success(`Calling ${patientName}`);
      fetchAppointments();
    } catch (error) {
      toast.error(error?.message || "Failed to call next patient");
    }
  };

  const handleExitConsultation = () => {
    setConsultationMode(false);
    setCurrentPatient(null);
    resetAccessState();
  };

  const handleViewRecord = async (healthId) => {
    if (!healthId) return;
    try {
      const data = await getPatientRecords(token, healthId);
      setRecords(data.data || data.records || []);
      setShowRecords(true);
      setAccessRequired(null);
      setRequestSent(false);
    } catch (error) {
      if (error?.status === 403) {
        setAccessRequired(healthId);
        setRequestSent(false);
      } else {
        toast.error("Failed to load medical records");
      }
    }
  };

  const handleRequestAccess = async () => {
    if (!accessRequired) return;
    setRequestingAccess(true);
    try {
      await requestAccess({ patientHealthId: accessRequired }, token);
      toast.success("Access request sent");
      setRequestSent(true);
    } catch (error) {
      toast.error("Failed to request access");
    } finally {
      setRequestingAccess(false);
    }
  };

  const fetchStats = async () => {
    if (!token) return;
    setStatsLoading(true);
    try {
      const data = await getDoctorStats(token);
      setStats({
        todaysAppointments: data.todaysAppointments,
        completedToday: data.completedToday,
        totalPatients: data.totalPatients
      });
    } catch (error) {
      toast.error("Failed to load stats");
    } finally {
      setStatsLoading(false);
    }
  };

  return (
    <DashboardLayout title="Doctor Dashboard">
      <div className="container mx-auto space-y-6">
        {!token && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Please log in as a doctor to view appointments and add records.
          </div>
        )}

        {!consultationMode && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {statsLoading ? (
              <>
                <StatsSkeleton />
                <StatsSkeleton />
                <StatsSkeleton />
              </>
            ) : (
              <>
                <StatsCard title="Today's Appointments" value={stats.todaysAppointments} />
                <StatsCard title="Completed Today" value={stats.completedToday} />
                <StatsCard title="Total Patients" value={stats.totalPatients} />
              </>
            )}
          </div>
        )}

        {!consultationMode && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className={`rounded px-4 py-2 text-sm font-semibold ${
                  activeTab === "today"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
                onClick={() => handleTabChange("today")}
              >
                Today
              </button>
              <button
                type="button"
                className={`rounded px-4 py-2 text-sm font-semibold ${
                  activeTab === "upcoming"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
                onClick={() => handleTabChange("upcoming")}
              >
                Upcoming
              </button>
              <button
                type="button"
                className={`rounded px-4 py-2 text-sm font-semibold ${
                  activeTab === "past"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
                onClick={() => handleTabChange("past")}
              >
                Past
              </button>
            </div>

            <div className="mt-4">
              {activeTab === "today" && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-3 text-lg font-semibold text-slate-900">
                      {formatLabel("Current Patient")}
                    </h2>
                    {currentPatientInQueue ? (
                      <>
                        <p className="text-xl font-bold text-slate-900">
                          {formatName(currentPatientInQueue.patient?.name || "Unknown")}
                        </p>
                        <p className="text-sm text-gray-600">
                          Age {currentPatientInQueue.patient?.age || "N/A"} •{" "}
                          {currentPatientInQueue.patient?.bloodGroup || "N/A"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {currentPatientInQueue.department
                            ? formatDepartment(currentPatientInQueue.department)
                            : "N/A"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatTime(currentPatientInQueue.date)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Queue #{currentPatientInQueue.queueNumber || "—"}
                        </p>
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-500">Symptoms</p>
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {getSymptomText(currentPatientInQueue)}
                          </p>
                        </div>
                        {isEmergency(currentPatientInQueue.priorityScore || 0) && (
                          <p className="mt-2 text-sm font-medium text-red-600">
                            Emergency patient under consultation
                          </p>
                        )}
                        <span
                          className={`mt-2 inline-block rounded px-2 py-1 text-xs text-white ${getPriorityColor(
                            currentPatientInQueue.priorityScore || 0
                          )}`}
                        >
                          {getPriorityLabel(currentPatientInQueue.priorityScore || 0)}
                        </span>
                        <button
                          onClick={() => handleOpenConsultation(currentPatientInQueue)}
                          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          Open Consultation
                        </button>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No patient currently in consultation
                      </p>
                    )}
                    {nextPatientInQueue && (
                      <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
                        <p className="text-xs font-semibold text-slate-500">Next</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatName(nextPatientInQueue.patient?.name || "Unknown")}
                        </p>
                        <p className="text-sm text-gray-600">
                          Queue #{nextPatientInQueue.queueNumber || "—"}
                        </p>
                        <span
                          className={`mt-2 inline-block rounded px-2 py-1 text-xs text-white ${getPriorityColor(
                            nextPatientInQueue.priorityScore || 0
                          )}`}
                        >
                          {getPriorityLabel(nextPatientInQueue.priorityScore || 0)}
                        </span>
                      </div>
                    )}
                    {!nextPatientInQueue && (
                      <p className="mt-3 text-sm text-gray-500">No patients waiting</p>
                    )}
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-slate-900">
                        {formatLabel("Today's Queue")}
                      </h2>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className={`rounded-lg px-3 py-2 text-xs font-semibold text-white ${
                            disableCallNext
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-700"
                          }`}
                          onClick={handleCallNext}
                          disabled={disableCallNext}
                        >
                          Call Next Patient
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300"
                          onClick={() => {
                            if (!refreshing) fetchAppointments();
                          }}
                          disabled={refreshing}
                        >
                          {refreshing ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-slate-700" />
                          ) : (
                            "Refresh"
                          )}
                        </button>
                      </div>
                    </div>
                    {hasCurrentPatient && (
                      <p className="mt-2 text-sm text-gray-500">
                        Finish current consultation before calling next patient
                      </p>
                    )}
                    {!hasWaitingPatients && (
                      <p className="mt-2 text-sm text-gray-500">No patients in queue</p>
                    )}
                    {todaysAppointmentsSorted.length === 0 ? (
                      <p className="text-sm text-gray-500">No appointments today</p>
                    ) : (
                      <AnimatePresence>
                        {todaysAppointmentsSorted.map((appointment) => (
                          <motion.div
                            key={appointment._id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.25 }}
                            className={`flex items-center justify-between rounded p-4 shadow ${
                              isEmergency(appointment.priorityScore || 0)
                                ? "border-2 border-red-500 animate-pulse"
                                : "border border-gray-100"
                            }`}
                          >
                            <div>
                              <p className="font-medium text-slate-900">
                                {formatName(appointment.patient?.name || "Unknown")}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatTime(appointment.date)} • Queue #{appointment.queueNumber || "—"}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                {getSymptomText(appointment)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {appointment.department || "General Medicine"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                            <span
                              className={`rounded px-2 py-1 text-xs text-white ${getPriorityColor(
                                appointment.priorityScore || 0
                              )}`}
                            >
                              {getPriorityLabel(appointment.priorityScore || 0)}
                            </span>
                            <EmergencyBadge priorityScore={appointment.priorityScore || 0} />
                            <span
                              className={`rounded px-2 py-1 text-xs font-semibold ${getStatusStyle(
                                appointment.status
                              )}`}
                              >
                                {appointment.status}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "upcoming" && (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-lg font-semibold text-slate-900">
                    {formatLabel("Upcoming Appointments")}
                  </h2>
                  {upcomingAppointments.length === 0 ? (
                    <p className="text-sm text-gray-500">No upcoming appointments</p>
                  ) : (
                    <div className="grid gap-3">
                      {upcomingAppointments.map((appointment) => (
                        <div
                          key={appointment._id}
                          className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm"
                        >
                          <p className="text-sm font-semibold text-slate-900">
                            {formatName(appointment.patient?.name || "Unknown")}
                          </p>
                          <p className="text-sm text-gray-600">
                            {appointment.department
                              ? formatDepartment(appointment.department)
                              : "N/A"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {appointment.date
                              ? new Date(appointment.date).toLocaleString()
                              : "Date not set"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "past" && (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-lg font-semibold text-slate-900">
                    {formatLabel("Past Appointments")}
                  </h2>
                  {sortedPastAppointments.length === 0 ? (
                    <p className="text-sm text-gray-500">No past appointments</p>
                  ) : (
                    <div className="max-h-96 overflow-y-auto">
                      {sortedPastAppointments.map((appointment) => (
                        <div key={appointment._id} className="border-b py-3 last:border-b-0">
                          <p className="font-medium text-slate-900">
                            {formatName(appointment.patient?.name || "Unknown")}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatLabel("Hospital")}: {appointment.hospitalName || "Unknown"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {appointment.date
                              ? new Date(appointment.date).toLocaleString()
                              : "Date not set"}
                          </p>
                          <button
                            type="button"
                            className="text-blue-600 text-sm hover:underline"
                            onClick={() =>
                              handleViewRecord(
                                appointment.patient?.healthId || appointment.patientHealthId
                              )
                            }
                          >
                            View Record
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">
                {formatLabel("Search Patient Records")}
              </h2>
              <input
                type="text"
                placeholder="Search patient by name or Health ID"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="mb-4 w-full rounded border border-slate-200 p-2 text-sm"
              />
              {searchResults.length === 0 ? (
                <p className="text-sm text-slate-500">
                  {search.trim().length < 2
                    ? "Type at least 2 characters to search."
                    : "No patients found."}
                </p>
              ) : (
                <div className="divide-y divide-slate-100 rounded-lg border border-slate-100">
                  {searchResults.map((patient) => (
                    <div
                      key={patient.healthId}
                      className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-50"
                      onClick={() => handleViewRecord(patient.healthId)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") handleViewRecord(patient.healthId);
                      }}
                    >
                      {formatName(patient.name || "Unknown")} — {patient.healthId}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {showRecords && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Medical Records</h2>
                  <button
                    type="button"
                    className="text-sm text-slate-500 hover:text-slate-700"
                    onClick={() => setShowRecords(false)}
                  >
                    Close
                  </button>
                </div>
                {records.length === 0 ? (
                  <p className="text-sm text-slate-500">No records found.</p>
                ) : (
                  <div className="grid gap-3">
                    {records.map((record) => (
                      <div key={record._id} className="border-b border-slate-100 py-3">
                        <p className="text-sm">
                          <span className="font-semibold">Diagnosis:</span>{" "}
                          {record.diagnosis || "N/A"}
                        </p>
                        <p className="text-sm">
                          <span className="font-semibold">Notes:</span>{" "}
                          {record.notes || "N/A"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {accessRequired && (
              <div className="rounded-xl bg-yellow-100 border-l-4 border-yellow-500 p-4">
                <p className="text-sm font-semibold text-yellow-800">
                  Access required to view records
                </p>
                {requestSent ? (
                  <p className="mt-3 text-sm font-medium text-green-600">
                    Access request sent. Waiting for patient approval
                  </p>
                ) : (
                  <button
                    type="button"
                    className="mt-3 rounded bg-yellow-600 px-3 py-2 text-sm font-semibold text-white hover:bg-yellow-700"
                    onClick={handleRequestAccess}
                    disabled={requestingAccess}
                  >
                    {requestingAccess ? "Requesting..." : "Request Access"}
                  </button>
                )}
                {requestSent && (
                  <p className="mt-2 text-sm text-gray-500 animate-pulse">
                    {waitingLong
                      ? "Still waiting for patient approval..."
                      : "Checking for patient approval..."}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {consultationMode && (
          <div className="grid gap-6 lg:grid-cols-3">
            {!selectedAppointment ? (
              <div className="col-span-3 mb-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">Select a checked-in patient to begin.</p>
              </div>
            ) : (
              <>
                <div className="col-span-1 mb-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h2 className="mb-3 text-lg font-semibold text-slate-900">
                    {formatLabel("Patient Info")}
                  </h2>
                  <div className="grid gap-2 text-sm text-gray-700">
                    <p>
                      <span className="font-semibold">Name:</span>{" "}
                      {formatName(selectedAppointment.patient?.name || "Unknown")}
                    </p>
                    <p>
                      <span className="font-semibold">Age:</span>{" "}
                      {selectedAppointment.patient?.age || "N/A"}
                    </p>
                    <p>
                      <span className="font-semibold">Blood Group:</span>{" "}
                      {selectedAppointment.patient?.bloodGroup || "N/A"}
                    </p>
                    <p>
                      <span className="font-semibold">Health ID:</span>{" "}
                      {selectedAppointment.patient?.healthId || "N/A"}
                    </p>
                    <p>
                      <span className="font-semibold">Phone:</span>{" "}
                      {selectedAppointment.patient?.phone || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="col-span-2 mb-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h2 className="mb-3 text-lg font-semibold text-slate-900">
                    {formatLabel("Consultation")}
                  </h2>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-sm font-medium text-gray-700">Symptoms</p>
                    <ul className="mt-2 ml-5 list-disc text-sm text-gray-600">
                      {selectedAppointment?.structuredSymptoms?.length ? (
                        selectedAppointment.structuredSymptoms.map((symptom, index) => (
                          <li key={index}>{symptom}</li>
                        ))
                      ) : (
                        <li>{getSymptomText(selectedAppointment)}</li>
                      )}
                    </ul>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs font-medium text-gray-500">Department</p>
                    <p className="text-sm text-gray-700">
                      {selectedAppointment?.department || "General Medicine"}
                    </p>
                  </div>
                  <form onSubmit={handleAddRecord} className="grid gap-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-600">
                        {formatLabel("Diagnosis")}
                      </p>
                      <input
                        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Diagnosis"
                        value={diagnosis}
                        onChange={(event) => setDiagnosis(event.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-600">
                        {formatLabel("Priority")}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <select
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          value={selectedPriority}
                          onChange={(event) => setSelectedPriority(Number(event.target.value))}
                        >
                          <option value={2}>Low</option>
                          <option value={5}>Medium</option>
                          <option value={8}>High</option>
                          <option value={10}>Emergency</option>
                        </select>
                        <button
                          type="button"
                          className={`rounded-lg px-3 py-2 text-sm font-semibold text-white ${
                            isPriorityChanged && !isUpdatingPriority
                              ? "bg-blue-600 hover:bg-blue-700"
                              : "bg-gray-400 cursor-not-allowed"
                          }`}
                          onClick={handleUpdatePriority}
                          disabled={!isPriorityChanged || isUpdatingPriority}
                        >
                          {isUpdatingPriority ? "Saving..." : "Update Priority"}
                        </button>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 p-3">
                      <p className="text-xs font-semibold text-slate-600">
                        {formatLabel("Prescription")}
                      </p>
                      <div className="mt-3 grid gap-2">
                        <input
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          placeholder="Medicine"
                          name="medicine"
                          value={medicineForm.medicine}
                          onChange={handleMedicineChange}
                        />
                        <div className="grid gap-2 md:grid-cols-2">
                          <input
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            placeholder="Dose"
                            name="dose"
                            value={medicineForm.dose}
                            onChange={handleMedicineChange}
                          />
                          <input
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            placeholder="Frequency"
                            name="frequency"
                            value={medicineForm.frequency}
                            onChange={handleMedicineChange}
                          />
                        </div>
                        <input
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          placeholder="Duration"
                          name="duration"
                          value={medicineForm.duration}
                          onChange={handleMedicineChange}
                        />
                        <button
                          type="button"
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300"
                          onClick={handleAddMedicine}
                        >
                          Add Medicine
                        </button>
                      </div>
                      {medicines.length > 0 && (
                        <div className="mt-3">
                          {medicines.map((med, index) => (
                            <div
                              key={index}
                              className="mb-2 flex items-center justify-between rounded-lg bg-white p-3 shadow"
                            >
                              <div>
                                <p className="font-medium text-slate-900">
                                  {index + 1}. {formatMedicine(med.medicine || "")}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {med.dose} · {med.frequency} · {med.duration}
                                </p>
                              </div>
                              <button
                                type="button"
                                className="text-sm text-red-500 hover:underline"
                                onClick={() => removeMedicine(index)}
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-600">
                        {formatLabel("Notes")}
                      </p>
                      <textarea
                        className="mt-2 min-h-[90px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Notes"
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                      />
                    </div>

                    <button
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                      disabled={submittingRecord}
                    >
                      {submittingRecord ? (
                        <div className="mx-auto h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                      ) : (
                        "Save Medical Record"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCompleteConsultation}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                    >
                      Complete Consultation
                    </button>
                    <button
                      type="button"
                      onClick={handleExitConsultation}
                      className="rounded-lg bg-gray-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-600"
                    >
                      Exit Consultation
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorDashboard;
