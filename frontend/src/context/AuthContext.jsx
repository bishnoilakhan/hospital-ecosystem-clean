import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  let initialToken = null;
  let initialRole = null;
  let initialHospitalId = null;

  try {
    initialToken = localStorage.getItem("token");
    initialRole = localStorage.getItem("role");
    initialHospitalId = localStorage.getItem("hospitalId");
  } catch (error) {
    console.error("localStorage error:", error);
  }

  const [token, setToken] = useState(initialToken);
  const [role, setRole] = useState(initialRole);
  const [hospitalId, setHospitalId] = useState(initialHospitalId);

  const login = (nextToken, nextRole, nextHospitalId) => {
    try {
      localStorage.setItem("token", nextToken);
      localStorage.setItem("role", nextRole);
      if (nextHospitalId) {
        localStorage.setItem("hospitalId", nextHospitalId);
      }
    } catch (error) {
      console.error("localStorage set error:", error);
    }

    setToken(nextToken);
    setRole(nextRole);
    setHospitalId(nextHospitalId || null);
  };

  const logout = () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error("localStorage clear error:", error);
    }

    setToken(null);
    setRole(null);
    setHospitalId(null);
  };

  return (
    <AuthContext.Provider value={{ token, role, hospitalId, login, logout }}>
      {children || <div>Loading...</div>}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) return {};

  return context;
};
