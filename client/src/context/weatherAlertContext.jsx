import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchWeatherData } from "../services/weatherAlertService"; // import weather service
import { subscribeThresholds } from "../services/thresholdService"; // import threshold service
import { addOrUpdateWeatherAlert } from "../services/activeWeatherAlert"; // import function to save alerts to Firestore

const WeatherAlertContext = createContext();

export const useWeatherAlertContext = () => {
  return useContext(WeatherAlertContext);
};

export const WeatherAlertProvider = ({ children }) => {
  const [weatherData, setWeatherData] = useState([]);
  const [thresholdData, setThresholdData] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Fetch weather data
    const fetchWeather = async () => {
      const data = await fetchWeatherData();
      setWeatherData(data);
    };

    fetchWeather();

    // Subscribe to disaster thresholds
    const unsubscribe = subscribeThresholds(
      (data) => {
        setThresholdData(data);
      },
      (error) => console.error(error)
    );

    return () => unsubscribe(); // Clean up subscription
  }, []);

  // Function to handle different weather alert types and danger levels
  const getAlertDetails = (type, value, threshold) => {
    let dangerLevel = "Low Risk";
    let dangerColor = "bg-yellow-100 text-yellow-800"; // Default color for Low Risk

    if (type === "uv") {
      const uvDifference = value - threshold;
      if (uvDifference >= 5) {
        dangerLevel = "High Risk"; // High risk for values above threshold + 5
        dangerColor = "bg-red-100 text-red-800"; // Red for High Risk
      } else if (uvDifference >= 2) {
        dangerLevel = "Medium Risk"; // Medium risk for values above threshold + 2
        dangerColor = "bg-orange-100 text-orange-800"; // Orange for Medium Risk
      }
    }

    if (type === "wind") {
      const windDifference = value - threshold;
      if (windDifference >= 20) {
        dangerLevel = "High Risk"; // High risk for values above threshold + 20
        dangerColor = "bg-red-100 text-red-800"; // Red for High Risk
      } else if (windDifference >= 10) {
        dangerLevel = "Medium Risk"; // Medium risk for values above threshold + 10
        dangerColor = "bg-orange-100 text-orange-800"; // Orange for Medium Risk
      }
    }

    return { dangerLevel, dangerColor };
  };

  // Logic to compare weather and threshold data and generate alerts
  useEffect(() => {
    if (weatherData.length > 0 && thresholdData.length > 0) {
      const newAlerts = [];

      weatherData.forEach((weatherDoc) => {
        const matchingThreshold = thresholdData.find(
          (threshold) => threshold.cityName === weatherDoc.cityName
        );

        if (matchingThreshold) {
          // Flood risk alert
          const rainfallExceedsThreshold =
            weatherDoc.cumulative48HourRainfallMm > matchingThreshold.rainfallThresholdMm;
          if (rainfallExceedsThreshold) {
            // Flood Alert message
              const floodAlertMessage = `Flood Alert: The cumulative rainfall in ${weatherDoc.cityName} has reached ${weatherDoc.cumulative48HourRainfallMm} mm, exceeding the threshold of ${matchingThreshold.rainfallThresholdMm} mm. This significant rainfall has increased the risk of flooding in low-lying areas. Please take immediate precautions and avoid flood-prone zones. Stay alert to updates from local authorities, and consider evacuating if necessary.`;

            const alert = {
              cityName: weatherDoc.cityName,
              message: floodAlertMessage,
              createdAt: new Date().toLocaleDateString(),
              type: "Flood",
              ...getAlertDetails("flood", weatherDoc.cumulative48HourRainfallMm, matchingThreshold.rainfallThresholdMm),
            };
            newAlerts.push(alert);
            addOrUpdateWeatherAlert(alert); // Save or update the alert to Firestore
          }

          // Wind risk alert
          const windExceedsThreshold = weatherDoc.windSpeedKmh > matchingThreshold.windThreshold;
          if (windExceedsThreshold) {
            // Wind Alert message
            const windAlertMessage = `Wind Alert: In ${weatherDoc.cityName}, wind speeds have exceeded the threshold. The current wind speed is ${weatherDoc.windSpeedKmh} km/h, which is above the threshold of ${matchingThreshold.windThreshold} km/h. These high winds can cause damage to structures, disrupt power, and pose safety risks. Please take appropriate precautions, secure loose objects, and avoid unnecessary travel. Stay indoors and follow updates from local authorities.`;

            const alert = {
              cityName: weatherDoc.cityName,
              message: windAlertMessage,
              createdAt: new Date().toLocaleDateString(),
              type: "Wind",
              ...getAlertDetails("wind", weatherDoc.windSpeedKmh, matchingThreshold.windThreshold),
            };
            newAlerts.push(alert);
            addOrUpdateWeatherAlert(alert); // Save or update the alert to Firestore
          }

          // Temperature risk alert
          const temperatureExceedsThreshold =
            weatherDoc.temperatureC > matchingThreshold.temperatureThreshold;
          if (temperatureExceedsThreshold) {
            // Temperature Alert message
            const temperatureAlertMessage = `Temperature Alert: The temperature in ${weatherDoc.cityName} has exceeded the threshold. The current temperature is ${weatherDoc.temperatureC}°C, which is above the threshold of ${matchingThreshold.temperatureThreshold}°C. This extreme heat may pose health risks, such as heat exhaustion or heatstroke. Stay hydrated, wear light clothing, and avoid prolonged exposure to the sun. Take care when venturing outdoors during the hottest parts of the day.`;

            const alert = {
              cityName: weatherDoc.cityName,
              message: temperatureAlertMessage,
              createdAt: new Date().toLocaleDateString(),
              type: "Temperature",
              ...getAlertDetails("temperature", weatherDoc.temperatureC, matchingThreshold.temperatureThreshold),
            };
            newAlerts.push(alert);
            addOrUpdateWeatherAlert(alert); // Save or update the alert to Firestore
          }

          // UV Index alert
          const uvExceedsThreshold =
            weatherDoc.uvIndex > matchingThreshold.uvIndexThreshold;
          if (uvExceedsThreshold) {
            // UV Alert message
            const uvAlertMessage = `UV Alert: The UV index in ${weatherDoc.cityName} is currently ${weatherDoc.uvIndex}, which exceeds the safe threshold of ${matchingThreshold.uvIndexThreshold}. This increased UV exposure may cause skin damage, so please take immediate precautions. Wear sunscreen with high SPF, protective clothing, sunglasses, and avoid direct sunlight between 10 AM and 4 PM.`;

            const alert = {
              cityName: weatherDoc.cityName,
              message: uvAlertMessage,
              createdAt: new Date().toLocaleDateString(),
              type: "UV",
              ...getAlertDetails("uv", weatherDoc.uvIndex, matchingThreshold.uvIndexThreshold),
            };
            newAlerts.push(alert);
            addOrUpdateWeatherAlert(alert); // Save or update the alert to Firestore
          }
        }
      });

      setAlerts(newAlerts);
    }
  }, [weatherData, thresholdData]);

  return (
    <WeatherAlertContext.Provider value={{ alerts }}>
      {children}
    </WeatherAlertContext.Provider>
  );
};

export default WeatherAlertContext;
