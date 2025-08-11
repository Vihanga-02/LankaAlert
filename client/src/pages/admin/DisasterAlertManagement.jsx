import React, { useState } from 'react';
import { 
  Cloud, 
  CloudRain, 
  Wind, 
  Mountain, 
  Thermometer, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  Filter,
  Search,
  AlertTriangle
} from 'lucide-react';

const DisasterAlertManagement = () => {
  const [activeTab, setActiveTab] = useState('current');
  const [searchTerm, setSearchTerm] = useState('');

  const disasters = [
    {
      id: 1,
      type: 'Flood',
      location: 'Colombo District',
      severity: 'High',
      description: 'Heavy rainfall causing flash floods in urban areas',
      affectedAreas: ['Colombo', 'Dehiwala', 'Moratuwa'],
      casualties: { deaths: 0, injured: 3, missing: 0 },
      evacuated: 150,
      shelters: 5,
      timestamp: '2024-01-26 08:30 AM',
      source: 'Weather API',
      status: 'Active',
      icon: CloudRain,
      color: 'text-blue-600'
    },
    {
      id: 2,
      type: 'Landslide',
      location: 'Kandy District',
      severity: 'Medium',
      description: 'Slope failure due to continuous rainfall',
      affectedAreas: ['Kandy', 'Peradeniya'],
      casualties: { deaths: 1, injured: 5, missing: 2 },
      evacuated: 80,
      shelters: 3,
      timestamp: '2024-01-26 06:15 AM',
      source: 'Reporter',
      status: 'Active',
      icon: Mountain,
      color: 'text-orange-600'
    },
    {
      id: 3,
      type: 'Strong Wind',
      location: 'Galle District',
      severity: 'Medium',
      description: 'Strong winds affecting coastal areas',
      affectedAreas: ['Galle', 'Hikkaduwa', 'Unawatuna'],
      casualties: { deaths: 0, injured: 1, missing: 0 },
      evacuated: 45,
      shelters: 2,
      timestamp: '2024-01-26 04:45 AM',
      source: 'Weather API',
      status: 'Monitoring',
      icon: Wind,
      color: 'text-gray-600'
    }
  ];

  const weatherData = [
    {
      id: 1,
      parameter: 'Rainfall',
      location: 'Colombo',
      value: '125mm',
      threshold: '100mm',
      status: 'Critical',
      lastUpdate: '5 mins ago',
      icon: CloudRain
    },
    {
      id: 2,
      parameter: 'Wind Speed',
      location: 'Galle',
      value: '65 km/h',
      threshold: '60 km/h',
      status: 'Warning',
      lastUpdate: '10 mins ago',
      icon: Wind
    },
    {
      id: 3,
      parameter: 'Temperature',
      location: 'Kandy',
      value: '28°C',
      threshold: '35°C',
      status: 'Normal',
      lastUpdate: '15 mins ago',
      icon: Thermometer
    }
  ];

  const tabs = [
    { id: 'current', name: 'Current Disasters', count: disasters.length },
    { id: 'weather', name: 'Weather Data', count: weatherData.length },
    { id: 'historical', name: 'Historical Data', count: 45 }
  ];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-orange-100 text-orange-800';
      case 'Low': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-red-100 text-red-800';
      case 'Monitoring': return 'bg-yellow-100 text-yellow-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'Warning': return 'bg-orange-100 text-orange-800';
      case 'Normal': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Disaster Alert Management</h1>
            <p className="mt-2 text-gray-600">Monitor and manage disaster data from various sources</p>
          </div>
          <button className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="h-5 w-5 mr-2" />
            Add Manual Entry
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
              <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2.5 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search disasters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <Filter className="h-5 w-5 mr-2 text-gray-400" />
          Filter
        </button>
      </div>

      {/* Current Disasters Tab */}
      {activeTab === 'current' && (
        <div className="space-y-6">
          {disasters.map((disaster) => (
            <div key={disaster.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <disaster.icon className={`h-8 w-8 ${disaster.color}`} />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{disaster.type}</h3>
                    <p className="text-gray-600">{disaster.location}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(disaster.severity)}`}>
                    {disaster.severity}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(disaster.status)}`}>
                    {disaster.status}
                  </span>
                </div>
              </div>

              <p className="text-gray-700 mb-4">{disaster.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-gray-600">Casualties</div>
                  <div className="text-lg font-semibold text-red-600">
                    {disaster.casualties.deaths + disaster.casualties.injured + disaster.casualties.missing}
                  </div>
                  <div className="text-xs text-gray-500">
                    {disaster.casualties.deaths}D • {disaster.casualties.injured}I • {disaster.casualties.missing}M
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-gray-600">Evacuated</div>
                  <div className="text-lg font-semibold text-blue-600">{disaster.evacuated}</div>
                  <div className="text-xs text-gray-500">People</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-gray-600">Shelters</div>
                  <div className="text-lg font-semibold text-green-600">{disaster.shelters}</div>
                  <div className="text-xs text-gray-500">Active</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-gray-600">Source</div>
                  <div className="text-lg font-semibold text-gray-600">{disaster.source}</div>
                  <div className="text-xs text-gray-500">{disaster.timestamp}</div>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-sm font-medium text-gray-600 mb-2">Affected Areas:</div>
                <div className="flex flex-wrap gap-2">
                  {disaster.affectedAreas.map((area, index) => (
                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                <button className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </button>
                <button className="inline-flex items-center px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Create Alert
                </button>
                <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Weather Data Tab */}
      {activeTab === 'weather' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {weatherData.map((data) => (
            <div key={data.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <data.icon className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{data.parameter}</h3>
                    <p className="text-gray-600">{data.location}</p>
                  </div>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(data.status)}`}>
                  {data.status}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current Value:</span>
                  <span className="text-lg font-semibold text-gray-900">{data.value}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Threshold:</span>
                  <span className="text-sm text-gray-700">{data.threshold}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Last Update:</span>
                  <span className="text-sm text-gray-500">{data.lastUpdate}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <button className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  View Historical Data
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Historical Data Tab */}
      {activeTab === 'historical' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center py-12">
            <Cloud className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Historical Data</h3>
            <p className="text-gray-600">Historical disaster data and analytics will be displayed here</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisasterAlertManagement;