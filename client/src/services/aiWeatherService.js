// Weather API service for Sri Lanka
class AIWeatherService {
  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_WEATHER_API_KEY_Vihanga;
    this.baseUrl = 'https://weather.googleapis.com/v1';
  }

  // Sri Lankan major cities with coordinates
  getSriLankanCities() {
    return {
      'colombo': { lat: 6.9271, lng: 79.8612, name: 'Colombo' },
      'kandy': { lat: 7.2906, lng: 80.6337, name: 'Kandy' },
      'galle': { lat: 6.0535, lng: 80.2210, name: 'Galle' },
      'jaffna': { lat: 9.6615, lng: 80.0255, name: 'Jaffna' },
      'negombo': { lat: 7.2083, lng: 79.8358, name: 'Negombo' },
      'trincomalee': { lat: 8.5874, lng: 81.2152, name: 'Trincomalee' },
      'batticaloa': { lat: 7.7102, lng: 81.6924, name: 'Batticaloa' },
      'anuradhapura': { lat: 8.3114, lng: 80.4037, name: 'Anuradhapura' },
      'polonnaruwa': { lat: 7.9403, lng: 81.0188, name: 'Polonnaruwa' },
      'ratnapura': { lat: 6.6828, lng: 80.3992, name: 'Ratnapura' },
      'matara': { lat: 5.9485, lng: 80.5353, name: 'Matara' },
      'nuwara eliya': { lat: 6.9497, lng: 80.7891, name: 'Nuwara Eliya' },
      'badulla': { lat: 6.9895, lng: 81.0557, name: 'Badulla' },
      'kurunegala': { lat: 7.4863, lng: 80.3623, name: 'Kurunegala' },
      'puttalam': { lat: 8.0362, lng: 79.8253, name: 'Puttalam' }
    };
  }

  // Find city coordinates from text
  findCityCoordinates(text) {
    const cities = this.getSriLankanCities();
    const lowerText = text.toLowerCase();
    
    for (const [key, value] of Object.entries(cities)) {
      if (lowerText.includes(key) || lowerText.includes(value.name.toLowerCase())) {
        return value;
      }
    }
    
    // Default to Colombo if no city found
    return cities['colombo'];
  }

  // Get current weather conditions
  async getCurrentWeather(lat, lng) {
    try {
      const url = `${this.baseUrl}/currentConditions:lookup?key=${this.apiKey}&location.latitude=${lat}&location.longitude=${lng}&unitsSystem=METRIC`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching current weather:', error);
      throw error;
    }
  }

  // Get weather forecast
  async getForecast(lat, lng, days = 3) {
    try {
      const url = `${this.baseUrl}/forecast/days:lookup?key=${this.apiKey}&location.latitude=${lat}&location.longitude=${lng}&days=${days}&unitsSystem=METRIC`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching forecast:', error);
      throw error;
    }
  }

  // Get hourly forecast
  async getHourlyForecast(lat, lng, hours = 12) {
    try {
      const url = `${this.baseUrl}/forecast/hours:lookup?key=${this.apiKey}&location.latitude=${lat}&location.longitude=${lng}&hours=${hours}&unitsSystem=METRIC`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching hourly forecast:', error);
      throw error;
    }
  }

  // Format weather data for display
  formatCurrentWeather(data) {
    if (!data) return null;
    
    return {
      temperature: Math.round(data.temperature?.degrees || 0),
      condition: data.weatherCondition?.description?.text || 'Unknown',
      feelsLike: Math.round(data.feelsLikeTemperature?.degrees || 0),
      humidity: data.relativeHumidity || 0,
      windSpeed: Math.round(data.wind?.speed?.value || 0),
      windDirection: data.wind?.direction?.cardinal || 'Unknown',
      uvIndex: data.uvIndex || 0,
      visibility: data.visibility?.distance || 0,
      pressure: Math.round(data.airPressure?.meanSeaLevelMillibars || 0),
      precipitationProbability: data.precipitation?.probability?.percent || 0,
      icon: data.weatherCondition?.iconBaseUri || null
    };
  }

  // Format forecast data
  formatForecast(data) {
    if (!data?.forecastDays) return [];
    
    return data.forecastDays.map(day => ({
      date: new Date(day.displayDate.year, day.displayDate.month - 1, day.displayDate.day),
      maxTemp: Math.round(day.maxTemperature?.degrees || 0),
      minTemp: Math.round(day.minTemperature?.degrees || 0),
      dayCondition: day.daytimeForecast?.weatherCondition?.description?.text || 'Unknown',
      nightCondition: day.nighttimeForecast?.weatherCondition?.description?.text || 'Unknown',
      precipitationChance: day.daytimeForecast?.precipitation?.probability?.percent || 0,
      dayIcon: day.daytimeForecast?.weatherCondition?.iconBaseUri || null,
      nightIcon: day.nighttimeForecast?.weatherCondition?.iconBaseUri || null
    }));
  }
}

export default new AIWeatherService();