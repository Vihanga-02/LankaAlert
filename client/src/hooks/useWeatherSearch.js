import { useState, useCallback } from 'react';
import { getWeatherData } from '../services/weatherService';

export const useWeatherSearch = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);

  const searchWeather = useCallback(async (location) => {
    if (!location.trim()) return;

    setLoading(true);
    setError('');

    try {
      const data = await getWeatherData(location);
      setWeatherData(data);
      
      // Add to search history
      setSearchHistory(prev => {
        const newHistory = [
          { location: data.location.name, timestamp: Date.now() },
          ...prev.filter(item => item.location !== data.location.name)
        ].slice(0, 5); // Keep only last 5 searches
        return newHistory;
      });

    } catch (err) {
      setError(err.message || 'Failed to fetch weather data');
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setWeatherData(null);
    setError('');
  }, []);

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  return {
    weatherData,
    loading,
    error,
    searchHistory,
    searchWeather,
    clearSearch,
    clearHistory
  };
};