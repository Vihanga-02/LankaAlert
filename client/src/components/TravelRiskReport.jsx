import React from "react";
import { Download, MapPin, AlertTriangle, Info, Route } from "lucide-react";
import { jsPDF } from "jspdf";

const TravelRiskReport = ({
  timestamp,
  userLocation,
  routes,
  selectedRouteIndex,
  routeRisks,
  notifications,
  affectedZones
}) => {
  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let yPosition = 20;

    // Header with logo
    doc.setFontSize(20);
    doc.setTextColor(40, 103, 178);
    
    // Add logo to the left side - using absolute path from public folder
    try {
      // Use the absolute path to the logo in the public folder
      const logoPath = `${window.location.origin}/logo.png`;
      // Add logo image (adjust dimensions as needed)
      doc.addImage(logoPath, 'PNG', margin, yPosition - 5, 20, 20);
      // Position text to the right of the logo
      doc.text("LankaAlert Travel Risk Report", margin + 25, yPosition + 5);
    } catch (error) {
      // Fallback if logo fails to load
      console.warn("Logo not found, using text-only header");
      doc.text("LankaAlert Travel Risk Report", pageWidth / 2, yPosition, { align: "center" });
    }
    
    yPosition += 15;

    // Timestamp
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${timestamp}`, margin, yPosition);
    yPosition += 10;

    // User Location
    if (userLocation) {
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`User Location: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`, margin, yPosition);
      yPosition += 10;
    }

    // Route Overview
    doc.setFontSize(14);
    doc.setTextColor(40, 103, 178);
    doc.text("Route Overview", margin, yPosition);
    yPosition += 10;

    // Selected route info
    const selectedRoute = routes[selectedRouteIndex];
    const selectedRisk = routeRisks[selectedRouteIndex];
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Selected Route: Route ${selectedRouteIndex + 1}`, margin, yPosition);
    yPosition += 7;
    doc.text(`Distance: ${selectedRoute.legs[0]?.distance?.text}`, margin, yPosition);
    yPosition += 7;
    doc.text(`Duration: ${selectedRoute.legs[0]?.duration?.text}`, margin, yPosition);
    yPosition += 7;
    doc.text(`Risk Level: ${selectedRisk.riskLevel.toUpperCase()}`, margin, yPosition);
    yPosition += 15;

    // All routes table - manually creating table without autoTable
    doc.setFontSize(12);
    doc.setTextColor(40, 103, 178);
    doc.text("Alternative Routes Comparison", margin, yPosition);
    yPosition += 10;

    // Table headers
    doc.setFillColor(40, 103, 178);
    doc.setTextColor(255, 255, 255);
    doc.rect(margin, yPosition, pageWidth - margin * 2, 8, 'F');
    doc.text("Route", margin + 2, yPosition + 6);
    doc.text("Distance", margin + 30, yPosition + 6);
    doc.text("Duration", margin + 70, yPosition + 6);
    doc.text("Risk", margin + 110, yPosition + 6);
    doc.text("Zones", margin + 140, yPosition + 6);
    yPosition += 8;

    // Table rows
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    
    routes.forEach((route, index) => {
      const risk = routeRisks[index];
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, yPosition, pageWidth - margin * 2, 8, 'F');
      }
      
      doc.text(`Route ${index + 1}`, margin + 2, yPosition + 6);
      doc.text(route.legs[0]?.distance?.text || "N/A", margin + 30, yPosition + 6);
      doc.text(route.legs[0]?.duration?.text || "N/A", margin + 70, yPosition + 6);
      doc.text(risk.riskLevel.toUpperCase(), margin + 110, yPosition + 6);
      doc.text(risk.affectedZones.length.toString(), margin + 140, yPosition + 6);
      
      yPosition += 8;
    });

    yPosition += 10;

    // Affected Zones
    if (affectedZones.length > 0) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(40, 103, 178);
      doc.text("Affected Zones", margin, yPosition);
      yPosition += 10;

      // Zone headers
      doc.setFillColor(220, 53, 69);
      doc.setTextColor(255, 255, 255);
      doc.rect(margin, yPosition, pageWidth - margin * 2, 8, 'F');
      doc.text("Zone", margin + 2, yPosition + 6);
      doc.text("Type", margin + 60, yPosition + 6);
      doc.text("Location", margin + 100, yPosition + 6);
      yPosition += 8;

      // Zone rows
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      
      affectedZones.forEach((zone, index) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
          
          // Re-add headers on new page
          doc.setFillColor(220, 53, 69);
          doc.setTextColor(255, 255, 255);
          doc.rect(margin, yPosition, pageWidth - margin * 2, 8, 'F');
          doc.text("Zone", margin + 2, yPosition + 6);
          doc.text("Type", margin + 60, yPosition + 6);
          doc.text("Location", margin + 100, yPosition + 6);
          yPosition += 8;
        }
        
        // Alternate row colors
        if (index % 2 === 0) {
          doc.setFillColor(240, 240, 240);
          doc.rect(margin, yPosition, pageWidth - margin * 2, 8, 'F');
        }
        
        doc.text(zone.name || "Unknown", margin + 2, yPosition + 6);
        doc.text(zone.type || "Unknown", margin + 60, yPosition + 6);
        doc.text(`${zone.latitude?.toFixed(4)}, ${zone.longitude?.toFixed(4)}`, margin + 100, yPosition + 6);
        
        yPosition += 8;
      });

      yPosition += 10;
    }

    // Notifications
    if (notifications.length > 0) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(40, 103, 178);
      doc.text("Active Alerts", margin, yPosition);
      yPosition += 10;

      notifications.forEach((notif, index) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(12);
        doc.setTextColor(220, 53, 69);
        doc.text(notif.title || "Unknown Alert", margin, yPosition);
        yPosition += 7;
        
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        
        // Split message into multiple lines if too long
        const message = notif.message || "No details available";
        const maxWidth = pageWidth - margin * 2;
        const splitMessage = doc.splitTextToSize(message, maxWidth);
        doc.text(splitMessage, margin, yPosition);
        yPosition += splitMessage.length * 7;
        
        if (notif.timestamp) {
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          doc.text(`Issued: ${new Date(notif.timestamp.toDate()).toLocaleString()}`, margin, yPosition);
          yPosition += 6;
        }
        
        yPosition += 8;
        
        // Add separator line
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 5;
      });
    }

    // Safety Tips
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(14);
    doc.setTextColor(40, 103, 178);
    doc.text("Safety Recommendations", margin, yPosition);
    yPosition += 10;

    const safetyTips = [
      "Avoid driving at night in high-risk zones",
      "Check weather conditions before traveling",
      "Keep emergency contacts handy",
      "Carry essential supplies (water, food, first aid)",
      "Inform someone about your travel route and estimated arrival time"
    ];

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    safetyTips.forEach((tip, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(`${index + 1}. ${tip}`, margin + 5, yPosition);
      yPosition += 7;
    });

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Information is based on available alerts. Actual conditions may differ.", 
             pageWidth / 2, footerY, { align: "center" });

    // Save PDF
    doc.save(`LankaAlert-Risk-Report-${timestamp.replace(/[:/]/g, '-')}.pdf`);
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-medium flex items-center">
          <Route className="mr-2 h-4 w-4" />
          Travel Risk Report
        </h4>
        <button
          onClick={generatePDF}
          className="flex items-center bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
        >
          <Download className="h-4 w-4 mr-1" />
          Download Report
        </button>
      </div>
      
      <div className="text-xs text-gray-500 mb-2">
        <p>Generated: {timestamp}</p>
        {userLocation && (
          <p>Your location: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}</p>
        )}
      </div>
      
      <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
        <p>Information is based on available alerts. Actual conditions may differ.</p>
      </div>
    </div>
  );
};

export default TravelRiskReport;