import React, { createContext, useContext, useState, useEffect } from "react";
import {
  addDisasterAlert,
  getDisasterAlerts,
  updateDisasterAlert,
  deleteDisasterAlert,
} from "../services/disasterAlertService";

const DisasterAlertContext = createContext();

export const DisasterAlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await getDisasterAlerts();
      setAlerts(data);
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
    }
    setLoading(false);
  };

  const createAlert = async (alertData) => {
    try {
      const id = await addDisasterAlert(alertData);
      setAlerts((prev) => [{ id, ...alertData }, ...prev]);
      return id;
    } catch (err) {
      console.error("Failed to create alert:", err);
      throw err;
    }
  };

  const editAlert = async (id, alertData) => {
    try {
      await updateDisasterAlert(id, alertData);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...alertData } : a))
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
