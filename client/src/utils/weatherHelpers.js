// Weather utility functions for disaster alert system

export const getAlertLevel = (weatherData) => {
  const { current, forecast } = weatherData;
  let alertLevel = 'low';
  const alerts = [];

  // Check current conditions
  if (current.precipitationMm > 10) {
    alertLevel = 'high';
    alerts.push('Heavy rain currently occurring');
  }

  if (current.windSpeedKmh > 40) {
    alertLevel = 'high';
    alerts.push('Strong winds currently occurring');
  }

  // Check forecast for next 24-48 hours
  const nextTwoDays = forecast.slice(0, 2);
  nextTwoDays.forEach((day, index) => {
    const dayLabel = index === 0 ? 'today' : 'tomorrow';
    
    if (day.precipitationMm > 15 || day.chanceOfRain > 85) {
      if (alertLevel !== 'high') alertLevel = 'moderate';
      alerts.push(`Heavy rain expected ${dayLabel}`);
    }

    if (day.maxWindSpeedKmh > 50) {
      alertLevel = 'high';
      alerts.push(`Severe wind conditions expected ${dayLabel}`);
    }
  });

  return { alertLevel, alerts };
};

export const formatWeatherForAlert = (weatherData) => {
  const { current, location } = weatherData;
  const { alertLevel, alerts } = getAlertLevel(weatherData);

  return {
    location: `${location.name}, ${location.country}`,
    alertLevel,
    alerts,
    summary: {
      temperature: `${Math.round(current.temperatureC)}°C`,
      condition: current.condition,
      rainfall: `${current.precipitationMm}mm`,
      windSpeed: `${current.windSpeedKmh} km/h`,
      humidity: `${current.humidity}%`
    }
  };
};

export const getDisasterRiskLevel = (weatherData) => {
  const { current, forecast } = weatherData;
  
  // Calculate flood risk
  const floodRisk = calculateFloodRisk(current, forecast);
  
  // Calculate wind damage risk  
  const windRisk = calculateWindRisk(current, forecast);
  
  return {
    flood: floodRisk,
    wind: windRisk,
    overall: Math.max(floodRisk.level, windRisk.level)
  };
};

const calculateFloodRisk = (current, forecast) => {
  let riskLevel = 1; // 1-5 scale
  const factors = [];

  // Current precipitation
  if (current.precipitationMm > 20) {
    riskLevel = 5;
    factors.push('Extremely heavy current rainfall');
  } else if (current.precipitationMm > 10) {
    riskLevel = Math.max(riskLevel, 4);
    factors.push('Heavy current rainfall');
  }

  // Forecast precipitation
  const totalForecastRain = forecast.slice(0, 3).reduce((sum, day) => sum + day.precipitationMm, 0);
  if (totalForecastRain > 50) {
    riskLevel = Math.max(riskLevel, 4);
    factors.push('Heavy rainfall expected over next 3 days');
  }

  return { level: riskLevel, factors };
};

const calculateWindRisk = (current, forecast) => {
  let riskLevel = 1; // 1-5 scale
  const factors = [];

  // Current wind conditions
  if (current.windSpeedKmh > 60) {
    riskLevel = 5;
    factors.push('Extremely strong current winds');
  } else if (current.windSpeedKmh > 40) {
    riskLevel = Math.max(riskLevel, 4);
    factors.push('Strong current winds');
  }

  // Forecast wind conditions
  const maxForecastWind = Math.max(...forecast.slice(0, 2).map(day => day.maxWindSpeedKmh));
  if (maxForecastWind > 70) {
    riskLevel = Math.max(riskLevel, 5);
    factors.push('Severe wind conditions expected');
  }

  return { level: riskLevel, factors };
};