import React, { useState } from 'react';
import { 
  Map, 
  MapPin, 
  AlertTriangle, 
  Layers, 
  Filter, 
  RefreshCw, 
  Eye,
  Plus,
  Settings
} from 'lucide-react';

const MapUpdate = () => {
  const [activeLayer, setActiveLayer] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const mapLayers = [
    { id: 'all', name: 'All Disasters', count: 15, color: 'text-gray-600' },
    { id: 'flood', name: 'Floods', count: 8, color: 'text-blue-600' },
    { id: 'landslide', name: 'Landslides', count: 3, color: 'text-orange-600' },
    { id: 'wind', name: 'Strong Winds', count: 2, color: 'text-gray-600' },
    { id: 'cyclone', name: 'Cyclones', count: 1, color: 'text-red-600' },
    { id: 'drought', name: 'Drought', count: 1, color: 'text-yellow-600' }
  ];

  const recentReports = [
    {
      id: 1,
      type: 'Flood',
      location: 'Colombo - Kollupitiya',
      reporter: 'Sunil Fernando',
      reporterPoints: 245,
      time: '2 hours ago',
      severity: 'High',
      verified: false,
      coordinates: { lat: 6.9271, lng: 79.8612 }
    },
    {
      id: 2,
      type: 'Landslide',
      location: 'Kandy - Peradeniya',
      reporter: 'Priya Jayawardena',
      reporterPoints: 180,
      time: '4 hours ago',
      severity: 'Medium',
      verified: true,
      coordinates: { lat: 7.2906, lng: 80.6337 }
    },
    {
      id: 3,
      type: 'Strong Wind',
      location: 'Galle - Hikkaduwa',
      reporter: 'Kamal Perera',
      reporterPoints: 95,
      time: '6 hours ago',
      severity: 'Medium',
      verified: true,
      coordinates: { lat: 6.1414, lng: 80.1018 }
    }
  ];

  const verifiedDisasters = [
    {
      id: 1,
      type: 'Flood',
      location: 'Ratnapura District',
      severity: 'High',
      affected: 1200,
      lastUpdate: '1 hour ago',
      status: 'Active'
    },
    {
      id: 2,
      type: 'Landslide',
      location: 'Badulla District',
      severity: 'Medium',
      affected: 450,
      lastUpdate: '3 hours ago',
      status: 'Monitoring'
    }
  ];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-orange-100 text-orange-800';
      case 'Low': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleVerifyReport = (id) => {
    console.log('Verify report:', id);
  };

  const handleCreateAlert = (report) => {
    console.log('Create alert for:', report);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Map Update Center</h1>
            <p className="mt-2 text-gray-600">Monitor and manage disaster locations across Sri Lanka</p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              <RefreshCw className="h-5 w-5 mr-2" />
              Refresh
            </button>
            <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="h-5 w-5 mr-2" />
              Add Marker
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Controls */}
        <div className="space-y-6">
          {/* Layer Controls */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Map Layers</h3>
              <Layers className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-2">
              {mapLayers.map((layer) => (
                <button
                  key={layer.id}
                  onClick={() => setActiveLayer(layer.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                    activeLayer === layer.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      layer.id === 'flood' ? 'bg-blue-500' :
                      layer.id === 'landslide' ? 'bg-orange-500' :
                      layer.id === 'wind' ? 'bg-gray-500' :
                      layer.id === 'cyclone' ? 'bg-red-500' :
                      layer.id === 'drought' ? 'bg-yellow-500' :
                      'bg-gray-400'
                    }`}></div>
                    <span className={`text-sm font-medium ${layer.color}`}>
                      {layer.name}
                    </span>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {layer.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Map Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
              <Settings className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                <span className="ml-2 text-sm text-gray-700">Show district boundaries</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                <span className="ml-2 text-sm text-gray-700">Auto-refresh data</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="ml-2 text-sm text-gray-700">Show population density</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="ml-2 text-sm text-gray-700">Show weather overlay</span>
              </label>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active Disasters</span>
                <span className="text-sm font-semibold text-gray-900">15</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Pending Reports</span>
                <span className="text-sm font-semibold text-orange-600">3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">People Affected</span>
                <span className="text-sm font-semibold text-red-600">2,450</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active Reporters</span>
                <span className="text-sm font-semibold text-green-600">42</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Map Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Map Container */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Sri Lanka Disaster Map</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </button>
              </div>
            </div>
            
            {/* Map Placeholder */}
            <div className="h-96 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
              <div className="text-center">
                <Map className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-700 mb-2">Interactive Map</h4>
                <p className="text-gray-500">Google Maps integration will display here</p>
                <p className="text-sm text-gray-400 mt-2">
                  Showing {activeLayer === 'all' ? 'all disasters' : mapLayers.find(l => l.id === activeLayer)?.name.toLowerCase()}
                </p>
              </div>
            </div>
          </div>

          {/* Recent Reporter Updates */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Reporter Updates</h3>
              <p className="text-sm text-gray-600">Latest disaster reports from field reporters</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentReports.map((report) => (
                  <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className={`h-5 w-5 ${
                          report.severity === 'High' ? 'text-red-500' : 'text-orange-500'
                        }`} />
                        <div>
                          <h4 className="font-medium text-gray-900">{report.type}</h4>
                          <p className="text-sm text-gray-600">{report.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(report.severity)}`}>
                          {report.severity}
                        </span>
                        {report.verified ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <span>Reporter: {report.reporter} ({report.reporterPoints} points)</span>
                      <span>{report.time}</span>
                    </div>
                    
                    <div className="flex space-x-3">
                      <button className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View on Map
                      </button>
                      {!report.verified && (
                        <button
                          onClick={() => handleVerifyReport(report.id)}
                          className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          Verify
                        </button>
                      )}
                      <button
                        onClick={() => handleCreateAlert(report)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        Create Alert
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Verified Disasters Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Verified Disasters</h3>
              <p className="text-sm text-gray-600">Current active and monitored disasters</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {verifiedDisasters.map((disaster) => (
                  <div key={disaster.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">{disaster.type}</h4>
                        <p className="text-sm text-gray-600">{disaster.location}</p>
                        <p className="text-xs text-gray-500">{disaster.affected} people affected</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(disaster.severity)}`}>
                        {disaster.severity}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{disaster.lastUpdate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapUpdate;