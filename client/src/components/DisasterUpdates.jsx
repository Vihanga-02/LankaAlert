import React, { useState, useEffect } from "react";
import { AlertTriangle, Calendar, MapPin, Filter } from "lucide-react";
import MapView from "./MapView";
import { useMapZone } from "../context/MapZoneContext";
import { getDisasterAlerts } from "../services/disasterAlertService";

const DisasterUpdates = () => {
  const [filters, setFilters] = useState({
    date: "",
    place: "",
    warningLevel: "",
    disasterType: "",
  });
  const [alerts, setAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  const { zones, loading } = useMapZone();

  // Fetch alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      setLoadingAlerts(true);
      try {
        const data = await getDisasterAlerts();
        setAlerts(data);
      } catch (err) {
        console.error("Failed to fetch alerts:", err);
      }
      setLoadingAlerts(false);
    };
    fetchAlerts();
  }, []);

  // Filtering
  const filterAlerts = (alerts) => {
    return alerts.filter((alert) => {
      const dateMatch = !filters.date || alert.date === filters.date;
      const placeMatch =
        !filters.place ||
        (alert.district &&
          alert.district.toLowerCase().includes(filters.place.toLowerCase())) ||
        (alert.city &&
          alert.city.toLowerCase().includes(filters.place.toLowerCase()));
      const severityMatch =
        !filters.warningLevel ||
        alert.severity?.toLowerCase() === filters.warningLevel.toLowerCase();
      const typeMatch =
        !filters.disasterType ||
        (alert.disasterName &&
          alert.disasterName
            .toLowerCase()
            .includes(filters.disasterType.toLowerCase())) ||
        (alert.type &&
          alert.type.toLowerCase().includes(filters.disasterType.toLowerCase()));

      return dateMatch && placeMatch && severityMatch && typeMatch;
    });
  };

  const filteredDisasterAlerts = filterAlerts(alerts);

  const filteredZones = zones.filter((zone) => {
    const placeMatch =
      !filters.place ||
      (zone.district &&
        zone.district.toLowerCase().includes(filters.place.toLowerCase())) ||
      (zone.city &&
        zone.city.toLowerCase().includes(filters.place.toLowerCase()));
    const typeMatch =
      !filters.disasterType ||
      (zone.subCategory &&
        zone.subCategory.toLowerCase().includes(filters.disasterType.toLowerCase()));
    return placeMatch && typeMatch;
  });

  const getSeverityColor = (severity) => {
    switch ((severity || "").toLowerCase()) {
      case "critical":
      case "high":
        return "text-red-700 bg-red-100 border-red-300";
      case "medium":
        return "text-yellow-700 bg-yellow-100 border-yellow-300";
      default:
        return "text-blue-700 bg-blue-100 border-blue-300";
    }
  };

  const getStatusColor = (status) => {
    switch ((status || "").toLowerCase()) {
      case "active":
        return "text-green-700 bg-green-50";
      case "monitoring":
        return "text-blue-700 bg-blue-50";
      case "critical":
        return "text-red-700 bg-red-50";
      default:
        return "text-gray-700 bg-gray-50";
    }
  };

  if (loading || loadingAlerts) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-xl text-gray-700">Loading disaster updates...</p>
      </div>
    );
  }

  return (
    <>
      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center text-gray-600 font-medium">
            <Filter className="w-5 h-5 mr-2" /> Filters:
          </div>

          <input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            className="px-3 py-2 border rounded-lg focus:ring focus:ring-blue-200"
          />

          <input
            type="text"
            placeholder="Search by place"
            value={filters.place}
            onChange={(e) => setFilters({ ...filters, place: e.target.value })}
            className="px-3 py-2 border rounded-lg focus:ring focus:ring-blue-200"
          />

          <select
            value={filters.warningLevel}
            onChange={(e) =>
              setFilters({ ...filters, warningLevel: e.target.value })
            }
            className="px-3 py-2 border rounded-lg focus:ring focus:ring-blue-200"
          >
            <option value="">All Severity</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <input
            type="text"
            placeholder="Disaster Type"
            value={filters.disasterType}
            onChange={(e) =>
              setFilters({ ...filters, disasterType: e.target.value })
            }
            className="px-3 py-2 border rounded-lg focus:ring focus:ring-blue-200"
          />
        </div>
      </div>

      {/* Map */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Disaster Map</h2>
        <div className="w-full h-140 rounded-lg shadow-sm border overflow-hidden">
          <MapView zones={filteredZones} />
        </div>
      </div>

      {/* Alerts */}
      {(!filteredDisasterAlerts || filteredDisasterAlerts.length === 0) ? (
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No Alerts Found
          </h3>
          <p className="text-gray-500">
            Try adjusting your filters to see more results.
          </p>
        </div>
      ) : (
        filteredDisasterAlerts.map((alert) => (
          <div
            key={alert.id}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 mb-6 border"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
              <div className="flex items-start space-x-4 mb-4 lg:mb-0">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {alert.disasterName || alert.type}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {alert.district}, {alert.city || alert.location}
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
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mb-3">
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
                {alert.status || "active"}
              </span>
            </div>

            <p className="text-gray-700 mb-4">{alert.description}</p>

            {alert.nearestSafeZone && (
              <p className="text-sm text-green-700 font-medium mb-4">
                ✅ Nearest Safe Zone: {alert.nearestSafeZone.name}
              </p>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-500">
                Valid until: {alert.validUntil || "N/A"}
              </span>
              <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                View Details →
              </button>
            </div>
          </div>
        ))
      )}
    </>
  );
};

export default DisasterUpdates;
