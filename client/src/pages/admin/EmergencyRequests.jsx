// src/pages/admin/EmergencyRequests.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Phone,
  MapPin,
  AlertTriangle,
  Package,
  Pencil,
  Trash2,
  Clock,
  Home,
  Heart,
  FileText,
  Search,
  Filter,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useEmergency } from "../../context/EmergencyContext";
import { useInventory } from "../../context/InventoryContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


const statusColors = {
  Pending: "bg-orange-100 text-orange-800",
  Processing: "bg-blue-100 text-blue-800",
  Complete: "bg-green-100 text-green-800",
};

const helpNeedsOptions = [
  { id: "rescue", name: "Rescue Operations", icon: <AlertTriangle className="h-5 w-5" /> },
  { id: "medical", name: "Medical Assistance", icon: <Heart className="h-5 w-5" /> },
  { id: "shelter", name: "Temporary Shelter", icon: <Home className="h-5 w-5" /> },
  { id: "transport", name: "Transportation", icon: <MapPin className="h-5 w-5" /> },
  { id: "food", name: "Food & Water", icon: <Users className="h-5 w-5" /> },
];

const EmergencyRequests = () => {
  const { allRequests, isLoading, handleUpdateRequest, handleDeleteRequest } = useEmergency();
  const { inventory } = useInventory();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [editingRequestId, setEditingRequestId] = useState(null);
  const [editForm, setEditForm] = useState({
    location: "",
    phone: "",
    needsHelp: [],
    foodItems: [],
    medicalItems: [],
  });

  useEffect(() => {
    if (!isLoading) setLoading(false);
  }, [isLoading]);

  // ---------------- PDF Generation ----------------
const generateAllRequestsPDF = () => {
  if (!allRequests || allRequests.length === 0) {
    alert("No requests to generate PDF.");
    return;
  }

  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text("Lanka Alert", 105, 20, { align: "center" });

  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text("Emergency Requests Summary", 105, 30, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Report Generated: ${new Date().toLocaleString()}`, 105, 40, { align: "center" });

  doc.text("System Admin: Dulmini Tharushika", 105, 47, { align: "center" });

  try {
    const logoUrl = `${window.location.origin}/logo.png`;
    doc.addImage(logoUrl, "PNG", 20, 10, 15, 15);
  } catch (err) {
    console.log("Logo not found, skipping...");
  }

  const columns = [
    { header: "Name", dataKey: "name" },
    { header: "Phone", dataKey: "phone" },
    { header: "Location", dataKey: "location" },
    { header: "Emergency Type", dataKey: "emergencyType" },
    { header: "Urgency", dataKey: "urgency" },
    { header: "Status", dataKey: "status" },
    { header: "Requested At", dataKey: "createdAt" },
    { header: "Needs Help", dataKey: "needsHelp" },
    { header: "Food Items", dataKey: "foodItems" },
    { header: "Medical Items", dataKey: "medicalItems" },
  ];

  const rows = allRequests.map((req) => ({
    name: req.name || req.user?.name || "N/A",
    phone: req.phone || req.user?.phone || "N/A",
    location: req.location || req.user?.location || "N/A",
    emergencyType: req.emergencyType || "N/A",
    urgency: req.urgency ? req.urgency.charAt(0).toUpperCase() + req.urgency.slice(1) : "N/A",
    status: req.status || "Pending",
    createdAt: req.createdAt?.toDate ? req.createdAt.toDate().toLocaleString() : "Unknown",
    needsHelp: req.needsHelp?.join(", ") || "N/A",
    foodItems: req.foodItems?.map((f) => `${f.name} (Qty: ${f.quantity})`).join("; ") || "N/A",
    medicalItems: req.medicalItems?.map((m) => `${m.name} (Qty: ${m.quantity})`).join("; ") || "N/A",
  }));

  autoTable(doc, {
    startY: 50,
    head: [columns.map((c) => c.header)],
    body: rows.map((row) => columns.map((c) => row[c.dataKey])),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [54, 162, 235], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    theme: "grid",
    margin: { top: 50 },
  });
  const finalY = doc.lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Verified by: ______", 20, finalY + 10);
  doc.text("Dulmini Tharushika", 20, finalY + 20);
  
  doc.text(`Page 1 of 1`, 195, finalY + 20, { align: "right" });

  doc.save(`LankaAlert_All_Requests_${new Date().toISOString().split("T")[0]}.pdf`);
};
// ------------------------------------------------


  // Filter and sort requests
  const filteredRequests = allRequests?.filter((req) => {
    const matchesSearch = 
      req.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.emergencyType?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Handle status filtering with case-insensitive comparison and handle different status formats
    let matchesStatus = true;
    if (statusFilter !== "all") {
      const requestStatus = req.status?.toLowerCase() || "";
      const filterStatus = statusFilter.toLowerCase();
      
      // Handle different possible status values
      if (filterStatus === "pending") {
        matchesStatus = requestStatus === "pending" || requestStatus === "";
      } else if (filterStatus === "processing") {
        matchesStatus = requestStatus === "processing" || requestStatus === "in progress";
      } else if (filterStatus === "complete") {
        matchesStatus = requestStatus === "complete" || requestStatus === "completed";
      }
    }
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Helper functions for status counting
  const getStatusCount = (statusType) => {
    if (!allRequests) return 0;
    
    return allRequests.filter(r => {
      const status = r.status?.toLowerCase() || "";
      
      switch (statusType) {
        case "pending":
          return status === "pending" || status === "";
        case "processing":
          return status === "processing" || status === "in progress";
        case "complete":
          return status === "complete" || status === "completed";
        default:
          return false;
      }
    }).length;
  };

  // Debug: Log unique status values for troubleshooting
  React.useEffect(() => {
    if (allRequests && allRequests.length > 0) {
      const uniqueStatuses = [...new Set(allRequests.map(req => req.status))];
      console.log("Available status values in data:", uniqueStatuses);
    }
  }, [allRequests]);

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
    return dateB - dateA;
  });

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading emergency requests...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!allRequests || allRequests.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No emergency requests found</h3>
          <p className="text-gray-500">There are currently no emergency requests in the system.</p>
        </div>
      </div>
    );
  }

  const handleEditClick = (req) => {
    setEditingRequestId(req.id);
    setEditForm({
      location: req.location || "",
      phone: req.phone || "",
      needsHelp: req.needsHelp || [],
      foodItems: req.foodItems?.map((f) => ({ name: f.name, quantity: f.quantity })) || [],
      medicalItems: req.medicalItems?.map((m) => ({ name: m.name, quantity: m.quantity })) || [],
    });
  };

  const handleLocationChange = (e) => {
    const value = e.target.value;
    if (/[^a-zA-Z\s,.-]/.test(value)) {
      alert("Location can only contain letters, spaces, commas, periods, and hyphens.");
      return;
    }
    setEditForm((prev) => ({ ...prev, location: value }));
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    if (/[^0-9]/.test(value)) {
      alert("Phone number can only contain digits.");
      return;
    }
    setEditForm((prev) => ({ ...prev, phone: value }));
  };

  const handleNeedToggle = (needId) => {
    setEditForm((prev) => ({
      ...prev,
      needsHelp: prev.needsHelp.includes(needId)
        ? prev.needsHelp.filter((id) => id !== needId)
        : [...prev.needsHelp, needId],
    }));
  };

  const handleFoodToggle = (itemName) => {
    if (editForm.foodItems.some((f) => f.name === itemName)) {
      setEditForm({
        ...editForm,
        foodItems: editForm.foodItems.filter((f) => f.name !== itemName),
      });
    } else {
      setEditForm({
        ...editForm,
        foodItems: [...editForm.foodItems, { name: itemName, quantity: 1 }],
      });
    }
  };

  const handleMedicalToggle = (itemName) => {
    if (editForm.medicalItems.some((f) => f.name === itemName)) {
      setEditForm({
        ...editForm,
        medicalItems: editForm.medicalItems.filter((f) => f.name !== itemName),
      });
    } else {
      setEditForm({
        ...editForm,
        medicalItems: [...editForm.medicalItems, { name: itemName, quantity: 1 }],
      });
    }
  };

  const handleFoodQuantityChange = (itemName, qty) => {
    setEditForm({
      ...editForm,
      foodItems: editForm.foodItems.map((f) =>
        f.name === itemName ? { ...f, quantity: qty } : f
      ),
    });
  };

  const handleMedicalQuantityChange = (itemName, qty) => {
    setEditForm({
      ...editForm,
      medicalItems: editForm.medicalItems.map((f) =>
        f.name === itemName ? { ...f, quantity: qty } : f
      ),
    });
  };

  const handleSaveUpdate = (reqId) => {
    handleUpdateRequest(reqId, { ...editForm });
    setEditingRequestId(null);
  };

  const handleCancelEdit = () => {
    setEditingRequestId(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Emergency Requests</h1>
            <p className="mt-2 text-gray-600">Manage and respond to emergency assistance requests</p>
          </div>
          <button
            onClick={generateAllRequestsPDF}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FileText className="h-5 w-5 mr-2" />
            Generate PDF
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search requests by name, location, or emergency type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">
                All Status ({allRequests?.length || 0})
              </option>
              <option value="Pending">
                Pending ({getStatusCount("pending")})
              </option>
              <option value="Processing">
                Processing ({getStatusCount("processing")})
              </option>
              <option value="Complete">
                Complete ({getStatusCount("complete")})
              </option>
            </select>
          </div>
        </div>
        
        {/* Filter Status Indicator */}
        {(searchQuery || statusFilter !== "all") && (
          <div className="mt-4 flex items-center space-x-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            {searchQuery && (
              <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Search: "{searchQuery}"
                <button
                  onClick={() => setSearchQuery("")}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
            {statusFilter !== "all" && (
              <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Status: {statusFilter}
                <button
                  onClick={() => setStatusFilter("all")}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-orange-500">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-2xl font-semibold text-gray-900">{allRequests?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-yellow-500">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">
                {getStatusCount("pending")}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-500">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Processing</p>
              <p className="text-2xl font-semibold text-gray-900">
                {getStatusCount("processing")}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-500">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {getStatusCount("complete")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-6">
        {sortedRequests.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          sortedRequests.map((req) => {
            const statusClass = statusColors[req.status || "Pending"];
            let formattedDate = "N/A";
            if (req.createdAt) {
              if (req.createdAt.toDate) formattedDate = req.createdAt.toDate().toLocaleString();
              else {
                const parsed = new Date(req.createdAt);
                formattedDate = isNaN(parsed) ? "N/A" : parsed.toLocaleString();
              }
            }

            const isEditing = editingRequestId === req.id;

            return (
              <div
                key={req.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-red-100">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {req.emergencyType || "Emergency Request"}
                        </h3>
                        <p className="text-lg font-semibold text-gray-800">
                          {req.name || req.user?.name || "Anonymous"}
                        </p>
                        <p className="text-sm text-gray-500 mt-1 flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span>Requested: {formattedDate}</span>
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${statusClass}`}
                    >
                      {req.status || "Pending"}
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Edit Request Details</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Location */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Location
                          </label>
                          <input
                            type="text"
                            name="location"
                            value={editForm.location}
                            onChange={handleLocationChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        {/* Phone */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                          </label>
                          <input
                            type="text"
                            name="phone"
                            value={editForm.phone}
                            onChange={handlePhoneChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Needs Help */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Needs Help
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {helpNeedsOptions.map((need) => (
                            <label
                              key={need.id}
                              className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                                editForm.needsHelp.includes(need.id)
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={editForm.needsHelp.includes(need.id)}
                                onChange={() => handleNeedToggle(need.id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              {need.icon}
                              <span className="text-sm font-medium">{need.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Inventory Items */}
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <h5 className="font-medium text-gray-900 mb-4">Select Items from Inventory</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                          {inventory.map((item) => {
                            const isFood = item.category === "food";
                            const isMedical = item.category === "medical";
                            const isSelected = isFood
                              ? editForm.foodItems.some((f) => f.name === item.name)
                              : editForm.medicalItems.some((m) => m.name === item.name);

                            return (
                              <div
                                key={item.id}
                                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                  isSelected 
                                    ? "border-blue-500 bg-blue-50" 
                                    : "border-gray-200 hover:bg-gray-50"
                                }`}
                              >
                                <div className="flex items-center space-x-3">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() =>
                                      isFood
                                        ? handleFoodToggle(item.name)
                                        : handleMedicalToggle(item.name)
                                    }
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <div>
                                    <span className="text-gray-900 font-medium">
                                      {item.name}
                                    </span>
                                    <span className="text-xs text-gray-500 ml-2 capitalize">
                                      ({item.category})
                                    </span>
                                  </div>
                                </div>
                                {isSelected && (
                                  <input
                                    type="number"
                                    min={1}
                                    value={
                                      isFood
                                        ? editForm.foodItems.find((f) => f.name === item.name)?.quantity || 1
                                        : editForm.medicalItems.find((m) => m.name === item.name)?.quantity || 1
                                    }
                                    onChange={(e) => {
                                      const qty = parseInt(e.target.value, 10) || 1;
                                      isFood
                                        ? handleFoodQuantityChange(item.name, qty)
                                        : handleMedicalQuantityChange(item.name, qty);
                                    }}
                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Form Actions */}
                      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => handleSaveUpdate(req.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* View mode */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <MapPin className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-sm text-gray-600">Location</p>
                            <p className="font-medium text-gray-900">{req.location || req.user?.location || "N/A"}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <Users className="h-5 w-5 text-orange-600" />
                          <div>
                            <p className="text-sm text-gray-600">Urgency</p>
                            <p className="font-medium text-gray-900">{req.urgency || "N/A"}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <Phone className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="text-sm text-gray-600">Phone</p>
                            <p className="font-medium text-gray-900">{req.phone || req.user?.phone || "N/A"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h5 className="font-medium text-gray-900 mb-2">Needs Help</h5>
                          <p className="text-gray-700">{req.needsHelp?.join(", ") || "N/A"}</p>
                        </div>

                        {req.foodItems?.length > 0 && (
                          <div className="p-4 bg-green-50 rounded-lg">
                            <h5 className="font-medium text-gray-900 mb-2">Food & Water Items</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {req.foodItems.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center p-2 bg-white rounded border">
                                  <span className="font-medium">{item.name}</span>
                                  <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {req.medicalItems?.length > 0 && (
                          <div className="p-4 bg-red-50 rounded-lg">
                            <h5 className="font-medium text-gray-900 mb-2">Medical Items</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {req.medicalItems.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center p-2 bg-white rounded border">
                                  <span className="font-medium">{item.name}</span>
                                  <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {req.description && (
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <h5 className="font-medium text-gray-900 mb-2">Description</h5>
                            <p className="text-gray-700">{req.description}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Action buttons */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    {req.status !== "Complete" && (
                      <button
                        onClick={() =>
                          navigate(`/admin/approve-request/${req.id}`, { state: { request: req } })
                        }
                        className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Approve Supply
                      </button>
                    )}
                    {req.status !== "Complete" && (
                      <button
                        onClick={() => handleEditClick(req)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Update
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteRequest(req.id)}
                      className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default EmergencyRequests;
