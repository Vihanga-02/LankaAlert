import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase"; // Assuming you already have Firebase setup

const WEATHER_ALERTS_COLLECTION = "WeatherAlerts";
const weatherAlertsRef = collection(db, WEATHER_ALERTS_COLLECTION);

// --- Helper function to generate timestamp for expiry ---
const getExpiresAt = () => {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // Set expiration time to 24 hours from now
  return expiresAt;
};

// --- Add or Update Weather Alert ---
export const addOrUpdateWeatherAlert = async (alertData) => {
  try {
    const { cityName, type } = alertData;
    
    // Query to check if an alert already exists for this city and type
    const q = query(
      weatherAlertsRef, 
      where("cityName", "==", cityName),
      where("type", "==", type),
      where("state", "==", "active")
    );
    const querySnapshot = await getDocs(q);

    // If there's already an active alert, update the existing one
    if (!querySnapshot.empty) {
      const existingAlert = querySnapshot.docs[0];
      const alertDocRef = doc(db, WEATHER_ALERTS_COLLECTION, existingAlert.id);
      
      // Update the expiresAt to reset it for 24 more hours if it's a new alert
      const updatedAlert = {
        ...alertData,
        expiresAt: getExpiresAt(),
      };

      // Set the state of the existing alert to inactive if it's within 24 hours and a new alert arrives
      await updateDoc(alertDocRef, updatedAlert);
      console.log(`Weather alert updated with ID: ${existingAlert.id}`);
      return existingAlert.id;
    } else {
      // If no active alert exists, create a new alert
      const alert = {
        ...alertData,
        createdAt: serverTimestamp(), // Firestore timestamp
        expiresAt: getExpiresAt(), // 24 hours from now
        state: "active", // Active state initially
      };
      
      const docRef = await addDoc(weatherAlertsRef, alert);
      console.log("Weather alert added with ID:", docRef.id);
      return docRef.id;
    }
  } catch (error) {
    console.error("Error adding or updating weather alert:", error);
    throw new Error("Could not add or update weather alert.");
  }
};

// --- Update Weather Alert State --- 
export const updateWeatherAlertState = async (alertId, state) => {
  try {
    const alertDocRef = doc(db, WEATHER_ALERTS_COLLECTION, alertId);
    await updateDoc(alertDocRef, { state }); // Updating the state field (active or inactive)
    console.log(`Weather alert ${alertId} state updated to ${state}`);
  } catch (error) {
    console.error("Error updating weather alert state:", error);
    throw new Error("Could not update weather alert.");
  }
};

// --- Delete Weather Alert ---
export const deleteWeatherAlert = async (alertId) => {
  try {
    const alertDocRef = doc(db, WEATHER_ALERTS_COLLECTION, alertId);
    await deleteDoc(alertDocRef);
    console.log(`Weather alert ${alertId} deleted`);
  } catch (error) {
    console.error("Error deleting weather alert:", error);
    throw new Error("Could not delete weather alert.");
  }
};

// --- Get all Active Weather Alerts ---
export const getActiveWeatherAlerts = async () => {
  try {
    const q = query(weatherAlertsRef, where("state", "==", "active"));
    const querySnapshot = await getDocs(q);
    const alerts = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return alerts;
  } catch (error) {
    console.error("Error getting active weather alerts:", error);
    throw new Error("Could not fetch active weather alerts.");
  }
};

// --- Check and Update Expired Alerts ---
// This function should be called periodically to check for expired alerts
export const checkExpiredAlerts = async () => {
  try {
    const q = query(weatherAlertsRef, where("state", "==", "active"));
    const querySnapshot = await getDocs(q);

    const currentTime = new Date();
    querySnapshot.forEach(async (doc) => {
      const alertData = doc.data();
      if (alertData.expiresAt.toDate() < currentTime) {
        // If the alert is expired, mark it as inactive
        await updateWeatherAlertState(doc.id, "inactive");
      }
    });
  } catch (error) {
    console.error("Error checking for expired alerts:", error);
    throw new Error("Could not check for expired weather alerts.");
  }
};
