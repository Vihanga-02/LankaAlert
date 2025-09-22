import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  subscribeThresholds,
  createThreshold,
  updateThreshold,
  deleteThreshold,
  cityCodeExists,
} from "../services/thresholdService";

const ThresholdsCtx = createContext(null);

export const ThresholdsProvider = ({ children }) => {
  const [thresholds, setThresholds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeThresholds(
      (list) => {
        setThresholds(list);
        setLoading(false);
      },
      (e) => {
        setErr(e);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const api = useMemo(
    () => ({
      thresholds,
      loading,
      error: err,

      create: async (data) => {
        if (await cityCodeExists(data.cityCode)) {
          throw new Error("City code already exists.");
        }
        await createThreshold(data); // Pass data including UV Index threshold
      },

      update: async (id, data) => {
        if (await cityCodeExists(data.cityCode, id)) {
          throw new Error("City code already exists.");
        }
        await updateThreshold(id, data); // Pass data including UV Index threshold
      },

      remove: async (id) => {
        await deleteThreshold(id);
      },
    }),
    [thresholds, loading, err]
  );

  return <ThresholdsCtx.Provider value={api}>{children}</ThresholdsCtx.Provider>;
};

export const useThresholds = () => {
  const ctx = useContext(ThresholdsCtx);
  if (!ctx) throw new Error("useThresholds must be used within ThresholdsProvider");
  return ctx;
};
