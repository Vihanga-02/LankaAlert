// services/emergencyService.js
import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";

/**
 * Save emergency request data into Firestore
 * @param {Object} emergencyData - The emergency form data
 * @returns {Promise<string>} - Returns the document ID of created request
 */
export const createEmergencyRequest = async (emergencyData) => {
  try {
    const docRef = await addDoc(collection(db, "emergencyRequests"), {
      ...emergencyData,
      status: "pending", // default status
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding emergency request: ", error);
    throw error;
  }
};

/**
 * Fetch all emergency requests for a specific phone number
 * @param {string} phone - Phone number of the requester
 * @returns {Promise<Array>} - List of requests
 */
export const getEmergencyRequests = async (phone) => {
  try {
    const q = query(collection(db, "emergencyRequests"), where("phone", "==", phone));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error fetching requests: ", error);
    throw error;
  }
};

/**
 * Update an emergency request
 * @param {string} id - Document ID of the request
 * @param {Object} updatedData - Fields to update
 */
export const updateEmergencyRequest = async (id, updatedData) => {
  try {
    const docRef = doc(db, "emergencyRequests", id);
    await updateDoc(docRef, updatedData);
  } catch (error) {
    console.error("Error updating request: ", error);
    throw error;
  }
};

/**
 * Delete an emergency request
 * @param {string} id - Document ID of the request
 */
export const deleteEmergencyRequest = async (id) => {
  try {
    const docRef = doc(db, "emergencyRequests", id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting request: ", error);
    throw error;
  }
};
