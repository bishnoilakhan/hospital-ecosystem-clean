import React, { createContext, useContext, useEffect, useState } from "react";

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

  useEffect(() => {
    if (!token) return;

    const timeoutId = setTimeout(() => {
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));

        if (!decoded || !decoded.role) {
          console.warn("Invalid token — clearing session");
          logout();
        }
      } catch (error) {
        console.warn("Token decode failed — clearing session");
        logout();
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [token]);

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
