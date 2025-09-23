import React, { useState, useEffect } from 'react'; 
import { 
  Bell, 
  Send, 
  Users, 
  MessageSquare, 
  Filter, 
  Search, 
  Plus,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

// ✅ Import necessary components and context
import DisasterThresholds from '../../components/DisasterThresholds';
import { ThresholdsProvider } from '../../context/ThresholdsContext';
import WeatherAlert from '../../components/weatherAlert';  // Import the WeatherAlert component
import { useWeatherAlertContext } from '../../context/weatherAlertContext'; // Import context
import HighRiskAlerts from '../../components/HighRiskAlert';  // Import FloodAlertRisk Component

const WeatherAlertManagement = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { alerts, loading } = useWeatherAlertContext(); // Get alerts from context

   const highRiskFloodAlerts = alerts.filter(alert =>alert.dangerLevel === "High Risk");
  const highRiskFloodCount = highRiskFloodAlerts.length; // Get count of high-risk flood alerts

  const tabs = [
    { id: 'active', name: 'Active Alerts', count: alerts.length }, // Dynamic count based on context
    { id: 'scheduled', name: 'High Risk', count: highRiskFloodCount },  // Count will be dynamically updated
    { id: 'templates', name: 'Daily updates' },  // This is a static value (adjust as per your app's requirements)
    { id: 'history', name: 'Threshold Management' }
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-orange-100 text-orange-800';
      case 'Low': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'Sent': return 'bg-gray-100 text-gray-800';
      case 'Failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div>Loading...</div>; // Loading state while fetching alerts
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Weather Alert Management</h1>
            <p className="mt-2 text-gray-600">Create and manage disaster alerts and notifications</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              {tab.name}
              <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2.5 rounded-full text-xs">{tab.count}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Active Alerts Tab */}
      {activeTab === 'active' && (
        <div className="space-y-6">
          <WeatherAlert alerts={alerts} />  {/* Display Weather Alerts */}
        </div>
      )}

      {/* Scheduled Alerts Tab */}
      {activeTab === 'scheduled' && (
        <div className="space-y-6">
          {/* Insert FloodAlertRisk Component here */}
          <HighRiskAlerts />  {/* Display Flood Alert Risk Component */}
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Template data rendering can be added here */}
        </div>
      )}

      {/* Threshold Management Tab (was "History") */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* ✅ Mount the provider locally so the tab works without touching App.jsx */}
          <ThresholdsProvider>
            <DisasterThresholds />
          </ThresholdsProvider>
        </div>
      )}
    </div>
  );
};

export default WeatherAlertManagement;
