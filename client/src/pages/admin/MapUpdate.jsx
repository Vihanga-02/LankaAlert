// src/pages/MapUpdate.jsx
import React, { useState, useEffect, useMemo } from "react";
import MapMarking from "../../components/MapMarking";
import { useMapZone } from "../../context/MapZoneContext";
import { Layers, RefreshCw, Plus, Pencil, Trash2, Filter } from "lucide-react";

// -------- Constants --------
const districts = [
  "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya",
  "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar",
  "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee",
  "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla",
  "Moneragala", "Ratnapura", "Kegalle"
];

const districtCities = {
  Colombo: ["Colombo", "Homagama", "Awissawella", "Kaduwela", "Moratuwa", "Maharagama"],
  Gampaha: ["Negombo", "Ja-Ela", "Wattala", "Kelaniya", "Ragama"],
  Kalutara: ["Kalutara", "Beruwala", "Panadura", "Horana", "Matugama"],
  Kandy: ["Kandy", "Peradeniya", "Gampola", "Akurana", "Kadugannawa"],
  Matale: ["Matale", "Dambulla", "Rattota", "Ukuwela"],
  "Nuwara Eliya": ["Nuwara Eliya", "Hatton", "Talawakele", "Ambewela"],
  Galle: ["Galle", "Hikkaduwa", "Ambalangoda", "Unawatuna", "Karapitiya"],
  Matara: ["Matara", "Dikwella", "Weligama", "Tangalle", "Kamburupitiya"],
  Hambantota: ["Hambantota", "Tissamaharama", "Weeraketiya"],
  Jaffna: ["Jaffna", "Chavakachcheri", "Point Pedro", "Nallur", "Tellippalai"],
  Kilinochchi: ["Kilinochchi", "Pooneryn", "Karachchi", "Elephant Pass"],
  Mannar: ["Mannar", "Musali", "Madhu", "Nanattan"],
  Vavuniya: ["Vavuniya", "Vavuniya North", "Vavuniya South", "Vavuniya Urban"],
  Mullaitivu: ["Mullaitivu", "Oddusuddan", "Puthukkudiyiruppu", "Maritimepattu"],
  Batticaloa: ["Batticaloa", "Kalmunai", "Eravur", "Kalkudah", "Manmunai"],
  Ampara: ["Ampara", "Kalmunai", "Samanthurai", "Padiyathalawa", "Uhana"],
  Trincomalee: ["Trincomalee", "Kinniya", "Muttur", "Verugal", "Seruwila"],
  Kurunegala: ["Kurunegala", "Maho", "Dambulla", "Alawwa", "Kuliyapitiya", "Polgahawela"],
  Puttalam: ["Puttalam", "Chilaw", "Nawagathena", "Kalpitiya"],
  Anuradhapura: ["Anuradhapura", "Mihintale", "Padaviya", "Kebithigollewa", "Thalawa"],
  Polonnaruwa: ["Polonnaruwa", "Dimbulagala", "Lankapura", "Welikanda"],
  Badulla: ["Badulla", "Hali-Ela", "Ella", "Mahiyanganaya", "Passara"],
  Moneragala: ["Moneragala", "Buttala", "Bibile", "Medagama", "Kataragama"],
  Ratnapura: ["Ratnapura", "Balangoda", "Elapatha", "Kuruwita", "Embilipitiya"],
  Kegalle: ["Kegalle", "Deraniyagala", "Ruwanwella", "Mawanella", "Yatiyantota"]
};

const dangerSubcategories = [
  "Floods",
  "Landslides",
  "High Wind",
  "Power Cuts",
  "Water Cuts",
  "Elephants Moving",
];

const categoryPills = [
  { id: "all", name: "All Zones", color: "text-gray-600" },
  { id: "danger", name: "Danger Zones", color: "text-red-600" },
  { id: "safe", name: "Safe Zones", color: "text-green-600" },
];

