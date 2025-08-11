import React from 'react';
import { 
  Users, 
  AlertTriangle, 
  Bell, 
  HelpCircle, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Package
} from 'lucide-react';
import { useEffect } from 'react';
import TestFirestore from '../../TestFirestore';

const AdminDashboard = () => {
  const stats = [
    {
      name: 'Total Users',
      value: '2,847',
      change: '+12%',
      changeType: 'increase',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      name: 'Active Alerts',
      value: '23',
      change: '+5%',
      changeType: 'increase',
      icon: Bell,
      color: 'bg-red-500'
    },
    {
      name: 'Emergency Requests',
      value: '7',
      change: '-2%',
      changeType: 'decrease',
      icon: HelpCircle,
      color: 'bg-orange-500'
    },
    {
      name: 'Reporters',
      value: '142',
      change: '+8%',
      changeType: 'increase',
      icon: Activity,
      color: 'bg-green-500'
    }
  ];

  const recentAlerts = [
    {
      id: 1,
      type: 'Flood Warning',
      location: 'Colombo District',
      severity: 'High',
      time: '2 hours ago',
      status: 'Active'
    },
    {
      id: 2,
      type: 'Wind Alert',
      location: 'Galle District',
      severity: 'Medium',
      time: '4 hours ago',
      status: 'Active'
    },
    {
      id: 3,
      type: 'Landslide Warning',
      location: 'Kandy District',
      severity: 'High',
      time: '6 hours ago',
      status: 'Resolved'
    }
  ];

  const emergencyRequests = [
    {
      id: 1,
      user: 'Kamal Perera',
      location: 'Ratnapura',
      need: 'Medical Supplies',
      priority: 'High',
      time: '1 hour ago'
    },
    {
      id: 2,
      user: 'Nimal Silva',
      location: 'Gampaha',
      need: 'Food & Water',
      priority: 'Medium',
      time: '3 hours ago'
    },
    {
      id: 3,
      user: 'Saman Fernando',
      location: 'Matara',
      need: 'Shelter',
      priority: 'High',
      time: '5 hours ago'
    }
  ];


  return (
    
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="mt-2 text-gray-600">Welcome to Lanka Alert Admin Dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <div className="flex items-center">
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  <div className={`ml-2 flex items-center text-sm ${
                    stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.changeType === 'increase' ? (
                      <TrendingUp className="h-4 w-4 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mr-1" />
                    )}
                    {stat.change}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Alerts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Alerts</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className={`h-5 w-5 ${
                      alert.severity === 'High' ? 'text-red-500' : 'text-orange-500'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900">{alert.type}</p>
                      <p className="text-sm text-gray-600">{alert.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      alert.status === 'Active' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {alert.status}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Emergency Requests */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Pending Emergency Requests</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {emergencyRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <HelpCircle className={`h-5 w-5 ${
                      request.priority === 'High' ? 'text-red-500' : 'text-orange-500'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900">{request.user}</p>
                      <p className="text-sm text-gray-600">{request.location} • {request.need}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      request.priority === 'High' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {request.priority}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">{request.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <button className="flex items-center justify-center p-4 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-100 transition-colors">
            <div className="text-center">
              <Bell className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-blue-600">Send Alert</span>
            </div>
          </button>
          <button className="flex items-center justify-center p-4 bg-green-50 border-2 border-dashed border-green-300 rounded-lg hover:bg-green-100 transition-colors">
            <div className="text-center">
              <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-green-600">Manage Users</span>
            </div>
          </button>
          <button className="flex items-center justify-center p-4 bg-orange-50 border-2 border-dashed border-orange-300 rounded-lg hover:bg-orange-100 transition-colors">
            <div className="text-center">
              <Package className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-orange-600">Update Inventory</span>
            </div>
          </button>
          <button className="flex items-center justify-center p-4 bg-purple-50 border-2 border-dashed border-purple-300 rounded-lg hover:bg-purple-100 transition-colors">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-purple-600">Add Disaster</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;