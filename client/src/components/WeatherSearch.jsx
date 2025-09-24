import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  AlertTriangle, 
  Droplets, 
  Wind, 
  Thermometer, 
  Sun, 
  Eye, 
  Calendar, 
  TrendingUp, 
  AlertCircle, 
  Gauge, 
  Zap,
  CloudRain,
  Sunrise,
  Sunset,
  Navigation
} from 'lucide-react';
import { getWeatherData } from '../services/weatherService';

// LoadingSpinner Component
const LoadingSpinner = ({ size = 'md' }) => {
  const sizeClasses = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`} />
  );
};

// Enhanced WeatherCard Component with horizontal layout
const WeatherCard = ({ day, isToday, index }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (isToday) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getRainAlert = (precipMm, chanceOfRain) => {
    if (precipMm > 10 || chanceOfRain > 80) return 'high';
    if (precipMm > 5 || chanceOfRain > 60) return 'moderate';
    return 'low';
  };

  const getWindAlert = (windSpeed) => {
    if (windSpeed > 40) return 'high';
    if (windSpeed > 25) return 'moderate';
    return 'low';
  };

  const rainAlert = getRainAlert(day.precipitationMm, day.chanceOfRain);
  const windAlert = getWindAlert(day.maxWindSpeedKmh);
  
  const alertColors = {
    high: 'from-red-50 to-red-100 border-red-300 shadow-red-100',
    moderate: 'from-orange-50 to-orange-100 border-orange-300 shadow-orange-100',
    low: 'from-green-50 to-green-100 border-green-300 shadow-green-100'
  };

  const hasAlert = rainAlert === 'high' || windAlert === 'high';
  const cardGradient = hasAlert ? alertColors.high : 'from-blue-50 to-indigo-100 border-blue-200 shadow-blue-100';

  return (
    <div 
      className={`min-w-[320px] bg-gradient-to-br ${cardGradient} border-2 rounded-2xl p-6 transition-all duration-500 hover:scale-105 hover:shadow-xl transform`}
      style={{ 
        animationDelay: `${index * 100}ms`,
        animation: 'slideInRight 0.6s ease-out forwards'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isToday ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <h4 className="font-bold text-gray-800 text-lg">{formatDate(day.date)}</h4>
          {hasAlert && <AlertTriangle className="h-5 w-5 text-red-600 animate-bounce" />}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-800">
            {Math.round(day.maxTempC)}°
          </div>
          <div className="text-sm text-gray-600">
            {Math.round(day.minTempC)}°
          </div>
        </div>
      </div>

      {/* Weather Condition */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-white/50 rounded-full flex items-center justify-center">
          <CloudRain className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <p className="font-medium text-gray-800">{day.condition}</p>
          <p className="text-sm text-gray-600">Feels like {Math.round(day.maxTempC)}°C</p>
        </div>
      </div>

      {/* Weather Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Rain Info */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <Droplets className={`h-4 w-4 ${rainAlert === 'high' ? 'text-red-600' : rainAlert === 'moderate' ? 'text-orange-600' : 'text-blue-600'}`} />
            <span className="text-xs font-semibold text-gray-700">RAIN</span>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-bold text-gray-800">{parseFloat(day.precipitationMm).toFixed(4)}mm</div>
            <div className="text-xs text-gray-600">{day.chanceOfRain}% chance</div>
          </div>
        </div>

        {/* Wind Info */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <Wind className={`h-4 w-4 ${windAlert === 'high' ? 'text-red-600' : windAlert === 'moderate' ? 'text-orange-600' : 'text-green-600'}`} />
            <span className="text-xs font-semibold text-gray-700">WIND</span>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-bold text-gray-800">{day.maxWindSpeedKmh} km/h</div>
            <div className="text-xs text-gray-600">Max speed</div>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="flex justify-between items-center text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <Eye className="h-3 w-3" />
          <span>{day.avgVisibilityKm}km</span>
        </div>
        <div className="flex items-center gap-1">
          <Gauge className="h-3 w-3" />
          <span>{day.avgHumidity}%</span>
        </div>
        {day.uvIndex > 0 && (
          <div className="flex items-center gap-1">
            <Sun className="h-3 w-3" />
            <span>UV {day.uvIndex}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Current Weather Display
const CurrentWeatherDisplay = ({ data }) => {
  const { current, location } = data;

  const getRainStatus = (precipitationMm, humidity) => {
    if (precipitationMm > 10) return { status: 'Heavy Rain', color: 'from-red-500 to-red-600', bgColor: 'bg-red-50', textColor: 'text-red-700', alert: true };
    if (precipitationMm > 5) return { status: 'Moderate Rain', color: 'from-orange-500 to-orange-600', bgColor: 'bg-orange-50', textColor: 'text-orange-700', alert: true };
    if (precipitationMm > 0) return { status: 'Light Rain', color: 'from-yellow-500 to-yellow-600', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700', alert: false };
    if (humidity > 80) return { status: 'High Humidity', color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50', textColor: 'text-blue-700', alert: false };
    return { status: 'Clear', color: 'from-green-500 to-green-600', bgColor: 'bg-green-50', textColor: 'text-green-700', alert: false };
  };

  const getWindStatus = (windSpeedKmh) => {
    if (windSpeedKmh > 40) return { status: 'Strong Wind', color: 'from-red-500 to-red-600', bgColor: 'bg-red-50', textColor: 'text-red-700', alert: true };
    if (windSpeedKmh > 25) return { status: 'Moderate Wind', color: 'from-orange-500 to-orange-600', bgColor: 'bg-orange-50', textColor: 'text-orange-700', alert: true };
    if (windSpeedKmh > 10) return { status: 'Gentle Wind', color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50', textColor: 'text-blue-700', alert: false };
    return { status: 'Calm', color: 'from-green-500 to-green-600', bgColor: 'bg-green-50', textColor: 'text-green-700', alert: false };
  };

  const rainStatus = getRainStatus(current.precipitationMm, current.humidity);
  const windStatus = getWindStatus(current.windSpeedKmh);

  return (
    <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-2xl p-8 mb-8 border border-blue-100">
      {/* Location Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <MapPin className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-1">{location.name}</h2>
            <p className="text-gray-600 text-lg">{location.region}, {location.country}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {Math.round(current.temperatureC)}°
          </div>
          <div className="text-xl text-gray-700 font-medium">{current.condition}</div>
          <div className="text-gray-500">Feels like {Math.round(current.feelsLike)}°C</div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Rain Status */}
        <div className={`${rainStatus.bgColor} border-2 ${rainStatus.alert ? 'border-red-300' : 'border-gray-200'} rounded-2xl p-6 transition-all duration-300 hover:scale-105`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 bg-gradient-to-r ${rainStatus.color} rounded-xl flex items-center justify-center shadow-lg`}>
              <Droplets className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-800">Rain Status</h3>
              {rainStatus.alert && <AlertCircle className="h-5 w-5 text-red-600 animate-pulse" />}
            </div>
          </div>
          <div className="space-y-2">
            <p className={`font-bold text-xl ${rainStatus.textColor}`}>{rainStatus.status}</p>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>Precipitation: <span className="font-semibold">{current.precipitationMm}mm</span></div>
              <div>Humidity: <span className="font-semibold">{current.humidity}%</span></div>
              <div>Rain Chance: <span className="font-semibold">{current.chanceOfRain}%</span></div>
              {current.thunderstormProbability > 0 && (
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  <span>Thunder: {current.thunderstormProbability}%</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Wind Status */}
        <div className={`${windStatus.bgColor} border-2 ${windStatus.alert ? 'border-red-300' : 'border-gray-200'} rounded-2xl p-6 transition-all duration-300 hover:scale-105`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 bg-gradient-to-r ${windStatus.color} rounded-xl flex items-center justify-center shadow-lg`}>
              <Wind className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-800">Wind Status</h3>
              {windStatus.alert && <AlertCircle className="h-5 w-5 text-red-600 animate-pulse" />}
            </div>
          </div>
          <div className="space-y-2">
            <p className={`font-bold text-xl ${windStatus.textColor}`}>{windStatus.status}</p>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>Speed: <span className="font-semibold">{current.windSpeedKmh} km/h</span></div>
              <div>Direction: <span className="font-semibold">{current.windDirection}</span></div>
              <div>Gust: <span className="font-semibold">{current.windGustKmh} km/h</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Weather Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 text-center">
          <Eye className="h-6 w-6 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-800">{current.visibility}</div>
          <div className="text-sm text-gray-600">Visibility (km)</div>
        </div>
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 text-center">
          <Gauge className="h-6 w-6 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-800">{Math.round(current.pressure)}</div>
          <div className="text-sm text-gray-600">Pressure (mb)</div>
        </div>
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 text-center">
          <Sun className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-800">{current.uvIndex}</div>
          <div className="text-sm text-gray-600">UV Index</div>
        </div>
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 text-center">
          <Navigation className="h-6 w-6 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-800">{current.windDirection}</div>
          <div className="text-sm text-gray-600">Wind Dir</div>
        </div>
      </div>
    </div>
  );
};

// Main WeatherSearch Component
const WeatherSearch = () => {
  const [query, setQuery] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    setWeatherData(null);
    
    try {
      const data = await getWeatherData(query);
      setWeatherData(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch weather data. Please try again.');
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Enhanced Search Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Weather Alert System
          </h1>
          <p className="text-xl text-gray-600 mb-8">Real-time weather monitoring for disaster preparedness</p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="relative">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                  <MapPin className="h-6 w-6 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter city name (e.g., Homagama, Galle, Kaduwela)"
                  className="w-full pl-14 pr-32 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-lg"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white px-8 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <Search className="h-5 w-5" />
                      Search
                    </>
                  )}
                </button>
              </div>
            </form>
            
            {error && (
              <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center gap-3 text-red-800 shadow-lg animate-shake">
                <AlertTriangle className="h-6 w-6 flex-shrink-0" />
                <p className="font-medium">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Weather Results */}
        {weatherData && (
          <div className="space-y-8">
            {/* Current Weather */}
            <CurrentWeatherDisplay data={weatherData} />
            
            {/* 5-Day Forecast with Horizontal Scroll */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-gray-200">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-gray-800">5-Day Forecast</h3>
                  <p className="text-gray-600">Scroll horizontally to view all days</p>
                </div>
                <TrendingUp className="h-6 w-6 text-indigo-600 ml-auto" />
              </div>
              
              {/* Horizontal Scrolling Container */}
              <div className="overflow-x-auto pb-4">
                <div className="flex gap-6 min-w-max">
                  {weatherData.forecast.slice(0, 5).map((day, index) => (
                    <WeatherCard 
                      key={index} 
                      day={day} 
                      isToday={index === 0}
                      index={index}
                    />
                  ))}
                </div>
              </div>
              
              {/* Scroll Indicator */}
              <div className="flex justify-center mt-4">
                <div className="flex gap-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Custom Styles */}
      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        /* Custom scrollbar for horizontal scroll */
        .overflow-x-auto::-webkit-scrollbar {
          height: 8px;
        }
        
        .overflow-x-auto::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        
        .overflow-x-auto::-webkit-scrollbar-thumb {
          background: linear-gradient(to right, #3b82f6, #6366f1);
          border-radius: 4px;
        }
        
        .overflow-x-auto::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to right, #2563eb, #4f46e5);
        }
      `}</style>
    </div>
  );
};

export default WeatherSearch;