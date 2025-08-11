import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, AlertTriangle, Cloud, Droplets } from 'lucide-react';

const WeatherSlideshow = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const alerts = [
    {
      id: 1,
      type: 'Heavy Rain',
      severity: 'High',
      location: 'Western Province',
      description: 'Heavy rainfall expected with thunderstorms. Flooding possible in low-lying areas.',
      icon: <Droplets className="h-8 w-8" />,
      color: 'from-blue-600 to-blue-800',
      time: '2 hours ago'
    },
    {
      id: 2,
      type: 'Strong Winds',
      severity: 'Medium',
      location: 'Southern Province',
      description: 'Strong winds up to 60 km/h expected. Secure loose objects and avoid coastal areas.',
      icon: <Cloud className="h-8 w-8" />,
      color: 'from-gray-600 to-gray-800',
      time: '4 hours ago'
    },
    {
      id: 3,
      type: 'Landslide Warning',
      severity: 'Critical',
      location: 'Central Province',
      description: 'High risk of landslides in hilly areas. Residents advised to evacuate if necessary.',
      icon: <AlertTriangle className="h-8 w-8" />,
      color: 'from-red-600 to-red-800',
      time: '1 hour ago'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % alerts.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [alerts.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % alerts.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + alerts.length) % alerts.length);
  };

  const getSeverityColor = (severity) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  return (
    <div className="relative h-64 md:h-80 overflow-hidden">
      {alerts.map((alert, index) => (
        <div
          key={alert.id}
          className={`absolute inset-0 transition-transform duration-500 ease-in-out ${
            index === currentSlide ? 'translate-x-0' : 
            index < currentSlide ? '-translate-x-full' : 'translate-x-full'
          }`}
        >
          <div className={`h-full bg-gradient-to-r ${alert.color} flex items-center`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <div className="flex items-center space-x-6 text-white">
                <div className="flex-shrink-0">
                  {alert.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h2 className="text-2xl md:text-3xl font-bold">{alert.type}</h2>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getSeverityColor(alert.severity)}`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-lg mb-1">{alert.location}</p>
                  <p className="text-sm md:text-base opacity-90">{alert.description}</p>
                  <p className="text-xs mt-2 opacity-75">{alert.time}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {alerts.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide ? 'bg-white' : 'bg-white bg-opacity-50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default WeatherSlideshow;