// src/components/MapZoneForm.jsx
import React from "react";
import MapMarking from "./MapMarking";

const MapZoneForm = ({
  mode = "add",
  data,
  setData,
  onSubmit,
  onClose,
  districts,
  districtCities,
  dangerSubcategories,
}) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((p) => ({ ...p, [name]: value }));
  };

  const handleDistrictChange = (e) => {
    setData((p) => ({ ...p, district: e.target.value, city: "" }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 overflow-y-auto max-h-[90vh]">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">
          {mode === "add" ? "Add New Zone" : "Edit Zone"}
        </h2>

        <form onSubmit={onSubmit} className="space-y-4">
          <MapMarking
            lat={data.latitude}
            lng={data.longitude}
            onLocationSelect={(lat, lng) =>
              setData((p) => ({ ...p, latitude: lat, longitude: lng }))
            }
          />
           {/* Hidden field to carry reportId */}
            {data.reportId && (
              <input type="hidden" name="reportId" value={data.reportId} />
            )}

          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={data.name}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              name="category"
              value={data.category}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500"
            >
              <option value="danger">Danger Zone</option>
              <option value="safe">Safe Zone</option>
            </select>
          </div>

          {data.category === "danger" && (
            <div>
              <label className="block text-sm font-medium mb-1">Danger Type</label>
              <select
                name="subCategory"
                value={data.subCategory}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:ring-1 focus:ring-red-500"
              >
                <option value="">Select type</option>
                {dangerSubcategories.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          {data.category === "safe" && (
            <div>
              <label className="block text-sm font-medium mb-1">Safe Zone Description</label>
              <input
                type="text"
                name="safeDescription"
                value={data.safeDescription}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:ring-1 focus:ring-green-500"
                placeholder="Describe why this zone is safe"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">District</label>
              <select
                name="district"
                value={data.district}
                onChange={handleDistrictChange}
                className="w-full border rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select District</option>
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <select
                name="city"
                value={data.city}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500"
                disabled={!data.district}
              >
                <option value="">Select City</option>
                {data.district &&
                  districtCities[data.district]?.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Latitude</label>
              <input
                type="text"
                name="latitude"
                value={data.latitude}
                readOnly
                className="w-full border rounded-lg px-3 py-2 bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Longitude</label>
              <input
                type="text"
                name="longitude"
                value={data.longitude}
                readOnly
                className="w-full border rounded-lg px-3 py-2 bg-gray-100"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {mode === "add" ? "Save Zone" : "Update Zone"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MapZoneForm;
