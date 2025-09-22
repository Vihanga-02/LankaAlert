import React, { useEffect, useMemo, useState } from "react";
import { Plus, Edit, Trash2, Save, X, Search, Filter } from "lucide-react";
import { useThresholds } from "../context/ThresholdsContext";

const emptyForm = {
  cityName: "",
  cityCode: "",
  latitude: "",
  longitude: "",
  rainfallThresholdMm: "",
  temperatureThreshold: "",
  windThreshold: "",
  airQualityThreshold: "",
  uvIndexThreshold: "", // New field for UV Index
};

const numberOrEmpty = (v) => (v === "" ? "" : Number(v));

const DisasterThresholds = () => {
  const { thresholds, loading, error, create, update, remove } = useThresholds();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(""); // Alert message state
  const [searchTerm, setSearchTerm] = useState(""); // Search term for city name
  const [showForm, setShowForm] = useState(false); // Toggle for showing the form
  const [showFilters, setShowFilters] = useState(false); // Toggle for filter visibility

  // Filter States
  const [filterCityCode, setFilterCityCode] = useState("");
  const [filterMinRainfall, setFilterMinRainfall] = useState("");
  const [filterMaxRainfall, setFilterMaxRainfall] = useState("");

  const filtered = useMemo(() => {
    return thresholds.filter((t) => {
      // Apply filters
      const cityCodeMatch = t.cityCode.toLowerCase().includes(filterCityCode.toLowerCase());
      const minRainfallMatch = !filterMinRainfall || t.rainfallThresholdMm >= filterMinRainfall;
      const maxRainfallMatch = !filterMaxRainfall || t.rainfallThresholdMm <= filterMaxRainfall;
      const cityNameMatch = t.cityName.toLowerCase().includes(searchTerm.toLowerCase()); // Apply search to cityName

      return cityCodeMatch && minRainfallMatch && maxRainfallMatch && cityNameMatch;
    });
  }, [thresholds, filterCityCode, filterMinRainfall, filterMaxRainfall, searchTerm]);

  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(""), 2500);
    return () => clearTimeout(id);
  }, [msg]);

  const validate = () => {
    const lat = Number(form.latitude);
    const lon = Number(form.longitude);
    const rainfallThr = Number(form.rainfallThresholdMm);
    const tempThr = Number(form.temperatureThreshold);
    const windThr = Number(form.windThreshold);
    const airQualityThr = Number(form.airQualityThreshold);
    const uvIndexThr = Number(form.uvIndexThreshold); // UV Index validation

    if (!form.cityName.trim()) return "City name is required";
    if (!form.cityCode.trim()) return "City code is required";
    if (Number.isNaN(lat) || lat < -90 || lat > 90) return "Latitude must be between -90 and 90";
    if (Number.isNaN(lon) || lon < -180 || lon > 180) return "Longitude must be between -180 and 180";
    if (Number.isNaN(rainfallThr) || rainfallThr <= 0) return "Rainfall threshold must be a positive number (mm)";
    if (Number.isNaN(tempThr) || tempThr <= 0) return "Temperature threshold must be a positive number (°C)";
    if (Number.isNaN(windThr) || windThr <= 0) return "Wind threshold must be a positive number (km/h)";
    if (Number.isNaN(airQualityThr) || airQualityThr <= 0) return "Air quality threshold must be a positive number (AQI)";
    if (Number.isNaN(uvIndexThr) || uvIndexThr <= 0) return "UV Index threshold must be a positive number"; // UV Index threshold validation
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) return setMsg(v);

    setBusy(true);
    try {
      const payload = {
        ...form,
        latitude: numberOrEmpty(form.latitude),
        longitude: numberOrEmpty(form.longitude),
        rainfallThresholdMm: numberOrEmpty(form.rainfallThresholdMm),
        temperatureThreshold: numberOrEmpty(form.temperatureThreshold),
        windThreshold: numberOrEmpty(form.windThreshold),
        airQualityThreshold: numberOrEmpty(form.airQualityThreshold),
        uvIndexThreshold: numberOrEmpty(form.uvIndexThreshold), // Include UV Index threshold
      };

      if (editingId) {
        await update(editingId, payload);
        setMsg("Threshold updated successfully!"); // Success message after update
      } else {
        await create(payload);
        setMsg("Threshold created successfully!"); // Success message after creation
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false); // Hide form after submission
    } catch (err) {
      setMsg(err.message || "Operation failed");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (t) => {
    setEditingId(t.id);
    setForm({
      cityName: t.cityName ?? "",
      cityCode: t.cityCode ?? "",
      latitude: t.latitude ?? "",
      longitude: t.longitude ?? "",
      rainfallThresholdMm: t.rainfallThresholdMm ?? "",
      temperatureThreshold: t.temperatureThreshold ?? "",
      windThreshold: t.windThreshold ?? "",
      airQualityThreshold: t.airQualityThreshold ?? "",
      uvIndexThreshold: t.uvIndexThreshold ?? "", // UV Index field for edit
    });
    setShowForm(true); // Show form when editing
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false); // Hide form when cancelled
  };

  const confirmDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this threshold?")) return;
    setBusy(true);
    try {
      await remove(id);
      setMsg("Threshold deleted successfully!"); // Success message after delete
    } catch (err) {
      setMsg(err.message || "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  // Handle city name input keydown event to restrict symbols and special characters
  const handleCityNameKeyDown = (e) => {
    const invalidChars = /[^a-zA-Z\s]/; // Only allow letters and spaces
    if (invalidChars.test(e.key)) {
      e.preventDefault(); // Prevent the invalid character
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Threshold Management</h2>
          <p className="text-gray-600">Manage city/place thresholds for weather conditions</p>
        </div>

        {/* Search Bar and Filter Button */}
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search by City Name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
               onKeyDown={handleCityNameKeyDown}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute right-3 top-3">
              <Search className="text-gray-500" />
            </div>
          </div>
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </button>
        </div>
      </div>

      {/* Filter Section */}
      {showFilters && (
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="w-full md:w-1/4">
            <input
              type="text"
              placeholder="Filter by City Code"
              value={filterCityCode}
              onChange={(e) => setFilterCityCode(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="w-full md:w-1/4">
            <input
              type="number"
              placeholder="Min Rainfall"
              value={filterMinRainfall}
              onChange={(e) => setFilterMinRainfall(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="w-full md:w-1/4">
            <input
              type="number"
              placeholder="Max Rainfall"
              value={filterMaxRainfall}
              onChange={(e) => setFilterMaxRainfall(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Add Threshold Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Threshold
        </button>
      )}

      {/* Display Message */}
      {msg && (
        <div className="p-4 bg-green-100 text-green-700 border border-green-300 rounded-lg mb-4">
          {msg}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className={`bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4`}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Form Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700">City/Place Name</label>
              <input
                value={form.cityName}
                onChange={(e) => setForm((f) => ({ ...f, cityName: e.target.value }))}
                onKeyDown={handleCityNameKeyDown} // Adding keydown handler
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Ex - Colombo"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">City Code</label>
              <input
                value={form.cityCode}
                onChange={(e) => setForm((f) => ({ ...f, cityCode: e.target.value.toUpperCase() }))}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 uppercase focus:ring-2 focus:ring-blue-500"
                placeholder="Ex - 1234"
                required
              />
            </div>

            {/* New Fields for Thresholds */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Latitude</label>
              <input
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Ex- 6.9271"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Longitude</label>
              <input
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Ex- 79.8612"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Rainfall Threshold (mm)</label>
              <input
                type="number"
                step="1"
                value={form.rainfallThresholdMm}
                onChange={(e) => setForm((f) => ({ ...f, rainfallThresholdMm: e.target.value }))}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Ex-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Temperature Threshold (°C)</label>
              <input
                type="number"
                step="1"
                value={form.temperatureThreshold}
                onChange={(e) => setForm((f) => ({ ...f, temperatureThreshold: e.target.value }))}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Ex-30"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Wind Threshold (km/h)</label>
              <input
                type="number"
                step="1"
                value={form.windThreshold}
                onChange={(e) => setForm((f) => ({ ...f, windThreshold: e.target.value }))}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Ex-50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Air Quality Threshold (AQI)</label>
              <input
                type="number"
                step="1"
                value={form.airQualityThreshold}
                onChange={(e) => setForm((f) => ({ ...f, airQualityThreshold: e.target.value }))}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Ex-150"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">UV Index Threshold</label>
              <input
                type="number"
                step="1"
                value={form.uvIndexThreshold}
                onChange={(e) => setForm((f) => ({ ...f, uvIndexThreshold: e.target.value }))}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Ex-7"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {editingId ? <Save className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {editingId ? "Save Changes" : "Add Threshold"}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </button>
            {msg && <span className="text-sm text-gray-600">{msg}</span>}
          </div>
        </form>
      )}

      {/* Table / List */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Latitude</th>
                <th className="px-4 py-3">Longitude</th>
                <th className="px-4 py-3">Rainfall Threshold (mm)</th>
                <th className="px-4 py-3">Temp. Threshold (°C)</th>
                <th className="px-4 py-3">Wind Threshold (km/h)</th>
                <th className="px-4 py-3">Air Quality Threshold (AQI)</th>
                <th className="px-4 py-3">UV Index Threshold</th>
                <th className="px-4 py-3 w-40">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={10} className="px-4 py-6 text-center text-gray-500">
                    Loading…
                  </td>
                </tr>
              )}
              {error && !loading && (
                <tr>
                  <td colSpan={10} className="px-4 py-6 text-center text-red-600">
                    {String(error)}
                  </td>
                </tr>
              )}
              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-6 text-center text-gray-500">
                    No thresholds found.
                  </td>
                </tr>
              )}
              {filtered.map((t) => (
                <tr key={t.id} className="text-sm">
                  <td className="px-4 py-3 font-medium text-gray-900">{t.cityName}</td>
                  <td className="px-4 py-3 text-gray-700">{t.cityCode}</td>
                  <td className="px-4 py-3 text-gray-700">{t.latitude}</td>
                  <td className="px-4 py-3 text-gray-700">{t.longitude}</td>
                  <td className="px-4 py-3 text-gray-700">{t.rainfallThresholdMm}</td>
                  <td className="px-4 py-3 text-gray-700">{t.temperatureThreshold}</td>
                  <td className="px-4 py-3 text-gray-700">{t.windThreshold}</td>
                  <td className="px-4 py-3 text-gray-700">{t.airQualityThreshold}</td>
                  <td className="px-4 py-3 text-gray-700">{t.uvIndexThreshold}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(t)}
                        className="inline-flex items-center px-2.5 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => confirmDelete(t.id)}
                        className="inline-flex items-center px-2.5 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DisasterThresholds;
