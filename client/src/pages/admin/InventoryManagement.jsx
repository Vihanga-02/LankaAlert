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
  Package,
  Activity,
  TrendingUp,
  TrendingDown,
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

  // Calculate stats
  const totalItems = inventory.length;
  const foodItems = inventory.filter(item => item.category === "food").length;
  const medicalItems = inventory.filter(item => item.category === "medical").length;
  const lowStockItems = inventory.filter(item => item.status === "Low Stock").length;
  const outOfStockItems = inventory.filter(item => item.status === "Out of Stock").length;

// ---------------- PDF GENERATION ----------------
const generatePDF = () => {
  if (!inventory || inventory.length === 0) {
    alert("No inventory items to generate PDF.");
    return;
  }

  const doc = new jsPDF("landscape", "pt", "a4");

  // Load logo from public folder
  const logoUrl = `${window.location.origin}/logo.png`;
  const img = new Image();
  img.src = logoUrl;

  img.onload = () => {
    // ---- Header ----
    doc.addImage(img, "PNG", 40, 20, 40, 40);
    doc.setFontSize(24);
    doc.setTextColor(30, 30, 30);
    doc.text("Lanka Alert", 90, 45);

    doc.setFontSize(14);
    doc.setTextColor(50, 50, 50);
    doc.text("Inventory Management Report", 90, 65);

    // Report metadata
    const reportDate = new Date().toLocaleString();
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Report Generated: ${reportDate}`, 90, 80);
    doc.text("System Admin: Dulmini Tharushika", 400, 80);

    // ---- Separate food and medical items ----
    const foodItems = inventory.filter((i) => i.category === "food");
    const medicalItems = inventory.filter((i) => i.category === "medical");

    // ---- Table Columns (no description) ----
    const columns = [
      { header: "Name", dataKey: "name" },
      { header: "Category", dataKey: "category" },
      { header: "Current Stock", dataKey: "currentStock" },
      { header: "Min Threshold", dataKey: "minThreshold" },
      { header: "Status", dataKey: "status" },
    ];

    let startY = 100;

    // ---- Function to create a table section ----
    const createTable = (items, title) => {
      if (items.length === 0) return startY;

      // Section title
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text(title, 40, startY);
      startY += 10;

      const rows = items.map((item) => ({
        name: item.name,
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
        styles: {
          fontSize: 9,
          cellPadding: 4,
          overflow: "linebreak",
          valign: "middle",
        },
        headStyles: {
          fillColor: [0, 123, 255],
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          0: { cellWidth: 140 }, // Name
          1: { cellWidth: 100 }, // Category
          2: { cellWidth: 100 }, // Current Stock
          3: { cellWidth: 100 }, // Min Threshold
          4: { cellWidth: 100 }, // Status
        },
        margin: { top: 100, left: 40, right: 40 },
      });

      return doc.lastAutoTable.finalY + 20;
    };

    // ---- Add food + medical tables ----
    if (foodItems.length > 0) {
      startY = createTable(foodItems, " Food Items Inventory");
    }
    if (medicalItems.length > 0) {
      startY = createTable(medicalItems, " Medical Items Inventory");
    }

    // ---- Footer with Page Numbers ----
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() - 60,
        doc.internal.pageSize.getHeight() - 10
      );
    }



    // ---- Save PDF ----
    doc.save("LankaAlert_Inventory_Report.pdf");
  };

  img.onerror = () => {
    console.error("Failed to load logo for PDF");
  };
};



  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
            <p className="mt-2 text-gray-600">Manage your emergency supplies and inventory items</p>
          </div>
          <div className="flex space-x-3">
            <Link
              to="/admin/inventory/add"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Item
            </Link>
            <button
              onClick={generatePDF}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FileText className="h-5 w-5 mr-2" />
              Generate PDF
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-500">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-semibold text-gray-900">{totalItems}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-500">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Food Items</p>
              <p className="text-2xl font-semibold text-gray-900">{foodItems}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-red-500">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Medical Items</p>
              <p className="text-2xl font-semibold text-gray-900">{medicalItems}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-yellow-500">
              <TrendingDown className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-semibold text-gray-900">{lowStockItems}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-red-500">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="text-2xl font-semibold text-gray-900">{outOfStockItems}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("food")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "food"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Food Items ({foodItems})
            </button>
            <button
              onClick={() => setActiveTab("medical")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "medical"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Medical Items ({medicalItems})
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative lg:w-96">
            <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${activeTab} inventory...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {activeTab === "food" ? "Food Items" : "Medical Items"} Inventory
          </h3>
          <p className="text-sm text-gray-600">
            Showing {filteredInventory.length} of {inventory.filter(item => item.category === activeTab).length} items
          </p>
        </div>
        
        {filteredInventory.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-500">
              {searchQuery ? "Try adjusting your search criteria." : `No ${activeTab} items in inventory.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-900">Item Name</th>
                  <th className="px-6 py-3 font-medium text-gray-900">Current Stock</th>
                  <th className="px-6 py-3 font-medium text-gray-900">Min Threshold</th>
                  <th className="px-6 py-3 font-medium text-gray-900">Status</th>
                  <th className="px-6 py-3 font-medium text-gray-900 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInventory.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg mr-3 ${
                          item.category === "food" ? "bg-green-100" : "bg-red-100"
                        }`}>
                          <Package className={`h-5 w-5 ${
                            item.category === "food" ? "text-green-600" : "text-red-600"
                          }`} />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500 capitalize">{item.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-lg font-semibold text-gray-900">{item.currentStock}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{item.minThreshold}</td>
                    <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm transition-colors"
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm transition-colors"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Update Form Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Update Item</h2>
              <p className="text-sm text-gray-600">Modify the inventory item details</p>
            </div>
            <form onSubmit={handleUpdateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Stock</label>
                <input
                  type="number"
                  name="currentStock"
                  value={formData.currentStock}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Threshold</label>
                <input
                  type="number"
                  name="minThreshold"
                  value={formData.minThreshold}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>In Stock</option>
                  <option>Low Stock</option>
                  <option>Out of Stock</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recent Movements */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Movements</h2>
          <span className="text-sm text-gray-500">Last 10 activities</span>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {recentMovements.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No recent movements</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {recentMovements.slice(-10).map((move) => (
                <div
                  key={move.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      move.type === "added" ? "bg-green-100" : "bg-red-100"
                    }`}>
                      {move.type === "added" ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {move.type === "added" ? "Added" : "Removed"} {move.quantity} {move.item}
                      </p>
                      <p className="text-xs text-gray-500">{move.date}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    move.type === "added" 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  }`}>
                    {move.type === "added" ? "Addition" : "Removal"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryManagement;

