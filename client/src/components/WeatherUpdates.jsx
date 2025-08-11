import React from "react";
import { AlertTriangle, Calendar, MapPin } from "lucide-react";

const WeatherUpdates = ({ alerts }) => {
  const getSeverityColor = (severity) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "text-red-700 bg-red-100 border-red-300";
      case "high":
        return "text-orange-700 bg-orange-100 border-orange-300";
      case "medium":
        return "text-yellow-700 bg-yellow-100 border-yellow-300";
      default:
        return "text-blue-700 bg-blue-100 border-blue-300";
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "critical":
        return "text-red-700 bg-red-50";
      case "active":
        return "text-green-700 bg-green-50";
      case "monitoring":
        return "text-blue-700 bg-blue-50";
      default:
        return "text-gray-700 bg-gray-50";
    }
  };

  if (!alerts || alerts.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No Alerts Found</h3>
        <p className="text-gray-500">Try adjusting your filters to see more results.</p>
      </div>
    );
  }

  return (
    <>
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 mb-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
            <div className="flex items-start space-x-4 mb-4 lg:mb-0">
              <div className="p-3 bg-blue-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{alert.type}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {alert.district}, {alert.location}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {alert.date} at {alert.time}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(
                  alert.severity
                )}`}
              >
                {alert.severity}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  alert.status
                )}`}
              >
                {alert.status}
              </span>
            </div>
          </div>

          <p className="text-gray-700 mb-4">{alert.description}</p>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-500">
              Valid until: {alert.validUntil}
            </span>
            <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
              View Details →
            </button>
          </div>
        </div>
      ))}
    </>
  );
};

export default WeatherUpdates;
