import React, { useState } from "react";
import { Bell, BellRing } from "lucide-react";
import WeatherUpdates from "../components/WeatherUpdates";
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

          {/* SMS Subscription Toggle */}
          <button
            onClick={() => setIsSubscribed(!isSubscribed)}
            className={`mt-4 sm:mt-0 flex items-center px-4 py-2 rounded-lg shadow-md transition ${
              isSubscribed
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-green-500 text-white hover:bg-green-600"
            }`}
          >
            {isSubscribed ? (
              <>
                <BellRing className="w-5 h-5 mr-2" /> Unsubscribe SMS
              </>
            ) : (
              <>
                <Bell className="w-5 h-5 mr-2" /> Subscribe SMS
              </>
            )}
          </button>
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
        {activeTab === "weather" ? <WeatherUpdates /> : <DisasterUpdates />}
      </div>
    </div>
  );
};

export default Alerts;
