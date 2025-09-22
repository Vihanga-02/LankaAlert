// src/pages/admin/DisasterAlertManagement.jsx
import React, { useState, useEffect } from "react";
import { Eye, Edit, AlertTriangle, Plus, Filter, Search, Map } from "lucide-react";
import { useDisasterReports } from "../../context/DisasterReportsContext";
import { useDisasterAlert } from "../../context/DisasterAlertContext";
import { useMapZone } from "../../context/MapZoneContext";

import DisasterAlertForm from "../../components/DisasterAlertForm";
import MapZoneForm from "../../components/MapZoneForm";
import CreatedDisasterAlerts from "../../components/CreatedDisasterAlerts";
import NotificationDropdown from "../../components/NotificationDropdown";

// -------- Constants --------
const districts = [
  "Colombo","Gampaha","Kalutara","Kandy","Matale","Nuwara Eliya","Galle",
  "Matara","Hambantota","Jaffna","Kilinochchi","Mannar","Vavuniya","Mullaitivu",
  "Batticaloa","Ampara","Trincomalee","Kurunegala","Puttalam","Anuradhapura","Polonnaruwa",
  "Badulla","Moneragala","Ratnapura","Kegalle",
];

const districtCities = {
  Colombo: ["Colombo","Homagama","Awissawella","Kaduwela","Moratuwa","Maharagama","Kottawa"],
  Gampaha: ["Negombo", "Ja-Ela", "Wattala", "Kelaniya", "Ragama"],
  Kalutara: ["Kalutara", "Beruwala", "Panadura", "Horana", "Matugama"],
  Kandy: ["Kandy", "Peradeniya", "Gampola", "Akurana", "Kadugannawa"],
  Matale: ["Matale", "Dambulla", "Rattota", "Ukuwela"],
  "Nuwara Eliya": ["Nuwara Eliya", "Hatton", "Talawakele", "Ambewela"],
  Galle: ["Galle", "Hikkaduwa", "Ambalangoda", "Unawatuna", "Karapitiya"],
  Matara: ["Matara", "Dikwella", "Weligama", "Tangalle", "Kamburupitiya"],
  Hambantota: ["Hambantota", "Tissamaharama", "Weeraketiya"],
  Jaffna: ["Jaffna", "Chavakachcheri", "Point Pedro", "Nallur", "Tellippalai"],
  Kilinochchi: ["Kilinochchi", "Pooneryn", "Karachchi", "Elephant Pass"],
  Mannar: ["Mannar", "Musali", "Madhu", "Nanattan"],
  Vavuniya: ["Vavuniya", "Vavuniya North", "Vavuniya South", "Vavuniya Urban"],
  Mullaitivu: ["Mullaitivu","Oddusuddan","Puthukkudiyiruppu","Maritimepattu"],
  Batticaloa: ["Batticaloa", "Kalmunai", "Eravur", "Kalkudah", "Manmunai"],
  Ampara: ["Ampara", "Kalmunai", "Samanthurai", "Padiyathalawa", "Uhana"],
  Trincomalee: ["Trincomalee", "Kinniya", "Muttur", "Verugal", "Seruwila"],
  Kurunegala: ["Kurunegala","Maho","Dambulla","Alawwa","Kuliyapitiya","Polgahawela"],
  Puttalam: ["Puttalam", "Chilaw", "Nawagathena", "Kalpitiya"],
  Anuradhapura: ["Anuradhapura","Mihintale","Padaviya","Kebithigollewa","Thalawa"],
  Polonnaruwa: ["Polonnaruwa", "Dimbulagala", "Lankapura", "Welikanda"],
  Badulla: ["Badulla", "Hali-Ela", "Ella", "Mahiyanganaya", "Passara"],
  Moneragala: ["Moneragala", "Buttala", "Bibile", "Medagama", "Kataragama"],
  Ratnapura: ["Ratnapura", "Balangoda", "Elapatha", "Kuruwita", "Embilipitiya"],
  Kegalle: ["Kegalle","Deraniyagala","Ruwanwella","Mawanella","Yatiyantota"],
};

