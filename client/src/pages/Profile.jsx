import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit3,
  Save,
  X,
  Shield,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  Download,
  FileText,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useDisasterReports } from "../context/DisasterReportsContext";
import { useRewards } from "../context/RewardContext";
import { NotificationService } from "../services/notificationService";
import { storage } from "../services/firebase";
import {
  ref,
  uploadString,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import DisasterReportForm from "../components/DisasterReportForm";
import ReportsPDFGenerator from "../components/ReportsPDFGenerator";

const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const { getUserReports, editReport, removeReport } = useDisasterReports();
  const { rewards, totalPoints, fetchRewards } = useRewards();

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    district: user?.district || "",
    city: user?.city || "",
    smsSubscribed: user?.smsSubscribed || false,
    farmerAlerts: user?.farmerAlerts || false,
    fishermenAlerts: user?.fishermenAlerts || false,
  });

  const [userReports, setUserReports] = useState([]);
  const [editingReportId, setEditingReportId] = useState(null);
  const [editingReportData, setEditingReportData] = useState({});

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [filteredReports, setFilteredReports] = useState([]);

  // PDF Generator ref
  const pdfGeneratorRef = useRef();

  // Update editForm when user data changes
  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || "",
        phone: user.phone || "",
        district: user.district || "",
        city: user.city || "",
        smsSubscribed: user.smsSubscribed || false,
        farmerAlerts: user.farmerAlerts || false,
        fishermenAlerts: user.fishermenAlerts || false,
      });
    }
  }, [user]);

  // Calculate points for a report using the combined system
  const calculateReportPoints = (report, allReports) => {
    let points = 0;

    // Base points for submitting report (original system)
    points += 50;

    // Original system bonuses
    // +20 points for reports with photos (original)
    if (report.images && report.images.length > 0) {
      points += 20;
    }

    // +30 points for critical priority (original)
    if (report.severity === "high") {
      points += 30;
    }

    // NEW: Additional points based on description length (word count)
    if (report.description) {
      const wordCount = report.description
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
      (report.latitude && report.longitude) ||
      (report.locationDescription &&
        report.locationDescription.trim().length > 0)
    ) {
      points += 5;
    }

    return points;
  };

  // Fetch rewards & user reports only if user is a reporter
  useEffect(() => {
    const fetchData = async () => {
      if (user?.email && user?.isReporter) {
        await fetchRewards(user.email);
        const reports = await getUserReports(user.email);
        setUserReports(reports || []);
      }
    };
    fetchData();
  }, [user, fetchRewards, getUserReports]);

  // Filter reports based on search term and severity
  useEffect(() => {
    let filtered = userReports;

    // Filter by search term (disaster type and location)
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter((report) => {
        const disasterType = (report.disasterType || "").toLowerCase();
        const location = (report.locationDescription || "").toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        return (
          disasterType.includes(searchLower) || location.includes(searchLower)
        );
      });
    }

    // Filter by severity
    if (severityFilter !== "all") {
      filtered = filtered.filter(
        (report) => report.severity === severityFilter
      );
    }

    setFilteredReports(filtered);
  }, [userReports, searchTerm, severityFilter]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async () => {
    try {
      console.log("Updating profile:", editForm);

      // Update user data in Firebase and context
      const result = await updateUser(editForm);

      if (result.success) {
        setIsEditing(false);
        alert("Profile updated successfully!");
      } else {
        throw new Error(result.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert(`Failed to update profile: ${error.message}`);
    }
  };

  const handleCancel = () => {
    // Reset form with current user data
    setEditForm({
      name: user?.name || "",
      phone: user?.phone || "",
      district: user?.district || "",
      city: user?.city || "",
      smsSubscribed: user?.smsSubscribed || false,
      farmerAlerts: user?.farmerAlerts || false,
      fishermenAlerts: user?.fishermenAlerts || false,
    });
    setIsEditing(false);
  };

  const handleReportEdit = (report) => {
    setEditingReportId(report.id);
    setEditingReportData({ ...report });
  };

  // Image upload function for editing
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

  // Generate unique filename for PDF downloads
  const generateFileName = (userEmail) => {
    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:.]/g, "-");
    const userHash = btoa(userEmail)
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 8);
    return `disaster_${userHash}_${timestamp}`;
  };


  // Delete images from Firebase Storage
  const deleteImagesFromStorage = async (imageUrls) => {
    if (!imageUrls || imageUrls.length === 0) {
      return;
    }

    const deletePromises = imageUrls.map(async (imageUrl) => {
      try {
        // Check if imageUrl is a string
        if (!imageUrl || typeof imageUrl !== "string") {
          console.warn("Invalid image URL:", imageUrl);
          return;
        }

        // Extract the path from Firebase Storage URL
        const urlParts = imageUrl.split("/");
        const pathIndex = urlParts.findIndex((part) => part === "disaster");

        if (pathIndex !== -1) {
          // Reconstruct the storage path
          const pathParts = urlParts.slice(pathIndex);
          // Remove query parameters if any
          const lastPart = pathParts[pathParts.length - 1].split("?")[0];
          pathParts[pathParts.length - 1] = lastPart;
          const imagePath = pathParts.join("/");

          // Create storage reference and delete
          const imageRef = ref(storage, imagePath);
          await deleteObject(imageRef);
          console.log(`Successfully deleted image: ${imagePath}`);
        }
      } catch (error) {
        console.error(`Error deleting image ${imageUrl}:`, error);
        // Don't throw error here, continue with other deletions
      }
    });

    try {
      await Promise.all(deletePromises);
    } catch (error) {
      console.error("Some images could not be deleted:", error);
    }
  };

  const handleReportUpdate = async () => {
    try {
      console.log("Updating report:", editingReportData);

      // Get the original report data to compare images
      const originalReport = userReports.find((r) => r.id === editingReportId);
      const originalImageUrls = originalReport?.images || [];

      let updatedData = { ...editingReportData };

      // Determine which images are being kept vs removed
      const currentImageUrls =
        editingReportData.images?.filter((img) => typeof img === "string") ||
        [];

      // Find images that were removed (exist in original but not in current)
      const removedImageUrls = originalImageUrls.filter(
        (originalUrl) =>
          typeof originalUrl === "string" &&
          !currentImageUrls.includes(originalUrl)
      );

      // Delete removed images from Firebase Storage
      if (removedImageUrls.length > 0) {
        console.log(
          `Deleting ${removedImageUrls.length} removed images from storage`
        );
        // Filter to ensure only valid string URLs are passed
        const validRemovedUrls = removedImageUrls.filter(
          (url) => url && typeof url === "string"
        );
        if (validRemovedUrls.length > 0) {
          await deleteImagesFromStorage(validRemovedUrls);
        }
      }

      // Handle new images if they exist
      if (editingReportData.images && editingReportData.images.length > 0) {
        // Check if any images are new (have base64 data)
        const newImages = editingReportData.images.filter(
          (img) => typeof img === "object" && img.base64
        );

        if (newImages.length > 0) {
          console.log(
            `Uploading ${newImages.length} new images for report update`
          );

          // Generate a report ID for the images if not already present
          const reportId =
            editingReportData.reportId || generateReportId(user.email);

          // Upload new images
          const newImageUrls = await uploadDisasterImages(
            newImages,
            reportId,
            user.email
          );

          // Keep existing URLs and add new ones
          const existingImageUrls = editingReportData.images.filter(
            (img) => typeof img === "string"
          );

          updatedData = {
            ...updatedData,
            images: [...existingImageUrls, ...newImageUrls],
            imageCount: existingImageUrls.length + newImageUrls.length,
            reportId: reportId,
          };
        } else {
          // No new images, just keep existing ones
          updatedData = {
            ...updatedData,
            images: currentImageUrls,
            imageCount: currentImageUrls.length,
          };
        }
      } else {
        // No images at all, delete all original images
        if (originalImageUrls.length > 0) {
          console.log(
            `Deleting all ${originalImageUrls.length} images from storage`
          );
          // Filter to ensure only valid string URLs are passed
          const validOriginalUrls = originalImageUrls.filter(
            (url) => url && typeof url === "string"
          );
          if (validOriginalUrls.length > 0) {
            await deleteImagesFromStorage(validOriginalUrls);
          }
        }
        updatedData = {
          ...updatedData,
          images: [],
          imageCount: 0,
        };
      }

      await editReport(editingReportId, updatedData);

      // Send notification to admin about the report update
      await NotificationService.notifyAdminReportEdited(
        originalReport,
        updatedData,
        user
      );

      const updatedReports = await getUserReports(user.email);
      setUserReports(updatedReports || []);
      setEditingReportId(null);

      alert(
        "Report updated successfully! Admin has been notified of the changes."
      );
    } catch (error) {
      console.error("Error updating report:", error);
      alert("Failed to update report. Check console for details.");
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (window.confirm("Are you sure you want to delete this report?")) {
      try {
        // Find the report to get its images and data
        const reportToDelete = userReports.find((r) => r.id === reportId);

        // Send notification to admin before deleting
        await NotificationService.notifyAdminReportDeleted(
          reportToDelete,
          user
        );

        // Delete images from Firebase Storage if they exist
        if (reportToDelete?.images && reportToDelete.images.length > 0) {
          console.log(
            `Deleting ${reportToDelete.images.length} images from storage for deleted report`
          );
          // Filter to ensure only valid string URLs are passed
          const validImageUrls = reportToDelete.images.filter(
            (url) => url && typeof url === "string"
          );
          if (validImageUrls.length > 0) {
            await deleteImagesFromStorage(validImageUrls);
          }
        }

        // Delete the report from Firestore
        await removeReport(reportId);
        setUserReports((prev) => prev.filter((r) => r.id !== reportId));

        alert("Report deleted successfully! Admin has been notified.");
      } catch (error) {
        console.error("Error deleting report:", error);
        alert("Failed to delete report. Check console for details.");
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-600">{user.email}</p>
              {user.isReporter && (
                <div className="flex items-center space-x-2 mt-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span className="text-green-600 font-medium">
                    Verified Reporter
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-3">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className={user.isReporter ? "lg:col-span-1" : "lg:col-span-3"}>
            <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Profile Information
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-900">{user.name}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">{user.email}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={editForm.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-900">{user.phone}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                {isEditing ? (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      name="district"
                      value={editForm.district}
                      onChange={handleInputChange}
                      placeholder="District"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      name="city"
                      value={editForm.city}
                      onChange={handleInputChange}
                      placeholder="City"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-900">
                      {user.city}, {user.district}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={logout}
                className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors mt-4"
              >
                Logout
              </button>
            </div>

            {/* Rewards Section for Reporters */}
            {user.isReporter && (
              <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Rewards & Points
                </h2>

                {/* Total Points Display */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white mb-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{totalPoints}</div>
                    <div className="text-blue-100">Total Points Earned</div>
                  </div>
                </div>

                {/* Rewards History */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Recent Point Awards
                  </h3>
                  {rewards && rewards.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {rewards.slice(0, 10).map((reward, index) => (
                        <div
                          key={reward.id || index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                        >
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {reward.reason || "Report submission"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {reward.date
                                ? new Date(reward.date).toLocaleDateString()
                                : "Date not available"}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              +{reward.points}
                            </div>
                            <div className="text-xs text-gray-500">points</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-sm">No rewards earned yet</div>
                      <div className="text-xs mt-1">
                        Submit disaster reports to earn points!
                      </div>
                    </div>
                  )}
                </div>

                {/* Points System Info */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">
                    How to Earn Points:
                  </h4>
                  <div className="text-xs text-blue-800 space-y-1">
                    <div>• Base Report: 10 points</div>
                    <div>• Good Description (10-19 words): +10 points</div>
                    <div>• Detailed Description (20-49 words): +20 points</div>
                    <div>
                      • Comprehensive Description (50+ words): +30 points
                    </div>
                    <div>• Include Images: +10 points</div>
                    <div>• Provide Location: +5 points</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Reports Table for Reporters Only */}
          {user.isReporter && (
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center justify-between">
                Your Submitted Reports
                <button
                  onClick={async () => {
                    const reports = await getUserReports(user.email);
                    setUserReports(reports || []);
                  }}
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              </h2>

              {/* Search and Filter Controls */}
              <div className="mb-4 flex flex-col sm:flex-row gap-4">
                {/* Search Input */}
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by disaster type or location..."
                    value={searchTerm}
                    onChange={(e) => {
                      // Only allow letters, spaces, commas, hyphens, and apostrophes for location names
                      const validInput = e.target.value.replace(
                        /[^a-zA-Z\s,\-']/g,
                        ""
                      );
                      setSearchTerm(validInput);
                    }}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Severity Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Priorities</option>
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>

                {/* Results Count and Clear Filters */}
                <div className="flex items-center gap-2">
                  <div className="text-sm text-gray-600">
                    {filteredReports.length} of {userReports.length} reports
                  </div>
                  {(searchTerm || severityFilter !== "all") && (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setSeverityFilter("all");
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>

              {/* PDF Generator Component */}
              <ReportsPDFGenerator
                ref={pdfGeneratorRef}
                reports={filteredReports}
                user={user}
                calculateReportPoints={calculateReportPoints}
                className="mb-4"
              />

              {filteredReports.length === 0 ? (
                <p className="text-gray-500">
                  {userReports.length === 0
                    ? "No reports submitted yet."
                    : "No reports match your search criteria."}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                          Title
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                          Location
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                          Priority
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                          Points
                        </th>
                        <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredReports.map((report) => (
                        <tr key={report.id}>
                          <td className="px-4 py-2 text-sm">
                            {report.title || "Untitled"}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {report.locationDescription || "-"}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                report.severity === "high"
                                  ? "bg-red-100 text-red-800"
                                  : report.severity === "medium"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {report.severity
                                ? report.severity.charAt(0).toUpperCase() +
                                  report.severity.slice(1)
                                : "Medium"}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm font-semibold text-green-600">
                            <div className="flex flex-col">
                              <span>
                                {calculateReportPoints(report, userReports)}
                              </span>
                              <div className="text-xs text-gray-500 mt-1">
                                <span>Base: 50</span>
                                {report.images?.length > 0 && (
                                  <span> • Photos: +20</span>
                                )}
                                {report.severity === "high" && (
                                  <span> • Critical: +30</span>
                                )}
                                {report.description &&
                                  (() => {
                                    const wordCount = report.description
                                      .trim()
                                      .split(/\s+/)
                                      .filter((word) => word.length > 0).length;
                                    if (wordCount >= 50)
                                      return <span> • Desc: +30</span>;
                                    if (wordCount >= 20)
                                      return <span> • Desc: +20</span>;
                                    if (wordCount >= 10)
                                      return <span> • Desc: +10</span>;
                                    return null;
                                  })()}
                                {((report.latitude && report.longitude) ||
                                  (report.locationDescription &&
                                    report.locationDescription.trim().length >
                                      0)) && <span> • Location: +5</span>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <div className="flex flex-col space-y-1">
                              <button
                                onClick={() =>
                                  pdfGeneratorRef.current?.downloadIndividualReportPDF(
                                    report
                                  )
                                }
                                disabled={
                                  pdfGeneratorRef.current?.pdfGenerating &&
                                  pdfGeneratorRef.current
                                    ?.generatingReportId === report.id
                                }
                                className="text-green-600 hover:underline text-sm flex items-center gap-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Download PDF"
                              >
                                {pdfGeneratorRef.current?.pdfGenerating &&
                                pdfGeneratorRef.current?.generatingReportId ===
                                  report.id ? (
                                  <>
                                    <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full"></div>
                                    PDF
                                  </>
                                ) : (
                                  <>
                                    <Download className="h-4 w-4" /> PDF
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleReportEdit(report)}
                                className="text-blue-600 hover:underline text-sm flex items-center gap-1 justify-center"
                              >
                                <Edit3 className="h-4 w-4" /> Edit
                              </button>
                              <button
                                onClick={() => handleReportDelete(report.id)}
                                className="text-red-600 hover:underline text-sm flex items-center gap-1 justify-center"
                              >
                                <Trash2 className="h-4 w-4" /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Editing Report Form */}
              {editingReportId && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Edit Report</h3>
                  <DisasterReportForm
                    formData={editingReportData}
                    setFormData={setEditingReportData}
                  />
                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={handleReportUpdate}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" /> Save
                    </button>
                    <button
                      onClick={() => setEditingReportId(null)}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
                    >
                      <X className="h-4 w-4" /> Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
