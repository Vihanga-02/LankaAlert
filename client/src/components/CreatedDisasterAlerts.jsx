// src/components/CreatedDisasterAlerts.jsx
import React, { useState, useEffect } from "react";
import {
  Edit,
  Trash2,
  Filter,
  MapPin,
  MessageCircle,
  Clock,
  FileText,
} from "lucide-react";
import { useDisasterAlert } from "../context/DisasterAlertContext";
import DisasterAlertForm from "./DisasterAlertForm";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Link } from "react-router-dom";

// ---- Severity Colors ----
const severityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

// ---- Hook: keep current time updated every 1 min ----
const useNow = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
};

const CreatedDisasterAlerts = ({ districts, districtCities, zones }) => {
  const { alerts, loading, editAlert, removeAlert } = useDisasterAlert();
  const [selectedAlert, setSelectedAlert] = useState(null);
  const now = useNow();

  const [filters, setFilters] = useState({
    date: "",
    disasterName: "",
    severity: "",
    status: "", // Active / Inactive
  });

  // ---- Filter logic ----
  const filteredAlerts = alerts.filter((alert) => {
    const start = new Date(`${alert.startDate}T${alert.startTime}`);
    const validUntil = alert.validUntil?.toDate
      ? alert.validUntil.toDate()
      : new Date(`${alert.validUntilDate}T${alert.validUntilTime}`);
    const active = now >= start && now <= validUntil;

    const dateMatch =
      !filters.date ||
      alert.startDate === filters.date ||
      alert.validUntilDate === filters.date;

    const nameMatch =
      !filters.disasterName ||
      (alert.disasterName &&
        alert.disasterName
          .toLowerCase()
          .includes(filters.disasterName.toLowerCase()));

    const levelMatch =
      !filters.severity ||
      (alert.severity &&
        alert.severity.toLowerCase() === filters.severity.toLowerCase());

    const statusMatch =
      !filters.status ||
      (filters.status === "active" && active) ||
      (filters.status === "inactive" && !active);

    return dateMatch && nameMatch && levelMatch && statusMatch;
  });

  if (loading) return <p>Loading alerts...</p>;
  if (!alerts.length) return <p>No disaster alerts created yet.</p>;

  // ---- Generate PDF with filters applied ----
  const generatePDF = () => {
    const doc = new jsPDF("landscape", "pt", "a4");

    // Load logo from public folder
    const logoUrl = `${window.location.origin}/logo.png`;
    const img = new Image();
    img.src = logoUrl;

    img.onload = () => {
      // ---- Header ----
      doc.addImage(img, "PNG", 40, 20, 40, 40);
      doc.setFontSize(24);
      doc.setTextColor(30, 30, 30);
      doc.text("Lanka Alert", 90, 45);

      doc.setFontSize(14);
      doc.setTextColor(50, 50, 50);
      doc.text("Created Disaster Alerts Report", 90, 65);

      // Report metadata
      const reportDate = new Date().toLocaleString();
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Report Generated: ${reportDate}`, 90, 80);
      doc.text(`System Admin: Vihanga Edirisinghe`, 400, 80);

      // ---- Table Data (use filteredAlerts) ----
      const tableData = filteredAlerts.map((alert, index) => {
        const start = `${alert.startDate || "N/A"} ${alert.startTime || ""}`;
        const validUntil = alert.validUntil?.toDate
          ? alert.validUntil.toDate().toLocaleString()
          : `${alert.validUntilDate || "N/A"} ${alert.validUntilTime || ""}`;

        const isActive =
          now >= new Date(`${alert.startDate}T${alert.startTime}`) &&
          now <=
            (alert.validUntil?.toDate
              ? alert.validUntil.toDate()
              : new Date(`${alert.validUntilDate}T${alert.validUntilTime}`));

        return [
          index + 1,
          alert.disasterName || "N/A",
          alert.description || "N/A",
          `${alert.district || "N/A"} - ${alert.city || "N/A"}`,
          start,
          validUntil,
          alert.severity?.toUpperCase() || "N/A",
          isActive ? "Active" : "Inactive",
          alert.sendSms ? "Enabled" : "Disabled",
          alert.nearestSafeZone?.name || "N/A",
        ];
      });

      // ---- Table Options ----
      autoTable(doc, {
        startY: 100,
        head: [[
          "#", "Name", "Description", "Location", "Start", "Valid Until",
          "Severity", "Status", "SMS", "Safe Zone"
        ]],
        body: tableData,
        theme: "grid",
        styles: {
          fontSize: 9,
          cellPadding: 4,
          overflow: "linebreak",
          valign: "middle",
        },
        headStyles: {
          fillColor: [0, 123, 255],
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          2: { cellWidth: 200 }, // Description wider
          3: { cellWidth: 120 }, // Location
          4: { cellWidth: 80 },  // Start
          5: { cellWidth: 80 },  // Valid Until
          9: { cellWidth: 100 }, // Safe Zone
        },
        margin: { top: 100, left: 40, right: 40 },
      });

      // ---- Footer with Page Numbers ----
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.getWidth() - 60,
          doc.internal.pageSize.getHeight() - 10
        );
      }

      // ---- Signature line ----
      doc.setFontSize(12);
      doc.setTextColor(30, 30, 30);
      const lastPage = doc.internal.getNumberOfPages();
      doc.setPage(lastPage);
      const y = doc.internal.pageSize.getHeight() - 60;
      doc.text("Verified by:", 40, y);
      doc.line(110, y + 2, 300, y + 2);
      doc.text("Vihanga Edirisinghe", 40, y + 15);

      // Save PDF
      doc.save("LankaAlert_DisasterAlerts_Report.pdf");
    };

    img.onerror = () => {
      console.error("Failed to load logo for PDF");
    };
  };

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-lg shadow-md border">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold flex items-center">
            <Filter className="h-5 w-5 mr-2 text-gray-600" /> Filter Alerts
          </h2>

          {/* PDF Button */}
          <button
            onClick={generatePDF}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
          >
            <FileText className="h-4 w-4 mr-2" /> Export PDF
          </button>
        </div>

        {/* Filter Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Filter by disaster name"
            value={filters.disasterName}
            onChange={(e) =>
              setFilters({ ...filters, disasterName: e.target.value })
            }
            className="px-3 py-2 border rounded-lg w-full"
          />
          <input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            className="px-3 py-2 border rounded-lg w-full"
          />
          <select
            value={filters.severity}
            onChange={(e) =>
              setFilters({ ...filters, severity: e.target.value })
            }
            className="px-3 py-2 border rounded-lg w-full"
          >
            <option value="">All Levels</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value })
            }
            className="px-3 py-2 border rounded-lg w-full"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* List of Alerts */}
      {filteredAlerts.map((alert) => {
        const start = new Date(`${alert.startDate}T${alert.startTime}`);
        const validUntil = alert.validUntil?.toDate
          ? alert.validUntil.toDate()
          : new Date(`${alert.validUntilDate}T${alert.validUntilTime}`);
        const active = now >= start && now <= validUntil;

        let vuDate = alert.validUntilDate;
        let vuTime = alert.validUntilTime;
        if ((!vuDate || !vuTime) && alert.validUntil?.toDate) {
          const d = alert.validUntil.toDate();
          vuDate = d.toISOString().split("T")[0];
          vuTime = d.toTimeString().slice(0, 5);
        }

        return (
          <div
            key={alert.id}
            className="bg-white border rounded-lg p-6 shadow-md flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0"
          >
            {/* Left: Details */}
            <div className="flex-1 space-y-2">
              <h3 className="text-xl font-semibold text-gray-900">
                {alert.disasterName}
              </h3>
              <p className="text-gray-700">{alert.description}</p>

              <div className="flex items-center space-x-2 text-gray-500 text-sm">
                <MapPin className="h-4 w-4" />
                <span>
                  {alert.district || "N/A"} - {alert.city || "N/A"}
                </span>
              </div>

              <p className="text-gray-400 text-sm">
                Start: {alert.startDate || "N/A"} {alert.startTime || ""} | Valid
                Until: {vuDate || "N/A"} {vuTime || ""}
              </p>

              <p
                className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${
                  active
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                <Clock className="h-4 w-4 mr-1" />
                {active ? "Active" : "Inactive"}
              </p>
              <br />

              {alert.nearestSafeZone && (
                <p className="text-green-600 text-sm flex items-center">
                  ✅ Safe Zone: {alert.nearestSafeZone.name}
                </p>
              )}

              {alert.sendSms && (
                <p className="text-blue-600 text-sm flex items-center">
                  <MessageCircle className="h-4 w-4 mr-1" /> SMS Alert Enabled
                </p>
              )}

              <p
                className={`inline-block mt-2 px-2 py-1 rounded text-sm font-medium ${
                  severityColors[alert.severity] ||
                  "bg-gray-100 text-gray-800"
                }`}
              >
                Severity: {alert.severity?.toUpperCase() || "N/A"}
              </p>
            </div>

            {/* Right: Actions */}
            <div className="flex space-x-3 mt-2 sm:mt-0">
              <button
                  onClick={() =>
                    setSelectedAlert({
                      ...alert,
                      validUntilDate: vuDate,
                      validUntilTime: vuTime,
                      reportId: alert.reportId || null, // ✅ keep reportId
                    })
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <Edit className="h-4 w-4 mr-2" /> Update
                </button>

              <button
                onClick={() => removeAlert(alert.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </button>
            </div>
          </div>
        );
      })}

      {/* Update Modal */}
      {selectedAlert && (
        <DisasterAlertForm
          report={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          createAlert={(data) => editAlert(selectedAlert.id, data)}
          districts={districts}
          districtCities={districtCities}
          zones={zones}
        />
      )}
    </div>
  );
};

export default CreatedDisasterAlerts;
