import React, { useState } from "react";
import { useWeatherAlertContext } from "../context/weatherAlertContext"; // Import context
import { MapPin, Calendar, Sun, Cloud, CloudRain, Wind } from "lucide-react"; // Import icons for weather types
import { Pie } from "react-chartjs-2"; // Import Pie Chart from Chart.js
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import jsPDF from "jspdf"; // Import jsPDF
import autoTable from "jspdf-autotable"; // Import autoTable for generating tables

// Register necessary components from Chart.js
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const WeatherAlert = () => {
  const { alerts } = useWeatherAlertContext(); // Get alerts from context
  const [filterCity, setFilterCity] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterRiskLevel, setFilterRiskLevel] = useState("All");

  // Handle Filtering by City, Type, and Risk Level
  const handleCityFilter = (e) => {
    setFilterCity(e.target.value.toLowerCase());
  };

  const handleTypeFilter = (e) => {
    setFilterType(e.target.value);
  };

  const handleRiskLevelFilter = (e) => {
    setFilterRiskLevel(e.target.value);
  };

  // Handle keydown to prevent symbols in city name filter
  const handleCityNameKeyDown = (e) => {
    const invalidChars = /[^a-zA-Z\s]/; // Only allow letters and spaces
    if (invalidChars.test(e.key)) {
      e.preventDefault(); // Prevent the invalid character
    }
  };

  // Filter the alerts based on city, type, and risk level
  const filteredAlerts = alerts.filter((alert) => {
    const matchesCity = filterCity ? alert.cityName.toLowerCase().includes(filterCity) : true;
    const matchesType = filterType !== "All" ? alert.type === filterType : true;
    const matchesRiskLevel = filterRiskLevel !== "All" ? alert.dangerLevel === filterRiskLevel : true;
    return matchesCity && matchesType && matchesRiskLevel;
  });

  // Function to get the danger level styling and text
  const getDangerLevelStyle = (level) => {
    switch (level) {
      case "High Risk":
        return { bgColor: "bg-red-100 text-red-800", text: "High Risk" }; // Red for High Risk
      case "Medium Risk":
        return { bgColor: "bg-orange-100 text-orange-800", text: "Medium Risk" }; // Orange for Medium Risk
      case "Low Risk":
        return { bgColor: "bg-yellow-100 text-yellow-800", text: "Low Risk" }; // Yellow for Low Risk
      default:
        return { bgColor: "bg-gray-100 text-gray-800", text: "Unknown" }; // Default style
    }
  };

  // Function to format the Firestore createdAt timestamp (only date)
  const formatDate = (timestamp) => {
    if (timestamp && timestamp.toDate) {
      const date = timestamp.toDate();
      return date.toLocaleDateString(); // Format to a readable string (only date, no time)
    }
    return timestamp; // Return the original timestamp if it's not a Firestore timestamp
  };

  // Function to get the weather type icon
  const getWeatherIcon = (type) => {
    switch (type) {
      case "Flood":
        return <CloudRain className="h-6 w-6 text-blue-500" />;
      case "Wind":
        return <Wind className="h-6 w-6 text-green-500" />;
      case "UV":
        return <Sun className="h-6 w-6 text-yellow-500" />;
      case "Temperature":
        return <Cloud className="h-6 w-6 text-gray-500" />;
      default:
        return <MapPin className="h-6 w-6 text-gray-500" />;
    }
  };

  // ---- Generate PDF ----
  const generatePDF = () => {
    const doc = new jsPDF("landscape", "pt", "a4"); // Set to landscape layout

    // ---- Header ----
    doc.setFontSize(20);
    doc.setTextColor(30, 30, 30);
    doc.text("Weather Alerts Report", 40, 50);

    // Report metadata
    const reportDate = new Date().toLocaleString();
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Report Generated: ${reportDate}`, 40, 70);
    doc.text("System Admin: Maleesha Shehan", 430, 70);

    // ---- Add Pie Chart as Image ----
    const pieChartCanvas = document.querySelector("canvas"); // Get the Pie chart canvas
    const pieChartImage = pieChartCanvas.toDataURL("image/png"); // Convert the canvas to a Base64 image

    // Add Pie chart image to the PDF (position at x=40, y=100, width=350, height=250)
    doc.addImage(pieChartImage, "PNG", 40, 100, 300, 220);

    // ---- Alert Count ----
    const alertCount = filteredAlerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    }, {});

    // Add Alert Counts Table
    const alertCountData = Object.entries(alertCount).map(([type, count]) => [
      type, count
    ]);

    autoTable(doc, {
      startY: 380, // Set table starting position after Pie chart
      head: [
        ["Alert Type", "Count"]
      ],
      body: alertCountData,
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 4,
        overflow: "linebreak",
        valign: "middle",
        halign: "center", // Center align the table
      },
      headStyles: {
        fillColor: [0, 123, 255],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { cellWidth: 120 }, // Alert Type column width
        1: { cellWidth: 80 },  // Count column width
      },
      margin: { top: 20, left: 40, right: 40 },
    });

    // ---- Table Data ----
    const tableData = filteredAlerts.map((alert, index) => {
      return [
        index + 1,
        alert.cityName || "N/A",
        alert.type || "N/A",
        alert.message || "N/A",
        alert.dangerLevel || "N/A",
        formatDate(alert.createdAt) || "N/A",  // Format the date
      ];
    });

    // ---- Table Options ----
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20, // Set table starting position after the alert count table
      head: [
        ["#", "City", "Alert Type", "Message", "Risk Level", "Date Created"]
      ],
      body: tableData,
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 4,
        overflow: "linebreak",
        valign: "middle",
        halign: "center", // Center align the table
      },
      headStyles: {
        fillColor: [0, 123, 255],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { cellWidth: 60 },  // Number column width
        1: { cellWidth: 120 }, // City column width
        2: { cellWidth: 120 }, // Type column width
        3: { cellWidth: 220 }, // Message column width
        4: { cellWidth: 80 },  // Risk level column width
        5: { cellWidth: 80 },  // Date column width
      },
      margin: { top: 20, left: 40, right: 40 },
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

    // Save PDF
    doc.save("WeatherAlerts_Report.pdf");
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Section with Pie Chart and Alert Count */}
      <div className="flex space-x-8 mb-8">
        {/* Pie Chart */}
        <div className="w-2/5 bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Alert Distribution</h2>
          <div className="w-full h-64">
            <Pie data={{
              labels: ["Flood", "Wind", "UV", "Temperature"],
              datasets: [{
                data: [
                  filteredAlerts.filter((alert) => alert.type === "Flood").length,
                  filteredAlerts.filter((alert) => alert.type === "Wind").length,
                  filteredAlerts.filter((alert) => alert.type === "UV").length,
                  filteredAlerts.filter((alert) => alert.type === "Temperature").length,
                ],
                backgroundColor: ["#3498db", "#2ecc71", "#f39c12", "#9b59b6"],
                hoverOffset: 4,
              }],
            }} options={{ responsive: true, maintainAspectRatio: true }} />
          </div>
        </div>

        {/* Alert Counts */}
        <div className="w-2/5 bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Alert Count by Type</h2>
          <div className="space-y-4">
            {["Flood", "Wind", "UV", "Temperature"].map((type) => (
              <div key={type} className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-200 rounded-full">
                  {getWeatherIcon(type)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">{type}</h3>
                  <p className="text-gray-500">{filteredAlerts.filter((alert) => alert.type === type).length} Alerts</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PDF Button - Next to Alert Count */}
      <div className="flex justify-end mb-6">
        <button
          onClick={generatePDF}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
        >
          Export PDF
        </button>
      </div>

      {/* Filters Section */}
      <div className="flex items-center space-x-6 mb-6">
        <input
          type="text"
          value={filterCity}
          onChange={handleCityFilter}
          onKeyDown={handleCityNameKeyDown}  // Attach the keydown handler here
          className="w-1/3 px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="Filter by City"
        />
        <select
          value={filterType}
          onChange={handleTypeFilter}
          className="w-1/3 px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="All">All Alert Types</option>
          <option value="Flood">Flood</option>
          <option value="Wind">Wind</option>
          <option value="UV">UV</option>
          <option value="Temperature">Temperature</option>
        </select>

        <select
          value={filterRiskLevel}
          onChange={handleRiskLevelFilter}
          className="w-1/3 px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="All">All Risk Levels</option>
          <option value="Low Risk">Low Risk</option>
          <option value="Medium Risk">Medium Risk</option>
          <option value="High Risk">High Risk</option>
        </select>
      </div>

      {/* Weather Alerts List */}
      <div className="space-y-6">
        {filteredAlerts.length === 0 && <p className="text-gray-500 text-center">No alerts found.</p>}
        {filteredAlerts.map((alert, index) => (
          <div
            key={index}
            className="p-6 rounded-lg shadow-md bg-white border border-gray-200"
          >
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gray-200 rounded-full">
                {getWeatherIcon(alert.type)}
              </div>
              <h3 className="text-xl font-semibold text-gray-700 flex-grow">{`${alert.type} Alert - ${alert.cityName}`}</h3>

              {/* Risk Level Indicator (Pill) */}
              <div
                className={`px-4 py-1 text-sm font-medium ${getDangerLevelStyle(alert.dangerLevel).bgColor} rounded-full`}
                style={{ minWidth: '80px', textAlign: 'center' }}
              >
                {getDangerLevelStyle(alert.dangerLevel).text}
              </div>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span>{alert.cityName}</span>
              <Calendar className="h-4 w-4 text-gray-500" />
              <span>{formatDate(alert.createdAt)}</span>
            </div>

            <p className="text-gray-600 text-lg mt-3">{alert.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeatherAlert;
