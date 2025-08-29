import React, { useState, useEffect } from "react";
import {
  Eye,
  Edit,
  AlertTriangle,
  Plus,
  Filter,
  Search,
} from "lucide-react";
import { useDisasterReports } from "../../context/DisasterReportsContext";

const DisasterAlertManagement = () => {
  const { reports, fetchReports, loading } = useDisasterReports();
  const [activeSection, setActiveSection] = useState("reports"); // reports or alerts
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchReports();
  }, []);

  // Filter reports based on search term
  const filteredReports = reports.filter(
    (report) =>
      report.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.locationDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.disasterType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Disaster Management Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Monitor submitted disaster reports and created alerts
          </p>
        </div>
        <button className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-5 w-5 mr-2" />
          Add Manual Entry
        </button>
      </div>

      {/* Top Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-6">
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
      </div>

      {/* Disaster Reports Section */}
      {activeSection === "reports" && (
        <>
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="h-5 w-5 mr-2 text-gray-400" />
              Filter
            </button>
          </div>

          <div className="space-y-6">
            {loading ? (
              <p>Loading reports...</p>
            ) : filteredReports.length === 0 ? (
              <p>No disaster reports found.</p>
            ) : (
              filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {report.title}
                      </h3>
                      <p className="text-gray-600">{report.locationDescription}</p>
                    </div>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(
                        report.severity
                      )}`}
                    >
                      {report.severity}
                    </span>
                  </div>

                  <p className="text-gray-700 mb-4">{report.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-gray-600">Reporter</div>
                      <div className="text-lg font-semibold text-gray-600">
                        {report.reporterEmail}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-gray-600">Date</div>
                      <div className="text-lg font-semibold text-gray-600">
                        {report.createdAt?.toDate
                          ? report.createdAt.toDate().toLocaleString()
                          : "N/A"}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-gray-600">Latitude</div>
                      <div className="text-lg font-semibold text-gray-600">
                        {report.latitude || "N/A"}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-gray-600">Longitude</div>
                      <div className="text-lg font-semibold text-gray-600">
                        {report.longitude || "N/A"}
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </button>
                    <button className="inline-flex items-center px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Create Alert
                    </button>
                    <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      <Edit className="h-4 w-4 mr-2" />
                      Mark on Map
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Created Alerts Section */}
      {activeSection === "alerts" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center py-20">
          <p className="text-gray-600">
            Alerts created from disaster reports will appear here in the future.
          </p>
        </div>
      )}
    </div>
  );
};

export default DisasterAlertManagement;
