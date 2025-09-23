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
      You are Lanka Alert Assistant, a helpful and reliable AI for weather and disaster management in Sri Lanka. Your primary goal is to provide accurate, concise, and actionable information to help users stay safe and informed.

      **Core Instructions:**
      - **Persona:** Be calm, empathetic, and professional. Use a reassuring and helpful tone, especially during emergencies.
      - **Language:** Respond in the same language as the user (English or Sinhala).
      - **Data Priority:** Prioritize and strictly use the specific weather and disaster data provided to you in the user's prompt. Do not use external or general knowledge for data points like temperature, alert status, or inventory levels.
      - **Conciseness:** Keep responses short and to the point. Provide only the most critical information first.
      - **Handling Missing Data:** If you cannot find relevant information in the provided context, state that the data is not available for that specific query and suggest alternative actions (e.g., checking the alerts page).

      **Response Guidelines:**
      - **Weather:**
          - Mention the specific city.
          - Use Celsius for temperature.
          - Add a brief, relevant safety tip if conditions are extreme (e.g., "Stay indoors during heavy rain.").
          - Acknowledge Sri Lanka's tropical and monsoon climate where appropriate.

      - **Disaster Alerts:**
          - Clearly state the type of alert (e.g., "Flood Alert," "Landslide Warning").
          - Mention the affected location(s) and their status.
          - Provide immediate, actionable advice (e.g., "Evacuate to nearest safe zone.").

      - **Inventory/Supplies:**
          - Report on stock levels concisely.
          - For specific item queries, give a clear status (e.g., "Tents are in low stock.").

      **Example Sinhala phrases to understand and respond to:**
      - 'කාලගුණය කොහොමද?' (What is the weather like?)
      - 'ගංවතුර අනතුරු ඇඟවීම් තියෙනවද?' (Are there flood warnings?)
      - 'කොළඹට හෙට කාලගුණය?' (Weather for Colombo tomorrow?)
      - 'ආරක්ෂිත කලාප' (Safe zones)
      - 'බඩු තොග' (Supplies/Inventory)
    `;
  }

  // Generate AI response with weather context
  async generateResponse(userMessage, weatherContext = null, firebaseContext = null) {
    try {
      // Detect if user is asking about weather
      const isWeatherQuery = this.isWeatherQuery(userMessage);
      const isDisasterQuery = this.isDisasterQuery(userMessage);
      const isInventoryQuery = this.isInventoryQuery(userMessage);
      let contextualPrompt = userMessage;

      // Get Firebase data if relevant
      if ((isDisasterQuery || isInventoryQuery) && !firebaseContext) {
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
    
    // Expanded Sinhala weather words
    const sinhalaWeatherWords = [
      'කාලගුණය', 'වර්ෂාව', 'වැස්ස', 'හිරු', 'වලාකුළු', 'උෂ්ණත්වය', 'අනාවැකි',
      'සුළඟ', 'අධික', 'උණුසුම්', 'සීතල', 'මෝසම්', 'සුළි සුළං', 'ගංවතුර',
      'නියඟය', 'අද', 'හෙට', 'සතිය'
    ];

    const lowerMessage = message.toLowerCase();
    
    return [...weatherKeywords, ...sinhalaWeatherWords]
      .some(keyword => lowerMessage.includes(keyword));
  }

  // Check if user message is disaster/safety related
  isDisasterQuery(message) {
    const disasterKeywords = [
      'alert', 'disaster', 'emergency', 'evacuation', 'safe zone', 'danger zone',
      'flood', 'landslide', 'cyclone', 'tsunami', 'fire', 'earthquake',
      'shelter', 'rescue', 'help', 'safety', 'risk', 'avoid', 'warning',
      'recent alerts', 'current situation', 'safe areas', 'danger areas',
      'active alerts', 'valid alerts', 'evacuation points', 'emergency contacts'
    ];
    
    // Expanded Sinhala disaster words
    const sinhalaDisasterWords = [
      'ආපදා', 'අනතුරු', 'හදිසි', 'ගංවතුර', 'නාය යෑම්', 'සුළි සුළං', 'සුනාමි', 'ගිනි',
      'ආරක්ෂිත කලාප', 'උදව්', 'සහන', 'ආරක්ෂාව', 'අනතුරු ඇඟවීම්', 'අවදානම්', 'වළක්වා',
      'ඉවත් කිරීම', 'ආරක්ෂිත ස්ථාන', 'හදිසි දුරකථන'
    ];

    const lowerMessage = message.toLowerCase();
    
    return [...disasterKeywords, ...sinhalaDisasterWords]
      .some(keyword => lowerMessage.includes(keyword));
  }

  // Check if user message is inventory/supplies related
  isInventoryQuery(message) {
    const inventoryKeywords = [
      'stock', 'inventory', 'supplies', 'equipment', 'shortage', 'low stock',
      'available', 'items', 'resources', 'materials', 'tools', 'medicine',
      'food', 'water', 'blankets', 'tents', 'first aid', 'medical supplies'
    ];
    
    // Expanded Sinhala inventory words
    const sinhalaInventoryWords = [
      'තොග', 'සම්පත්', 'උපකරණ', 'බඩු', 'හිඟයක්', 'අඩු තොග', 'ලබා ගත හැකි', 'අයිතම',
      'ඖෂධ', 'ආහාර', 'වතුර', 'බෙහෙත්', 'ප්‍රථමාධාර', 'ජලය'
    ];

    const lowerMessage = message.toLowerCase();
    
    return [...inventoryKeywords, ...sinhalaInventoryWords]
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

    // Add inventory information
    if (firebaseContext.inventory && firebaseContext.inventory.length > 0) {
      prompt += `INVENTORY & SUPPLIES:\n`;
      firebaseContext.inventory.slice(0, 10).forEach((item, index) => {
        prompt += `${index + 1}. ${firebaseService.formatInventoryItemForAI(item)}\n`;
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
    
    prompt += 'Please provide a helpful response based on this disaster alert, zone and inventory information, along with any weather context. Include specific recommendations for safety and evacuation if relevant and use short answers.';
    
    return prompt;
  }

  // Fallback responses for when AI service fails
  getFallbackResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('weather') || lowerMessage.includes('temperature') || lowerMessage.includes('කාලගුණය') || lowerMessage.includes('උෂ්ණත්වය')) {
      return "I'm currently unable to access the latest weather information. Please try again in a moment, or check the Weather Alerts page for current conditions. / මට මේ මොහොතේ කාලගුණ තොරතුරු ලබා ගැනීමට නොහැකිය. කරුණාකර මොහොතකින් නැවත උත්සාහ කරන්න, නැතහොත් කාලගුණ අනතුරු ඇඟවීම් පිටුව පරීක්ෂා කරන්න.";
    } else if (lowerMessage.includes('emergency') || lowerMessage.includes('help') || lowerMessage.includes('හදිසි') || lowerMessage.includes('උදව්')) {
      return "For immediate emergencies, please call 119 (Police), 118 (Fire & Rescue), or 110 (Ambulance). You can also visit our Emergency Help page for more resources. / හදිසි අවස්ථාවන් සඳහා, කරුණාකර 119 (පොලිසිය), 118 (ගිනි නිවන සේවා) හෝ 110 (ගිලන් රථ) අමතන්න. වැඩි විස්තර සඳහා අපගේ හදිසි උදව් පිටුවට පිවිසිය හැක.";
    } else if (lowerMessage.includes('flood') || lowerMessage.includes('disaster') || lowerMessage.includes('ගංවතුර') || lowerMessage.includes('ආපදා')) {
      return "For the latest disaster alerts and safety information, please check our alerts page. Stay informed through official channels and follow local authority guidelines. / නවතම ආපදා අනතුරු ඇඟවීම් සහ ආරක්ෂක තොරතුරු සඳහා, කරුණාකර අපගේ අනතුරු ඇඟවීම් පිටුව පරීක්ෂා කරන්න. නිල මූලාශ්‍රවලින් තොරතුරු ලබාගෙන පළාත් පාලන ආයතන වල උපදෙස් අනුගමනය කරන්න.";
    } else if (lowerMessage.includes('safe zone') || lowerMessage.includes('evacuation') || lowerMessage.includes('ආරක්ෂිත කලාප') || lowerMessage.includes('ඉවත් කිරීම')) {
      return "I can help you find safe zones and evacuation points in your area. Please specify your location or check our map for the nearest safe zones. / ඔබට ඔබගේ ප්‍රදේශයේ ඇති ආරක්ෂිත කලාප සහ ඉවත් කිරීමේ ස්ථාන සොයා ගැනීමට මට උදව් කළ හැකිය. කරුණාකර ඔබගේ ස්ථානය සඳහන් කරන්න.";
    } else if (lowerMessage.includes('stock') || lowerMessage.includes('inventory') || lowerMessage.includes('තොග') || lowerMessage.includes('සම්පත්')) {
      return "I can help you check current inventory levels and supply status. Please specify what items you're looking for or ask about low stock alerts. / දැනට පවතින තොග මට්ටම් සහ සැපයුම් තත්ත්වය පරීක්ෂා කිරීමට මට උදව් කළ හැකිය. කරුණාකර ඔබට අවශ්‍ය ද්‍රව්‍ය සඳහන් කරන්න.";
    } else {
      return "I'm here to help with weather information and disaster management guidance for Sri Lanka. How can I assist you today? / මම ශ්‍රී ලංකාවේ කාලගුණ තොරතුරු සහ ආපදා කළමනාකරණ මගපෙන්වීම් සඳහා උදව් කිරීමට මෙහි සිටිමි. අද මට ඔබට උදව් කළ හැක්කේ කෙසේද?";
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
