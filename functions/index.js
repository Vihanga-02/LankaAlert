const admin = require('firebase-admin');
const fetch = require('node-fetch');
const { onSchedule } = require("firebase-functions/v2/scheduler");

// Load environment variables from .env file
require('dotenv').config();

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Access the API key directly from process.env
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

// --- Helper Functions ---
// These functions make the API calls.
// The getHourlyHistory function is correct as it defaults to 24 hours.

/**
 * Fetches historical hourly weather data for the specified number of hours.
 * @param {number} latitude - The latitude of the location.
 * @param {number} longitude - The longitude of the location.
 * @param {string} apiKey - The Google Weather API key.
 * @param {number} hours - The number of hours of historical data to fetch (max 24 per call).
 * @returns {Promise<object>} The API response.
 */
const getHourlyHistory = async (latitude, longitude, apiKey, hours = 24) => {
    const url = `https://weather.googleapis.com/v1/history/hours:lookup?key=${apiKey}&location.latitude=${latitude}&location.longitude=${longitude}&hours=${hours}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Historical API error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
};

/**
 * Fetches the daily forecast for a given location.
 * @param {number} latitude - The latitude of the location.
 * @param {number} longitude - The longitude of the location.
 * @param {string} apiKey - The Google Weather API key.
 * @param {number} days - The number of days to forecast (max 10).
 * @returns {Promise<object>} The API response.
 */
const getDailyForecast = async (latitude, longitude, apiKey, days = 1) => {
    const url = `https://weather.googleapis.com/v1/forecast/days:lookup?key=${apiKey}&location.latitude=${latitude}&location.longitude=${longitude}&days=${days}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Forecast API error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
};

// --- Core Logic ---
// This is the main logic that processes the data.

/**
 * Processes a single city's weather data for flood risk analysis.
 * Fetches 24 hours of historical data and a 24-hour forecast to calculate cumulative rainfall.
 * @param {object} cityData - The city document data from Firestore.
 * @param {string} apiKey - The Google Weather API key.
 * @returns {Promise<object>} The processed weather data.
 */
const processCityWeather = async (cityData, apiKey) => {
    try {
        console.log(`Processing weather data for ${cityData.cityName}...`);

        // Fetch historical and forecast data in parallel to optimize performance
        const [historicalData, forecast] = await Promise.all([
            getHourlyHistory(cityData.latitude, cityData.longitude, apiKey, 24),
            getDailyForecast(cityData.latitude, cityData.longitude, apiKey, 1)
        ]);

        // Sum precipitation from historical data (last 24 hours)
        let totalHistoricalRainfallMm = 0;
        if (historicalData.historyHours) {
            for (const hour of historicalData.historyHours) {
                totalHistoricalRainfallMm += hour.precipitation?.qpf?.quantity || 0;
            }
        }
        
        // Get predicted rainfall from the 24-hour forecast
        let predictedRainfallMm = 0;
        if (forecast.forecastDays && forecast.forecastDays.length > 0) {
            const todayForecast = forecast.forecastDays[0];
            predictedRainfallMm = (todayForecast.daytimeForecast?.precipitation?.qpf?.quantity || 0) +
                                  (todayForecast.nighttimeForecast?.precipitation?.qpf?.quantity || 0);
        }

        // Calculate 48-hour cumulative rainfall (24 hours historical + 24 hours forecast)
        const cumulative48HourRainfall = totalHistoricalRainfallMm + predictedRainfallMm;

        // Extract the required data for wind, temperature, UV, and air quality
        const currentWeather = forecast.forecastDays ? forecast.forecastDays[0].daytimeForecast : {};

        // Fixing temperature issue by using maxHeatIndex for the perceived temperature
        const maxTemperature = currentWeather.maxHeatIndex?.degrees || 0; // Using maxTemperature for actual temperature
        const windSpeedKmh = currentWeather.wind?.speed?.value || 0; // Wind speed in km/h
        const uvIndex = currentWeather.uvIndex || 0; // UV Index
        const airQualityIndex = currentWeather.airQuality?.aqi || 0; // Air Quality Index (AQI)

        // Check against the city's specific rainfall threshold
        const isFloodRisk = cumulative48HourRainfall >= cityData.rainfallThresholdMm;

        const weatherData = {
            cityName: cityData.cityName,
            coordinates: { latitude: cityData.latitude, longitude: cityData.longitude },
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            lastUpdated: new Date().toISOString(),
            cumulative48HourRainfallMm: parseFloat(cumulative48HourRainfall.toFixed(2)),
            rainfallThresholdMm: cityData.rainfallThresholdMm,
            windSpeedKmh: windSpeedKmh, //  field for wind speed
            temperatureC: maxTemperature, //  temperature field now using maxTemperature for the correct value
            uvIndex: uvIndex, //   for UV index
            airQualityIndex: airQualityIndex, //  field for air quality
            alerts: {
                hasFloodRisk: isFloodRisk,
            }
        };

        if (isFloodRisk) {
            console.log(`FLOOD RISK ALERT: Cumulative 48-hour rainfall for ${cityData.cityName} (${weatherData.cumulative48HourRainfallMm}mm) exceeds the threshold of ${cityData.rainfallThresholdMm}mm!`);
            // TODO: Add your notification logic here (e.g., send push notification, email, etc.)
        }

        return weatherData;

    } catch (error) {
        console.error(`Error processing weather data for ${cityData.cityName}:`, error);
        return {
            cityName: cityData.cityName,
            error: { message: error.message }
        };
    }
};

// --- Scheduled Function ---
// This function is the entry point for your scheduled job.

exports.updateWeatherFromThresholds = onSchedule({
    schedule: 'every 60 minutes',
}, async (context) => {
    try {
        console.log('Starting scheduled weather update for all cities in disasterThresholds collection...');
        const apiKey = WEATHER_API_KEY;

        if (!apiKey) {
            console.error('Weather API key not found in environment variables.');
            return null;
        }

        // 1. Fetch all documents from the 'disasterThresholds' collection
        const thresholdsRef = db.collection('disasterThresholds');
        const snapshot = await thresholdsRef.get();

        if (snapshot.empty) {
            console.log('No cities found in the disasterThresholds collection. Stopping execution.');
            return null;
        }

        const batch = db.batch();
        const results = { successful: 0, failed: 0, errors: [] };

        for (const doc of snapshot.docs) {
            const cityData = doc.data();
            try {
                // Process each city's weather and create a batched write operation
                const weatherData = await processCityWeather(cityData, apiKey);
                const docRef = db.collection('sriLankaWeather').doc(cityData.cityName.toLowerCase().replace(/\s+/g, '_'));
                batch.set(docRef, weatherData, { merge: true });

                if (weatherData.error) {
                    results.failed++;
                    results.errors.push(`${cityData.cityName}: ${weatherData.error.message}`);
                } else {
                    results.successful++;
                }
            } catch (error) {
                console.error(`Failed to process ${cityData.cityName}:`, error);
                results.failed++;
                results.errors.push(`${cityData.cityName}: ${error.message}`);
            }
        }

        // Commit all batched writes at once
        await batch.commit();

        // Log the summary of the run
        const summaryRef = db.collection('weatherUpdateLogs').doc();
        await summaryRef.set({
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            totalCities: snapshot.docs.length,
            successful: results.successful,
            failed: results.failed,
            errors: results.errors,
            executionTime: new Date().toISOString()
        });

        console.log(`Weather update completed. Success: ${results.successful}, Failed: ${results.failed}`);
        return null;

    } catch (error) {
        console.error('Critical error in scheduled weather update function:', error);
        await db.collection('weatherUpdateLogs').doc().set({
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            error: error.message,
            critical: true
        });
        return null;
    }
});
