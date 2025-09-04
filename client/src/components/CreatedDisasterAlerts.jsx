import React, { useState } from "react";
import { Edit, Trash2, Filter, MapPin, MessageCircle } from "lucide-react";
import { useDisasterAlert } from "../context/DisasterAlertContext";
import DisasterAlertForm from "./DisasterAlertForm";

const severityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

const CreatedDisasterAlerts = ({ districts, districtCities, zones }) => {
  const { alerts, loading, editAlert, removeAlert } = useDisasterAlert();
  const [selectedAlert, setSelectedAlert] = useState(null);

  const [filters, setFilters] = useState({
    date: "",
    disasterName: "",
    severity: "",
  });

  const filteredAlerts = alerts.filter((alert) => {
    const dateMatch = !filters.date || alert.date === filters.date;
    const nameMatch =
      !filters.disasterName ||
      (alert.disasterName &&
        alert.disasterName.toLowerCase().includes(filters.disasterName.toLowerCase()));
    const levelMatch =
      !filters.severity ||
      (alert.severity && alert.severity.toLowerCase() === filters.severity.toLowerCase());
    return dateMatch && nameMatch && levelMatch;
  });

  if (loading) return <p>Loading alerts...</p>;
  if (!alerts.length) return <p>No disaster alerts created yet.</p>;

  return (
    <div className="space-y-6">
      {/* 🔍 Filter Controls */}
      <div className="bg-white p-4 rounded-lg shadow-md border">
        <h2 className="text-lg font-semibold flex items-center mb-3">
          <Filter className="h-5 w-5 mr-2 text-gray-600" /> Filter Alerts
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Filter by disaster name"
            value={filters.disasterName}
            onChange={(e) => setFilters({ ...filters, disasterName: e.target.value })}
            className="px-3 py-2 border rounded-lg w-full"
          />
          <input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            className="px-3 py-2 border rounded-lg w-full"
          />
          <select
            value={filters.severity}
            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
            className="px-3 py-2 border rounded-lg w-full"
          >
            <option value="">All Levels</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {/* List of Alerts */}
      {filteredAlerts.map((alert) => (
        <div
          key={alert.id}
          className="bg-white border rounded-lg p-6 shadow-md flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0"
        >
          {/* Left Side: Alert Details */}
          <div className="flex-1 space-y-2">
            <h3 className="text-xl font-semibold text-gray-900">{alert.disasterName}</h3>
            <p className="text-gray-700">{alert.description}</p>

            {/* Location */}
            <div className="flex items-center space-x-2 text-gray-500 text-sm">
              <MapPin className="h-4 w-4" />
              <span>
                {alert.district || "N/A"} - {alert.city || "N/A"}
              </span>
            </div>

            {/* Date & Time */}
            <p className="text-gray-400 text-sm">
              Date: {alert.date || "N/A"} | Time: {alert.time || "N/A"}
            </p>

            {/* Safe Zone */}
            {alert.nearestSafeZone && (
              <p className="text-green-600 text-sm flex items-center">
                ✅ Safe Zone: {alert.nearestSafeZone.name}
              </p>
            )}

            {/* SMS Alert */}
            {alert.sendSms && (
              <p className="text-blue-600 text-sm flex items-center">
                <MessageCircle className="h-4 w-4 mr-1" /> SMS Alert Enabled
              </p>
            )}

            {/* Severity at bottom */}
            <p
              className={`inline-block mt-2 px-2 py-1 rounded text-sm font-medium ${
                severityColors[alert.severity] || "bg-gray-100 text-gray-800"
              }`}
            >
              Severity: {alert.severity?.toUpperCase() || "N/A"}
            </p>
          </div>

          {/* Right Side: Actions */}
          <div className="flex space-x-3 mt-2 sm:mt-0">
            <button
              onClick={() => setSelectedAlert(alert)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Edit className="h-4 w-4 mr-2" /> Update
            </button>
            <button
              onClick={() => removeAlert(alert.id)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </button>
          </div>
        </div>
      ))}

      {/* Update Modal */}
      {selectedAlert && (
        <DisasterAlertForm
          report={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          createAlert={(data) => editAlert(selectedAlert.id, data)}
          districts={districts}
          districtCities={districtCities}
          zones={zones}
        />
      )}
    </div>
  );
};

export default CreatedDisasterAlerts;
