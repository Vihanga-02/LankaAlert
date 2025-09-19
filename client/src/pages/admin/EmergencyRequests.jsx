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
} from "lucide-react";
import { useEmergency } from "../../context/EmergencyContext";

const statusColors = {
  Pending: "bg-orange-100 text-orange-800",
  Processing: "bg-blue-100 text-blue-800",
  Complete: "bg-green-100 text-green-800",
};

const EmergencyRequests = () => {
  const { allRequests, isLoading, handleUpdateRequest, handleDeleteRequest } =
    useEmergency();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading) setLoading(false);
  }, [isLoading]);

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading requests...</div>;
  }

  if (!allRequests || allRequests.length === 0) {
    return <div className="p-6 text-center text-gray-500">No emergency requests found.</div>;
  }

  // ✅ Sort requests by date (latest first)
  const sortedRequests = [...allRequests].sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
    return dateB - dateA; // latest first
  });

  // ✅ Always navigate to approve-request page
  const handleApproveSupply = (req) => {
    navigate(`/admin/approve-request/${req.id}`, { state: { request: req } });
  };

  const handleStatusUpdate = (req) => {
    const newStatus =
      req.status === "Pending"
        ? "Processing"
        : req.status === "Processing"
        ? "Complete"
        : "Complete";

    handleUpdateRequest(req.id, { status: newStatus });
  };

  return (
    <div className="p-6 font-[Inter] bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Emergency Requests</h1>
      <ul className="space-y-4">
        {sortedRequests.map((req) => {
          const statusClass = statusColors[req.status || "Pending"];
          const isActionable = req.status !== "Complete";

          // ✅ format createdAt safely
          let formattedDate = "N/A";
          if (req.createdAt) {
            if (req.createdAt.toDate) {
              formattedDate = req.createdAt.toDate().toLocaleString();
            } else {
              const parsed = new Date(req.createdAt);
              formattedDate = isNaN(parsed) ? "N/A" : parsed.toLocaleString();
            }
          }

          return (
            <li
              key={req.id}
              className="p-6 bg-white shadow-md rounded-lg border border-gray-200"
            >
              {/* Header */}
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

              {/* Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-base text-gray-600 mb-4">
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

              {req.needsHelp?.includes("food") &&
                req.foodItems &&
                req.foodItems.length > 0 && (
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

              <p className="text-base text-gray-700 mb-4">
                {req.description || "N/A"}
              </p>

              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-4">
                {isActionable && (
                  <button
                    onClick={() => handleApproveSupply(req)}
                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Approve Supply
                  </button>
                )}
                {isActionable && (
                  <button
                    onClick={() => handleStatusUpdate(req)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Update Status
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
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default EmergencyRequests;
