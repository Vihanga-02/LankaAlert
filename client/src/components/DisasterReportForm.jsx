// components/DisasterReportForm.jsx
import React, { useState } from "react";
import { MapPin } from "lucide-react";
import ReporterMapMarking from "./ReporterMapMarking"; // your map component

const disasterTypes = [
  { id: "flood", name: "Flood", icon: "🌊" },
  { id: "landslide", name: "Landslide", icon: "🏔️" },
  { id: "storm", name: "Storm/Cyclone", icon: "🌪️" },
  { id: "drought", name: "Drought", icon: "🌵" },
  { id: "other", name: "Other", icon: "⚠️" },
];

const DisasterReportForm = ({ formData, setFormData }) => {
  const [mapLocation, setMapLocation] = useState({
    latitude: "",
    longitude: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));
        setMapLocation({ latitude: lat, longitude: lng });
      });
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  return (
    <div className="max-w-2xl space-y-6 mx-auto">
      {/* Disaster Information */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Disaster Information</h2>

        {/* Disaster Type */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Disaster Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {disasterTypes.map((type) => (
              <label
                key={type.id}
                className={`flex items-center gap-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50 ${
                  formData.disasterType === type.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="disasterType"
                  value={type.id}
                  checked={formData.disasterType === type.id}
                  onChange={handleChange}
                  className="hidden"
                />
                <span className="text-xl">{type.icon}</span>
                <span>{type.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Disaster Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Heavy flooding in Colombo"
            className="w-full border border-gray-300 rounded-lg p-2"
          />
        </div>

        {/* Severity */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Severity Level</label>
          <select
            name="severity"
            value={formData.severity}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Provide detailed information about the disaster..."
            rows={4}
            className="w-full border border-gray-300 rounded-lg p-2"
          />
        </div>
      </div>

      {/* Location Information */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Location Information</h2>

        {/* Location Description */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Location Description</label>
          <input
            type="text"
            name="locationDescription"
            value={formData.locationDescription}
            onChange={handleChange}
            placeholder="e.g., Colombo 07, near Manning Market"
            className="w-full border border-gray-300 rounded-lg p-2"
          />
        </div>

        {/* Latitude & Longitude */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Latitude</label>
            <input
              type="text"
              name="latitude"
              value={formData.latitude}
              onChange={handleChange}
              placeholder="6.9271"
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Longitude</label>
            <input
              type="text"
              name="longitude"
              value={formData.longitude}
              onChange={handleChange}
              placeholder="79.8612"
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>
        </div>

        {/* Current Location Button */}
        <button
          type="button"
          onClick={handleCurrentLocation}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mb-4"
        >
          <MapPin className="w-5 h-5" />
          Use Current Location
        </button>

        {/* Google Map */}
        {formData.latitude && formData.longitude && (
          <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-300">
            <ReporterMapMarking
              disasterType={formData.disasterType}
              latitude={parseFloat(formData.latitude)}
              longitude={parseFloat(formData.longitude)}
              onLocationSelect={(coords) => {
                setFormData((prev) => ({
                  ...prev,
                  latitude: coords.latitude.toFixed(6),
                  longitude: coords.longitude.toFixed(6),
                }));
                setMapLocation(coords);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DisasterReportForm;
