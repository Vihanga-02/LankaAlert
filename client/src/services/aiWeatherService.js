// Weather API service for Sri Lanka
class AIWeatherService {
  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_WEATHER_API_KEY_Vihanga;
    this.baseUrl = 'https://weather.googleapis.com/v1';
  }

  // Sri Lankan cities with a focus on Colombo and Galle districts, with Sinhala names
  getSriLankanCities() {
    return {
      // Major cities
      'colombo': { lat: 6.9271, lng: 79.8612, name: 'Colombo', sinName: 'කොළඹ' },
      'kandy': { lat: 7.2906, lng: 80.6337, name: 'Kandy', sinName: 'මහනුවර' },
      'galle': { lat: 6.0535, lng: 80.2210, name: 'Galle', sinName: 'ගාල්ල' },
      'jaffna': { lat: 9.6615, lng: 80.0255, name: 'Jaffna', sinName: 'යාපනය' },
      'negombo': { lat: 7.2083, lng: 79.8358, name: 'Negombo', sinName: 'මීගමුව' },
      'trincomalee': { lat: 8.5874, lng: 81.2152, name: 'Trincomalee', sinName: 'ත්\u200dරිකුණාමලය' },
      'batticaloa': { lat: 7.7102, lng: 81.6924, name: 'Batticaloa', sinName: 'මඩකලපුව' },
      'anuradhapura': { lat: 8.3114, lng: 80.4037, name: 'Anuradhapura', sinName: 'අනුරාධපුරය' },
      'nuwara eliya': { lat: 6.9497, lng: 80.7891, name: 'Nuwara Eliya', sinName: 'නුවර එළිය' },
      'badulla': { lat: 6.9895, lng: 81.0557, name: 'Badulla', sinName: 'බදුල්ල' },
      'kurunegala': { lat: 7.4863, lng: 80.3623, name: 'Kurunegala', sinName: 'කුරුණෑගල' },
      
      // Colombo District cities and towns
      'sri jayawardenepura kotte': { lat: 6.9108, lng: 79.8878, name: 'Sri Jayawardenepura Kotte', sinName: 'ශ්‍රී ජයවර්ධනපුර කෝට්ටේ' },
      'dehiwala-mount lavinia': { lat: 6.8731, lng: 79.8758, name: 'Dehiwala-Mount Lavinia', sinName: 'දෙහිවල-ගල්කිස්ස' },
      'moratuwa': { lat: 6.7991, lng: 79.8767, name: 'Moratuwa', sinName: 'මොරටුව' },
      'maharagama': { lat: 6.8494, lng: 79.9236, name: 'Maharagama', sinName: 'මහරගම' },
      'kesbewa': { lat: 6.7953, lng: 79.9386, name: 'Kesbewa', sinName: 'කෙසබෑව' },
      'boralesgamuwa': { lat: 6.8306, lng: 79.9077, name: 'Boralesgamuwa', sinName: 'බොරලැස්ගමුව' },
      'kaduwela': { lat: 6.9405, lng: 80.0152, name: 'Kaduwela', sinName: 'කඩුවෙල' },
      'awissawella': { lat: 6.9587, lng: 80.2078, name: 'Awissawella', sinName: 'අවිස්සාවේල්ල' },
      'homagama': { lat: 6.857, lng: 80.0305, name: 'Homagama', sinName: 'හෝමාගම' },
      'malabe': { lat: 6.915, lng: 79.967, name: 'Malabe', sinName: 'මාලබේ' },
      'kollonnawa': { lat: 6.9388, lng: 79.9138, name: 'Kolonnawa', sinName: 'කොළොන්නාව' },
      'nugegoda': { lat: 6.8778, lng: 79.897, name: 'Nugegoda', sinName: 'නුගේගොඩ' },
      'kotikawatta': { lat: 6.9388, lng: 79.9138, name: 'Kotikawatta', sinName: 'කොටිකාවත්ත' },
      'rathmalana': { lat: 6.8206, lng: 79.8736, name: 'Rathmalana', sinName: 'රත්මලාන' },
      'kiribathgoda': { lat: 6.9859, lng: 79.9255, name: 'Kiribathgoda', sinName: 'කිරිබත්ගොඩ' },
      'wattala': { lat: 7.0094, lng: 79.8824, name: 'Wattala', sinName: 'වත්තල' },
      'ja-ela': { lat: 7.075, lng: 79.8833, name: 'Ja-Ela', sinName: 'ජා ඇල' },
      'ragama': { lat: 7.009, lng: 79.926, name: 'Ragama', sinName: 'රාගම' },
      'minuwangoda': { lat: 7.155, lng: 79.941, name: 'Minuwangoda', sinName: 'මිනුවන්ගොඩ' },
      'divulapitiya': { lat: 7.189, lng: 79.96, name: 'Divulapitiya', sinName: 'දිවුලපිටිය' },
      'ganemulla': { lat: 7.0658, lng: 79.9599, name: 'Ganemulla', sinName: 'ගණේමුල්ල' },
      'hanwella': { lat: 6.9167, lng: 80.1268, name: 'Hanwella', sinName: 'හංවැල්ල' },
      'athurugiriya': { lat: 6.8922, lng: 79.9428, name: 'Athurugiriya', sinName: 'අතුරුගිරිය' },
      'thalangama': { lat: 6.9247, lng: 79.9572, name: 'Thalangama', sinName: 'තලංගම' },
      'kottawa': { lat: 6.8524, lng: 80.1264, name: 'Kottawa', sinName: 'කොට්ටාව' },
      'piliyandala': { lat: 6.786, lng: 79.914, name: 'Piliyandala', sinName: 'පිළියන්දල' },
      'kahathuduwa': { lat: 6.78, lng: 79.972, name: 'Kahathuduwa', sinName: 'කහතුඩුව' },
      'bambalapitiya': { lat: 6.8931, lng: 79.8517, name: 'Bambalapitiya', sinName: 'බම්බලපිටිය' },
      'wellawatte': { lat: 6.868, lng: 79.854, name: 'Wellawatte', sinName: 'වැල්ලවත්ත' },
      'kollupitiya': { lat: 6.911, lng: 79.855, name: 'Kollupitiya', sinName: 'කොල්ලුපිටිය' },
      'maradana': { lat: 6.924, lng: 79.878, name: 'Maradana', sinName: 'මරදාන' },
      'borella': { lat: 6.914, lng: 79.885, name: 'Borella', sinName: 'බොරැල්ල' },
      'dematagoda': { lat: 6.932, lng: 79.878, name: 'Dematagoda', sinName: 'දෙමටගොඩ' },

      // Galle District cities and towns
      'hikkaduwa': { lat: 6.136, lng: 80.096, name: 'Hikkaduwa', sinName: 'හිකඩුව' },
      'unawatuna': { lat: 6.014, lng: 80.258, name: 'Unawatuna', sinName: 'උණවටුන' },
      'ambalangoda': { lat: 6.2307, lng: 80.063, name: 'Ambalangoda', sinName: 'අම්බලන්ගොඩ' },
      'balapitiya': { lat: 6.208, lng: 80.0519, name: 'Balapitiya', sinName: 'බලපිටිය' },
      'ahungalla': { lat: 6.32, lng: 80.038, name: 'Ahungalla', sinName: 'අහුංගල්ල' },
      'elpitiya': { lat: 6.27, lng: 80.15, name: 'Elpitiya', sinName: 'ඇල්පිටිය' },
      'dodanduwa': { lat: 6.0792, lng: 80.1066, name: 'Dodanduwa', sinName: 'දොඩන්දුව' },
      'habaraduwa': { lat: 6.002, lng: 80.301, name: 'Habaraduwa', sinName: 'හබරාදුව' },
      'baddegama': { lat: 6.13, lng: 80.27, name: 'Baddegama', sinName: 'බද්දේගම' },
      'yakkalamulla': { lat: 6.09, lng: 80.29, name: 'Yakkalamulla', sinName: 'යක්කලමුල්ල' },
      'akmeemana': { lat: 6.059, lng: 80.276, name: 'Akmeemana', sinName: 'අක්මීමන' },
      'bentota': { lat: 6.42, lng: 80, name: 'Bentota', sinName: 'බෙන්තොට' },
      'kosgoda': { lat: 6.2778, lng: 80.0573, name: 'Kosgoda', sinName: 'කොස්ගොඩ' },
      'karandeniya': { lat: 6.23, lng: 80.12, name: 'Karandeniya', sinName: 'කරන්දෙණිය' },
      'imaduwa': { lat: 6.03, lng: 80.32, name: 'Imaduwa', sinName: 'ඉමදුව' },
      'naluwa': { lat: 6.18, lng: 80.12, name: 'Neluwa', sinName: 'නෙලුව' },
      'waggalmada': { lat: 6.046, lng: 80.176, name: 'Waggalmada', sinName: 'වග්ගල්මඩ' },
      'talpe': { lat: 6.007, lng: 80.27, name: 'Talpe', sinName: 'තල්පේ' },
      'gintota': { lat: 6.0725, lng: 80.218, name: 'Gintota', sinName: 'ගිංතොට' },
      'boossa': { lat: 6.0792, lng: 80.1706, name: 'Boossa', sinName: 'බූස්ස' },
      
      // Other main cities and towns for broader coverage
      'matara': { lat: 5.9485, lng: 80.5353, name: 'Matara', sinName: 'මාතර' },
      'ratnapura': { lat: 6.6828, lng: 80.3992, name: 'Ratnapura', sinName: 'රත්නපුර' },
      'polonnaruwa': { lat: 7.9403, lng: 81.0188, name: 'Polonnaruwa', sinName: 'පොළොන්නරුව' },
      'puttalam': { lat: 8.0362, lng: 79.8253, name: 'Puttalam', sinName: 'පුත්තලම' },
      'kalutara': { lat: 6.5869, lng: 79.9603, name: 'Kalutara', sinName: 'කළුතර' },
      'ampara': { lat: 7.3061, lng: 81.6702, name: 'Ampara', sinName: 'අම්පාර' },
      'vavuniya': { lat: 8.7554, lng: 80.4998, name: 'Vavuniya', sinName: 'වවුනියාව' },
      'gampaha': { lat: 7.087, lng: 79.996, name: 'Gampaha', sinName: 'ගම්පහ' },
      'chilaw': { lat: 7.5756, lng: 79.7944, name: 'Chilaw', sinName: 'හලාවත' },
      'dambulla': { lat: 7.8667, lng: 80.65, name: 'Dambulla', sinName: 'දඹුල්ල' },
      'hambantota': { lat: 6.1264, lng: 81.1219, name: 'Hambantota', sinName: 'හම්බන්තොට' },
      'monaragala': { lat: 6.8833, lng: 81.35, name: 'Monaragala', sinName: 'මොනරාගල' },
      'kegalle': { lat: 7.2519, lng: 80.3475, name: 'Kegalle', sinName: 'කෑගල්ල' }
    };
  }

  // Find city coordinates from text, now supporting both English and Sinhala
  findCityCoordinates(text) {
    const cities = this.getSriLankanCities();
    const lowerText = text.toLowerCase();
    
    for (const [key, value] of Object.entries(cities)) {
      if (lowerText.includes(key) || lowerText.includes(value.name.toLowerCase()) || text.includes(value.sinName)) {
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