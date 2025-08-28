import React, { createContext, useContext, useEffect, useState } from "react";
import {
  addDisasterReport,
  getDisasterReports,
  updateDisasterReport,
  deleteDisasterReport,
  getDisasterReportById,
} from "../services/DisasterReports.js";
import { useAuth } from "./AuthContext";

const DisasterReportsContext = createContext();
export const useDisasterReports = () => useContext(DisasterReportsContext);

export const DisasterReportsProvider = ({ children }) => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all reports on mount
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await getDisasterReports();
      setReports(data);
    } catch (error) {
      console.error("Failed to fetch reports", error);
    } finally {
      setLoading(false);
    }
  };

  const addReport = async (reportData) => {
    if (!user) throw new Error("No logged-in user");
    try {
      const newId = await addDisasterReport(reportData, user);
      const newReport = await getDisasterReportById(newId);
      setReports((prev) => [...prev, newReport]);
    } catch (error) {
      console.error("Failed to add report:", error);
      throw error;
    }
  };

  const editReport = async (id, updatedData) => {
    try {
      await updateDisasterReport(id, updatedData);
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updatedData } : r))
      );
    } catch (error) {
      console.error("Failed to update report:", error);
      throw error;
    }
  };

  const removeReport = async (id) => {
    try {
      await deleteDisasterReport(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error("Failed to delete report:", error);
      throw error;
    }
  };

  // ✅ Async version: always fetch fresh user reports from Firestore
  const getUserReports = async (email) => {
    try {
      const allReports = await getDisasterReports();
      return allReports.filter((r) => r.reporterEmail === email);
    } catch (error) {
      console.error("Failed to fetch user reports:", error);
      return [];
    }
  };

  return (
    <DisasterReportsContext.Provider
      value={{
        reports,
        loading,
        addReport,
        editReport,
        removeReport,
        fetchReports,
        getUserReports, // async now
      }}
    >
      {children}
    </DisasterReportsContext.Provider>
  );
};
