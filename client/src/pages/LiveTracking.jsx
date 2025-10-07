import React, { useState, useEffect, useMemo } from "react";
import { MapPin, Filter, Navigation, AlertTriangle } from "lucide-react";
import MapLiveTrack from "../components/MapLiveTrack";
import { useMapZone } from "../context/MapZoneContext";
import { useNavigate } from "react-router-dom";

const LiveTracking = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [filters, setFilters] = useState({ category: "", subCategory: "" });
  const [liveNotifications, setLiveNotifications] = useState([]);
  const { zones, loading } = useMapZone();
  const navigate = useNavigate();

  // ✅ Haversine distance helper (in meters)
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371e3; // meters
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // ✅ Watch user location in real-time with danger zone alerts
  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(loc);

          // Check nearby danger zones
          const nearbyAlerts = zones
            .filter((z) => z.category === "danger")
            .filter((z) => getDistance(loc.lat, loc.lng, z.latitude, z.longitude) < 2000) // 2 km radius
            .map((z) => ({
              id: z.id,
              title: `Danger Zone Nearby`,
              message: `${z.subCategory} reported near ${z.city || z.name}`,
            }));

          setLiveNotifications(nearbyAlerts);
        },
        (error) => console.error("Error watching location:", error),
        { enableHighAccuracy: true }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [zones]);

  const availableSubCategories = useMemo(
    () => [...new Set(zones.map((z) => z.subCategory).filter(Boolean))],
    [zones]
  );

  const filteredZones = zones.filter((zone) => {
    const categoryMatch =
      !filters.category ||
      zone.category?.toLowerCase() === filters.category.toLowerCase();
    const subCategoryMatch =
      !filters.subCategory ||
      zone.subCategory?.toLowerCase() === filters.subCategory.toLowerCase();
    return categoryMatch && subCategoryMatch;
  });

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-xl text-gray-700">Loading zones...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Live Disaster Tracking
          </h1>
          <p className="text-lg text-gray-600">
            Real-time tracking of disasters and safe zones with interactive mapping
          </p>
        </div>

        <button
          onClick={() => navigate("/risk-route")}
          className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
        >
          Go to Risk Route →
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <Filter className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) =>
                      setFilters({ ...filters, category: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">All</option>
                    <option value="danger">Danger</option>
                    <option value="safe">Safe</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Disaster Type
                  </label>
                  <select
                    value={filters.subCategory}
                    onChange={(e) =>
                      setFilters({ ...filters, subCategory: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">All</option>
                    {availableSubCategories.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Navigation className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Your Location
                </h3>
              </div>
              {userLocation ? (
                <div className="text-sm text-gray-600">
                  <p>Latitude: {userLocation.lat.toFixed(4)}</p>
                  <p>Longitude: {userLocation.lng.toFixed(4)}</p>
                  <p className="mt-2 text-green-600">Location tracking active</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Requesting location...</p>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-blue-600 text-white p-4 flex items-center space-x-2">
                <MapPin className="h-6 w-6" />
                <h3 className="text-lg font-semibold">
                  Interactive Disaster Map
                </h3>
              </div>
              <div className="relative h-[500px]">
                <MapLiveTrack zones={filteredZones} userLocation={userLocation} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Live Danger Alerts Panel */}
      {liveNotifications.length > 0 && (
        <div className="absolute top-4 right-4 z-30 bg-white shadow-lg rounded-xl p-4 w-[90%] max-w-sm border border-red-400">
          <h3 className="font-semibold text-lg mb-2 flex items-center text-red-700">
            <AlertTriangle className="mr-2 h-5 w-5" /> Danger Alerts
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {liveNotifications.map((notif) => (
              <div
                key={notif.id}
                className="p-3 bg-red-50 border border-red-300 rounded-lg"
              >
                <p className="font-medium text-red-700">{notif.title}</p>
                <p className="text-sm text-gray-700">{notif.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTracking;