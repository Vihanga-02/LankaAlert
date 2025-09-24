// src/pages/PreviousRequests.jsx
import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import {
  AlertTriangle,
  Clock,
  MapPin,
  Phone,
  User,
  Trash2,
  FileText,
} from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const PreviousRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "emergencyRequests"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRequests(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white shadow-lg rounded-lg p-6 max-w-md w-full text-center">
          <AlertTriangle className="h-10 w-10 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600">
            Please log in to view your previous emergency requests.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading your requests...</p>
      </div>
    );
  }

  // Function to delete a request
  const handleDelete = async (id) => {
    const confirm = window.confirm("Are you sure you want to delete this request?");
    if (!confirm) return;

    try {
      await deleteDoc(doc(db, "emergencyRequests", id));
      // Remove from local state immediately without page refresh
      setRequests(prev => prev.filter(req => req.id !== id));
      alert("Request deleted successfully.");
    } catch (error) {
      console.error("Error deleting request:", error);
      alert("Failed to delete request. Please try again.");
    }
  };

// Generate PDF with logo from public folder (No Description column)
const generatePDF = () => {
  if (requests.length === 0) {
    alert("No requests to generate PDF.");
    return;
  }

  const doc = new jsPDF();
  
  // Set document properties
  doc.setProperties({
    title: "LankaAlert - Emergency Requests Report",
    subject: "Emergency Requests Summary",
    author: "LankaAlert System",
  });

  // Add logo from public folder
  const logoUrl = `${window.location.origin}/logo.png`;
  
  // Create an image object to handle loading
  const img = new Image();
  img.src = logoUrl;
  img.crossOrigin = "Anonymous"; // Handle CORS if needed

  img.onload = function() {
    // Add logo to the PDF
    doc.addImage(img, 'PNG', 20, 10, 15, 15);
    
    // Continue with the rest of the PDF content
    addPDFContent(doc);
  };

  img.onerror = function() {
    // If logo fails to load, continue without it
    console.log('Logo not available, proceeding without it');
    addPDFContent(doc);
  };

  const addPDFContent = (doc) => {
    // Add header section
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("Lanka Alert", 105, 20, { align: "center" });
    
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text("Emergency Requests Report", 105, 30, { align: "center" });
    
    // Add report generation info
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(`Report Generated: ${new Date().toLocaleString()}`, 105, 40, { align: "center" });
    
    // Add system admin info
    doc.text("System Admin: Dulmini Tharushika", 105, 47, { align: "center" });

    // Define table columns (no description field)
    const columns = [
      { header: "Name", dataKey: "name" },
      { header: "Phone", dataKey: "phone" },
      { header: "Location", dataKey: "location" },
      { header: "Emergency Type", dataKey: "emergencyType" },
      { header: "Urgency", dataKey: "urgency" },
      { header: "Status", dataKey: "status" },
      { header: "Requested At", dataKey: "createdAt" },
    ];

    // Prepare table data
    const rows = requests.map((req) => ({
      name: req.name || "N/A",
      phone: req.phone || "N/A",
      location: req.location || "N/A",
      emergencyType: req.emergencyType || "N/A",
      urgency: req.urgency ? req.urgency.charAt(0).toUpperCase() + req.urgency.slice(1) : "N/A",
      status: req.status || "pending",
      createdAt: req.createdAt?.toDate
        ? req.createdAt.toDate().toLocaleString()
        : "Unknown",
    }));

    // Create the table
    autoTable(doc, {
      startY: 55,
      head: [columns.map((col) => col.header)],
      body: rows.map((row) => columns.map((col) => row[col.dataKey])),
      styles: { 
        fontSize: 9, 
        cellPadding: 3, 
        lineWidth: 0.1,
        lineColor: [200, 200, 200]
      },
      headStyles: { 
        fillColor: [54, 162, 235], 
        textColor: 255, 
        lineWidth: 0.1,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      theme: "grid",
      margin: { top: 55 },
    });

    // Add footer with signature line
    const finalY = doc.lastAutoTable.finalY + 10;
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Verified by: ______", 20, finalY + 10);
    doc.text("Dulmini Tharushika", 20, finalY + 20);
    
    doc.text(`Page 1 of 1`, 195, finalY + 20, { align: "right" });

    // Save the PDF
    doc.save(`LankaAlert_Requests_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };
};


  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 text-center">
            Your Previous Emergency Requests
          </h1>
          <button
            onClick={generatePDF}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate PDF
          </button>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">
            No previous requests found.
          </div>
        ) : (
          <div className="space-y-6">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-white border border-gray-200 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
              >
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {req.emergencyType || "Emergency"}
                  </h2>
                  <span
                    className={`px-3 py-1 text-sm rounded-full font-medium ${
                      req.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {req.status || "pending"}
                  </span>
                </div>

                {/* Personal Info */}
                <div className="mb-3 text-sm text-gray-700 space-y-1">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>
                      <strong>Name:</strong> {req.name || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>
                      <strong>Phone:</strong> {req.phone || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Location & Time */}
                <div className="flex flex-wrap gap-4 mb-3 text-sm text-gray-600">
                  <span className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>
                      <strong>Location:</strong> {req.location || "N/A"}
                    </span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      <strong>Requested At:</strong>{" "}
                      {req.createdAt?.toDate
                        ? req.createdAt.toDate().toLocaleString()
                        : "Unknown time"}
                    </span>
                  </span>
                </div>

                {/* Urgency */}
                <div className="mb-3 text-sm">
                  <span className="font-semibold text-gray-800">Urgency:</span>{" "}
                  <span>
                    {req.urgency
                      ? req.urgency.charAt(0).toUpperCase() + req.urgency.slice(1)
                      : "N/A"}
                  </span>
                </div>

                {/* Help Needed */}
                {req.needsHelp?.length > 0 && (
                  <div className="mb-2 text-sm">
                    <span className="font-semibold text-gray-800">Help Needed:</span>{" "}
                    {req.needsHelp.join(", ")}
                  </div>
                )}

                {/* Food & Water Items */}
                {req.foodItems?.length > 0 && (
                  <div className="mb-2 text-sm">
                    <span className="font-semibold text-gray-800">Food & Water:</span>{" "}
                    {req.foodItems.map((f) => `${f.name} (${f.quantity})`).join(", ")}
                  </div>
                )}

                {/* Delete Button for incomplete requests */}
                {req.status !== "completed" && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => handleDelete(req.id)}
                      className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </button>
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-gray-200 mt-4 pt-2 text-xs text-gray-400">
                  Request ID: {req.id}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviousRequests;
