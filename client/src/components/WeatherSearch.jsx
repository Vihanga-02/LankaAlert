import React, { useState, useCallback } from 'react';
import { Search, MapPin, AlertTriangle, Droplets, Wind, Thermometer, Sun, Eye, Calendar, TrendingUp, AlertCircle, Gauge, Zap } from 'lucide-react';
import { getWeatherData } from '../services/weatherService';  // Corrected import for the weather service

// LoadingSpinner Component
const LoadingSpinner = ({ size = 'md' }) => {
  const sizeClasses = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`} />
  );
};

// WeatherCard Component
const WeatherCard = ({ day, isToday }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (isToday) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
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
    high: 'border-red-200 bg-red-50',
    moderate: 'border-orange-200 bg-orange-50',
    low: 'border-green-200 bg-green-50'
  };
  const hasAlert = rainAlert === 'high' || windAlert === 'high';

  return (
    <div className={`border-2 rounded-lg p-4 transition-all duration-200 hover:shadow-md ${hasAlert ? alertColors.high : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-gray-800">{formatDate(day.date)}</h4>
          {hasAlert && <AlertTriangle className="h-4 w-4 text-red-600" />}
        </div>
        <div className="flex items-center gap-2">
          <Thermometer className="h-4 w-4 text-gray-600" />
          <span className="font-medium text-gray-800">
            {Math.round(day.maxTempC)}°C / {Math.round(day.minTempC)}°C
          </span>
        </div>
      </div>
      <div className="text-sm text-gray-600 mb-3">{day.condition}</div>
      <div className="grid grid-cols-2 gap-3">
        {/* Rain Info */}
        <div className={`p-3 rounded-md ${alertColors[rainAlert]}`}>
          <div className="flex items-center gap-2 mb-1">
            <Droplets className="h-4 w-4" />
            <span className="font-medium">Rain</span>
          </div>
          <div className="space-y-1 text-xs">
            <div>Amount: {day.precipitationMm}mm</div>
            <div>Chance: {day.chanceOfRain}%</div>
            <div>Humidity: {day.avgHumidity}%</div>
            {day.thunderstormProbability > 0 && (
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                <span>Thunder: {day.thunderstormProbability}%</span>
              </div>
            )}
          </div>
        </div>
        {/* Wind Info */}
        <div className={`p-3 rounded-md ${alertColors[windAlert]}`}>
          <div className="flex items-center gap-2 mb-1">
            <Wind className="h-4 w-4" />
            <span className="font-medium">Wind</span>
          </div>
          <div className="space-y-1 text-xs">
            <div>Max: {day.maxWindSpeedKmh} km/h</div>
            <div>Avg: {day.avgWindSpeedKmh} km/h</div>
            <div>Visibility: {day.avgVisibilityKm}km</div>
            {day.uvIndex > 0 && (
              <div className="flex items-center gap-1">
                <Sun className="h-3 w-3" />
                <span>UV: {day.uvIndex}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// WeatherDisplay Component
const WeatherDisplay = ({ data }) => {
  const { current, location, forecast } = data;

  const getRainStatus = (precipitationMm, humidity) => {
    if (precipitationMm > 10) return { status: 'Heavy Rain', color: 'text-red-600 bg-red-50', alert: true };
    if (precipitationMm > 5) return { status: 'Moderate Rain', color: 'text-orange-600 bg-orange-50', alert: true };
    if (precipitationMm > 0) return { status: 'Light Rain', color: 'text-yellow-600 bg-yellow-50', alert: false };
    if (humidity > 80) return { status: 'High Humidity', color: 'text-blue-600 bg-blue-50', alert: false };
    return { status: 'Clear', color: 'text-green-600 bg-green-50', alert: false };
  };

  const getWindStatus = (windSpeedKmh) => {
    if (windSpeedKmh > 40) return { status: 'Strong Wind', color: 'text-red-600 bg-red-50', alert: true };
    if (windSpeedKmh > 25) return { status: 'Moderate Wind', color: 'text-orange-600 bg-orange-50', alert: true };
    if (windSpeedKmh > 10) return { status: 'Gentle Wind', color: 'text-blue-600 bg-blue-50', alert: false };
    return { status: 'Calm', color: 'text-green-600 bg-green-50', alert: false };
  };

  const rainStatus = getRainStatus(current.precipitationMm, current.humidity);
  const windStatus = getWindStatus(current.windSpeedKmh);

  return (
    <div className="space-y-6">
      {/* Current Weather Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <MapPin className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{location.name}</h2>
              <p className="text-gray-600">{location.region}, {location.country}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-gray-800">{Math.round(current.temperatureC)}°C</div>
            <div className="text-gray-600">{current.condition}</div>
            <div className="text-sm text-gray-500">Feels like {Math.round(current.feelsLike)}°C</div>
          </div>
        </div>
        {/* Critical Status Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg border-2 ${rainStatus.alert ? 'border-red-200' : 'border-gray-200'} ${rainStatus.color}`}>
            <div className="flex items-center gap-3 mb-2">
              <Droplets className="h-5 w-5" />
              <h3 className="font-semibold">Rain Status</h3>
              {rainStatus.alert && <AlertCircle className="h-4 w-4" />}
            </div>
            <div className="space-y-1">
              <p className="font-medium">{rainStatus.status}</p>
              <p className="text-sm opacity-80">Precipitation: {current.precipitationMm}mm</p>
              <p className="text-sm opacity-80">Humidity: {current.humidity}%</p>
              <p className="text-sm opacity-80">Rain Chance: {current.chanceOfRain}%</p>
              {current.thunderstormProbability > 0 && (
                <p className="text-sm opacity-80">Thunder: {current.thunderstormProbability}%</p>
              )}
            </div>
          </div>
          <div className={`p-4 rounded-lg border-2 ${windStatus.alert ? 'border-red-200' : 'border-gray-200'} ${windStatus.color}`}>
            <div className="flex items-center gap-3 mb-2">
              <Wind className="h-5 w-5" />
              <h3 className="font-semibold">Wind Status</h3>
              {windStatus.alert && <AlertCircle className="h-4 w-4" />}
            </div>
            <div className="space-y-1">
              <p className="font-medium">{windStatus.status}</p>
              <p className="text-sm opacity-80">Speed: {current.windSpeedKmh} km/h</p>
              <p className="text-sm opacity-80">Direction: {current.windDirection}</p>
              <p className="text-sm opacity-80">Gust: {current.windGustKmh} km/h</p>
            </div>
          </div>
        </div>
      </div>
      {/* 5-Day Forecast */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="h-6 w-6 text-blue-600" />
          <h3 className="text-2xl font-bold text-gray-800">5-Day Forecast</h3>
          <TrendingUp className="h-5 w-5 text-blue-600" />
        </div>
        <div className="grid gap-4">
          {forecast.slice(0, 5).map((day, index) => (
            <WeatherCard key={index} day={day} isToday={index === 0} />
          ))}
        </div>
      </div>
    </div>
  );
};

// WeatherSearch Component
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
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter city name (e.g., New York, Tokyo, London)"
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-gray-900 placeholder-gray-500"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 min-w-[120px] justify-center"
          >
            {loading ? <LoadingSpinner size="sm" /> : <><Search className="h-5 w-5" /> Search</>}
          </button>
        </form>
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-800">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </div>

      {weatherData && <WeatherDisplay data={weatherData} />}
    </div>
  );
};

export default WeatherSearch;
