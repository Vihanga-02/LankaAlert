import React, { useState } from "react";
import { X } from "lucide-react";
import MapView from "./MapView";

const DisasterAlertForm = ({
  report,
  onClose,
  createAlert,
  districts = [],
  districtCities = {},
  zones = [],
}) => {
  const [formData, setFormData] = useState({
    disasterName: report?.disasterName || "",
    description: report?.description || "",
    severity: report?.severity || "low",
    district: report?.district || "",
    city: report?.city || "",
    nearestSafeZone: report?.nearestSafeZone || null,
    date: report?.date || new Date().toISOString().slice(0, 10),
    time:
      report?.time ||
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    sendSms: report?.sendSms || false,
    smsFilters: report?.smsFilters || {},
  });

  // Track the selected zone on the map for highlighting
  const [selectedZone, setSelectedZone] = useState(formData.nearestSafeZone);

  const handleSubmit = (e) => {
    e.preventDefault();
    createAlert(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </button>

        {/* Dynamic Heading */}
        <h2 className="text-2xl font-bold mb-6">
          {report ? "Update Disaster Alert" : "Create Disaster Alert"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Disaster Name */}
          <div>
            <label className="block text-sm font-medium">Disaster Name</label>
            <input
              type="text"
              value={formData.disasterName}
              onChange={(e) =>
                setFormData({ ...formData, disasterName: e.target.value })
              }
              className="w-full border rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full border rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
              rows={3}
              required
            />
          </div>

          {/* Severity */}
          <div>
            <label className="block text-sm font-medium">Severity</label>
            <select
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
              className="w-full border rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="low">🟢 Low</option>
              <option value="medium">🟡 Medium</option>
              <option value="high">🔴 High</option>
            </select>
          </div>

          {/* District & City */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">District</label>
              <select
                value={formData.district}
                onChange={(e) =>
                  setFormData({ ...formData, district: e.target.value, city: "" })
                }
                className="w-full border rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                required
              >
                <option value="">Select District</option>
                {districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">City</label>
              <select
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full border rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                required
                disabled={!formData.district}
              >
                <option value="">Select City</option>
                {formData.district &&
                  districtCities[formData.district]?.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full border rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Time</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full border rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
          </div>

          {/* Safe Zone */}
          <div>
            <label className="block text-sm font-medium">Nearest Safe Zone (optional)</label>
            <div className="h-64 border rounded-lg overflow-hidden mt-2">
              <MapView
                zones={zones}
                selectedZone={selectedZone}
                onSelectSafeZone={(zone) => {
                  setFormData({ ...formData, nearestSafeZone: zone });
                  setSelectedZone(zone);
                }}
              />
            </div>
            {formData.nearestSafeZone && (
              <p className="mt-2 text-sm text-green-600">
                ✅ Selected: {formData.nearestSafeZone.name}
              </p>
            )}
          </div>

          {/* SMS */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.sendSms}
                onChange={(e) =>
                  setFormData({ ...formData, sendSms: e.target.checked })
                }
                className="mr-2"
              />
              Send SMS Alerts
            </label>
            {formData.sendSms && (
              <div className="mt-2 p-3 border rounded-lg bg-gray-50 text-sm">
                <p>📌 User filtering form will go here (to be built later).</p>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {report ? "Update Alert" : "Create Alert"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DisasterAlertForm;
