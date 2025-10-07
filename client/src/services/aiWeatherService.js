// Weather API service for Sri Lanka with enhanced bilingual support
class aiWeatherService {
  constructor() {
    // Try multiple possible API key variable names
    this.apiKey = import.meta.env.VITE_GOOGLE_WEATHER_API_KEY_Vihanga || 
                  import.meta.env.VITE_GOOGLE_WEATHER_API_KEY;
    this.baseUrl = 'https://weather.googleapis.com/v1';
    
    // Weather condition translations
    this.weatherTranslations = {
      'sunny': { en: 'Sunny', si: 'සූර්යාලෝකය' },
      'partly cloudy': { en: 'Partly Cloudy', si: 'අර්ධ වළාකුළු' },
      'cloudy': { en: 'Cloudy', si: 'වළාකුළු' },
      'overcast': { en: 'Overcast', si: 'ගැඹුරු වළාකුළු' },
      'rain': { en: 'Rain', si: 'වර්ෂාව' },
      'light rain': { en: 'Light Rain', si: 'සැහැල්ලු වර්ෂාව' },
      'heavy rain': { en: 'Heavy Rain', si: 'ගැඹුරු වර්ෂාව' },
      'thunderstorm': { en: 'Thunderstorm', si: 'ගිගිරුම් වර්ෂාව' },
      'fog': { en: 'Fog', si: 'කඳුළු' },
      'mist': { en: 'Mist', si: 'අඳුරු' },
      'clear': { en: 'Clear', si: 'පැහැදිලි' },
      'windy': { en: 'Windy', si: 'සුළං' }
    };
    
    if (!this.apiKey) {
      console.warn('Weather API key not found. Please set VITE_GOOGLE_WEATHER_API_KEY in your environment variables.');
    }
  }

