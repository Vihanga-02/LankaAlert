import React, { useState, useEffect } from 'react';
import { MapPin, Filter, Layers, Navigation, AlertTriangle, Droplets, Mountain, Wind } from 'lucide-react';

const LiveTracking = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({
    floods: true,
    landslides: true,
    storms: true,
    earthquakes: false
  });

  const disasters = [
    {
      id: 1,
      type: 'flood',
      title: 'Flood Alert - Colombo',
      severity: 'high',
      lat: 6.9271,
      lng: 79.8612,
      description: 'Major flooding in low-lying areas',
      time: '2 hours ago',
      affected: 150
    },
    {
      id: 2,
      type: 'landslide',
      title: 'Landslide Warning - Kandy',
      severity: 'critical',
      lat: 7.2906,
      lng: 80.6337,
      description: 'High risk of landslides in hilly areas',
      time: '1 hour ago',
      affected: 75
    },
    {
      id: 3,
      type: 'storm',
      title: 'Storm Warning - Galle',
      severity: 'medium',
      lat: 6.0535,
      lng: 80.2210,
      description: 'Strong winds and heavy rainfall',
      time: '3 hours ago',
      affected: 200
    }
  ];

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  const getDisasterIcon = (type) => {
    switch (type) {
      case 'flood':
        return <Droplets className="h-5 w-5" />;
      case 'landslide':
        return <Mountain className="h-5 w-5" />;
      case 'storm':
        return <Wind className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'text-red-700 bg-red-100 border-red-300';
      case 'high':
        return 'text-orange-700 bg-orange-100 border-orange-300';
      case 'medium':
        return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      default:
        return 'text-blue-700 bg-blue-100 border-blue-300';
    }
  };

  const getMarkerColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  const filteredDisasters = disasters.filter(disaster => 
    selectedFilters[disaster.type + 's'] || selectedFilters[disaster.type]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Live Disaster Tracking</h1>
          <p className="text-lg text-gray-600">
            Real-time tracking of disasters and your location with interactive mapping
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <Filter className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Disaster Filters</h3>
              </div>
              
              <div className="space-y-3">
                {Object.entries(selectedFilters).map(([key, value]) => (
                  <label key={key} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setSelectedFilters({
                        ...selectedFilters,
                        [key]: e.target.checked
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700 capitalize">
                      {key.replace(/s$/, '').replace(/([A-Z])/g, ' $1')}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Location Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Navigation className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Your Location</h3>
              </div>
              
              {userLocation ? (
                <div className="text-sm text-gray-600">
                  <p>Latitude: {userLocation.lat.toFixed(4)}</p>
                  <p>Longitude: {userLocation.lng.toFixed(4)}</p>
                  <p className="mt-2 text-green-600">Location tracking active</p>
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  <p>Requesting location access...</p>
                  <button className="mt-2 text-blue-600 hover:text-blue-800">
                    Enable Location
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Map Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Map Header */}
              <div className="bg-blue-600 text-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-6 w-6" />
                    <h3 className="text-lg font-semibold">Interactive Disaster Map</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Layers className="h-5 w-5" />
                    <span className="text-sm">Live Updates</span>
                  </div>
                </div>
              </div>

              {/* Map Container - Placeholder for Google Maps */}
              <div className="relative h-96 bg-gray-100">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-xl font-semibold text-gray-600 mb-2">
                      Google Maps Integration
                    </h4>
                    <p className="text-gray-500 mb-4">
                      Interactive map will be displayed here using Google Maps API
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {filteredDisasters.map((disaster) => (
                        <div
                          key={disaster.id}
                          className={`flex items-center space-x-2 px-3 py-1 rounded-full text-white text-sm ${getMarkerColor(disaster.severity)}`}
                        >
                          {getDisasterIcon(disaster.type)}
                          <span>{disaster.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Simulated markers */}
                <div className="absolute top-16 left-20">
                  <div className="bg-red-500 text-white p-2 rounded-full shadow-lg">
                    <Mountain className="h-4 w-4" />
                  </div>
                </div>
                <div className="absolute top-32 right-24">
                  <div className="bg-orange-500 text-white p-2 rounded-full shadow-lg">
                    <Droplets className="h-4 w-4" />
                  </div>
                </div>
                <div className="absolute bottom-20 left-32">
                  <div className="bg-yellow-500 text-white p-2 rounded-full shadow-lg">
                    <Wind className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Map Legend */}
              <div className="p-4 bg-gray-50 border-t">
                <h4 className="font-semibold text-gray-900 mb-3">Map Legend</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    <span>Critical</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                    <span>High Risk</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                    <span>Medium Risk</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    <span>Your Location</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Disaster List */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Active Disasters Near You</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDisasters.map((disaster) => (
              <div key={disaster.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getMarkerColor(disaster.severity)} text-white`}>
                      {getDisasterIcon(disaster.type)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{disaster.title}</h4>
                      <p className="text-sm text-gray-500">{disaster.time}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(disaster.severity)}`}>
                    {disaster.severity}
                  </span>
                </div>
                
                <p className="text-gray-700 mb-4">{disaster.description}</p>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {disaster.affected} people affected
                  </span>
                  <button className="text-blue-600 hover:text-blue-800 font-medium">
                    View on Map →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTracking;