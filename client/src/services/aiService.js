import { GoogleGenerativeAI } from '@google/generative-ai';
import aiWeatherService from './aiWeatherService.js';
import firebaseService from './firebaseService.js';

class AIService {
  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // System instruction for Sri Lankan weather assistant
    this.systemInstruction = `
      You are Lanka Alert Assistant, a helpful weather and disaster management AI for Sri Lanka. 
      Your role is to:
      1. Provide accurate weather information for Sri Lankan cities
      2. Offer disaster preparedness advice specific to Sri Lanka's climate
      3. Give location-based weather alerts and safety recommendations
      4. Understand both English and basic Sinhala/Tamil phrases
      5. Be concise but informative in your responses
      6. Focus on practical, actionable advice for Sri Lankan users
      
      When responding about weather:
      - Always mention the specific city/location
      - Include temperature in Celsius
      - Mention monsoon patterns when relevant
      - Provide safety advice for extreme weather
      - Be aware of Sri Lanka's tropical climate and monsoon seasons
    `;
  }

  // Generate AI response with weather context
  async generateResponse(userMessage, weatherContext = null, firebaseContext = null) {
    try {
      // Detect if user is asking about weather
      const isWeatherQuery = this.isWeatherQuery(userMessage);
      const isDisasterQuery = this.isDisasterQuery(userMessage);
      let contextualPrompt = userMessage;
      
      // Get Firebase data if relevant
      if (isDisasterQuery && !firebaseContext) {
        try {
          firebaseContext = await firebaseService.searchRelevantData(userMessage);
        } catch (error) {
          console.error('Error fetching Firebase context:', error);
        }
      }
      
      if (isWeatherQuery && weatherContext) {
        contextualPrompt = this.buildWeatherPrompt(userMessage, weatherContext);
      } else if (isWeatherQuery && !weatherContext) {
        // Try to get weather data based on user's location query
        const location = aiWeatherService.findCityCoordinates(userMessage);
        try {
          const currentWeather = await aiWeatherService.getCurrentWeather(location.lat, location.lng);
          const formattedWeather = aiWeatherService.formatCurrentWeather(currentWeather);
          contextualPrompt = this.buildWeatherPrompt(userMessage, {
            location: location.name,
            current: formattedWeather
          });
        } catch (error) {
          console.error('Error fetching weather for AI context:', error);
        }
      }
      
      // Build disaster/safety prompt if Firebase context is available
      if (firebaseContext && (firebaseContext.alerts.length > 0 || firebaseContext.zones.length > 0)) {
        contextualPrompt = this.buildDisasterPrompt(userMessage, firebaseContext, weatherContext);
      }

      const result = await this.model.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: `${this.systemInstruction}\n\nUser question: ${contextualPrompt}` }]
        }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 500,
        }
      });

      return result.response.text();
    } catch (error) {
      console.error('Error generating AI response:', error);
      return this.getFallbackResponse(userMessage);
    }
  }

  // Check if user message is weather-related
  isWeatherQuery(message) {
    const weatherKeywords = [
      'weather', 'temperature', 'rain', 'sunny', 'cloudy', 'forecast', 
      'storm', 'wind', 'humidity', 'hot', 'cold', 'monsoon', 'cyclone',
      'flood', 'drought', 'climate', 'today', 'tomorrow', 'week'
    ];
    
    const sinhalaWeatherWords = ['කාලගුණය', 'වර්ෂාව', 'හිරු', 'වලාකුළ'];
    const tamilWeatherWords = ['வானிலை', 'மழை', 'வெயில்', 'மேகம்'];
    
    const lowerMessage = message.toLowerCase();
    
    return [...weatherKeywords, ...sinhalaWeatherWords, ...tamilWeatherWords]
      .some(keyword => lowerMessage.includes(keyword));
  }

  // Check if user message is disaster/safety related
  isDisasterQuery(message) {
    const disasterKeywords = [
      'alert', 'disaster', 'emergency', 'evacuation', 'safe zone', 'danger zone',
      'flood', 'landslide', 'cyclone', 'tsunami', 'fire', 'earthquake',
      'shelter', 'rescue', 'help', 'safety', 'risk', 'avoid', 'warning',
      'recent alerts', 'current situation', 'safe areas', 'danger areas'
    ];
    
    const sinhalaDisasterWords = ['ආපදාව', 'අනතුරු', 'ගලා යාම', 'ගිනි'];
    const tamilDisasterWords = ['பேரிடர்', 'ஆபத்து', 'வெள்ளம்', 'தீ'];
    
    const lowerMessage = message.toLowerCase();
    
    return [...disasterKeywords, ...sinhalaDisasterWords, ...tamilDisasterWords]
      .some(keyword => lowerMessage.includes(keyword));
  }

  // Build weather-specific prompt
  buildWeatherPrompt(userMessage, weatherContext) {
    const { location, current, forecast } = weatherContext;
    
    let prompt = `User is asking: "${userMessage}"\n\nCurrent weather data for ${location}:\n`;
    
    if (current) {
      prompt += `
        - Temperature: ${current.temperature}°C (feels like ${current.feelsLike}°C)
        - Condition: ${current.condition}
        - Humidity: ${current.humidity}%
        - Wind: ${current.windSpeed} km/h ${current.windDirection}
        - UV Index: ${current.uvIndex}
        - Precipitation chance: ${current.precipitationProbability}%
        - Visibility: ${current.visibility} km
        - Pressure: ${current.pressure} mb
      `;
    }
    
    if (forecast && forecast.length > 0) {
      prompt += `\n\nForecast for next ${forecast.length} days:\n`;
      forecast.forEach((day, index) => {
        prompt += `Day ${index + 1}: ${day.maxTemp}°C/${day.minTemp}°C, ${day.dayCondition}, ${day.precipitationChance}% rain chance\n`;
      });
    }
    
    prompt += '\n\nPlease provide a helpful response based on this weather information and the user\'s question.';
    
    return prompt;
  }

  // Build disaster-specific prompt
  buildDisasterPrompt(userMessage, firebaseContext, weatherContext = null) {
    let prompt = `User is asking: "${userMessage}"\n\n`;
    
    // Add current disaster alerts
    if (firebaseContext.alerts && firebaseContext.alerts.length > 0) {
      prompt += `CURRENT DISASTER ALERTS:\n`;
      firebaseContext.alerts.slice(0, 5).forEach((alert, index) => {
        prompt += `${index + 1}. ${firebaseService.formatDisasterAlertForAI(alert)}\n`;
      });
      prompt += '\n';
    }
    
    // Add relevant zones
    if (firebaseContext.zones && firebaseContext.zones.length > 0) {
      prompt += `RELEVANT ZONES:\n`;
      firebaseContext.zones.slice(0, 5).forEach((zone, index) => {
        prompt += `${index + 1}. ${firebaseService.formatMapZoneForAI(zone)}\n`;
      });
      prompt += '\n';
    }
    
    // Add weather context if available
    if (weatherContext) {
      prompt += `CURRENT WEATHER CONTEXT:\n`;
      if (weatherContext.current) {
        prompt += `Temperature: ${weatherContext.current.temperature}°C, Condition: ${weatherContext.current.condition}\n`;
        prompt += `Precipitation chance: ${weatherContext.current.precipitationProbability}%\n`;
      }
      prompt += '\n';
    }
    
    prompt += 'Please provide a helpful response based on this disaster alert and zone information, along with any weather context. Include specific recommendations for safety and evacuation if relevant.';
    
    return prompt;
  }

  // Fallback responses for when AI service fails
  getFallbackResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('weather') || lowerMessage.includes('temperature')) {
      return "I'm currently unable to access the latest weather information. Please try again in a moment, or check the Weather Alerts page for current conditions.";
    } else if (lowerMessage.includes('emergency') || lowerMessage.includes('help')) {
      return "For immediate emergencies, please call 119 (Police), 118 (Fire & Rescue), or 110 (Ambulance). You can also visit our Emergency Help page for more resources.";
    } else if (lowerMessage.includes('flood') || lowerMessage.includes('disaster')) {
      return "For the latest disaster alerts and safety information, please check our alerts page. Stay informed through official channels and follow local authority guidelines.";
    } else if (lowerMessage.includes('safe zone') || lowerMessage.includes('evacuation')) {
      return "I can help you find safe zones and evacuation points in your area. Please specify your location or check our map for the nearest safe zones.";
    } else {
      return "I'm here to help with weather information and disaster management guidance for Sri Lanka. How can I assist you today?";
    }
  }

  // Generate weather summary for location
  async getWeatherSummary(locationName) {
    try {
      const location = aiWeatherService.findCityCoordinates(locationName || 'colombo');
      const [currentWeather, forecast] = await Promise.all([
        aiWeatherService.getCurrentWeather(location.lat, location.lng),
        aiWeatherService.getForecast(location.lat, location.lng, 3)
      ]);
      
      const formattedCurrent = aiWeatherService.formatCurrentWeather(currentWeather);
      const formattedForecast = aiWeatherService.formatForecast(forecast);
      
      return await this.generateResponse(
        `Give me a weather summary for ${location.name}`,
        {
          location: location.name,
          current: formattedCurrent,
          forecast: formattedForecast
        }
      );
    } catch (error) {
      console.error('Error generating weather summary:', error);
      return `I'm unable to get the current weather information for ${locationName}. Please try again later.`;
    }
  }
}

export default new AIService();