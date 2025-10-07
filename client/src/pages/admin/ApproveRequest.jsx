// src/pages/admin/ApproveRequest.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Check, FileText } from "lucide-react";
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
    return <div className="p-6 text-center text-gray-600">Request not found.</div>;
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
    <div className="p-6 bg-gray-50 min-h-screen font-[Inter]">
      <h1 className="text-2xl font-bold mb-4">Approve Emergency Request</h1>

      

      {/* Requester Info */}
      <div className="p-6 bg-white shadow rounded mb-6 space-y-2">
        <h3 className="text-xl font-bold mb-2">Requester Details</h3>
        <p><b>Name:</b> {request.user?.name || request.name || "N/A"}</p>
        <p><b>Phone:</b> {request.user?.phone || request.phone || "N/A"}</p>
        <p><b>Location:</b> {request.user?.location || request.location || "N/A"}</p>
        <p><b>Emergency Type:</b> {request.emergencyType || "N/A"}</p>
        <p><b>Urgency:</b> {request.urgency || "N/A"}</p>
        <p><b>Description:</b> {request.description || "N/A"}</p>
        <p className="text-sm text-gray-500">
          <b>Status:</b> {request.status || "Pending"}
        </p>
      </div>

      {/* Approval Section */}
      <div className="p-6 bg-white shadow rounded mb-6">
        {foodItems.length === 0 ? (
          <div className="text-center">
            <p className="text-gray-500 mb-4">This request does not include food items.</p>
            {request.status !== "Complete" && (
              <button
                onClick={handleApproveNonFood}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center mx-auto"
              >
                <Check className="h-4 w-4 mr-2" />
                Approve Request
              </button>
            )}
          </div>
        ) : (
          <>
            <h3 className="text-xl font-bold mb-2">Requested Food Items</h3>
            <ul className="space-y-3">
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
                  <li
                    key={idx}
                    className={`p-3 rounded flex justify-between items-center border ${
                      available
                        ? "border-green-300 bg-green-50"
                        : "border-red-300 bg-red-50"
                    }`}
                  >
                    <div>
                      <div className="font-medium text-gray-800">{item.name}</div>
                      <div className="text-sm text-gray-600">
                        Quantity requested: {item.quantity}
                      </div>
                      <div className="text-sm text-gray-600">
                        In inventory: {itemInInventory ? itemInInventory.currentStock : "—"}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span
                        className={`font-semibold ${
                          available ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        {available ? "Available" : "Not Available"}
                      </span>

                      {isApproved ? (
                        <span className="text-sm font-semibold text-blue-700 flex items-center">
                          <Check className="h-4 w-4 mr-1" /> Approved
                        </span>
                      ) : (
                        <button
                          disabled={!available || loading}
                          onClick={() => handleApproveItem(item.name, item.quantity)}
                          className={`px-3 py-1 rounded text-white text-sm flex items-center ${
                            available ? "bg-green-600 hover:bg-green-700" : "bg-gray-300 cursor-not-allowed"
                          }`}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {/* Back Button */}
      <div className="flex justify-end mt-4">
        <button
          onClick={() => navigate("/admin/emergency")}
          className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default ApproveRequest;