const dangerSubcategories = [
  "Floods",
  "Landslides",
  "High Wind",
  "Power Cuts",
  "Water Cuts",
  "Elephants Moving",
];

const DisasterAlertManagement = () => {
  const { reports, fetchReports, loading } = useDisasterReports();
  const { alerts, createAlert } = useDisasterAlert();
  const { zones, fetchZones, addZone } = useMapZone();

  const [activeSection, setActiveSection] = useState("reports");
  const [searchTerm, setSearchTerm] = useState("");
  const [reportFilter, setReportFilter] = useState("all"); // all, created, notCreated, zoneMarked, noZone

  // For modals
  const [selectedReport, setSelectedReport] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  const [zoneData, setZoneData] = useState(null);

  useEffect(() => {
    fetchReports();
    fetchZones();
  }, []);

  // 🔍 Filtering reports
  const filteredReports = reports
    .filter(
      (report) =>
        report.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.locationDescription
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        report.disasterType?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((report) => {
      const hasAlert = alerts.some((a) => a.reportId === report.id);
      const hasZone = zones.some((z) => z.reportId === report.id);

      if (reportFilter === "created") return hasAlert;
      if (reportFilter === "notCreated") return !hasAlert;
      if (reportFilter === "zoneMarked") return hasZone;
      if (reportFilter === "noZone") return !hasZone;
      return true;
    });

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-orange-100 text-orange-800";
      case "low":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // ✅ Create Alert (from report)
  const handleCreateAlert = (report) => {
    setSelectedReport(report);
    setManualMode(false);
    setZoneData(null);
  };

  // ✅ Manual Entry
  const handleManualEntry = () => {
    setSelectedReport(null);
    setManualMode(true);
    setZoneData(null);
  };

  // ✅ Mark on Map
  const handleMarkOnMap = (report) => {
    setSelectedReport(null);
    setManualMode(false);
    setZoneData({
      name: report.title || "",
      category: "danger",
      subCategory: report.disasterType || "",
      latitude: report.latitude?.toString() || "",
      longitude: report.longitude?.toString() || "",
      district: report.district || "",
      city: report.city || "",
      safeDescription: "",
      reportId: report.id || null, // ✅ link report to zone
    });
  };

  // ✅ Save zone to Map
  const handleSaveZone = async (e) => {
    e.preventDefault();
    try {
      await addZone({
        ...zoneData,
        latitude: parseFloat(zoneData.latitude),
        longitude: parseFloat(zoneData.longitude),
        reportId: zoneData.reportId || null, // ✅ ensure saved
      });
      setZoneData(null);
    } catch (err) {
      console.error("Failed to save zone:", err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Disaster Management Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Monitor disaster reports, create alerts, and mark danger zones on the map
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
          {/* Notification Bell */}
          <NotificationDropdown />
          <button
            onClick={handleManualEntry}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-5 w-5 mr-2" /> Add Manual Entry
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b border-gray-200 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <nav className="flex space-x-6 mb-4 sm:mb-0">
          <button
            onClick={() => setActiveSection("reports")}
            className={`py-2 px-3 font-medium text-sm border-b-2 ${
              activeSection === "reports"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Disaster Reports
          </button>
          <button
            onClick={() => setActiveSection("alerts")}
            className={`py-2 px-3 font-medium text-sm border-b-2 ${
              activeSection === "alerts"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Created Alerts
          </button>
        </nav>

        {/* Filter for reports */}
        {activeSection === "reports" && (
          <div className="flex items-center space-x-2">
            <label className="text-gray-600 text-sm">Show:</label>
            <select
              value={reportFilter}
              onChange={(e) => setReportFilter(e.target.value)}
              className="border rounded-lg px-2 py-1 text-sm"
            >
              <option value="all">All Reports</option>
              <option value="created">Alert Created</option>
              <option value="notCreated">No Alert</option>
              <option value="zoneMarked">Zone Marked</option>
              <option value="noZone">No Zone</option>
            </select>
          </div>
        )}
      </div>

      {/* Reports Section */}
      {activeSection === "reports" && (
        <>
          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-6">
            {loading ? (
              <p>Loading reports...</p>
            ) : filteredReports.length === 0 ? (
              <p>No reports found.</p>
            ) : (
              filteredReports.map((report) => {
                const hasAlert = alerts.some((a) => a.reportId === report.id);
                const hasZone = zones.some((z) => z.reportId === report.id);
                return (
                  <div
                    key={report.id}
                    className="bg-white rounded-lg shadow-sm border p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {report.title}
                        </h3>
                        <p className="text-gray-600">
                          {report.locationDescription}
                        </p>
                      </div>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(
                          report.severity
                        )}`}
                      >
                        {report.severity}
                      </span>
                    </div>

                    <p className="text-gray-700 mb-2">{report.description}</p>
                    {hasAlert && (
                      <p className="text-green-700 font-semibold mb-1">
                        ✅ Alert Created
                      </p>
                    )}
                    {hasZone && (
                      <p className="text-blue-700 font-semibold mb-2">
                        ✅ Zone Marked
                      </p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm font-medium text-gray-600">
                          Reporter
                        </div>
                        <div className="text-lg font-semibold text-gray-600">
                          {report.reporterEmail}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm font-medium text-gray-600">
                          Date
                        </div>
                        <div className="text-lg font-semibold text-gray-600">
                          {report.createdAt?.toDate
                            ? report.createdAt.toDate().toLocaleString()
                            : "N/A"}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm font-medium text-gray-600">
                          Latitude
                        </div>
                        <div className="text-lg font-semibold text-gray-600">
                          {report.latitude || "N/A"}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm font-medium text-gray-600">
                          Longitude
                        </div>
                        <div className="text-lg font-semibold text-gray-600">
                          {report.longitude || "N/A"}
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleCreateAlert(report)}
                        disabled={hasAlert}
                        className={`inline-flex items-center px-3 py-2 rounded-lg ${
                          hasAlert
                            ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                            : "bg-orange-600 text-white hover:bg-orange-700"
                        }`}
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" /> Create Alert
                      </button>
                      <button
                        onClick={() => handleMarkOnMap(report)}
                        disabled={hasZone}
                        className={`inline-flex items-center px-3 py-2 rounded-lg ${
                          hasZone
                            ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        <Map className="h-4 w-4 mr-2" /> Mark on Map
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Alerts Section */}
      {activeSection === "alerts" && (
        <CreatedDisasterAlerts
          districts={districts}
          districtCities={districtCities}
          zones={zones.filter((z) => z.category === "safe")}
        />
      )}

      {/* ✅ DisasterAlertForm Modal */}
      {(selectedReport || manualMode) && (
        <DisasterAlertForm
          report={manualMode ? null : selectedReport}
          onClose={() => {
            setSelectedReport(null);
            setManualMode(false);
          }}
          districts={districts}
          districtCities={districtCities}
          zones={zones.filter((z) => z.category === "safe")}
          createAlert={(data) => {
            const payload = { ...data, reportId: selectedReport?.id || null };
            return createAlert(payload);
          }}
        />
      )}

      {/* ✅ MapZoneForm Modal */}
      {zoneData && (
        <MapZoneForm
          mode="add"
          data={zoneData}
          setData={setZoneData}
          onSubmit={handleSaveZone}
          onClose={() => setZoneData(null)}
          districts={districts}
          districtCities={districtCities}
          dangerSubcategories={dangerSubcategories}
        />
      )}
    </div>
  );
};

export default DisasterAlertManagement;
