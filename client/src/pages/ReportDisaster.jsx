import React, { useState, useEffect } from "react";
import { AlertTriangle, FileText } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useDisasterReports } from "../context/DisasterReportsContext";
import { useRewards } from "../context/RewardContext"; 
import DisasterReportForm from "../components/DisasterReportForm";

const ReportDisaster = () => {
  const { user } = useAuth();
  const { addReport } = useDisasterReports();
  const { givePoints, totalPoints, fetchRewards } = useRewards();

  const [formData, setFormData] = useState({
    disasterType: "",
    title: "",
    severity: "medium",
    description: "",
    locationDescription: "",
    latitude: "",
    longitude: "",
  });

  const [currentPoints, setCurrentPoints] = useState(0);

  // 🔹 Fetch current user points on mount
  useEffect(() => {
    if (user?.email) {
      fetchRewards(user.email);
    }
  }, [user, fetchRewards]);

  // Update currentPoints whenever totalPoints changes in context
  useEffect(() => {
    setCurrentPoints(totalPoints);
  }, [totalPoints]);

  const handleSubmit = async () => {
    try {
      console.log("Form Data Submitted:", formData);

      // 1️⃣ Save report in Firestore
      await addReport(formData, user);

      // 2️⃣ Give 50 points to reporter
      await givePoints(user); // givePoints internally calls fetchRewards

      // 3️⃣ Reset form
      setFormData({
        disasterType: "",
        title: "",
        severity: "medium",
        description: "",
        locationDescription: "",
        latitude: "",
        longitude: "",
      });

      alert("✅ Disaster Report submitted & 50 points awarded!");
    } catch (err) {
      alert("❌ Failed to submit report. Check console for details.");
      console.error(err);
    }
  };

  // If user is not a verified reporter
  if (!user?.isReporter) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-md p-8">
          <AlertTriangle className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h2>
          <p className="text-gray-600 mb-6">
            This page is only available to verified reporters. Apply as a reporter during
            registration to access disaster reporting features.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Report Disaster</h1>
          <p className="text-lg text-gray-600">
            Submit official disaster reports to help your community stay safe
          </p>
        </div>

        {/* Reporter Badge */}
        <div className="bg-green-100 border border-green-300 rounded-lg p-4 mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-green-900">{user.name}</span>
                <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                  Verified Reporter
                </span>
              </div>
              <p className="text-sm text-green-700">
                Current Points: {currentPoints}
              </p>
            </div>
          </div>
        </div>

        {/* Layout: Form on left, Sidebar on right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Disaster Form */}
          <div className="lg:col-span-2">
            <DisasterReportForm formData={formData} setFormData={setFormData} />

            {/* Submit button outside form */}
            <div className="flex justify-end mt-4">
              <button
                onClick={handleSubmit}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                Submit Report
              </button>
            </div>
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-6">
            {/* Reporting Guidelines */}
            <div className="bg-yellow-50 rounded-lg p-6">
              <h3 className="text-lg font-bold text-yellow-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Reporting Guidelines
              </h3>
              <ul className="space-y-2 text-sm text-yellow-800">
                <li>• Provide accurate and verified information</li>
                <li>• Include specific location details</li>
                <li>• Report only confirmed casualties</li>
                <li>• Upload clear, relevant photos</li>
                <li>• Submit reports as soon as possible</li>
                <li>• Update reports if situation changes</li>
              </ul>
            </div>

            {/* Points System */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-bold text-blue-900 mb-4">Points System</h3>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex justify-between">
                  <span>Verified Report:</span>
                  <span className="font-semibold">50 points</span>
                </div>
                <div className="flex justify-between">
                  <span>With Photos:</span>
                  <span className="font-semibold">+20 points</span>
                </div>
                <div className="flex justify-between">
                  <span>Critical Priority:</span>
                  <span className="font-semibold">+30 points</span>
                </div>
                <div className="flex justify-between">
                  <span>First Report:</span>
                  <span className="font-semibold">+40 points</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDisaster;
