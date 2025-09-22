import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase"; // <-- you already have this file

const COL = "disasterThresholds";
const colRef = collection(db, COL);

// --- Realtime subscription (used by Context)
export const subscribeThresholds = (onData, onError) => {
  const q = query(colRef, orderBy("cityName"));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onData(list);
    },
    (err) => onError?.(err)
  );
};

// --- Uniqueness check by cityCode (optional but helpful)
export const cityCodeExists = async (cityCode, ignoreId = null) => {
  const q = query(colRef, where("cityCode", "==", cityCode));
  const snap = await getDocs(q);
  if (snap.empty) return false;
  if (!ignoreId) return true;
  return snap.docs.some((d) => d.id !== ignoreId);
};

// --- CRUD
export const createThreshold = async (payload) => {
  const clean = {
    cityName: payload.cityName,
    cityCode: payload.cityCode,
    latitude: Number(payload.latitude),
    longitude: Number(payload.longitude),
    rainfallThresholdMm: Number(payload.rainfallThresholdMm),
    temperatureThreshold: Number(payload.temperatureThreshold),
    windThreshold: Number(payload.windThreshold),
    airQualityThreshold: Number(payload.airQualityThreshold),
    uvIndexThreshold: Number(payload.uvIndexThreshold), // Include UV Index threshold
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  return addDoc(colRef, clean);
};

export const updateThreshold = async (id, payload) => {
  const ref = doc(db, COL, id);
  const clean = {
    ...payload,
    latitude: Number(payload.latitude),
    longitude: Number(payload.longitude),
    rainfallThresholdMm: Number(payload.rainfallThresholdMm),
    temperatureThreshold: Number(payload.temperatureThreshold),
    windThreshold: Number(payload.windThreshold),
    airQualityThreshold: Number(payload.airQualityThreshold),
    uvIndexThreshold: Number(payload.uvIndexThreshold), // Include UV Index threshold
    updatedAt: serverTimestamp(),
  };
  return updateDoc(ref, clean);
};

export const deleteThreshold = async (id) => {
  const ref = doc(db, COL, id);
  return deleteDoc(ref);
};
