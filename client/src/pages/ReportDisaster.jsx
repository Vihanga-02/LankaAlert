import React, { useState } from 'react';
import { MapPin, Camera, Send, AlertTriangle, Users, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ReportDisaster = () => {
  const { user } = useAuth();
  const [reportForm, setReportForm] = useState({
    disasterType: '',
    title: '',
    description: '',
    location: '',
    latitude: '',
    longitude: '',
    severity: 'medium',
    deaths: 0,
    injured: 0,
    peopleAffected: 0,
    images: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const disasterTypes = [
    { id: 'flood', name: 'Flood', icon: '🌊' },
    { id: 'landslide', name: 'Landslide', icon: '🏔️' },
    { id: 'storm', name: 'Storm/Cyclone', icon: '🌪️' },
    { id: 'earthquake', name: 'Earthquake', icon: '🌍' },
    { id: 'fire', name: 'Wildfire', icon: '🔥' },
    { id: 'drought', name: 'Drought', icon: '🌵' },
    { id: 'other', name: 'Other', icon: '⚠️' }
  ];

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setReportForm(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setReportForm(prev => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6)
          }));
          alert('Location captured successfully!');
        },
        (error) => {
          alert('Error getting location. Please enter manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    // In a real app, you would upload these to Firebase Storage
    setReportForm(prev => ({
      ...prev,
      images: [...prev.images, ...files.map(file => file.name)]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      console.log('Disaster report submitted:', reportForm);
      alert('Disaster report submitted successfully! You earned 50 points.');
      
      // Reset form
      setReportForm({
        disasterType: '',
        title: '',
        description: '',
        location: '',
        latitude: '',
        longitude: '',
        severity: 'medium',
        deaths: 0,
        injured: 0,
        peopleAffected: 0,
        images: []
      });
      setIsSubmitting(false);
    }, 2000);
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

  if (!user?.isReporter) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-md p-8">
          <AlertTriangle className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h2>
          <p className="text-gray-600 mb-6">
            This page is only available to verified reporters. Apply as a reporter during registration to access disaster reporting features.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Report Disaster</h1>
          <p className="text-lg text-gray-600">
            Submit official disaster reports to help your community stay safe
          </p>
        </div>

        {/* Reporter Badge */}
        <div className="bg-green-100 border border-green-300 rounded-lg p-4 mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-green-900">{user.name}</span>
                <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                  Verified Reporter
                </span>
              </div>
              <p className="text-sm text-green-700">Current Points: {user.points || 0}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Report Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Disaster Type */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Disaster Information</h3>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Disaster Type *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {disasterTypes.map((type) => (
                      <label
                        key={type.id}
                        className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                          reportForm.disasterType === type.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="disasterType"
                          value={type.id}
                          checked={reportForm.disasterType === type.id}
                          onChange={handleInputChange}
                          className="sr-only"
                          required
                        />
                        <span className="text-lg">{type.icon}</span>
                        <span className="text-sm font-medium">{type.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Report Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={reportForm.title}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Heavy flooding in Colombo suburbs"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Severity Level
                    </label>
                    <select
                      name="severity"
                      value={reportForm.severity}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(reportForm.severity)}`}>
                        {reportForm.severity.charAt(0).toUpperCase() + reportForm.severity.slice(1)} Priority
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detailed Description *
                  </label>
                  <textarea
                    name="description"
                    value={reportForm.description}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Provide detailed information about the disaster, current situation, and immediate impacts..."
                  />
                </div>
              </div>

              {/* Location Information */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Location Information
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location Description *
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={reportForm.location}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Colombo 07, near Manning Market"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Latitude
                      </label>
                      <input
                        type="text"
                        name="latitude"
                        value={reportForm.latitude}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="6.9271"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Longitude
                      </label>
                      <input
                        type="text"
                        name="longitude"
                        value={reportForm.longitude}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="79.8612"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleLocationClick}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <MapPin className="h-4 w-4" />
                    <span>Use Current Location</span>
                  </button>
                </div>
              </div>

              {/* Casualties & Impact */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Impact Assessment
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deaths
                    </label>
                    <input
                      type="number"
                      name="deaths"
                      value={reportForm.deaths}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Injured
                    </label>
                    <input
                      type="number"
                      name="injured"
                      value={reportForm.injured}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      People Affected
                    </label>
                    <input
                      type="number"
                      name="peopleAffected"
                      value={reportForm.peopleAffected}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Images Upload */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Camera className="h-5 w-5 mr-2" />
                  Evidence Photos
                </h3>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="text-sm text-gray-600 mb-4">
                    Upload photos of the disaster scene (optional)
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer inline-block"
                  >
                    Choose Images
                  </label>
                </div>
                
                {reportForm.images.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Images:</h4>
                    <div className="space-y-1">
                      {reportForm.images.map((image, index) => (
                        <div key={index} className="text-sm text-gray-600">
                          📷 {image}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Submit Button */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <span>Submit Report</span>
                    </>
                  )}
                </button>
              </div>

              {/* Reporting Guidelines */}
              <div className="bg-yellow-50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-yellow-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Reporting Guidelines
                </h3>
                <ul className="space-y-2 text-sm text-yellow-800">
                  <li>• Provide accurate and verified information</li>
                  <li>• Include specific location details</li>
                  <li>• Report only confirmed casualties</li>
                  <li>• Upload clear, relevant photos</li>
                  <li>• Submit reports as soon as possible</li>
                  <li>• Update reports if situation changes</li>
                </ul>
              </div>

              {/* Points System */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-4">Points System</h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex justify-between">
                    <span>Verified Report:</span>
                    <span className="font-semibold">50 points</span>
                  </div>
                  <div className="flex justify-between">
                    <span>With Photos:</span>
                    <span className="font-semibold">+20 points</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Critical Priority:</span>
                    <span className="font-semibold">+30 points</span>
                  </div>
                  <div className="flex justify-between">
                    <span>First Report:</span>
                    <span className="font-semibold">+40 points</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportDisaster;