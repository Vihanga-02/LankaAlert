// Google Weather API Service


const GOOGLE_WEATHER_API_KEY = import.meta.env.VITE_GOOGLE_WEATHER_API_KEY; // Google Weather API key
const GOOGLE_WEATHER_BASE_URL = 'https://weather.googleapis.com/v1';
const GEOCODING_API_KEY = import.meta.env.VITE_GOOGLE_WEATHER_API_KEY; // Same key can be used if Geocoding API is enabled

// First, we need to convert city name to coordinates using Google Geocoding API
const getCoordinatesFromCity = async (cityName) => {
  try {
    const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cityName)}&key=${GEOCODING_API_KEY}`;
    
    const response = await fetch(geocodingUrl);
    if (!response.ok) {
      throw new Error('Failed to geocode city name');
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      throw new Error('City not found. Please check the spelling and try again.');
    }
    
    const location = data.results[0];
    return {
      latitude: location.geometry.location.lat,
      longitude: location.geometry.location.lng,
      formattedAddress: location.formatted_address,
      addressComponents: location.address_components
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error('Unable to find the specified city. Please check the spelling and try again.');
  }
};

// Get current weather conditions
const getCurrentConditions = async (latitude, longitude) => {
  const currentConditionsUrl = `${GOOGLE_WEATHER_BASE_URL}/currentConditions:lookup?key=${GOOGLE_WEATHER_API_KEY}&location.latitude=${latitude}&location.longitude=${longitude}`;
  
  const response = await fetch(currentConditionsUrl);
  if (!response.ok) {
    throw new Error('Failed to fetch current weather conditions');
  }
  
  return await response.json();
};

// Get daily forecast
const getDailyForecast = async (latitude, longitude, days = 5) => {
  const forecastUrl = `${GOOGLE_WEATHER_BASE_URL}/forecast/days:lookup?key=${GOOGLE_WEATHER_API_KEY}&location.latitude=${latitude}&location.longitude=${longitude}&days=${days}`;
  
  const response = await fetch(forecastUrl);
  if (!response.ok) {
    throw new Error('Failed to fetch weather forecast');
  }
  
  return await response.json();
};

// Main function to get weather data
export const getWeatherData = async (cityName) => {
  try {
    // Step 1: Get coordinates from city name
    const coordinates = await getCoordinatesFromCity(cityName);
    
    // Step 2: Get current conditions and forecast
    const [currentConditions, dailyForecast] = await Promise.all([
      getCurrentConditions(coordinates.latitude, coordinates.longitude),
      getDailyForecast(coordinates.latitude, coordinates.longitude, 5)
    ]);

    // Step 3: Transform the data to match our component structure
    return transformGoogleWeatherData(currentConditions, dailyForecast, coordinates);

  } catch (error) {
    console.error('Weather API Error:', error);
    throw new Error(error.message || 'Unable to fetch weather data. Please try again.');
  }
};

// Transform Google Weather API response to our component format
const transformGoogleWeatherData = (currentData, forecastData, locationData) => {
  // Extract location information
  const addressComponents = locationData.addressComponents || [];
  const city = addressComponents.find(comp => comp.types.includes('locality'))?.long_name || 
               addressComponents.find(comp => comp.types.includes('administrative_area_level_2'))?.long_name || 
               'Unknown City';
  const region = addressComponents.find(comp => comp.types.includes('administrative_area_level_1'))?.long_name || '';
  const country = addressComponents.find(comp => comp.types.includes('country'))?.long_name || '';

  return {
    location: {
      name: city,
      region: region,
      country: country,
      coordinates: {
        latitude: locationData.latitude,
        longitude: locationData.longitude
      }
    },
    current: {
      temperatureC: currentData.temperature?.degrees || 0,
      condition: currentData.weatherCondition?.description?.text || 'Unknown',
      precipitationMm: currentData.precipitation?.qpf?.quantity || 0,
      humidity: currentData.relativeHumidity || 0,
      windSpeedKmh: currentData.wind?.speed?.value || 0,
      windDirection: currentData.wind?.direction?.cardinal || 'Unknown',
      windGustKmh: currentData.wind?.gust?.value || 0,
      chanceOfRain: currentData.precipitation?.probability?.percent || 0,
      uvIndex: currentData.uvIndex || 0,
      visibility: currentData.visibility?.distance || 0,
      pressure: currentData.airPressure?.meanSeaLevelMillibars || 0,
      feelsLike: currentData.feelsLikeTemperature?.degrees || currentData.temperature?.degrees || 0,
      thunderstormProbability: currentData.thunderstormProbability || 0
    },
    forecast: forecastData.forecastDays?.map(day => ({
      date: `${day.displayDate.year}-${String(day.displayDate.month).padStart(2, '0')}-${String(day.displayDate.day).padStart(2, '0')}`,
      maxTempC: day.maxTemperature?.degrees || 0,
      minTempC: day.minTemperature?.degrees || 0,
      condition: day.daytimeForecast?.weatherCondition?.description?.text || 'Unknown',
      precipitationMm: (day.daytimeForecast?.precipitation?.qpf?.quantity || 0) + 
                      (day.nighttimeForecast?.precipitation?.qpf?.quantity || 0),
      chanceOfRain: Math.max(
        day.daytimeForecast?.precipitation?.probability?.percent || 0,
        day.nighttimeForecast?.precipitation?.probability?.percent || 0
      ),
      avgHumidity: Math.round(
        ((day.daytimeForecast?.relativeHumidity || 0) + 
         (day.nighttimeForecast?.relativeHumidity || 0)) / 2
      ),
      maxWindSpeedKmh: Math.max(
        day.daytimeForecast?.wind?.speed?.value || 0,
        day.nighttimeForecast?.wind?.speed?.value || 0
      ),
      avgWindSpeedKmh: Math.round(
        ((day.daytimeForecast?.wind?.speed?.value || 0) + 
         (day.nighttimeForecast?.wind?.speed?.value || 0)) / 2
      ),
      avgVisibilityKm: 10, // Default visibility as it's not provided in daily forecast
      thunderstormProbability: Math.max(
        day.daytimeForecast?.thunderstormProbability || 0,
        day.nighttimeForecast?.thunderstormProbability || 0
      ),
      uvIndex: day.daytimeForecast?.uvIndex || 0,
      sunrise: day.sunEvents?.sunriseTime,
      sunset: day.sunEvents?.sunsetTime,
      moonPhase: day.moonEvents?.moonPhase
    })) || []
  };
};

// Helper function to get weather icon URL from Google's icon base URI
export const getWeatherIconUrl = (iconBaseUri, size = 64) => {
  if (!iconBaseUri) return null;
  return `${iconBaseUri}/${size}.png`;
};

// Helper function to format weather condition for display
export const formatWeatherCondition = (condition) => {
  if (!condition) return 'Unknown';
  
  // Capitalize first letter of each word
  return condition.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

// Helper function to convert wind direction degrees to cardinal
export const getWindDirectionFromDegrees = (degrees) => {
  const directions = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
  ];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};