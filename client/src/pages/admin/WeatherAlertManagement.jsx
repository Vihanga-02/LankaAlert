import React, { useState } from 'react';
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

const WeatherAlertManagement = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const activeAlerts = [
    {
      id: 1,
      title: 'Flood Warning - Colombo District',
      message: 'Heavy rainfall expected. Residents in low-lying areas advised to move to higher ground.',
      type: 'SMS & Push',
      recipients: 15420,
      sent: 15420,
      delivered: 15200,
      priority: 'High',
      status: 'Active',
      createdBy: 'Admin',
      createdAt: '2024-01-26 08:30 AM',
      expiresAt: '2024-01-27 08:30 AM'
    },
    {
      id: 2,
      title: 'Wind Alert - Galle District',
      message: 'Strong winds affecting coastal areas. Fishermen advised not to go to sea.',
      type: 'SMS',
      recipients: 5680,
      sent: 5680,
      delivered: 5598,
      priority: 'Medium',
      status: 'Active',
      createdBy: 'Admin',
      createdAt: '2024-01-26 06:15 AM',
      expiresAt: '2024-01-26 18:15 PM'
    }
  ];

  const scheduledAlerts = [
    {
      id: 3,
      title: 'Weather Update - Island Wide',
      message: 'Daily weather update for all districts.',
      type: 'Push',
      recipients: 25000,
      priority: 'Low',
      status: 'Scheduled',
      scheduledFor: '2024-01-27 06:00 AM',
      createdBy: 'System',
      createdAt: '2024-01-25 10:00 AM'
    }
  ];

  const templates = [
    {
      id: 1,
      name: 'Flood Warning',
      content: 'Heavy rainfall expected in {district}. Residents in low-lying areas advised to move to higher ground. For emergency assistance call 1390.',
      category: 'Flood',
      lastUsed: '2024-01-26'
    },
    {
      id: 2,
      name: 'Landslide Alert',
      content: 'Landslide risk in {district} due to continuous rainfall. Avoid mountainous areas. Stay alert.',
      category: 'Landslide',
      lastUsed: '2024-01-20'
    },
    {
      id: 3,
      name: 'Cyclone Warning',
      content: 'Cyclone alert for {district}. Stay indoors. Secure loose objects. Emergency hotline: 1390.',
      category: 'Cyclone',
      lastUsed: '2024-01-15'
    }
  ];

  const tabs = [
    { id: 'active', name: 'Active Alerts', count: activeAlerts.length },
    { id: 'scheduled', name: 'Scheduled', count: scheduledAlerts.length },
    { id: 'templates', name: 'Templates', count: templates.length },
    { id: 'history', name: 'History', count: 156 }
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Weather Alert Management</h1>
            <p className="mt-2 text-gray-600">Create and manage disaster alerts and notifications</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Alert
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Bell className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Alerts</p>
              <p className="text-2xl font-semibold text-gray-900">{activeAlerts.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Send className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Messages Sent</p>
              <p className="text-2xl font-semibold text-gray-900">21,100</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Recipients</p>
              <p className="text-2xl font-semibold text-gray-900">15,420</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Delivery Rate</p>
              <p className="text-2xl font-semibold text-gray-900">98.6%</p>
            </div>
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
            placeholder="Search alerts..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <Filter className="h-5 w-5 mr-2 text-gray-400" />
          Filter
        </button>
      </div>

      {/* Active Alerts Tab */}
      {activeTab === 'active' && (
        <div className="space-y-6">
          {activeAlerts.map((alert) => (
            <div key={alert.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{alert.title}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(alert.priority)}`}>
                      {alert.priority} Priority
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(alert.status)}`}>
                      {alert.status}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3">{alert.message}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Type: {alert.type}</span>
                    <span>•</span>
                    <span>Created by: {alert.createdBy}</span>
                    <span>•</span>
                    <span>Created: {alert.createdAt}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <Edit className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-red-600">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-gray-600">Recipients</div>
                  <div className="text-lg font-semibold text-blue-600">{alert.recipients.toLocaleString()}</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-gray-600">Sent</div>
                  <div className="text-lg font-semibold text-green-600">{alert.sent.toLocaleString()}</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-gray-600">Delivered</div>
                  <div className="text-lg font-semibold text-purple-600">{alert.delivered.toLocaleString()}</div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-gray-600">Delivery Rate</div>
                  <div className="text-lg font-semibold text-orange-600">
                    {((alert.delivered / alert.sent) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Expires: {alert.expiresAt}
                </div>
                <div className="flex space-x-3">
                  <button className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    View Details
                  </button>
                  <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    <Clock className="h-4 w-4 mr-2" />
                    Extend
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scheduled Alerts Tab */}
      {activeTab === 'scheduled' && (
        <div className="space-y-6">
          {scheduledAlerts.map((alert) => (
            <div key={alert.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{alert.title}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(alert.priority)}`}>
                      {alert.priority} Priority
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(alert.status)}`}>
                      {alert.status}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3">{alert.message}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Type: {alert.type}</span>
                    <span>•</span>
                    <span>Recipients: {alert.recipients.toLocaleString()}</span>
                    <span>•</span>
                    <span>Scheduled for: {alert.scheduledFor}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <Edit className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-red-600">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 mb-3">
                    {template.category}
                  </span>
                  <p className="text-gray-700 text-sm mb-3">{template.content}</p>
                  <p className="text-sm text-gray-500">Last used: {template.lastUsed}</p>
                </div>
                <div className="flex space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <Edit className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-red-600">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <button className="w-full inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Send className="h-4 w-4 mr-2" />
                Use Template
              </button>
            </div>
          ))}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Alert History</h3>
            <p className="text-gray-600">Historical alert data and analytics will be displayed here</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherAlertManagement;