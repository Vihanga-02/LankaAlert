import React, { useState } from "react";
import { useWeatherAlertContext } from "../context/weatherAlertContext"; // Import context
import { Search, MapPin, Calendar } from "lucide-react"; // Import icons for search, location, and date

const WeatherAlert = () => {
  const { alerts } = useWeatherAlertContext(); // Get alerts from context
  const [searchTerm, setSearchTerm] = useState("");

  // Handle Search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  // Filter the alerts based on city name (case-insensitive)
  const filteredAlerts = alerts.filter((alert) =>
    alert.cityName.toLowerCase().includes(searchTerm)
  );

  // Function to get the danger level styling and text
  const getDangerLevelStyle = (level) => {
    switch (level) {
      case "High Risk":
        return {
          bgColor: "bg-red-100 text-red-800", // Red for High Risk
          text: "High Risk",
          borderColor: "border-red-800", // Red border for High Risk
        };
      case "Medium Risk":
        return {
          bgColor: "bg-orange-100 text-orange-800", // Orange for Medium Risk
          text: "Medium Risk",
          borderColor: "border-orange-800", // Orange border for Medium Risk
        };
      case "Low Risk":
        return {
          bgColor: "bg-yellow-100 text-yellow-800", // Yellow for Low Risk
          text: "Low Risk",
          borderColor: "border-yellow-800", // Yellow border for Low Risk
        };
      default:
        return { bgColor: "bg-gray-100 text-gray-800", text: "Unknown", borderColor: "border-gray-800" }; // Default style
    }
  };

  // Function to format the Firestore createdAt timestamp
  const formatDate = (timestamp) => {
    // If `timestamp` is a Firestore timestamp, it has a `toDate()` method to convert to JavaScript Date object
    if (timestamp && timestamp.toDate) {
      const date = timestamp.toDate();
      return date.toLocaleString(); // Format to a readable string
    }
    return timestamp; // Return the original timestamp if it's not a Firestore timestamp
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm space-y-6 border border-gray-200">
      {/* Title */}
      <h1 className="text-3xl font-semibold text-gray-800 mb-4">Weather Alerts</h1>

      {/* Search Bar */}
      <div className="flex items-center space-x-2 mb-6">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search Alerts"
            value={searchTerm}
            onChange={handleSearch}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div className="absolute right-3 top-3">
            <Search className="text-gray-500" />
          </div>
        </div>
      </div>

      {/* Display Alerts */}
      {filteredAlerts.length === 0 && <p className="text-gray-500 text-center">No alerts found for this city.</p>}
      {filteredAlerts.map((alert, index) => (
        <div
          key={index}
          className={`p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 bg-white border ${getDangerLevelStyle(alert.dangerLevel).borderColor}`}
        >
          <div className="flex flex-col space-y-4 relative">
            {/* Alert Header */}
            <div className="flex items-center space-x-4">
              <MapPin className="h-5 w-5 text-gray-500" />
              <h3 className="text-xl font-semibold text-gray-700">{`${alert.type} Alert - ${alert.cityName}`}</h3>
            </div>

            {/* Location and Date Info */}
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{alert.cityName}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(alert.createdAt)}</span> {/* Format the createdAt timestamp */}
              </div>
            </div>

            {/* Detailed Message */}
            <p className="text-gray-600 text-lg">{alert.message}</p>

            {/* Danger Level (Top-right corner) */}
            {alert.dangerLevel && (
              <div
                className={`absolute top-2 right-4 px-4 py-1 text-sm font-medium ${getDangerLevelStyle(
                  alert.dangerLevel
                ).bgColor} rounded-full`}
              >
                {getDangerLevelStyle(alert.dangerLevel).text}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WeatherAlert;