  // Sri Lankan cities with a focus on Colombo and Galle districts, with Sinhala names
  getSriLankanCities() {
    return {
      // Major cities
      'colombo': { lat: 6.9271, lng: 79.8612, name: 'Colombo', sinName: 'කොළඹ', aliases: ['colombo city', 'kolamba', 'කොළඹ', 'colombo district'] },
      'kandy': { lat: 7.2906, lng: 80.6337, name: 'Kandy', sinName: 'මහනුවර' },
      'galle': { lat: 6.0535, lng: 80.2210, name: 'Galle', sinName: 'ගාල්ල', aliases: ['galle city', 'ගාල්ල', 'galle district'] },
      'jaffna': { lat: 9.6615, lng: 80.0255, name: 'Jaffna', sinName: 'යාපනය' },
      'negombo': { lat: 7.2083, lng: 79.8358, name: 'Negombo', sinName: 'මීගමුව' },
      'trincomalee': { lat: 8.5874, lng: 81.2152, name: 'Trincomalee', sinName: 'ත්\u200dරිකුණාමලය' },
      'batticaloa': { lat: 7.7102, lng: 81.6924, name: 'Batticaloa', sinName: 'මඩකලපුව' },
      'anuradhapura': { lat: 8.3114, lng: 80.4037, name: 'Anuradhapura', sinName: 'අනුරාධපුරය' },
      'nuwara eliya': { lat: 6.9497, lng: 80.7891, name: 'Nuwara Eliya', sinName: 'නුවර එළිය' },
      'badulla': { lat: 6.9895, lng: 81.0557, name: 'Badulla', sinName: 'බදුල්ල' },
      'kurunegala': { lat: 7.4863, lng: 80.3623, name: 'Kurunegala', sinName: 'කුරුණෑගල' },
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
      'kegalle': { lat: 7.2519, lng: 80.3475, name: 'Kegalle', sinName: 'කෑගල්ල' },

      // Colombo District (expanded)
      'dehiwala-mount lavinia': { lat: 6.8296, lng: 79.8636, name: 'Dehiwala-Mount Lavinia', sinName: 'දෙහිවල-මවුන්ට් ලවිනය', aliases: ['dehiwala', 'mount lavinia', 'දෙහිවල', 'මවුන්ට් ලවිනය'] },
      'moratuwa': { lat: 6.7740, lng: 79.8829, name: 'Moratuwa', sinName: 'මොරටුව', aliases: ['මොරටුව'] },
      'sri jayawardenepura kotte': { lat: 6.8941, lng: 79.9025, name: 'Sri Jayawardenepura Kotte', sinName: 'ශ්‍රී ජයවර්ධනපුර කෝට්ටේ', aliases: ['kotte', 'sjp kotte', 'ශ්‍රී ජයවර්ධනපුර', 'කෝට්ටේ'] },
      'maharagama': { lat: 6.8428, lng: 79.9232, name: 'Maharagama', sinName: 'මහරගම', aliases: ['මහරගම'] },
      'kaduwela': { lat: 6.9331, lng: 79.9843, name: 'Kaduwela', sinName: 'කඩුවෙල', aliases: ['කඩුවෙල'] },
      'homagama': { lat: 6.8441, lng: 80.0020, name: 'Homagama', sinName: 'හෝමාගම', aliases: ['හෝමාගම'] },
      'piliyandala': { lat: 6.8018, lng: 79.9225, name: 'Piliyandala', sinName: 'පිළියන්දල', aliases: ['පිළියන්දල'] },
      'nugegoda': { lat: 6.8721, lng: 79.8889, name: 'Nugegoda', sinName: 'නුගේගොඩ', aliases: ['නුගේගොඩ'] },
      'ratmalana': { lat: 6.8193, lng: 79.8836, name: 'Ratmalana', sinName: 'රත්මලාන', aliases: ['රත්මලාන'] },
      'malabe': { lat: 6.9055, lng: 79.9572, name: 'Malabe', sinName: 'මාලාබේ', aliases: ['මාලාබේ'] },
      'battaramulla': { lat: 6.8969, lng: 79.9181, name: 'Battaramulla', sinName: 'බත්තරමුල්ල', aliases: ['බත්තරමුල්ල'] },
      'pannipitiya': { lat: 6.8469, lng: 79.94, name: 'Pannipitiya', sinName: 'පන්නිපිටිය', aliases: ['පන්නිපිටිය'] },
      'boralesgamuwa': { lat: 6.8167, lng: 79.9, name: 'Boralesgamuwa', sinName: 'බොරලේස්ගමුව', aliases: ['බොරලේස්ගමුව'] },
      'kesbewa': { lat: 6.801, lng: 79.965, name: 'Kesbewa', sinName: 'කැස්බැව', aliases: ['කැස්බැව'] },
      'avissawella': { lat: 6.954, lng: 80.204, name: 'Avissawella', sinName: 'අවිස්සාවේල්ල', aliases: ['awissawella', 'අවිස්සාවේල්ල'] },
      'padukka': { lat: 6.8444, lng: 80.0833, name: 'Padukka', sinName: 'පාදුක්ක', aliases: ['පාදුක්ක'] },
      'hanwella': { lat: 6.9038, lng: 80.0847, name: 'Hanwella', sinName: 'හංවැල්ල', aliases: ['හංවැල්ල'] },
      'rajagiriya': { lat: 6.9104, lng: 79.8989, name: 'Rajagiriya', sinName: 'රාජගිරිය', aliases: ['රාජගිරිය'] },
      'wellampitiya': { lat: 6.9333, lng: 79.9, name: 'Wellampitiya', sinName: 'වැල්ලම්පිටිය', aliases: ['වැල්ලම්පිටිය'] },

      // Galle District (expanded)
      'hikkaduwa': { lat: 6.139, lng: 80.1006, name: 'Hikkaduwa', sinName: 'හික්කඩුව', aliases: ['හික්කඩුව'] },
      'ambalangoda': { lat: 6.235, lng: 80.0547, name: 'Ambalangoda', sinName: 'අම්බලංගොඩ', aliases: ['අම්බලංගොඩ'] },
      'elpitiya': { lat: 6.2989, lng: 80.1853, name: 'Elpitiya', sinName: 'ඇල්පිටිය', aliases: ['ඇල්පිටිය'] },
      'baddegama': { lat: 6.1711, lng: 80.2178, name: 'Baddegama', sinName: 'බද්දේගම', aliases: ['බද්දේගම'] },
      'unawatuna': { lat: 6.0109, lng: 80.2493, name: 'Unawatuna', sinName: 'උනාවටුන', aliases: ['උනාවටුන'] },
      'karapitiya': { lat: 6.0531, lng: 80.2386, name: 'Karapitiya', sinName: 'කරපිටිය', aliases: ['කරපිටිය'] },
      'ahangama': { lat: 5.9714, lng: 80.3808, name: 'Ahangama', sinName: 'අහංගම', aliases: ['අහංගම'] },
      'habaraduwa': { lat: 5.99, lng: 80.3167, name: 'Habaraduwa', sinName: 'හබරදූව', aliases: ['හබරදූව'] },
      'bentota': { lat: 6.421, lng: 80.0049, name: 'Bentota', sinName: 'බෙන්තොට', aliases: ['බෙන්තොට'] },
      'akmeemana': { lat: 6.0533, lng: 80.3114, name: 'Akmeemana', sinName: 'අක්මීමන', aliases: ['අක්මීමන'] },
      'yakkalamulla': { lat: 6.0959, lng: 80.3453, name: 'Yakkalamulla', sinName: 'යක්කලමුල්ල', aliases: ['යක්කලමුල්ල'] },
      'imaduwa': { lat: 6.04, lng: 80.4, name: 'Imaduwa', sinName: 'ඉමදූව', aliases: ['ඉමදූව'] },
      'ahungalla': { lat: 6.3182, lng: 80.0366, name: 'Ahungalla', sinName: 'අහුංගල්ල', aliases: ['අහුංගල්ල'] }
    };
  }

