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


  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading requests...</div>;
  }

  if (!allRequests || allRequests.length === 0) {
    return <div className="p-6 text-center text-gray-500">No emergency requests found.</div>;
  }

  const sortedRequests = [...allRequests].sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
    return dateB - dateA;
  });

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
    <div className="p-6 font-sans bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900">Emergency Requests</h1>
      {/* PDF Button */}
      <div className="flex justify-right mb-6">
        <button
          onClick={generateAllRequestsPDF}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
        >
          📄 Generate PDF
        </button>
      </div>
      <ul className="space-y-6">
        {sortedRequests.map((req) => {
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
            <li
              key={req.id}
              className="p-6 bg-white shadow-lg rounded-xl border border-blue-100 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {req.emergencyType || "N/A"}
                    </h3>
                    <p className="text-lg font-semibold text-gray-800">
                      {req.name || req.user?.name || "N/A"}
                    </p>
                    <p className="text-sm text-gray-500 mt-1 flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>Requested on: {formattedDate}</span>
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${statusClass}`}
                >
                  {req.status || "Pending"}
                </span>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={editForm.location}
                      onChange={handleLocationChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={editForm.phone}
                      onChange={handlePhoneChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Needs Help */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Needs Help
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {helpNeedsOptions.map((need) => (
                        <label
                          key={need.id}
                          className={`flex items-center space-x-2 p-2 border rounded-lg cursor-pointer transition-colors ${
                            editForm.needsHelp.includes(need.id)
                              ? "border-blue-500 bg-blue-100"
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

                  {/* ALL INVENTORY ITEMS */}
                  <div className="mt-2 space-y-2 p-3 border border-gray-300 rounded-lg bg-white">
                    <p className="font-medium text-gray-700">Select Items</p>
                    {inventory.map((item) => {
                      const isFood = item.category === "food";
                      const isMedical = item.category === "medical";
                      const isSelected = isFood
                        ? editForm.foodItems.some((f) => f.name === item.name)
                        : editForm.medicalItems.some((m) => m.name === item.name);

                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between bg-white-50 p-2 rounded-lg border border-blue-100"
                        >
                          <div className="flex items-center space-x-2">
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
                            <span className="text-gray-800 font-medium">
                              {item.name}{" "}
                              <span className="text-xs text-gray-500">({item.category})</span>
                            </span>
                          </div>
                          {isSelected && (
                            <input
                              type="number"
                              min={1}
                              value={
                                isFood
                                  ? editForm.foodItems.find((f) => f.name === item.name)?.quantity ||
                                    1
                                  : editForm.medicalItems.find((m) => m.name === item.name)
                                      ?.quantity || 1
                              }
                              onChange={(e) => {
                                const qty = parseInt(e.target.value, 10) || 1;
                                isFood
                                  ? handleFoodQuantityChange(item.name, qty)
                                  : handleMedicalQuantityChange(item.name, qty);
                              }}
                              className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <>
                  {/* View mode */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-base text-gray-700 mb-4">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-blue-500" />
                      <span>{req.location || req.user?.location || "N/A"}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-orange-500" />
                      <span>{req.urgency || "N/A"}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-green-500" />
                      <span>{req.phone || req.user?.phone || "N/A"}</span>
                    </div>
                  </div>

                  <p className="text-base text-gray-700 mb-2">
                    <b>Needs Help:</b> {req.needsHelp?.join(", ") || "N/A"}
                  </p>

                  {req.foodItems?.length > 0 && (
                    <div className="text-base text-gray-700 mb-2">
                      <b>Food & Water Items:</b>
                      <ul className="list-disc list-inside mt-1">
                        {req.foodItems.map((item, idx) => (
                          <li key={idx}>
                            {item.name} - Quantity: {item.quantity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {req.medicalItems?.length > 0 && (
                    <div className="text-base text-gray-700 mb-2">
                      <b>Medical Items:</b>
                      <ul className="list-disc list-inside mt-1">
                        {req.medicalItems.map((item, idx) => (
                          <li key={idx}>
                            {item.name} - Quantity: {item.quantity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="text-base text-gray-700 mb-4">{req.description || "N/A"}</p>
                </>
              )}

              {/* Action buttons */}
              <div className="flex justify-end space-x-3 mt-4">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => handleSaveUpdate(req.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    {req.status !== "Complete" && (
                      <button
                        onClick={() =>
                          navigate(`/admin/approve-request/${req.id}`, { state: { request: req } })
                        }
                        className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Approve Supply
                      </button>
                    )}
                    {req.status !== "Complete" && (
                      <button
                        onClick={() => handleEditClick(req)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
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
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default EmergencyRequests;
