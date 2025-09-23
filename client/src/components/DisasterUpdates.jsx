// src/components/DisasterUpdates.jsx
import React, { useState, useEffect } from "react";
import { AlertTriangle, Calendar, MapPin, Filter, FileDown } from "lucide-react";
import MapView from "./MapView";
import { useMapZone } from "../context/MapZoneContext";
import { getDisasterAlerts } from "../services/disasterAlertService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const DisasterUpdates = () => {
  const [filters, setFilters] = useState({
    date: "",
    place: "",
    warningLevel: "",
    disasterType: "",
    status: "active", // default: show only valid active alerts
  });

  const [alerts, setAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  const { zones, loading } = useMapZone();

  // Fetch alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      setLoadingAlerts(true);
      try {
        const data = await getDisasterAlerts();
        setAlerts(data);
      } catch (err) {
        console.error("Failed to fetch alerts:", err);
      }
      setLoadingAlerts(false);
    };
    fetchAlerts();
  }, []);

  // Filter disaster alerts
  const filterAlerts = (alerts) => {
    const now = new Date();
    return alerts.filter((alert) => {
      const start = new Date(`${alert.startDate}T${alert.startTime}`);
      const validUntil = new Date(
        `${alert.validUntilDate}T${alert.validUntilTime}`
      );

      const isActive = now >= start && now <= validUntil;

      const dateMatch =
        !filters.date ||
        alert.startDate === filters.date ||
        alert.validUntilDate === filters.date;

      const placeMatch =
        !filters.place ||
        (alert.district &&
          alert.district.toLowerCase().includes(filters.place.toLowerCase())) ||
        (alert.city &&
          alert.city.toLowerCase().includes(filters.place.toLowerCase()));

      const severityMatch =
        !filters.warningLevel ||
        alert.severity?.toLowerCase() === filters.warningLevel.toLowerCase();

      const typeMatch =
        !filters.disasterType ||
        (alert.disasterName &&
          alert.disasterName
            .toLowerCase()
            .includes(filters.disasterType.toLowerCase()));

      const statusMatch =
        filters.status === "all" ||
        (filters.status === "active" && isActive) ||
        (filters.status === "expired" && !isActive);

      return (
        dateMatch && placeMatch && severityMatch && typeMatch && statusMatch
      );
    });
  };

  const filteredDisasterAlerts = filterAlerts(alerts);

  // Filter zones (unchanged)
  const filteredZones = zones.filter((zone) => {
    const placeMatch =
      !filters.place ||
      (zone.district &&
        zone.district.toLowerCase().includes(filters.place.toLowerCase())) ||
      (zone.city &&
        zone.city.toLowerCase().includes(filters.place.toLowerCase()));

    const typeMatch =
      !filters.disasterType ||
      (zone.subCategory &&
        zone.subCategory
          .toLowerCase()
          .includes(filters.disasterType.toLowerCase()));

    return placeMatch && typeMatch;
  });

  // Helpers for styling
  const getSeverityColor = (severity) => {
    switch ((severity || "").toLowerCase()) {
      case "critical":
      case "high":
        return "text-red-700 bg-red-100 border-red-300";
      case "medium":
        return "text-yellow-700 bg-yellow-100 border-yellow-300";
      default:
        return "text-blue-700 bg-blue-100 border-blue-300";
    }
  };

  const getStatusColor = (active) => {
    return active ? "text-green-700 bg-green-50" : "text-gray-700 bg-gray-50";
  };

 // ---- Generate PDF with filters applied ----
