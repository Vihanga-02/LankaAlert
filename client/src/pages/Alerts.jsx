import React, { useState } from "react";
import { Bell, BellRing } from "lucide-react";
import WeatherUpdates from "../components/WeatherUpdates";
import WeatherAlert from "../components/weatherAlert";
import DisasterUpdates from "../components/DisasterUpdates";

const Alerts = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [activeTab, setActiveTab] = useState("weather");

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Disaster & Weather Alerts
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex border-b mb-6">
          <button
            onClick={() => setActiveTab("weather")}
            className={`px-4 py-2 font-medium ${
              activeTab === "weather"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-blue-500"
            }`}
          >
            Weather Updates
          </button>
          <button
            onClick={() => setActiveTab("disaster")}
            className={`ml-4 px-4 py-2 font-medium ${
              activeTab === "disaster"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-blue-500"
            }`}
          >
            Disaster Updates
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "weather" ? <WeatherAlert /> : <DisasterUpdates />}
      </div>
    </div>
  );
};

export default Alerts;
