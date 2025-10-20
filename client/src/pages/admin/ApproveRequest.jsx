// src/pages/admin/ApproveRequest.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { 
  Check, 
  FileText, 
  ArrowLeft, 
  User, 
  Phone, 
  MapPin, 
  AlertTriangle, 
  Clock, 
  Package,
  CheckCircle,
  XCircle,
  Send
} from "lucide-react";
import { useInventory } from "../../context/InventoryContext";
import { useEmergency } from "../../context/EmergencyContext";
import { sendSms } from "../../services/smsService";



const ApproveRequest = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();

  const { inventory, updateInventoryItem } = useInventory();
  const { allRequests, handleUpdateRequest, isLoading: requestsLoading } =
    useEmergency();

  const [request, setRequest] = useState(location.state?.request ?? null);
  const [approvedItems, setApprovedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [smsSent, setSmsSent] = useState(false);

  const normalizedFoodItems = (r) => {
    if (!r?.foodItems) return [];
    return r.foodItems.map((it) =>
      typeof it === "string"
        ? { name: it, quantity: 1 }
        : { name: it.name, quantity: it.quantity ?? 1 }
    );
  };

  useEffect(() => {
    if (!request && !requestsLoading && allRequests && id) {
      const found = allRequests.find((r) => String(r.id) === String(id));
      if (found) setRequest(found);
    }
  }, [request, id, allRequests, requestsLoading]);

  useEffect(() => {
    if (!request) return;
    if (request.status === "Complete") {
      const names = normalizedFoodItems(request).map((f) =>
        f.name.toLowerCase()
      );
      setApprovedItems(names);
    }
  }, [request]);

  if (!request) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Request not found</h3>
          <p className="text-gray-500 mb-6">The emergency request you're looking for could not be found.</p>
          <button
            onClick={() => navigate("/admin/emergency")}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Emergency Requests
          </button>
        </div>
      </div>
    );
  }

  const handleApproveNonFood = async () => {
    try {
      setLoading(true);
      await handleUpdateRequest(request.id, { status: "Complete" });
      setRequest((prev) => ({ ...prev, status: "Complete" }));
      // Send SMS to requester
      const phone = request.phone || request.user?.phone;
      if (phone) {
        const message = `Lanka Alert: Your emergency request (${request.emergencyType || "General"}) has been approved. Our team is processing assistance. Stay safe.`;
        try { await sendSms(phone, message); } catch (e) { console.error("SMS send failed", e); }
      }
      alert("Request approved and marked as Complete.");
      navigate("/admin/emergency");
    } catch (err) {
      console.error("Approve non-food error:", err);
      alert("Failed to approve request.");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveItem = async (itemName, quantityRequested) => {
    const itemKey = itemName.toLowerCase();
    if (approvedItems.includes(itemKey)) return;

    const itemInInventory = inventory.find(
      (i) => i.name?.toLowerCase() === itemKey
    );

    if (!itemInInventory) {
      alert(`${itemName} is not found in inventory.`);
      return;
    }

    if (itemInInventory.currentStock < quantityRequested) {
      alert(
        `${itemName} does not have enough stock. Available: ${itemInInventory.currentStock}`
      );
      return;
    }

    try {
      setLoading(true);

      await updateInventoryItem(itemInInventory.id, {
        currentStock: itemInInventory.currentStock - quantityRequested,
      });

      const newApproved = [...approvedItems, itemKey];
      setApprovedItems(newApproved);

      const requestedNames = normalizedFoodItems(request).map((f) =>
        f.name.toLowerCase()
      );
      const allApproved = requestedNames.every((n) => newApproved.includes(n));

      if (allApproved) {
        await handleUpdateRequest(request.id, { status: "Complete" });
        setRequest((prev) => ({ ...prev, status: "Complete" }));
        // Send SMS to requester
        const phone = request.phone || request.user?.phone;
        if (phone) {
          const message = `Lanka Alert: Your emergency request (${request.emergencyType || "General"}) has been approved. Supplies are being arranged. Stay safe.`;
          try { await sendSms(phone, message); } catch (e) { console.error("SMS send failed", e); }
        }
        alert("All items approved — request marked as Complete.");
      } else {
        alert(`${itemName} approved. Remaining stock updated.`);
      }
    } catch (err) {
      console.error("Approve error:", err);
      alert("Failed to approve item.");
    } finally {
      setLoading(false);
    }
  };

  const foodItems = normalizedFoodItems(request);




  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => navigate("/admin/emergency")}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to emergency requests"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Approve Emergency Request</h1>
            <p className="mt-2 text-gray-600">Review and approve emergency assistance request</p>
          </div>
        </div>
      </div>

      {/* Request Status Banner */}
      <div className={`mb-6 p-4 rounded-lg border-l-4 ${
        request.status === "Complete" 
          ? "bg-green-50 border-green-400" 
          : request.status === "Processing"
          ? "bg-blue-50 border-blue-400"
          : "bg-orange-50 border-orange-400"
      }`}>
        <div className="flex items-center">
          <div className={`p-2 rounded-lg mr-3 ${
            request.status === "Complete" 
              ? "bg-green-100" 
              : request.status === "Processing"
              ? "bg-blue-100"
              : "bg-orange-100"
          }`}>
            <AlertTriangle className={`h-5 w-5 ${
              request.status === "Complete" 
                ? "text-green-600" 
                : request.status === "Processing"
                ? "text-blue-600"
                : "text-orange-600"
            }`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Request Status: {request.status || "Pending"}
            </h3>
            <p className="text-sm text-gray-600">
              {request.status === "Complete" 
                ? "This request has been completed and approved."
                : request.status === "Processing"
                ? "This request is currently being processed."
                : "This request is pending approval."}
            </p>
          </div>
        </div>
      </div>

      {/* Requester Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Requester Information</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium text-gray-900">{request.user?.name || request.name || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Phone className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium text-gray-900">{request.user?.phone || request.phone || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <MapPin className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-medium text-gray-900">{request.user?.location || request.location || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Emergency Type</p>
                <p className="font-medium text-gray-900">{request.emergencyType || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Urgency</p>
                <p className="font-medium text-gray-900">{request.urgency || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gray-100">
                <FileText className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Description</p>
                <p className="font-medium text-gray-900">{request.description || "N/A"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Supply Approval</h3>
          <p className="text-sm text-gray-600">Review and approve requested items from inventory</p>
        </div>
        
        <div className="p-6">
          {foodItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Food Items Requested</h4>
              <p className="text-gray-500 mb-6">This request does not include any food or water items.</p>
              {request.status !== "Complete" && (
                <button
                  onClick={handleApproveNonFood}
                  disabled={loading}
                  className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Approve Request
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-2">Requested Food Items</h4>
                <p className="text-sm text-gray-600">Review each item and approve based on inventory availability</p>
              </div>
              
              <div className="space-y-4">
                {foodItems.map((item, idx) => {
                  const itemKey = item.name.toLowerCase();
                  const itemInInventory = inventory.find(
                    (i) => i.name?.toLowerCase() === itemKey
                  );
                  const available =
                    itemInInventory &&
                    itemInInventory.currentStock >= item.quantity;
                  const isApproved =
                    approvedItems.includes(itemKey) ||
                    request.status === "Complete";

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        isApproved
                          ? "border-green-300 bg-green-50"
                          : available
                          ? "border-blue-300 bg-blue-50"
                          : "border-red-300 bg-red-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className={`p-2 rounded-lg ${
                              isApproved
                                ? "bg-green-100"
                                : available
                                ? "bg-blue-100"
                                : "bg-red-100"
                            }`}>
                              <Package className={`h-5 w-5 ${
                                isApproved
                                  ? "text-green-600"
                                  : available
                                  ? "text-blue-600"
                                  : "text-red-600"
                              }`} />
                            </div>
                            <div>
                              <h5 className="font-semibold text-gray-900">{item.name}</h5>
                              <p className="text-sm text-gray-600">
                                Requested: {item.quantity} units
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Available in inventory:</span>
                              <span className={`ml-2 font-medium ${
                                itemInInventory ? "text-gray-900" : "text-red-600"
                              }`}>
                                {itemInInventory ? itemInInventory.currentStock : "Not found"}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Status:</span>
                              <span className={`ml-2 font-medium ${
                                isApproved
                                  ? "text-green-600"
                                  : available
                                  ? "text-blue-600"
                                  : "text-red-600"
                              }`}>
                                {isApproved ? "Approved" : available ? "Available" : "Not Available"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="ml-4">
                          {isApproved ? (
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="h-5 w-5 mr-2" />
                              <span className="font-medium">Approved</span>
                            </div>
                          ) : (
                            <button
                              disabled={!available || loading}
                              onClick={() => handleApproveItem(item.name, item.quantity)}
                              className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors ${
                                available 
                                  ? "bg-green-600 hover:bg-green-700" 
                                  : "bg-gray-300 cursor-not-allowed"
                              }`}
                            >
                              <Check className="h-4 w-4 mr-1 inline" />
                              Approve
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate("/admin/emergency")}
          className="inline-flex items-center px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Emergency Requests
        </button>
        
        {request.status === "Complete" && (
          <div className="flex items-center text-green-600">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span className="font-medium">Request Completed</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApproveRequest;