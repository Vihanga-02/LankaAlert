import React, { useState, useEffect, useRef } from "react";
import { AlertTriangle, FileText, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useDisasterReports } from "../context/DisasterReportsContext";
import { useRewards } from "../context/RewardContext";
import { storage } from "../services/firebase";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import DisasterReportForm from "../components/DisasterReportForm";

const ReportDisaster = () => {
  const { user } = useAuth();
  const { addReport } = useDisasterReports();
  const { givePoints, totalPoints, fetchRewards } = useRewards();

  // Ref to access form validation
  const formRef = useRef();

  const [formData, setFormData] = useState({
    disasterType: "",
    title: "",
    severity: "",
    description: "",
    locationDescription: "",
    latitude: "",
    longitude: "",
    images: [], // Add images array to form data
  });

  const [currentPoints, setCurrentPoints] = useState(0);

  // Toast state
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success", // success, error
  });

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Show toast function
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 4000);
  };

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

  // Prevent scrolling when submitting
  useEffect(() => {
    if (isSubmitting) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup function to reset overflow when component unmounts
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isSubmitting]);

  // Image upload function
  const uploadDisasterImages = async (images, reportId, userEmail) => {
    if (!images || images.length === 0) {
      return [];
    }

    const uploadPromises = images.map(async (image, index) => {
      try {
        // Create unique filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const fileName = `${timestamp}_${index}_${image.name}`;
        const imagePath = `disaster/${reportId}/${fileName}`;

        // Create storage reference
        const imageRef = ref(storage, imagePath);

        // Upload base64 string
        const snapshot = await uploadString(imageRef, image.base64, "data_url");

        // Get download URL
        const downloadURL = await getDownloadURL(snapshot.ref);

        // Return only the URL
        return downloadURL;
      } catch (error) {
        console.error(`Error uploading image ${image.name}:`, error);
        throw new Error(`Failed to upload ${image.name}: ${error.message}`);
      }
    });

    try {
      const uploadedImages = await Promise.all(uploadPromises);
      console.log(
        `Successfully uploaded ${uploadedImages.length} images for report ${reportId}`
      );
      return uploadedImages;
    } catch (error) {
      console.error("Error uploading disaster images:", error);
      throw error;
    }
  };

  // Generate unique report ID
  const generateReportId = (userEmail) => {
    const timestamp = Date.now();
    const userHash = btoa(userEmail)
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 8);
    return `disaster_${userHash}_${timestamp}`;
  };

  // Calculate estimated points for current form using the combined system
  const calculateEstimatedPoints = () => {
    // Use the same calculation as the actual reward system
    const mockReportData = {
      description: formData.description,
      images: formData.images,
      latitude: formData.latitude,
      longitude: formData.longitude,
      locationDescription: formData.locationDescription,
      severity: formData.severity,
    };

    // Combined points system calculation
    let points = 50; // Base points (original system)

    // Original system bonuses
    // Bonus points for including images (original +20)
    if (mockReportData.images && mockReportData.images.length > 0) {
      points += 20;
    }

    // Bonus points for critical priority (original +30)
    if (mockReportData.severity === "high") {
      points += 30;
    }

    // NEW: Additional points based on description length (word count)
    if (mockReportData.description) {
      const wordCount = mockReportData.description
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length;

      if (wordCount >= 50) {
        points += 30; // Detailed description (50+ words)
      } else if (wordCount >= 20) {
        points += 20; // Good description (20-49 words)
      } else if (wordCount >= 10) {
        points += 10; // Basic description (10-19 words)
      }
    }

    // Bonus points for providing location (additional)
    if (
      (mockReportData.latitude && mockReportData.longitude) ||
      (mockReportData.locationDescription &&
        mockReportData.locationDescription.trim().length > 0)
    ) {
      points += 5;
    }

    return points;
  };

  const handleSubmit = async () => {
    try {
      console.log("Form Data Submitted:", formData);

      // Use the form's validation instead of basic validation
      if (!formRef.current?.validateForm()) {
        console.log("Form validation failed - stopping submission");
        return;
      }

      console.log("Form validation passed - proceeding with submission");

      // Set loading state
      setIsSubmitting(true);

      // Generate unique report ID for image storage
      const reportId = generateReportId(user.email);

      let uploadedImages = [];

      // Upload images if they exist
      if (formData.images && formData.images.length > 0) {
        console.log(
          `Uploading ${formData.images.length} images for report ${reportId}`
        );
        uploadedImages = await uploadDisasterImages(
          formData.images,
          reportId,
          user.email
        );
      }

      // Prepare form data with uploaded image URLs
      const reportDataToSubmit = {
        ...formData,
        images: uploadedImages,
        imageCount: uploadedImages.length,
        reportId: reportId,
      };

      // 1️⃣ Save report in Firestore (with images uploaded to Firebase Storage)
      await addReport(reportDataToSubmit, user);

      // 2️⃣ Give dynamic points to reporter based on report quality
      await givePoints(user, reportDataToSubmit); // Pass report data for dynamic points calculation

      // 3️⃣ Reset form
      setFormData({
        disasterType: "",
        title: "",
        severity: "medium",
        description: "",
        locationDescription: "",
        latitude: "",
        longitude: "",
        images: [],
      });

      const calculatedPoints = calculateEstimatedPoints();
      const imageBonus = formData.images?.length > 0 ? " (+20 for images)" : "";
      const severityBonus =
        formData.severity === "high" ? " (+30 for critical)" : "";
      showToast(
        `✅ Disaster Report submitted & ${calculatedPoints} points awarded!${imageBonus}${severityBonus}`,
        "success"
      );
    } catch (err) {
      showToast(
        "❌ Failed to submit report. Check console for details.",
        "error"
      );
      console.error(err);
    } finally {
      // Reset loading state
      setIsSubmitting(false);
    }
  };

  // If user is not a verified reporter
  if (!user?.isReporter) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-md p-8">
          <AlertTriangle className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Access Restricted
          </h2>
          <p className="text-gray-600 mb-6">
            This page is only available to verified reporters. Apply as a
            reporter during registration to access disaster reporting features.
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
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg border-l-4 transform transition-all duration-300 ${
            toast.type === "success"
              ? "bg-green-50 border-green-400 text-green-800"
              : "bg-red-50 border-red-400 text-red-800"
          }`}
        >
          <div className="flex items-center">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 ${
                toast.type === "success" ? "bg-green-500" : "bg-red-500"
              }`}
            >
              <span className="text-white text-sm">
                {toast.type === "success" ? "✓" : "!"}
              </span>
            </span>
            <p className="font-medium">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Loading Indicator - Centered (No Background) */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-xl p-6 shadow-xl border border-gray-200 flex items-center space-x-3 pointer-events-auto">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="text-lg font-medium text-gray-900">
              Submitting Report...
            </span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Report Disaster
          </h1>
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
                <span className="font-semibold text-green-900">
                  {user.name}
                </span>
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
            <DisasterReportForm
              ref={formRef}
              formData={formData}
              setFormData={setFormData}
            />

            {/* Submit button outside form */}
            <div className="flex justify-end mt-4">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`flex items-center gap-3 px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform ${
                  isSubmitting
                    ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:-translate-y-1"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>Submit Report</>
                )}
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
              <h3 className="text-lg font-bold text-blue-900 mb-4">
                Points System
              </h3>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex justify-between">
                  <span>Base Report:</span>
                  <span className="font-semibold">50 points</span>
                </div>
                <div className="flex justify-between">
                  <span>With Photos:</span>
                  <span className="font-semibold">+20 points</span>
                </div>
                <div className="flex justify-between">
                  <span>Critical Priority (High):</span>
                  <span className="font-semibold">+30 points</span>
                </div>
                <hr className="my-3 border-blue-200" />
                <div className="text-xs text-blue-700 font-medium mb-2">
                  DESCRIPTION BONUSES:
                </div>
                <div className="flex justify-between text-sm">
                  <span>Description (10-19 words):</span>
                  <span className="font-semibold">+10 points</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Description (20-49 words):</span>
                  <span className="font-semibold">+20 points</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Description (50+ words):</span>
                  <span className="font-semibold">+30 points</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Location Provided:</span>
                  <span className="font-semibold">+5 points</span>
                </div>
                <hr className="my-3 border-blue-200" />
                <div className="flex justify-between font-bold text-blue-900">
                  <span>Your Estimated Points:</span>
                  <span className="text-lg">{calculateEstimatedPoints()}</span>
                </div>
                {formData.description &&
                  formData.description.trim().length > 0 && (
                    <p className="text-xs text-blue-600 mt-1">
                      ✓ Description:{" "}
                      {
                        formData.description
                          .trim()
                          .split(/\s+/)
                          .filter((word) => word.length > 0).length
                      }{" "}
                      words
                    </p>
                  )}
                {formData.images?.length > 0 && (
                  <p className="text-xs text-blue-600">
                    ✓ {formData.images.length} image
                    {formData.images.length > 1 ? "s" : ""} included
                  </p>
                )}
                {formData.severity === "high" && (
                  <p className="text-xs text-blue-600">
                    ✓ Critical priority bonus
                  </p>
                )}
                {((formData.latitude && formData.longitude) ||
                  (formData.locationDescription &&
                    formData.locationDescription.trim().length > 0)) && (
                  <p className="text-xs text-blue-600">✓ Location provided</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDisaster;