// -------- Component --------
const MapUpdate = () => {
  const { zones, addZone, updateZone, deleteZone, fetchZones, loading } = useMapZone();

  // Filters
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSubCategory, setActiveSubCategory] = useState("");
  const [searchText, setSearchText] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");

  // Add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addData, setAddData] = useState({
    name: "",
    category: "danger",
    subCategory: "",
    safeDescription: "",
    district: "",
    city: "",
    latitude: "",
    longitude: "",
  });

  // Edit form
  const [showEditForm, setShowEditForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({
    name: "",
    category: "danger",
    subCategory: "",
    safeDescription: "",
    district: "",
    city: "",
    latitude: "",
    longitude: "",
  });

  useEffect(() => {
    fetchZones();
  }, []);

  // Derived: filtered zones for map + table
  const filteredZones = useMemo(() => {
    return zones.filter((z) => {
      if (activeCategory !== "all" && z.category !== activeCategory) return false;
      if (activeCategory === "danger" && activeSubCategory && z.subCategory !== activeSubCategory) return false;
      if (districtFilter && z.district !== districtFilter) return false;
      if (cityFilter && z.city !== cityFilter) return false;
      if (searchText) {
        const blob = `${z.name} ${z.category} ${z.subCategory || ""} ${z.safeDescription || ""} ${z.city} ${z.district}`.toLowerCase();
        if (!blob.includes(searchText.toLowerCase())) return false;
      }
      return true;
    });
  }, [zones, activeCategory, activeSubCategory, districtFilter, cityFilter, searchText]);

  // -------- Handlers: Add --------
  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setAddData((p) => ({ ...p, [name]: value }));
  };
  const handleAddDistrict = (e) => {
    setAddData((p) => ({ ...p, district: e.target.value, city: "" }));
  };
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    await addZone({
      ...addData,
      latitude: parseFloat(addData.latitude),
      longitude: parseFloat(addData.longitude),
    });
    setShowAddForm(false);
    setAddData({
      name: "",
      category: "danger",
      subCategory: "",
      safeDescription: "",
      district: "",
      city: "",
      latitude: "",
      longitude: "",
    });
  };

  // -------- Handlers: Edit --------
  const openEditModal = (zone) => {
    setEditId(zone.id);
    setEditData({
      name: zone.name || "",
      category: zone.category || "danger",
      subCategory: zone.subCategory || "",
      safeDescription: zone.safeDescription || "",
      district: zone.district || "",
      city: zone.city || "",
      latitude: zone.latitude?.toString() ?? "",
      longitude: zone.longitude?.toString() ?? "",
    });
    setShowEditForm(true);
  };
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((p) => ({ ...p, [name]: value }));
  };
  const handleEditDistrict = (e) => {
    setEditData((p) => ({ ...p, district: e.target.value, city: "" }));
  };
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editId) return;
    await updateZone(editId, {
      ...editData,
      latitude: parseFloat(editData.latitude),
      longitude: parseFloat(editData.longitude),
    });
    setShowEditForm(false);
    setEditId(null);
  };

  // -------- Handlers: Delete --------
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this zone?")) {
      await deleteZone(id);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Map Zone Manager</h1>
          <p className="mt-2 text-gray-600">Add and manage Danger/Safe zones across Sri Lanka</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={fetchZones}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-5 w-5 mr-2" /> Refresh
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-5 w-5 mr-2" /> Add Zone
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Filters */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Map Filters</h3>
              <Layers className="h-5 w-5 text-gray-400" />
            </div>

            {/* Category pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {categoryPills.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setActiveSubCategory("");
                  }}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    activeCategory === cat.id ? "bg-blue-100 border border-blue-300" : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <span className={cat.color}>{cat.name}</span>
                </button>
              ))}
            </div>

            {/* Danger subcategory filter */}
            {activeCategory === "danger" && (
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm font-medium text-gray-700">
                  <Filter className="h-4 w-4 mr-2" /> Danger Types
                </div>
                <div className="flex flex-wrap gap-2">
                  {dangerSubcategories.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => setActiveSubCategory((prev) => (prev === sub ? "" : sub))}
                      className={`px-3 py-1 rounded-lg text-sm ${
                        activeSubCategory === sub ? "bg-red-100 border border-red-300" : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Location + text filters */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">District</label>
                <select
                  value={districtFilter}
                  onChange={(e) => {
                    setDistrictFilter(e.target.value);
                    setCityFilter("");
                  }}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All Districts</option>
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
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500"
                  disabled={!districtFilter}
                >
                  <option value="">All Cities</option>
                  {districtFilter &&
                    districtCities[districtFilter]?.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Search</label>
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search by name or description"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Map + Table */}
        <div className="lg:col-span-3 space-y-6">
          {/* Map */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Sri Lanka Map</h3>
            </div>
            {loading ? (
              <div className="h-96 flex items-center justify-center">Loading zones...</div>
            ) : (
              // Do NOT pass onDelete to keep InfoWindow read-only
              <MapMarking lat={null} lng={null} zones={filteredZones} />
            )}
          </div>

          {/* Rows under map */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Zones</h3>
              <span className="text-sm text-gray-500">{filteredZones.length} result(s)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="text-left px-3 py-2">Name</th>
                    <th className="text-left px-3 py-2">Category</th>
                    <th className="text-left px-3 py-2">Type / Description</th>
                    <th className="text-left px-3 py-2">District</th>
                    <th className="text-left px-3 py-2">City</th>
                    <th className="text-left px-3 py-2">Lat</th>
                    <th className="text-left px-3 py-2">Lng</th>
                    <th className="text-right px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredZones.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-3 py-6 text-center text-gray-500">
                        No zones match the current filters.
                      </td>
                    </tr>
                  )}
                  {filteredZones.map((z) => (
                    <tr key={z.id} className="border-t">
                      <td className="px-3 py-2">{z.name}</td>
                      <td className="px-3 py-2 capitalize">
                        {z.category === "danger" ? (
                          <span className="text-red-600 font-medium">Danger</span>
                        ) : (
                          <span className="text-green-600 font-medium">Safe</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {z.category === "danger" ? z.subCategory || "-" : z.safeDescription || "-"}
                      </td>
                      <td className="px-3 py-2">{z.district || "-"}</td>
                      <td className="px-3 py-2">{z.city || "-"}</td>
                      <td className="px-3 py-2">{typeof z.latitude === "number" ? z.latitude.toFixed(6) : z.latitude}</td>
                      <td className="px-3 py-2">{typeof z.longitude === "number" ? z.longitude.toFixed(6) : z.longitude}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(z)}
                            className="inline-flex items-center px-2.5 py-1.5 rounded-lg border hover:bg-gray-50"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4 mr-1" /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(z.id)}
                            className="inline-flex items-center px-2.5 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Delete
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
      </div>

      {/* Add Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Add New Zone</h2>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <MapMarking
                lat={addData.latitude}
                lng={addData.longitude}
                onLocationSelect={(lat, lng) => setAddData((p) => ({ ...p, latitude: lat, longitude: lng }))}
              />

              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={addData.name}
                  onChange={handleAddChange}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  name="category"
                  value={addData.category}
                  onChange={handleAddChange}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="danger">Danger Zone</option>
                  <option value="safe">Safe Zone</option>
                </select>
              </div>

              {addData.category === "danger" && (
                <div>
                  <label className="block text-sm font-medium mb-1">Danger Type</label>
                  <select
                    name="subCategory"
                    value={addData.subCategory}
                    onChange={handleAddChange}
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

              {addData.category === "safe" && (
                <div>
                  <label className="block text-sm font-medium mb-1">Safe Zone Description</label>
                <input
                    type="text"
                    name="safeDescription"
                    value={addData.safeDescription}
                    onChange={handleAddChange}
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
                    value={addData.district}
                    onChange={handleAddDistrict}
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
                    value={addData.city}
                    onChange={handleAddChange}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500"
                    disabled={!addData.district}
                  >
                    <option value="">Select City</option>
                    {addData.district &&
                      districtCities[addData.district]?.map((c) => (
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
                    value={addData.latitude}
                    readOnly
                    className="w-full border rounded-lg px-3 py-2 bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Longitude</label>
                  <input
                    type="text"
                    name="longitude"
                    value={addData.longitude}
                    readOnly
                    className="w-full border rounded-lg px-3 py-2 bg-gray-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Save Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Edit Zone</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <MapMarking
                lat={editData.latitude}
                lng={editData.longitude}
                onLocationSelect={(lat, lng) => setEditData((p) => ({ ...p, latitude: lat, longitude: lng }))}
              />

              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={editData.name}
                  onChange={handleEditChange}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  name="category"
                  value={editData.category}
                  onChange={handleEditChange}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="danger">Danger Zone</option>
                  <option value="safe">Safe Zone</option>
                </select>
              </div>

              {editData.category === "danger" && (
                <div>
                  <label className="block text-sm font-medium mb-1">Danger Type</label>
                  <select
                    name="subCategory"
                    value={editData.subCategory}
                    onChange={handleEditChange}
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

              {editData.category === "safe" && (
                <div>
                  <label className="block text-sm font-medium mb-1">Safe Zone Description</label>
                  <input
                    type="text"
                    name="safeDescription"
                    value={editData.safeDescription}
                    onChange={handleEditChange}
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
                    value={editData.district}
                    onChange={handleEditDistrict}
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
                    value={editData.city}
                    onChange={handleEditChange}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500"
                    disabled={!editData.district}
                  >
                    <option value="">Select City</option>
                    {editData.district &&
                      districtCities[editData.district]?.map((c) => (
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
                  <input type="text" name="latitude" value={editData.latitude} readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Longitude</label>
                  <input type="text" name="longitude" value={editData.longitude} readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-100" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEditForm(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Update Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapUpdate;
