import React, { useState } from 'react';
import { 
  HelpCircle, 
  User, 
  MapPin, 
  Clock, 
  Package, 
  Users, 
  CheckCircle, 
  XCircle,
  Search,
  Filter,
  AlertTriangle,
  Phone
} from 'lucide-react';

const EmergencyRequests = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');

  const pendingRequests = [
    {
      id: 1,
      user: {
        name: 'Kamal Perera',
        phone: '+94123456789',
        location: 'Ratnapura, Sabaragamuwa'
      },
      requestType: 'Medical Supplies',
      urgency: 'High',
      description: 'Diabetic patient needs insulin urgently. Local pharmacy closed due to flooding.',
      items: ['Insulin', 'Syringes', 'Blood glucose test strips'],
      peopleAffected: 1,
      submittedAt: '2024-01-26 08:30 AM',
      disaster: 'Flood',
      coordinates: { lat: 6.6829, lng: 80.4098 }
    },
    {
      id: 2,
      user: {
        name: 'Nimal Silva',
        phone: '+94123456790',
        location: 'Gampaha, Western'
      },
      requestType: 'Food & Water',
      urgency: 'Medium',
      description: 'Family of 5 trapped in house due to flooding. Need food and clean water.',
      items: ['Rice packets', 'Water bottles', 'Canned food'],
      peopleAffected: 5,
      submittedAt: '2024-01-26 07:15 AM',
      disaster: 'Flood',
      coordinates: { lat: 7.0873, lng: 80.0514 }
    },
    {
      id: 3,
      user: {
        name: 'Saman Fernando',
        phone: '+94123456791',
        location: 'Matara, Southern'
      },
      requestType: 'Shelter',
      urgency: 'High',
      description: 'House damaged by strong winds. Family needs temporary shelter.',
      items: ['Temporary shelter', 'Blankets', 'Mattresses'],
      peopleAffected: 4,
      submittedAt: '2024-01-26 06:45 AM',
      disaster: 'Strong Wind',
      coordinates: { lat: 5.9549, lng: 80.5550 }
    }
  ];

  const processingRequests = [
    {
      id: 4,
      user: {
        name: 'Priya Jayawardena',
        phone: '+94123456792',
        location: 'Kandy, Central'
      },
      requestType: 'Medical Supplies',
      urgency: 'Medium',
      description: 'Elder person needs medications for blood pressure.',
      items: ['Blood pressure medication', 'Medical consultation'],
      peopleAffected: 1,
      submittedAt: '2024-01-25 15:30 PM',
      assignedTo: 'Sunil Fernando (Kandy Reporter)',
      assignedAt: '2024-01-25 16:00 PM',
      estimatedDelivery: '2024-01-26 10:00 AM',
      disaster: 'Landslide'
    }
  ];

  const completedRequests = [
    {
      id: 5,
      user: {
        name: 'Ruwan Perera',
        phone: '+94123456793',
        location: 'Colombo, Western'
      },
      requestType: 'Food & Water',
      urgency: 'Medium',
      description: 'Family needed emergency food supplies.',
      items: ['Rice packets', 'Water bottles', 'Milk powder'],
      peopleAffected: 3,
      submittedAt: '2024-01-25 12:00 PM',
      assignedTo: 'Kamal Perera (Colombo Reporter)',
      completedAt: '2024-01-25 18:30 PM',
      disaster: 'Flood'
    }
  ];

  const availableReporters = [
    {
      id: 1,
      name: 'Sunil Fernando',
      district: 'Kandy',
      points: 245,
      activeAssignments: 2,
      distance: '2.5 km'
    },
    {
      id: 2,
      name: 'Kamal Perera',
      district: 'Colombo',
      points: 180,
      activeAssignments: 1,
      distance: '1.8 km'
    },
    {
      id: 3,
      name: 'Priya Silva',
      district: 'Gampaha',
      points: 156,
      activeAssignments: 0,
      distance: '5.2 km'
    }
  ];

  const tabs = [
    { id: 'pending', name: 'Pending', count: pendingRequests.length },
    { id: 'processing', name: 'Processing', count: processingRequests.length },
    { id: 'completed', name: 'Completed', count: completedRequests.length }
  ];

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-orange-100 text-orange-800';
      case 'Low': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAssignRequest = (requestId, reporterId) => {
    console.log('Assign request', requestId, 'to reporter', reporterId);
  };

  const handleCompleteRequest = (requestId) => {
    console.log('Complete request', requestId);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Emergency Requests</h1>
        <p className="mt-2 text-gray-600">Manage and fulfill emergency requests from affected citizens</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <HelpCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Requests</p>
              <p className="text-2xl font-semibold text-gray-900">{pendingRequests.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Processing</p>
              <p className="text-2xl font-semibold text-gray-900">{processingRequests.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed Today</p>
              <p className="text-2xl font-semibold text-gray-900">{completedRequests.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">People Helped</p>
              <p className="text-2xl font-semibold text-gray-900">
                {pendingRequests.reduce((sum, req) => sum + req.peopleAffected, 0) + 
                 processingRequests.reduce((sum, req) => sum + req.peopleAffected, 0) + 
                 completedRequests.reduce((sum, req) => sum + req.peopleAffected, 0)}
              </p>
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
            placeholder="Search requests..."
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

      {/* Content based on active tab */}
      <div className="space-y-6">
        {/* Pending Requests */}
        {activeTab === 'pending' && (
          <>
            {pendingRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className={`h-6 w-6 ${
                      request.urgency === 'High' ? 'text-red-500' : 'text-orange-500'
                    }`} />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{request.requestType}</h3>
                      <p className="text-gray-600">{request.user.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUrgencyColor(request.urgency)}`}>
                      {request.urgency} Priority
                    </span>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {request.disaster}
                    </span>
                  </div>
                </div>

                <p className="text-gray-700 mb-4">{request.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span>{request.user.name}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{request.user.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{request.user.location}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Requested Items:</p>
                  <div className="flex flex-wrap gap-2">
                    {request.items.map((item, index) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>People affected: {request.peopleAffected}</span>
                    <span>•</span>
                    <span>Submitted: {request.submittedAt}</span>
                  </div>
                  <div className="flex space-x-3">
                    <button className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <Package className="h-4 w-4 mr-2" />
                      Assign to Reporter
                    </button>
                    <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      <MapPin className="h-4 w-4 mr-2" />
                      View Location
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Processing Requests */}
        {activeTab === 'processing' && (
          <>
            {processingRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-6 w-6 text-orange-500" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{request.requestType}</h3>
                      <p className="text-gray-600">{request.user.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUrgencyColor(request.urgency)}`}>
                      {request.urgency} Priority
                    </span>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                      Processing
                    </span>
                  </div>
                </div>

                <p className="text-gray-700 mb-4">{request.description}</p>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="h-5 w-5 text-orange-600" />
                    <span className="font-medium text-orange-800">Assigned to: {request.assignedTo}</span>
                  </div>
                  <div className="text-sm text-orange-700">
                    <p>Assigned: {request.assignedAt}</p>
                    <p>Estimated delivery: {request.estimatedDelivery}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    People affected: {request.peopleAffected}
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleCompleteRequest(request.id)}
                      className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Complete
                    </button>
                    <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      <Phone className="h-4 w-4 mr-2" />
                      Contact Reporter
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Completed Requests */}
        {activeTab === 'completed' && (
          <>
            {completedRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{request.requestType}</h3>
                      <p className="text-gray-600">{request.user.name}</p>
                    </div>
                  </div>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Completed
                  </span>
                </div>

                <p className="text-gray-700 mb-4">{request.description}</p>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Completed by: {request.assignedTo}</span>
                  </div>
                  <div className="text-sm text-green-700">
                    <p>Completed: {request.completedAt}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    People helped: {request.peopleAffected}
                  </div>
                  <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Available Reporters Sidebar - shown when assigning */}
      <div className="fixed inset-0 z-50 hidden" id="assign-modal">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75"></div>
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Reporters</h3>
            <div className="space-y-4">
              {availableReporters.map((reporter) => (
                <div key={reporter.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{reporter.name}</h4>
                    <span className="text-sm text-gray-500">{reporter.distance}</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    <p>{reporter.district} District</p>
                    <p>{reporter.points} points • {reporter.activeAssignments} active assignments</p>
                  </div>
                  <button
                    onClick={() => handleAssignRequest(1, reporter.id)}
                    className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Assign
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyRequests;