import React, { createContext, useContext, useState, useEffect } from "react";
import MapZoneServices from "../services/MapZoneServices";

const MapZoneContext = createContext();
export const useMapZone = () => useContext(MapZoneContext);

export const MapZoneProvider = ({ children }) => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchZones = async () => {
    setLoading(true);
    try {
      const data = await MapZoneServices.getZones();
      setZones(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addZone = async (zoneData) => {
    const newZone = await MapZoneServices.createZone(zoneData);
    setZones((prev) => [...prev, newZone]);
    return newZone;
  };

  const updateZone = async (id, updatedData) => {
    const updatedZone = await MapZoneServices.updateZone(id, updatedData);
    setZones((prev) => prev.map((z) => (z.id === id ? updatedZone : z)));
    return updatedZone;
  };

  const deleteZone = async (id) => {
    await MapZoneServices.deleteZone(id);
    setZones((prev) => prev.filter((z) => z.id !== id));
    return true;
  };

  useEffect(() => {
    fetchZones();
  }, []);

  return (
    <MapZoneContext.Provider value={{ zones, loading, fetchZones, addZone, updateZone, deleteZone }}>
      {children}
    </MapZoneContext.Provider>
  );
};
