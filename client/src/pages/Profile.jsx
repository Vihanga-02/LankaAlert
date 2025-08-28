import React, { useState, useEffect } from "react";
import { 
  User, Mail, Phone, MapPin, Edit3, Save, X, Shield, Trash2, RefreshCw 
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useDisasterReports } from "../context/DisasterReportsContext";
import { useRewards } from "../context/RewardContext";
import DisasterReportForm from "../components/DisasterReportForm";

const Profile = () => {
  const { user, logout } = useAuth();
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = () => {
    console.log("Updated profile:", editForm);
    setIsEditing(false);
    alert("Profile updated successfully!");
  };

  const handleCancel = () => {
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

  const handleReportUpdate = async () => {
    await editReport(editingReportId, editingReportData);
    const updatedReports = await getUserReports(user.email);
    setUserReports(updatedReports || []);
    setEditingReportId(null);
  };

  const handleReportDelete = async (reportId) => {
    if (window.confirm("Are you sure you want to delete this report?")) {
      await removeReport(reportId);
      setUserReports((prev) => prev.filter((r) => r.id !== reportId));
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
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
              {user.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-600">{user.email}</p>
              {user.isReporter && (
                <div className="flex items-center space-x-2 mt-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span className="text-green-600 font-medium">Verified Reporter</span>
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
              <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Information</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">{user.email}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
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
                    <span className="text-gray-900">{user.city}, {user.district}</span>
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

              {userReports.length === 0 ? (
                <p className="text-gray-500">No reports submitted yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Title</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Location</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Points</th>
                        <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {userReports.map((report) => (
                        <tr key={report.id}>
                          <td className="px-4 py-2 text-sm">{report.title || "Untitled"}</td>
                          <td className="px-4 py-2 text-sm">{report.locationDescription || "-"}</td>
                          <td className="px-4 py-2 text-sm">50</td>
                          <td className="px-4 py-2 text-center space-x-2">
                            <button
                              onClick={() => handleReportEdit(report)}
                              className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                            >
                              <Edit3 className="h-4 w-4" /> Edit
                            </button>
                            <button
                              onClick={() => handleReportDelete(report.id)}
                              className="text-red-600 hover:underline text-sm flex items-center gap-1"
                            >
                              <Trash2 className="h-4 w-4" /> Delete
                            </button>
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
