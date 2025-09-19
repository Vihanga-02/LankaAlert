import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, MessageSquare, MapPin, Clock, AlertTriangle, Send, User, Home, Heart, Check } from 'lucide-react';
import { createEmergencyRequest } from "../services/emergencyService";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";

const EmergencyHelp = () => {
  const navigate = useNavigate();

  const [emergencyForm, setEmergencyForm] = useState({
    name: '',
    phone: '',
    location: '',
    emergencyType: '',
    description: '',
    urgency: 'high',
    needsHelp: [],
    foodItems: []
  });

  const [inventoryItems, setInventoryItems] = useState([]);

  // Fetch inventory items from Firebase
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const snapshot = await getDocs(collection(db, "inventoryItems"));
        const items = snapshot.docs.map(doc => doc.data().name);
        setInventoryItems(items);
      } catch (err) {
        console.error("Failed to fetch inventory:", err);
      }
    };
    fetchInventory();
  }, []);

  const emergencyTypes = [
    { id: 'flood', name: 'Flood', icon: '🌊' },
    { id: 'landslide', name: 'Landslide', icon: '🏔️' },
    { id: 'fire', name: 'Fire', icon: '🔥' },
    { id: 'accident', name: 'Accident', icon: '🚨' },
    { id: 'medical', name: 'Medical Emergency', icon: '🏥' },
    { id: 'other', name: 'Other', icon: '⚠️' }
  ];

  const helpNeeds = [
    { id: 'rescue', name: 'Rescue Operations', icon: <AlertTriangle className="h-5 w-5" /> },
    { id: 'medical', name: 'Medical Assistance', icon: <Heart className="h-5 w-5" /> },
    { id: 'shelter', name: 'Temporary Shelter', icon: <Home className="h-5 w-5" /> },
    { id: 'food', name: 'Food & Water', icon: <User className="h-5 w-5" /> },
    { id: 'transport', name: 'Transportation', icon: <MapPin className="h-5 w-5" /> }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEmergencyForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNeedToggle = (needId) => {
    setEmergencyForm(prev => ({
      ...prev,
      needsHelp: prev.needsHelp.includes(needId)
        ? prev.needsHelp.filter(id => id !== needId)
        : [...prev.needsHelp, needId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const docId = await createEmergencyRequest(emergencyForm);
      navigate("/confirmation", { state: { docId } });
      setEmergencyForm({
        name: "",
        phone: "",
        location: "",
        emergencyType: "",
        description: "",
        urgency: "high",
        needsHelp: [],
        foodItems: []
      });
    } catch (error) {
      alert("Failed to submit emergency request. Please try again.");
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Emergency Help</h1>
          <p className="text-lg text-gray-600">
            Request immediate assistance during emergencies and disasters
          </p>
        </div>

        {/* Emergency Contacts */}
        <div className="bg-red-600 text-white rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Phone className="h-6 w-6 mr-2" />
            Emergency Hotlines
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">119</div>
              <div className="text-sm text-red-100">Emergency Services</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">110</div>
              <div className="text-sm text-red-100">Police Emergency</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">011 2 136 136</div>
              <div className="text-sm text-red-100">Disaster Management</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Emergency Request Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Submit Emergency Request</h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={emergencyForm.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={emergencyForm.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+94 123 456 789"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Location *</label>
                  <input
                    type="text"
                    name="location"
                    value={emergencyForm.location}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your current location or address"
                  />
                </div>

                {/* Emergency Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Type *</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {emergencyTypes.map((type) => (
                      <label
                        key={type.id}
                        className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                          emergencyForm.emergencyType === type.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="emergencyType"
                          value={type.id}
                          checked={emergencyForm.emergencyType === type.id}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <span className="text-lg">{type.icon}</span>
                        <span className="text-sm font-medium">{type.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Urgency Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Urgency Level</label>
                  <select
                    name="urgency"
                    value={emergencyForm.urgency}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="critical">Critical - Life Threatening</option>
                    <option value="high">High - Immediate Help Needed</option>
                    <option value="medium">Medium - Help Needed Soon</option>
                    <option value="low">Low - Non-urgent</option>
                  </select>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getUrgencyColor(emergencyForm.urgency)}`}>
                      {emergencyForm.urgency.charAt(0).toUpperCase() + emergencyForm.urgency.slice(1)} Priority
                    </span>
                  </div>
                </div>

                {/* Help Needed */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type of Help Needed (Select all that apply)
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {helpNeeds.map((need) => (
                      <div key={need.id} className="flex flex-col">
                        <label
                          className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                            emergencyForm.needsHelp.includes(need.id)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={emergencyForm.needsHelp.includes(need.id)}
                            onChange={() => handleNeedToggle(need.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          {need.icon}
                          <span className="text-sm font-medium">{need.name}</span>
                        </label>

                        {/* Food & Water vertical list with quantity input */}
                        {need.id === 'food' && emergencyForm.needsHelp.includes('food') && (
                          <div className="mt-3 space-y-3 p-3 border border-gray-300 rounded-lg bg-gray-50">
                            {inventoryItems.length > 0 ? inventoryItems.map((item) => (
                              <div key={item} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-300">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={emergencyForm.foodItems.some(f => f.name === item)}
                                    onChange={() => {
                                      if (emergencyForm.foodItems.some(f => f.name === item)) {
                                        setEmergencyForm({
                                          ...emergencyForm,
                                          foodItems: emergencyForm.foodItems.filter(f => f.name !== item)
                                        });
                                      } else {
                                        setEmergencyForm({
                                          ...emergencyForm,
                                          foodItems: [...emergencyForm.foodItems, { name: item, quantity: 1 }]
                                        });
                                      }
                                    }}
                                    className="rounded border-gray-400 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-gray-800 font-medium">{item}</span>
                                </div>
                                {emergencyForm.foodItems.some(f => f.name === item) && (
                                  <input
                                    type="number"
                                    min={1}
                                    value={emergencyForm.foodItems.find(f => f.name === item)?.quantity || 1}
                                    onChange={(e) => {
                                      const qty = parseInt(e.target.value, 10) || 1;
                                      setEmergencyForm({
                                        ...emergencyForm,
                                        foodItems: emergencyForm.foodItems.map(f =>
                                          f.name === item ? { ...f, quantity: qty } : f
                                        )
                                      });
                                    }}
                                    className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                )}
                              </div>
                            )) : <p className="text-gray-500 text-sm">Loading inventory items...</p>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detailed Description *
                  </label>
                  <textarea
                    name="description"
                    value={emergencyForm.description}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the emergency situation in detail..."
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Send className="h-5 w-5" />
                  <span>Submit Emergency Request</span>
                </button>
              </form>
            </div>
          </div>

          {/* Quick Actions & Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Chat with Support</span>
                </button>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Expected Response Times
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Critical Emergencies:</span>
                  <span className="font-semibold text-red-600">5-10 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">High Priority:</span>
                  <span className="font-semibold text-orange-600">15-30 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Medium Priority:</span>
                  <span className="font-semibold text-yellow-600">1-2 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Low Priority:</span>
                  <span className="font-semibold text-blue-600">2-6 hours</span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-6">
              <h3 className="text-lg font-bold text-yellow-900 mb-4">Safety Tips</h3>
              <ul className="space-y-2 text-sm text-yellow-800">
                <li>• Stay calm and assess the situation</li>
                <li>• Move to a safe location if possible</li>
                <li>• Keep your phone charged</li>
                <li>• Have emergency supplies ready</li>
                <li>• Follow official evacuation orders</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyHelp;
