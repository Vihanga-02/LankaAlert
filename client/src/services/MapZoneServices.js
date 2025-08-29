// services/MapZoneServices.js
import { db } from "./firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";

const COLLECTION_NAME = "mapZones";

const MapZoneServices = {
  // CREATE
  createZone: async (zoneData) => {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), zoneData);
      return { id: docRef.id, ...zoneData };
    } catch (error) {
      console.error("Error adding zone:", error);
      throw error;
    }
  },

  // READ
  getZones: async () => {
    try {
      const snapshot = await getDocs(collection(db, COLLECTION_NAME));
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching zones:", error);
      throw error;
    }
  },

  // UPDATE
  updateZone: async (id, updatedData) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, updatedData);
      return { id, ...updatedData };
    } catch (error) {
      console.error("Error updating zone:", error);
      throw error;
    }
  },

  // DELETE
  deleteZone: async (id) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error("Error deleting zone:", error);
      throw error;
    }
  },
};

export default MapZoneServices;
