const API_BASE_URL = "https://hospital-ecosystem-v2.onrender.com/api";

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    const message = data?.message || "Request failed";
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
};

export const loginUser = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
};

export const registerUser = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
};

export const activatePatient = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/auth/activate-patient`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
};

export const createAppointment = async (payload, token) => {
  const response = await fetch(`${API_BASE_URL}/appointment/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
};

export const getPatientRecords = async (token, patientHealthId = "") => {
  const query = patientHealthId
    ? `?patientHealthId=${encodeURIComponent(patientHealthId)}`
    : "";
  const response = await fetch(`${API_BASE_URL}/patient/records${query}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return handleResponse(response);
};

export const getPatientAppointments = async (token) => {
  const response = await fetch(`${API_BASE_URL}/patient/appointments`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return handleResponse(response);
};

export const addMedicalRecord = async (payload, token) => {
  const response = await fetch(`${API_BASE_URL}/medical-record/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
};

export const checkInPatient = async (appointmentId, token) => {
  const response = await fetch(`${API_BASE_URL}/appointment/checkin/${appointmentId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return handleResponse(response);
};

export const completeAppointment = async (appointmentId, token) => {
  const response = await fetch(`${API_BASE_URL}/appointment/complete/${appointmentId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return handleResponse(response);
};

export const callNextPatient = async (token) => {
  const response = await fetch(`${API_BASE_URL}/appointment/call-next`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return handleResponse(response);
};

export const updateAppointmentPriority = async (appointmentId, priorityScore, token) => {
  const response = await fetch(`${API_BASE_URL}/appointment/priority/${appointmentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ priorityScore })
  });
  return handleResponse(response);
};

export const createDoctorProfile = async (payload, token) => {
  const response = await fetch(`${API_BASE_URL}/admin/create-doctor`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
};

export const triageSymptoms = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/triage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
};

export const getAdminStats = async (token) => {
  const response = await fetch(`${API_BASE_URL}/admin/stats`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return handleResponse(response);
};

export const getUsers = async (token) => {
  const response = await fetch(`${API_BASE_URL}/admin/users`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return handleResponse(response);
};

export const updateUser = async (userId, payload, token) => {
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
};

export const getDoctors = async (token, hospitalId = "") => {
  const query = hospitalId ? `?hospitalId=${encodeURIComponent(hospitalId)}` : "";
  const response = await fetch(`${API_BASE_URL}/doctors${query}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return handleResponse(response);
};

export const getDoctorUsersWithoutProfile = async (token) => {
  const response = await fetch(`${API_BASE_URL}/admin/doctor-users`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return handleResponse(response);
};

export const getHospitals = async (token) => {
  const response = await fetch(`${API_BASE_URL}/hospitals`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return handleResponse(response);
};

export const getHospitalById = async (hospitalId, token) => {
  const response = await fetch(`${API_BASE_URL}/hospitals/${hospitalId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return handleResponse(response);
};

export const createHospital = async (payload, token) => {
  const response = await fetch(`${API_BASE_URL}/admin/hospitals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
};

export const createHospitalAdmin = async (payload, token) => {
  const response = await fetch(`${API_BASE_URL}/admin/create-hospital-admin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
};

export const searchPatients = async (tokenOrQuery, maybeQuery) => {
  const query = typeof maybeQuery === "string" ? maybeQuery : tokenOrQuery;
  const token = typeof maybeQuery === "string" ? tokenOrQuery : null;
  const response = await fetch(
    `${API_BASE_URL}/patients?search=${encodeURIComponent(query)}`,
    {
      headers: token
        ? {
            Authorization: `Bearer ${token}`
          }
        : undefined
    }
  );
  return handleResponse(response);
};

export const getTodayAppointments = async (token) => {
  const response = await fetch(`${API_BASE_URL}/appointments/today`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return handleResponse(response);
};

export const getPatientStats = async (token) => {
  const response = await fetch(`${API_BASE_URL}/patient/stats`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return handleResponse(response);
};

export const getPatientProfile = async (token) => {
  const response = await fetch(`${API_BASE_URL}/patients/profile`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return handleResponse(response);
};

export const getDoctorStats = async (token) => {
  const response = await fetch(`${API_BASE_URL}/doctor/stats`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return handleResponse(response);
};

export const getReceptionStats = async (token) => {
  const response = await fetch(`${API_BASE_URL}/reception/stats`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return handleResponse(response);
};

export const registerPatientByReception = async (payload, token) => {
  const response = await fetch(`${API_BASE_URL}/patients/reception/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
};

export const getAccessRequests = async (token) => {
  const response = await fetch(`${API_BASE_URL}/access/requests`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return handleResponse(response);
};

export const approveAccessRequest = async (requestId, token) => {
  const response = await fetch(`${API_BASE_URL}/access/approve/${requestId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return handleResponse(response);
};

export const rejectAccessRequest = async (requestId, token) => {
  const response = await fetch(`${API_BASE_URL}/access/reject/${requestId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return handleResponse(response);
};

export const requestAccess = async (payload, token) => {
  const response = await fetch(`${API_BASE_URL}/access/request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
};
