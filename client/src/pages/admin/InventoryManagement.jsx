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
  FileText,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useInventory } from "../../context/InventoryContext";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

  const [activeTab, setActiveTab] = useState("food");

  const handleDelete = async (id, name) => {
    const ok = window.confirm(`Delete "${name}" from inventory?`);
    if (!ok) return;
    await deleteInventoryItem(id);
  };

  const handleEdit = (item) => {
    setEditingItem(item.id);
    setFormData({
      name: item.name,
      currentStock: item.currentStock,
      minThreshold: item.minThreshold,
      status: item.status,
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    await updateInventoryItem(editingItem, formData);
    setEditingItem(null);
  };

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

  const filteredInventory = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      item.category?.toLowerCase() === activeTab
  );

// ---------------- PDF GENERATION ----------------
const generatePDF = () => {
  if (!inventory || inventory.length === 0) {
    alert("No inventory items to generate PDF.");
    return;
  }

  const doc = new jsPDF();
  
  // Add logo/image at the top (you'll need to add your logo to the project)
  // For now, I'll add a placeholder text for the logo
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text("Lanka Alert", 105, 20, { align: "center" });
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text("Inventory Management Report", 105, 28, { align: "center" });
  
  // Report metadata
  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString();
  
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`Report Generated: ${currentDate}, ${currentTime}`, 14, 40);
  doc.text(`System Admin: Dulmini Tharushika`, 14, 46);
  
  // Separate food and medical items
  const foodItems = inventory.filter((i) => i.category === "food");
  const medicalItems = inventory.filter((i) => i.category === "medical");
  
  // Table headers matching the sample format
  const columns = [
    { header: "Name", dataKey: "name" },
    { header: "Description", dataKey: "description" },
    { header: "Category", dataKey: "category" },
    { header: "Current Stock", dataKey: "currentStock" },
    { header: "Min Threshold", dataKey: "minThreshold" },
    { header: "Status", dataKey: "status" },
  ];

  let startY = 60;

  // Function to create table with proper styling
  const createTable = (items, title) => {
    if (items.length === 0) return startY;
    
    // Add section title
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text(title, 14, startY);
    startY += 8;

    const rows = items.map((item) => ({
      name: item.name,
      description: item.description || "No description available",
      category: item.category === "food" ? "Food" : "Medical",
      currentStock: item.currentStock.toString(),
      minThreshold: item.minThreshold.toString(),
      status: item.status,
    }));

    autoTable(doc, {
      startY: startY,
      head: [columns.map((col) => col.header)],
      body: rows.map((row) => columns.map((col) => row[col.dataKey])),
      theme: "grid",
      headStyles: { 
        fillColor: [54, 162, 235], 
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3,
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        overflow: 'linebreak'
      },
      columnStyles: {
        0: { cellWidth: 25 }, // Name
        1: { cellWidth: 45 }, // Description
        2: { cellWidth: 20 }, // Category
        3: { cellWidth: 20 }, // Current Stock
        4: { cellWidth: 20 }, // Min Threshold
        5: { cellWidth: 20 }, // Status
      },
      margin: { left: 14, right: 14 },
    });

    return doc.lastAutoTable.finalY + 15;
  };

  // Create tables for each category
  if (foodItems.length > 0) {
    startY = createTable(foodItems, "Food Items Inventory");
  }
  
  if (medicalItems.length > 0) {
    startY = createTable(medicalItems, "Medical Items Inventory");
  }

  // Add footer with verification line
  const finalY = doc.lastAutoTable.finalY + 20;
  if (finalY < 280) {
    doc.setFontSize(10);
    doc.text("Verified by: ______", 14, finalY);
    doc.text("Dulmini Tharushika", 14, finalY + 6);
    doc.text(`Page 1 of 1`, 105, finalY + 6, { align: "center" });
  }

  doc.save("LankaAlert_Inventory_Report.pdf");
};

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-indigo-50 to-blue-100 min-h-screen">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-indigo-900">Inventory Management</h1>
        <div className="flex space-x-3">
          <Link
            to="/admin/inventory/add"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Item
          </Link>

          {/* PDF Button */}
          <button
            onClick={generatePDF}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors"
          >
            <FileText className="h-5 w-5 mr-2" />
            Generate PDF
          </button>
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
          {recentMovements.slice(-10).map((move) => (
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
