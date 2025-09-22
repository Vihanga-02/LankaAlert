// src/context/DisasterAlertContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  addDisasterAlert,
  getDisasterAlerts,
  updateDisasterAlert,
  deleteDisasterAlert,
} from "../services/disasterAlertService";
import { Timestamp } from "firebase/firestore";

const DisasterAlertContext = createContext();

// 🔥 Utility to normalize Firestore data
const normalizeAlert = (alert) => {
  const data = { ...alert };

  // Normalize validUntil (timestamp → date + time)
  if (data.validUntil && typeof data.validUntil.toDate === "function") {
    const d = data.validUntil.toDate();
    data.validUntilDate = d.toISOString().split("T")[0]; // yyyy-mm-dd
    data.validUntilTime = d.toTimeString().slice(0, 5); // HH:mm
  }

  // Normalize createdAt (timestamp)
  if (data.createdAt && typeof data.createdAt.toDate === "function") {
    data.createdAt = data.createdAt.toDate();
  }

  return data;
};

export const DisasterAlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  // ----------------- Fetch all alerts -----------------
  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await getDisasterAlerts();
      const normalized = data.map((a) => normalizeAlert(a));
      setAlerts(normalized);
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  // ----------------- Create alert -----------------
  const createAlert = async (alertData) => {
    try {
      let validUntil = null;
      if (alertData.validUntilDate && alertData.validUntilTime) {
        validUntil = Timestamp.fromDate(
          new Date(`${alertData.validUntilDate}T${alertData.validUntilTime}`)
        );
      }

      const newAlert = {
        ...alertData,
        createdAt: Timestamp.now(),
        validUntil,
      };

      // Add to Firestore
      const id = await addDisasterAlert(newAlert);

      // Update state
      setAlerts((prev) => [{ id, ...normalizeAlert(newAlert) }, ...prev]);

      return id;
    } catch (err) {
      console.error("Failed to create alert:", err);
      throw err;
    }
  };

  // ----------------- Edit alert -----------------
  const editAlert = async (id, alertData) => {
  try {
    let validUntil = null;
    if (alertData.validUntilDate && alertData.validUntilTime) {
      validUntil = Timestamp.fromDate(
        new Date(`${alertData.validUntilDate}T${alertData.validUntilTime}`)
      );
    }

    // ✅ Preserve reportId if missing in update
    const existing = alerts.find((a) => a.id === id);
    const updatedAlert = {
      ...alertData,
      validUntil,
      reportId: alertData.reportId || existing?.reportId || null,
    };

    await updateDisasterAlert(id, updatedAlert);

    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, ...normalizeAlert(updatedAlert) } : a
      )
    );
  } catch (err) {
    console.error("Failed to update alert:", err);
    throw err;
  }
};


  // ----------------- Remove alert -----------------
  const removeAlert = async (id) => {
    try {
      await deleteDisasterAlert(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Failed to delete alert:", err);
      throw err;
    }
  };

  // ----------------- Initial fetch -----------------
  useEffect(() => {
    fetchAlerts();
  }, []);

  return (
    <DisasterAlertContext.Provider
      value={{
        alerts,
        loading,
        fetchAlerts,
        createAlert,
        editAlert,
        removeAlert,
      }}
    >
      {children}
    </DisasterAlertContext.Provider>
  );
};

// ----------------- Hook -----------------
export const useDisasterAlert = () => {
  const context = useContext(DisasterAlertContext);
  if (!context) {
    throw new Error(
      "useDisasterAlert must be used within a DisasterAlertProvider"
    );
  }
  return context;
};
