import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

const disasterAlertsCollection = collection(db, "disasterAlerts");

export const addDisasterAlert = async (alertData) => {
  const docRef = await addDoc(disasterAlertsCollection, {
    ...alertData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getDisasterAlerts = async () => {
  const q = query(disasterAlertsCollection, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const updateDisasterAlert = async (id, alertData) => {
  const docRef = doc(db, "disasterAlerts", id);
  await updateDoc(docRef, {
    ...alertData,
    updatedAt: serverTimestamp(),
  });
};

export const deleteDisasterAlert = async (id) => {
  const docRef = doc(db, "disasterAlerts", id);
  await deleteDoc(docRef);
};
