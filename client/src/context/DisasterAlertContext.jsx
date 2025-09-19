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
  if (data.validUntil instanceof Timestamp) {
    const d = data.validUntil.toDate();
    data.validUntilDate = d.toISOString().split("T")[0]; // yyyy-mm-dd
    data.validUntilTime = d.toTimeString().slice(0, 5); // HH:mm
  }

  // Normalize createdAt (timestamp)
  if (data.createdAt instanceof Timestamp) {
    data.createdAt = data.createdAt.toDate();
  }

  return data;
};

export const DisasterAlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await getDisasterAlerts();
      const normalized = data.map((a) => normalizeAlert(a));
      setAlerts(normalized);
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
    }
    setLoading(false);
  };

  const createAlert = async (alertData) => {
    try {
      // Convert validUntilDate + validUntilTime → Timestamp
      let validUntil = null;
      if (alertData.validUntilDate && alertData.validUntilTime) {
        validUntil = Timestamp.fromDate(
          new Date(`${alertData.validUntilDate}T${alertData.validUntilTime}:00`)
        );
      }

      const newAlert = {
        ...alertData,
        createdAt: Timestamp.now(),
        validUntil,
      };

      const id = await addDisasterAlert(newAlert);
      setAlerts((prev) => [{ id, ...normalizeAlert(newAlert) }, ...prev]);
      return id;
    } catch (err) {
      console.error("Failed to create alert:", err);
      throw err;
    }
  };

  const editAlert = async (id, alertData) => {
    try {
      let validUntil = null;
      if (alertData.validUntilDate && alertData.validUntilTime) {
        validUntil = Timestamp.fromDate(
          new Date(`${alertData.validUntilDate}T${alertData.validUntilTime}:00`)
        );
      }

      const updated = {
        ...alertData,
        validUntil,
      };

      await updateDisasterAlert(id, updated);
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, ...normalizeAlert(updated) } : a
        )
      );
    } catch (err) {
      console.error("Failed to update alert:", err);
    }
  };

  const removeAlert = async (id) => {
    try {
      await deleteDisasterAlert(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Failed to delete alert:", err);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  return (
    <DisasterAlertContext.Provider
      value={{ alerts, loading, fetchAlerts, createAlert, editAlert, removeAlert }}
    >
      {children}
    </DisasterAlertContext.Provider>
  );
};

export const useDisasterAlert = () => {
  return useContext(DisasterAlertContext);
};
