const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch"); // npm install node-fetch@2
require("dotenv").config(); // optional for local env

admin.initializeApp();
const db = admin.firestore();

// Google Weather API setup
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || "YOUR_GOOGLE_WEATHER_API_KEY";
const CITY = "Colombo"; // example city
const COUNTRY_CODE = "LK"; // optional
const WEATHER_API_URL = `https://weather.googleapis.com/v1/weather?location=${CITY},${COUNTRY_CODE}&key=${WEATHER_API_KEY}`;

// Scheduled function - runs every hour
exports.fetchWeatherData = functions.pubsub
  .schedule("every 60 minutes")
  .timeZone("Asia/Colombo")
  .onRun(async (context) => {
    try {
      const response = await fetch(WEATHER_API_URL);
      const data = await response.json();

      // Save data to Firestore
      await db.collection("weatherData").add({
        city: CITY,
        temperature: data.current.temp_c || data.current.temperature, // depends on API response
        humidity: data.current.humidity,
        weather: data.current.condition?.text || data.current.weather, // adapt to API
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log("Weather data saved:", data);
      return null;
    } catch (error) {
      console.error("Error fetching weather data:", error);
      return null;
    }
  });

// Test HTTP function (optional)
exports.helloWorld = functions.https.onRequest((req, res) => {
  res.send("Hello! Firebase Functions are working.");
});
