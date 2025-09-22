import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase"; // You already have this file

// Function to fetch weather data
export const fetchWeatherData = async () => {
  const colRef = collection(db, "sriLankaWeather");
  const snapshot = await getDocs(colRef);
  const weatherList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return weatherList;
};