const generatePDF = () => {
  const doc = new jsPDF("landscape", "pt", "a4");

  // Logo
  const logoUrl = `${window.location.origin}/logo.png`;
  const img = new Image();
  img.src = logoUrl;

  img.onload = () => {
    // ---- Header ----
    doc.addImage(img, "PNG", 40, 20, 45, 45);
    doc.setFontSize(24);
    doc.setTextColor(30, 30, 30);
    doc.text("Lanka Alert", 100, 45);

    doc.setFontSize(14);
    doc.setTextColor(80, 80, 80);
    doc.text("Disaster Alerts Report", 100, 65);

    // Metadata
    const reportDate = new Date().toLocaleString();
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(`Generated: ${reportDate}`, 100, 80);

    // ---- Table Data ----
    const now = new Date();
    const tableData = filteredDisasterAlerts.map((alert, index) => {
      const start = `${alert.startDate || "N/A"} ${alert.startTime || ""}`;
      const validUntil = `${alert.validUntilDate || "N/A"} ${
        alert.validUntilTime || ""
      }`;
      const isActive =
        now >= new Date(`${alert.startDate}T${alert.startTime}`) &&
        now <= new Date(`${alert.validUntilDate}T${alert.validUntilTime}`);

      return {
        index: index + 1,
        name: alert.disasterName || "N/A",
        description: alert.description || "N/A",
        location: `${alert.district || "N/A"} - ${alert.city || "N/A"}`,
        start,
        validUntil,
        severity: alert.severity?.toUpperCase() || "N/A",
        status: isActive ? "Active" : "Expired",
      };
    });

    // ---- Table ----
    autoTable(doc, {
      startY: 110,
      head: [
        [
          "#",
          "Name",
          "Description",
          "Location",
          "Start",
          "Valid Until",
          "Severity",
          "Status",
        ],
      ],
      body: tableData.map((row) => [
        row.index,
        row.name,
        row.description,
        row.location,
        row.start,
        row.validUntil,
        row.severity,
        row.status,
      ]),
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 5,
        overflow: "linebreak",
        valign: "middle",
      },
      headStyles: {
        fillColor: [30, 64, 175], // deep blue
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: {
        2: { cellWidth: 200 }, // Description
        3: { cellWidth: 120 }, // Location
        4: { cellWidth: 80 }, // Start
        5: { cellWidth: 80 }, // Valid Until
      },
      margin: { top: 100, left: 40, right: 40 },

      // ---- Custom Coloring ----
      didParseCell: function (data) {
        if (data.section === "body") {
          // Severity column (6th index)
          if (data.column.index === 6) {
            const val = data.cell.raw?.toLowerCase();
            if (val === "low") {
              data.cell.styles.textColor = [34, 139, 34]; // green
            } else if (val === "medium") {
              data.cell.styles.textColor = [255, 140, 0]; // orange
            } else if (val === "high" || val === "critical") {
              data.cell.styles.textColor = [220, 20, 60]; // red
            }
          }

          // Status column (7th index)
          if (data.column.index === 7) {
            const val = data.cell.raw?.toLowerCase();
            if (val === "active") {
              data.cell.styles.textColor = [0, 128, 0]; // green
              data.cell.styles.fontStyle = "bold";
            } else if (val === "expired" || val === "inactive") {
              data.cell.styles.textColor = [128, 128, 128]; // gray
            }
          }
        }
      },
    });

    // ---- Footer ----
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() - 60,
        doc.internal.pageSize.getHeight() - 20
      );

      // Small tagline
      doc.text(
        "Generated by Lanka Alert System",
        40,
        doc.internal.pageSize.getHeight() - 20
      );
    }

    // Save
    doc.save("LankaAlert_DisasterAlerts_Report.pdf");
  };
};


  if (loading || loadingAlerts) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-xl text-gray-700">Loading disaster updates...</p>
      </div>
    );
  }

  return (
    <>
      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center text-gray-600 font-medium">
            <Filter className="w-5 h-5 mr-2" /> Filters:
          </div>

          <input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            className="px-3 py-2 border rounded-lg focus:ring focus:ring-blue-200"
          />

          <input
            type="text"
            placeholder="Search by place"
            value={filters.place}
            onChange={(e) => setFilters({ ...filters, place: e.target.value })}
            className="px-3 py-2 border rounded-lg focus:ring focus:ring-blue-200"
          />

          <select
            value={filters.warningLevel}
            onChange={(e) =>
              setFilters({ ...filters, warningLevel: e.target.value })
            }
            className="px-3 py-2 border rounded-lg focus:ring focus:ring-blue-200"
          >
            <option value="">All Severity</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <input
            type="text"
            placeholder="Disaster Type"
            value={filters.disasterType}
            onChange={(e) =>
              setFilters({ ...filters, disasterType: e.target.value })
            }
            className="px-3 py-2 border rounded-lg focus:ring focus:ring-blue-200"
          />

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border rounded-lg focus:ring focus:ring-blue-200"
          >
            <option value="active">Active Only</option>
            <option value="all">All</option>
            <option value="expired">Expired Only</option>
          </select>
        </div>

        {/* PDF Button */}
        <div className="flex justify-end">
          <button
            onClick={generatePDF}
            className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg shadow hover:bg-teal-700 transition"
          >
            <FileDown className="w-5 h-5" />
            Generate PDF
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Disaster Map</h2>
        <div className="w-full h-140 rounded-lg shadow-sm border overflow-hidden">
          <MapView zones={filteredZones} />
        </div>
      </div>

      {/* Alerts */}
      {(!filteredDisasterAlerts || filteredDisasterAlerts.length === 0) ? (
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No Alerts Found
          </h3>
          <p className="text-gray-500">
            Try adjusting your filters to see more results.
          </p>
        </div>
      ) : (
        filteredDisasterAlerts.map((alert) => {
          const start = `${alert.startDate} ${alert.startTime}`;
          const validUntil = `${alert.validUntilDate} ${alert.validUntilTime}`;
          const now = new Date();
          const isActive =
            now >= new Date(`${alert.startDate}T${alert.startTime}`) &&
            now <= new Date(`${alert.validUntilDate}T${alert.validUntilTime}`);

          return (
            <div
              key={alert.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 mb-6 border"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                <div className="flex items-start space-x-4 mb-4 lg:mb-0">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {alert.disasterName}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {alert.district}, {alert.city}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{start}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(
                    alert.severity
                  )}`}
                >
                  {alert.severity}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    isActive
                  )}`}
                >
                  {isActive ? "Active" : "Expired"}
                </span>
              </div>

              <p className="text-gray-700 mb-4">{alert.description}</p>

              {alert.nearestSafeZone && (
                <p className="text-sm text-green-700 font-medium mb-4">
                  ✅ Nearest Safe Zone: {alert.nearestSafeZone.name}
                </p>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className="text-sm text-gray-500">
                  Valid until: {validUntil}
                </span>
              </div>
            </div>
          );
        })
      )}
    </>
  );
};

export default DisasterUpdates;
