import React, { useState } from "react";
import { Filter, Bell, BellRing } from "lucide-react";
import WeatherUpdates from "../components/WeatherUpdates";
import DisasterUpdates from "../components/DisasterUpdates";

const Alerts = () => {
  const [filters, setFilters] = useState({
    date: "",
    place: "",
    warningLevel: "",
    disasterType: "",
  });
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [activeTab, setActiveTab] = useState("weather");

  const weatherAlerts = [
    {
      id: 1,
      type: "Heavy Rainfall",
      severity: "High",
      location: "Western Province",
      district: "Colombo",
      description:
        "Heavy rainfall with thunderstorms expected. Flooding possible in low-lying areas.",
      date: "2025-01-15",
      time: "14:30",
      status: "Active",
      validUntil: "2025-01-16 06:00",
    },
    {
      id: 2,
      type: "Strong Winds",
      severity: "Medium",
      location: "Southern Province",
      district: "Galle",
      description: "Strong winds up to 60 km/h expected. Secure loose objects.",
      date: "2025-01-15",
      time: "12:15",
      status: "Active",
      validUntil: "2025-01-15 20:00",
    },
  ];

  const disasterAlerts = [
    {
      id: 3,
      type: "Landslide Warning",
      severity: "Critical",
      location: "Central Province",
      district: "Kandy",
      description: "High risk of landslides in hilly areas. Evacuation advised.",
      date: "2025-01-15",
      time: "10:45",
      status: "Critical",
      validUntil: "2025-01-17 12:00",
    },
    {
      id: 4,
      type: "Flood Alert",
      severity: "Medium",
      location: "North Western Province",
      district: "Kurunegala",
      description: "River levels rising due to continuous rainfall.",
      date: "2025-01-14",
      time: "18:20",
      status: "Monitoring",
      validUntil: "2025-01-16 08:00",
    },
  ];

  const filterAlerts = (alerts) => {
    return alerts.filter((alert) => {
      return (
        (!filters.place ||
          alert.district.toLowerCase().includes(filters.place.toLowerCase())) &&
        (!filters.warningLevel ||
          alert.severity.toLowerCase() === filters.warningLevel.toLowerCase()) &&
        (!filters.disasterType ||
          alert.type.toLowerCase().includes(filters.disasterType.toLowerCase())) &&
        (!filters.date || alert.date === filters.date)
      );
    });
  };

  const filteredWeatherAlerts = filterAlerts(weatherAlerts);
  const filteredDisasterAlerts = filterAlerts(disasterAlerts);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Weather & Disaster Alerts
          </h1>
          <p className="text-lg text-gray-600">
            Stay informed with real-time weather and disaster alerts across Sri Lanka
          </p>
        </div>

        {/* SMS Subscription */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h2 className="text-xl font-bold mb-2 flex items-center">
                <Bell className="h-6 w-6 mr-2" /> Smart SMS Alerts
              </h2>
              <p className="text-blue-100">
                Get instant SMS notifications for weather alerts in your area. Never
                miss critical updates.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setIsSubscribed(!isSubscribed)}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  isSubscribed
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : "bg-white text-blue-600 hover:bg-blue-50"
                }`}
              >
                {isSubscribed ? (
                  <>
                    <BellRing className="h-5 w-5 inline mr-2" />
                    Subscribed
                  </>
                ) : (
                  "Subscribe Now"
                )}
              </button>
              <button className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold transition-colors">
                Customize Alerts
              </button>
            </div>
          </div>
        </div>

        {/* Tabs Switch */}
        <div className="mb-6">
          <nav className="flex space-x-4 border-b border-gray-200">
            <button
              className={`px-4 py-2 font-semibold ${
                activeTab === "weather"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              onClick={() => setActiveTab("weather")}
            >
              Weather Updates
            </button>
            <button
              className={`px-4 py-2 font-semibold ${
                activeTab === "disaster"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              onClick={() => setActiveTab("disaster")}
            >
              Disaster Updates
            </button>
          </nav>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filter Alerts</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Place
              </label>
              <input
                type="text"
                placeholder="Enter city or district"
                value={filters.place}
                onChange={(e) => setFilters({ ...filters, place: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Warning Level
              </label>
              <select
                value={filters.warningLevel}
                onChange={(e) => setFilters({ ...filters, warningLevel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Levels</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Disaster Type
              </label>
              <select
                value={filters.disasterType}
                onChange={(e) => setFilters({ ...filters, disasterType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="rainfall">Heavy Rainfall</option>
                <option value="winds">Strong Winds</option>
                <option value="landslide">Landslide</option>
                <option value="flood">Flood</option>
                <option value="cyclone">Cyclone</option>
                <option value="storm">Storm</option>
                <option value="roadblock">Road Block</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {activeTab === "weather" ? (
          <WeatherUpdates alerts={filteredWeatherAlerts} />
        ) : (
          <DisasterUpdates alerts={filteredDisasterAlerts} />
        )}
      </div>
    </div>
  );
};

export default Alerts;
