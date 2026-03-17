import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";

const rootEl = document.getElementById("root");
ReactDOM.createRoot(rootEl).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