  // Enhanced city detection with better keyword matching
  findCityCoordinates(text) {
    const cities = this.getSriLankanCities();
    const lowerText = text.toLowerCase().trim();
    const normalized = lowerText.replace(/[-,]/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Enhanced keyword matching for better city detection
    const cityKeywords = {
      'colombo': ['colombo', 'කොළඹ', 'colombo city', 'capital', 'colombo district'],
      'kandy': ['kandy', 'මහනුවර', 'kandy city', 'hill capital'],
      'galle': ['galle', 'ගාල්ල', 'galle fort', 'southern', 'galle district'],
      'jaffna': ['jaffna', 'යාපනය', 'northern', 'jaffna city'],
      'negombo': ['negombo', 'මීගමුව', 'airport city', 'beach'],
      'matara': ['matara', 'මාතර', 'southern province'],
      'ratnapura': ['ratnapura', 'රත්නපුර', 'gem city', 'sabaragamuwa'],
      'anuradhapura': ['anuradhapura', 'අනුරාධපුරය', 'ancient city', 'north central'],
      'nuwara eliya': ['nuwara eliya', 'නුවර එළිය', 'little england', 'hill station'],
      'badulla': ['badulla', 'බදුල්ල', 'uva province', 'mountain'],
      'kurunegala': ['kurunegala', 'කුරුණෑගල', 'north western', 'elephant rock']
    };
    
    // First try exact keyword matching
    for (const [cityKey, keywords] of Object.entries(cityKeywords)) {
      for (const keyword of keywords) {
        if (normalized.includes(keyword.toLowerCase())) {
          return cities[cityKey] || cities['colombo'];
        }
      }
    }
    
    // Then try alias and partial matching with city names
    for (const [key, value] of Object.entries(cities)) {
      const aliases = value.aliases || [];
      const englishName = value.name && typeof value.name === 'string' ? value.name.toLowerCase() : '';
      if (normalized.includes(key) ||
          normalized.includes(englishName) ||
          normalized.includes(key.replace(/-/g, ' ')) ||
          aliases.some(a => normalized.includes(a.toLowerCase())) ||
          text.includes(value.sinName)) {
        return value;
      }
    }
    
    // Default to Colombo if no city found
    console.log(`No city found for text: "${text}", defaulting to Colombo`);
    return cities['colombo'];
  }

  // Get current weather conditions
  async getCurrentWeather(lat, lng) {
    try {
      if (!this.apiKey) {
        throw new Error('Weather API key not configured');
      }

      const url = `${this.baseUrl}/currentConditions:lookup?key=${this.apiKey}&location.latitude=${lat}&location.longitude=${lng}&unitsSystem=METRIC`;
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Weather API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching current weather:', error);
      // Return mock data for development/testing
      return this.getMockWeatherData();
    }
  }

  // Get weather forecast with error handling
  async getForecast(lat, lng, days = 3) {
    try {
      if (!this.apiKey) {
        throw new Error('Weather API key not configured');
      }

      const url = `${this.baseUrl}/forecast/days:lookup?key=${this.apiKey}&location.latitude=${lat}&location.longitude=${lng}&days=${days}&unitsSystem=METRIC`;
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Weather API error: ${response.status} - ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching forecast:', error);
      // Return mock forecast data
      return this.getMockForecastData(days);
    }
  }

  // Enhanced weather data formatting with bilingual support
  formatCurrentWeather(data, language = 'en') {
    if (!data) return null;
    
    const condition = data.weatherCondition?.description?.text || 'Unknown';
    const translatedCondition = this.translateWeatherCondition(condition, language);
    
    return {
      temperature: Math.round(data.temperature?.degrees || 0),
      condition: translatedCondition,
      originalCondition: condition,
      feelsLike: Math.round(data.feelsLikeTemperature?.degrees || 0),
      humidity: data.relativeHumidity || 0,
      windSpeed: Math.round(data.wind?.speed?.value || 0),
      windDirection: data.wind?.direction?.cardinal || 'Unknown',
      uvIndex: data.uvIndex || 0,
      visibility: data.visibility?.distance || 0,
      pressure: Math.round(data.airPressure?.meanSeaLevelMillibars || 0),
      precipitationProbability: data.precipitation?.probability?.percent || 0,
      icon: data.weatherCondition?.iconBaseUri || null,
      language: language
    };
  }

  // Translate weather conditions to Sinhala
  translateWeatherCondition(condition, language = 'en') {
    if (language === 'en') return condition;
    
    const lowerCondition = condition.toLowerCase();
    
    // Direct translation lookup
    for (const [key, translations] of Object.entries(this.weatherTranslations)) {
      if (lowerCondition.includes(key)) {
        return translations.si;
      }
    }
    
    // Fallback: return original condition if no translation found
    return condition;
  }

  // Generate bilingual weather summary
  generateWeatherSummary(weatherData, cityInfo, language = 'en') {
    if (!weatherData) return null;
    
    const temp = weatherData.temperature;
    const condition = weatherData.condition;
    const feelsLike = weatherData.feelsLike;
    const humidity = weatherData.humidity;
    const windSpeed = weatherData.windSpeed;
    const windDirection = weatherData.windDirection;
    const cityName = language === 'si' ? cityInfo.sinName : cityInfo.name;
    
    if (language === 'si') {
      return `${cityName}: ${temp}°C, ${condition}, ආර්ද්‍රතාවය ${humidity}%`;
    } else {
      return `${cityName}: ${temp}°C, ${condition}, ${humidity}% humidity`;
    }
  }

  // Enhanced forecast formatting with bilingual support
  formatForecast(data, language = 'en') {
    if (!data?.forecastDays) return [];
    
    return data.forecastDays.map(day => {
      const dayCondition = day.daytimeForecast?.weatherCondition?.description?.text || 'Unknown';
      const nightCondition = day.nighttimeForecast?.weatherCondition?.description?.text || 'Unknown';
      
      return {
        date: new Date(day.displayDate.year, day.displayDate.month - 1, day.displayDate.day),
        maxTemp: Math.round(day.maxTemperature?.degrees || 0),
        minTemp: Math.round(day.minTemperature?.degrees || 0),
        dayCondition: this.translateWeatherCondition(dayCondition, language),
        nightCondition: this.translateWeatherCondition(nightCondition, language),
        originalDayCondition: dayCondition,
        originalNightCondition: nightCondition,
        precipitationChance: day.daytimeForecast?.precipitation?.probability?.percent || 0,
        dayIcon: day.daytimeForecast?.weatherCondition?.iconBaseUri || null,
        nightIcon: day.nighttimeForecast?.weatherCondition?.iconBaseUri || null,
        language: language
      };
    });
  }

  // Detect language from query text
  detectLanguage(text) {
    const sinhalaRegex = /[\u0D80-\u0DFF]/;
    return sinhalaRegex.test(text) ? 'si' : 'en';
  }

  // Enhanced weather query processing
  async processWeatherQuery(query, language = null) {
    try {
      // Auto-detect language if not provided
      const detectedLanguage = language || this.detectLanguage(query);
      
      console.log(`Processing weather query: "${query}" in ${detectedLanguage}`);
      
      const cityInfo = this.findCityCoordinates(query);
      const weatherData = await this.getCurrentWeather(cityInfo.lat, cityInfo.lng);
      const forecastData = await this.getForecast(cityInfo.lat, cityInfo.lng, 3);
      
      const formattedWeather = this.formatCurrentWeather(weatherData, detectedLanguage);
      const formattedForecast = this.formatForecast(forecastData, detectedLanguage);
      const summary = this.generateWeatherSummary(formattedWeather, cityInfo, detectedLanguage);
      
      return {
        current: formattedWeather,
        forecast: formattedForecast,
        summary: summary,
        city: cityInfo,
        language: detectedLanguage,
        timestamp: new Date().toISOString(),
        query: query
      };
    } catch (error) {
      console.error('Error processing weather query:', error);
      
      // Return fallback response in detected language
      const detectedLanguage = language || this.detectLanguage(query);
      const cityInfo = this.findCityCoordinates(query);
      
      return {
        current: this.formatCurrentWeather(this.getMockWeatherData(), detectedLanguage),
        forecast: this.formatForecast(this.getMockForecastData(3), detectedLanguage),
        summary: detectedLanguage === 'si' ? 
          `${cityInfo.sinName} හි කාලගුණ තොරතුරු ලබා ගැනීමට නොහැකිය. කරුණාකර මොහොතකින් නැවත උත්සාහ කරන්න.` :
          `Unable to fetch weather data for ${cityInfo.name}. Please try again in a moment.`,
        city: cityInfo,
        language: detectedLanguage,
        timestamp: new Date().toISOString(),
        query: query,
        error: true
      };
    }
  }

  // Enhanced mock weather data for development/testing
  getMockWeatherData() {
    const conditions = ['Partly Cloudy', 'Sunny', 'Cloudy', 'Light Rain', 'Clear'];
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    
    return {
      temperature: { degrees: 28 + Math.floor(Math.random() * 5) },
      feelsLikeTemperature: { degrees: 32 + Math.floor(Math.random() * 3) },
      weatherCondition: { 
        description: { text: randomCondition },
        iconBaseUri: 'https://weather.gstatic.com/weather/'
      },
      relativeHumidity: 70 + Math.floor(Math.random() * 20),
      wind: { 
        speed: { value: 10 + Math.floor(Math.random() * 10) },
        direction: { cardinal: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)] }
      },
      uvIndex: 5 + Math.floor(Math.random() * 5),
      visibility: { distance: 8 + Math.floor(Math.random() * 5) },
      airPressure: { meanSeaLevelMillibars: 1010 + Math.floor(Math.random() * 10) },
      precipitation: { probability: { percent: Math.floor(Math.random() * 40) } }
    };
  }

  // Mock forecast data
  getMockForecastData(days = 3) {
    const forecastDays = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      forecastDays.push({
        displayDate: {
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          day: date.getDate()
        },
        maxTemperature: { degrees: 30 + Math.random() * 5 },
        minTemperature: { degrees: 22 + Math.random() * 3 },
        daytimeForecast: {
          weatherCondition: { 
            description: { text: ['Sunny', 'Partly Cloudy', 'Cloudy'][Math.floor(Math.random() * 3)] }
          },
          precipitation: { probability: { percent: Math.floor(Math.random() * 40) } }
        },
        nighttimeForecast: {
          weatherCondition: { 
            description: { text: ['Clear', 'Partly Cloudy'][Math.floor(Math.random() * 2)] }
          }
        }
      });
    }
    
    return { forecastDays };
  }
}

export default new aiWeatherService();