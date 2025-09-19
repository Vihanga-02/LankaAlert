// src/pages/admin/InventoryManagement.jsx
import React, { useState } from "react";
import {
  Search,
  Filter,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useInventory } from "../../context/InventoryContext";

const InventoryManagement = () => {
  const { inventory, recentMovements, deleteInventoryItem, updateInventoryItem } =
    useInventory();

  const [searchQuery, setSearchQuery] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    currentStock: "",
    minThreshold: "",
    status: "",
  });

  // Category tab state
  const [activeTab, setActiveTab] = useState("food");

  // Delete item
  const handleDelete = async (id, name) => {
    const ok = window.confirm(`Delete "${name}" from inventory?`);
    if (!ok) return;
    await deleteInventoryItem(id);
  };

  // Edit item → open inline form
  const handleEdit = (item) => {
    setEditingItem(item.id);
    setFormData({
      name: item.name,
      currentStock: item.currentStock,
      minThreshold: item.minThreshold,
      status: item.status,
    });
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit updated item
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    await updateInventoryItem(editingItem, formData);
    setEditingItem(null);
  };

  // Status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "In Stock":
        return (
          <span className="px-2 py-1 text-xs bg-green-200 text-green-900 font-semibold rounded-full">
            In Stock
          </span>
        );
      case "Low Stock":
        return (
          <span className="px-2 py-1 text-xs bg-yellow-200 text-yellow-900 font-semibold rounded-full">
            Low Stock
          </span>
        );
      case "Out of Stock":
        return (
          <span className="px-2 py-1 text-xs bg-red-200 text-red-900 font-semibold rounded-full">
            Out of Stock
          </span>
        );
      default:
        return null;
    }
  };

  // Filter inventory by search + category
  const filteredInventory = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      item.category?.toLowerCase() === activeTab
  );

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-indigo-50 to-blue-100 min-h-screen">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-indigo-900">Inventory Management</h1>
        <div className="flex space-x-3">
          <button className="inline-flex items-center px-4 py-2 bg-indigo-200 text-indigo-800 rounded-lg hover:bg-indigo-300 transition-colors">
            <Filter className="h-5 w-5 mr-2" />
            Filter
          </button>
          <Link
            to="/admin/inventory/add"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Item
          </Link>
        </div>
      </div>

      {/* CATEGORY TABS */}
      <div className="flex space-x-4 border-b pb-2">
        <button
          onClick={() => setActiveTab("food")}
          className={`px-4 py-2 font-medium ${
            activeTab === "food"
              ? "border-b-2 border-indigo-600 text-indigo-600"
              : "text-gray-600"
          }`}
        >
          Food Items
        </button>
        <button
          onClick={() => setActiveTab("medical")}
          className={`px-4 py-2 font-medium ${
            activeTab === "medical"
              ? "border-b-2 border-indigo-600 text-indigo-600"
              : "text-gray-600"
          }`}
        >
          Medical Items
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative">
        <input
          type="text"
          placeholder={`Search ${activeTab} inventory...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
        <Search className="h-5 w-5 text-indigo-400 absolute left-3 top-2.5" />
      </div>

      {/* INVENTORY TABLE */}
      <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-indigo-200">
        <table className="w-full text-sm text-left">
          <thead className="bg-indigo-600 text-white">
            <tr>
              <th className="px-6 py-3 uppercase font-medium">Item</th>
              <th className="px-6 py-3 uppercase font-medium">Stock</th>
              <th className="px-6 py-3 uppercase font-medium">Status</th>
              <th className="px-6 py-3 uppercase font-medium">Min Stock</th>
              <th className="px-6 py-3 text-right uppercase font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-indigo-100 bg-indigo-50">
            {filteredInventory.map((item, idx) => (
              <tr
                key={item.id}
                className={`hover:bg-indigo-100 ${
                  idx % 2 === 0 ? "bg-indigo-50" : "bg-indigo-100"
                }`}
              >
                <td className="px-6 py-4 font-medium text-indigo-900">{item.name}</td>
                <td className="px-6 py-4 text-gray-800">{item.currentStock}</td>
                <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                <td className="px-6 py-4 text-gray-800">{item.minThreshold}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="inline-flex items-center px-3 py-1 bg-green-200 text-green-800 rounded-lg hover:bg-green-300 text-sm"
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Update
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.name)}
                    className="inline-flex items-center px-3 py-1 bg-red-200 text-red-800 rounded-lg hover:bg-red-300 text-sm"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* INLINE UPDATE FORM */}
      {editingItem && (
        <div className="bg-white shadow-lg rounded-lg p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Update Item</h2>
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            {/* NAME */}
            <div>
              <label className="block text-sm font-medium">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            {/* CURRENT STOCK */}
            <div>
              <label className="block text-sm font-medium">Current Stock</label>
              <input
                type="number"
                name="currentStock"
                value={formData.currentStock}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            {/* MIN STOCK */}
            <div>
              <label className="block text-sm font-medium">Min Stock</label>
              <input
                type="number"
                name="minThreshold"
                value={formData.minThreshold}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            {/* STATUS */}
            <div>
              <label className="block text-sm font-medium">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option>In Stock</option>
                <option>Low Stock</option>
                <option>Out of Stock</option>
              </select>
            </div>

            {/* FORM BUTTONS */}
            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RECENT MOVEMENTS */}
      <div>
        <h2 className="text-xl font-semibold text-indigo-900 mb-3">Recent Movements</h2>
        <div className="bg-white shadow-lg rounded-lg divide-y divide-indigo-100 border border-indigo-200">
          {recentMovements.map((move) => (
            <div
              key={move.id}
              className="px-6 py-4 flex items-center justify-between hover:bg-indigo-50"
            >
              <div className="flex items-center space-x-3">
                {move.type === "added" ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-indigo-900">
                    {move.type === "added" ? "Added" : "Removed"} {move.quantity}{" "}
                    {move.item}
                  </p>
                  <p className="text-xs text-gray-500">{move.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InventoryManagement;
