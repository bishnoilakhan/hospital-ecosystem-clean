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

  try {
    const decoded = token ? JSON.parse(atob(token.split(".")[1])) : null;

    if (decoded && !decoded.hospitalId) {
      console.warn("Old token detected — clearing session");

      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("hospitalId");

      setToken(null);
      setRole(null);
      setHospitalId(null);
    }
  } catch (error) {
    console.warn("Invalid token — clearing session");

    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("hospitalId");

    setToken(null);
    setRole(null);
    setHospitalId(null);
  }

  const login = (nextToken, nextRole, nextHospitalId) => {
    const normalizedRole = nextRole?.toLowerCase() || null;
    console.log("STORING ROLE:", normalizedRole);
    try {
      localStorage.setItem("token", nextToken);
      if (normalizedRole) {
        localStorage.setItem("role", normalizedRole);
      }
      if (nextHospitalId) {
        localStorage.setItem("hospitalId", nextHospitalId);
      }
    } catch (error) {
      console.error("localStorage set error:", error);
    }

    setToken(nextToken);
    setRole(normalizedRole);
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
