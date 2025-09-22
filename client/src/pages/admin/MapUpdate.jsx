// src/pages/MapUpdate.jsx
import React, { useState, useEffect, useMemo } from "react";
import MapMarking from "../../components/MapMarking";
import MapZoneForm from "../../components/MapZoneForm";
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

  // Filtered zones
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

  // Add submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    await addZone({
      ...addData,
      latitude: parseFloat(addData.latitude),
      longitude: parseFloat(addData.longitude),
       reportId: addData.reportId || null, // ✅ keep link if exists
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
      reportId: null, // ✅ reset after save
    });
  };

  // Edit open + submit
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

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editId) return;
    await updateZone(editId, {
      ...editData,
      latitude: parseFloat(editData.latitude),
      longitude: parseFloat(editData.longitude),
      reportId: editData.reportId || null, // ✅ preserve reportId
    });
    setShowEditForm(false);
    setEditId(null);
  };

  // Delete
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

          {/* Zones table */}
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
                      <td className="px-3 py-2">
                        {typeof z.latitude === "number" ? z.latitude.toFixed(6) : z.latitude}
                      </td>
                      <td className="px-3 py-2">
                        {typeof z.longitude === "number" ? z.longitude.toFixed(6) : z.longitude}
                      </td>
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
        <MapZoneForm
          mode="add"
          data={addData}
          setData={setAddData}
          onSubmit={handleAddSubmit}
          onClose={() => setShowAddForm(false)}
          districts={districts}
          districtCities={districtCities}
          dangerSubcategories={dangerSubcategories}
        />
      )}

      {/* Edit Modal */}
      {showEditForm && (
        <MapZoneForm
          mode="edit"
          data={editData}
          setData={setEditData}
          onSubmit={handleEditSubmit}
          onClose={() => setShowEditForm(false)}
          districts={districts}
          districtCities={districtCities}
          dangerSubcategories={dangerSubcategories}
        />
      )}
    </div>
  );
};

export default MapUpdate;
