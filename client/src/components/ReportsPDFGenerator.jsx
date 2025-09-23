import React, { useState, forwardRef, useImperativeHandle } from "react";
import { Download, FileText } from "lucide-react";
import jsPDF from "jspdf";
import { storage } from "../services/firebase";
import { ref, getBlob, getDownloadURL } from "firebase/storage";

const ReportsPDFGenerator = forwardRef(
  (
    {
      reports,
      user,
      calculateReportPoints,
      className = "",
      onSuccess,
      onError,
    },
    ref
  ) => {
    const [pdfGenerating, setPdfGenerating] = useState(false);
    const [generatingReportId, setGeneratingReportId] = useState(null);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingMessage, setLoadingMessage] = useState("");

    // Expose functions to parent component via ref
    useImperativeHandle(ref, () => ({
      downloadIndividualReportPDF,
      downloadAllReportsPDF,
      pdfGenerating,
      generatingReportId,
      loadingProgress,
      loadingMessage,
    }));

    // Enhanced Firebase Storage image loading for PDF generation
    const loadImageForPDF = async (imageUrl) => {
      try {
        console.log("🖼️ Loading image for PDF:", imageUrl);

        // Method 1: Try Firebase Storage SDK approach
        if (imageUrl.includes("firebasestorage.googleapis.com")) {
          try {
            console.log("🔥 Trying Firebase Storage SDK method");

            // Extract storage path from URL
            let storagePath = null;

            // Match pattern: /o/path?params
            const pathMatch = imageUrl.match(/\/o\/([^?]+)/);
            if (pathMatch) {
              storagePath = decodeURIComponent(pathMatch[1]);
              console.log("📂 Extracted storage path:", storagePath);

              // Create Firebase Storage reference
              const imageRef = ref(storage, storagePath);

              // Get blob using Firebase SDK
              const blob = await getBlob(imageRef);
              console.log(
                "✅ Got blob from Firebase Storage, size:",
                blob.size
              );

              // Convert blob to data URL
              return new Promise((resolve, reject) => {
                const reader = new FileReader();

                reader.onload = () => {
                  const img = new Image();

                  img.onload = () => {
                    try {
                      const canvas = document.createElement("canvas");
                      const ctx = canvas.getContext("2d");

                      canvas.width = img.naturalWidth;
                      canvas.height = img.naturalHeight;

                      // Draw image directly without white background
                      ctx.drawImage(img, 0, 0);

                      const dataURL = canvas.toDataURL("image/jpeg", 0.8);

                      resolve({
                        dataURL,
                        width: canvas.width,
                        height: canvas.height,
                      });
                    } catch (canvasError) {
                      reject(canvasError);
                    }
                  };

                  img.onerror = () =>
                    reject(new Error("Failed to load image from blob"));
                  img.src = reader.result;
                };

                reader.onerror = () => reject(new Error("Failed to read blob"));
                reader.readAsDataURL(blob);
              });
            }
          } catch (firebaseError) {
            console.log(
              "❌ Firebase Storage SDK failed:",
              firebaseError.message
            );
          }
        }

        // Method 2: Try direct URL loading with different variations
        const urlsToTry = [imageUrl];

        if (imageUrl.includes("firebasestorage.googleapis.com")) {
          // Add alt=media if not present
          if (!imageUrl.includes("alt=media")) {
            const urlWithMedia = imageUrl.includes("?")
              ? `${imageUrl}&alt=media`
              : `${imageUrl}?alt=media`;
            urlsToTry.push(urlWithMedia);
          }

          // Try without token (public access)
          const urlWithoutToken = imageUrl.replace(/[?&]token=[^&]*/, "");
          const publicUrl = urlWithoutToken.includes("?")
            ? `${urlWithoutToken}&alt=media`
            : `${urlWithoutToken}?alt=media`;
          urlsToTry.push(publicUrl);
        }

        // Try each URL variation
        for (let i = 0; i < urlsToTry.length; i++) {
          const urlToTry = urlsToTry[i];
          console.log(`🔄 Trying direct load method ${i + 1}:`, urlToTry);

          try {
            return await new Promise((resolve, reject) => {
              const img = new Image();
              img.crossOrigin = "anonymous";

              img.onload = () => {
                try {
                  console.log(
                    "✅ Direct load successful, dimensions:",
                    img.naturalWidth,
                    "x",
                    img.naturalHeight
                  );

                  const canvas = document.createElement("canvas");
                  const ctx = canvas.getContext("2d");

                  canvas.width = img.naturalWidth || img.width;
                  canvas.height = img.naturalHeight || img.height;

                  // White background
                  ctx.fillStyle = "#FFFFFF";
                  ctx.fillRect(0, 0, canvas.width, canvas.height);

                  // Draw image
                  ctx.drawImage(img, 0, 0);

                  const dataURL = canvas.toDataURL("image/jpeg", 0.8);

                  resolve({
                    dataURL,
                    width: canvas.width,
                    height: canvas.height,
                  });
                } catch (error) {
                  reject(error);
                }
              };

              img.onerror = () => {
                reject(new Error(`Direct load failed for: ${urlToTry}`));
              };

              // Set timeout
              setTimeout(() => {
                reject(new Error(`Timeout loading: ${urlToTry}`));
              }, 10000);

              img.src = urlToTry;
            });
          } catch (directError) {
            console.log(
              `❌ Direct load method ${i + 1} failed:`,
              directError.message
            );
          }
        }

        // If all methods fail, throw error
        throw new Error(`All loading methods failed for: ${imageUrl}`);
      } catch (error) {
        console.error("❌ Image loading failed:", error);
        throw error;
      }
    };

    // Enhanced helper function to handle Firebase Storage URLs for PDF generation
    const prepareImageForPDF = async (imageUrl) => {
      console.log("🚀 prepareImageForPDF called with:", imageUrl);

      // Add overall timeout for this function
      return Promise.race([
        new Promise(async (resolve, reject) => {
          try {
            console.log("📥 Starting image preparation for PDF:", imageUrl);

            // Method 1: Try Firebase SDK approach for Firebase Storage URLs
            if (imageUrl.includes("firebasestorage.googleapis.com")) {
              try {
                console.log(
                  "🔥 Attempting Firebase SDK blob-to-base64 approach..."
                );

                // Extract path from Firebase Storage URL
                const urlObj = new URL(imageUrl);
                const pathMatch = urlObj.pathname.match(
                  /\/v0\/b\/[^\/]+\/o\/(.+)/
                );

                if (pathMatch) {
                  const filePath = decodeURIComponent(pathMatch[1]);
                  console.log("📁 Extracted file path:", filePath);

                  const imageRef = ref(storage, filePath);

                  try {
                    // Use getBlob to get the actual image data
                    const blob = await getBlob(imageRef);
                    console.log(
                      "✅ Got blob from Firebase:",
                      blob.size,
                      "bytes",
                      blob.type
                    );

                    // Convert blob directly to base64 data URL
                    const dataURL = await new Promise((resolve, reject) => {
                      const reader = new FileReader();
                      reader.onload = () => resolve(reader.result);
                      reader.onerror = reject;
                      reader.readAsDataURL(blob);
                    });

                    console.log(
                      "✅ Converted blob to data URL, length:",
                      dataURL.length
                    );

                    // Create image element to get dimensions
                    const img = await new Promise((resolve, reject) => {
                      const tempImg = new Image();
                      tempImg.onload = () => {
                        console.log(
                          "✅ Image loaded successfully, dimensions:",
                          tempImg.naturalWidth,
                          "x",
                          tempImg.naturalHeight
                        );
                        resolve(tempImg);
                      };
                      tempImg.onerror = (error) => {
                        console.error(
                          "❌ Error creating image from data URL:",
                          error
                        );
                        reject(error);
                      };
                      tempImg.src = dataURL;
                    });

                    console.log("✅ Firebase SDK blob method successful");
                    resolve({
                      dataURL,
                      width: img.naturalWidth || img.width,
                      height: img.naturalHeight || img.height,
                    });
                    return;
                  } catch (blobError) {
                    console.log("❌ Blob access failed:", blobError.message);
                    // Try the download URL approach as fallback
                    try {
                      const freshDownloadURL = await getDownloadURL(imageRef);
                      console.log(
                        "🔗 Trying fresh download URL as fallback:",
                        freshDownloadURL
                      );

                      const result = await loadImageForPDF(freshDownloadURL);
                      console.log("✅ Fallback download URL method successful");
                      resolve(result);
                      return;
                    } catch (urlError) {
                      console.log(
                        "❌ Download URL fallback also failed:",
                        urlError.message
                      );
                      throw urlError;
                    }
                  }
                }
              } catch (firebaseError) {
                console.log(
                  "❌ Firebase SDK method failed:",
                  firebaseError.message
                );
              }
            }

            // Method 2: Try direct loading first (should work with your new Storage rules)
            try {
              console.log("🔄 Attempting direct loading...");
              const result = await loadImageForPDF(imageUrl);
              console.log("✅ Successfully loaded image directly");
              resolve(result);
              return;
            } catch (error) {
              console.log("❌ Direct loading failed:", error.message);
            }

            // If direct loading fails, try some URL variations
            console.log("🔧 Trying URL variations...");
            const urlVariations = [];

            if (imageUrl.includes("firebasestorage.googleapis.com")) {
              // Try with alt=media parameter
              if (!imageUrl.includes("alt=media")) {
                const urlWithMedia = imageUrl.includes("?")
                  ? `${imageUrl}&alt=media`
                  : `${imageUrl}?alt=media`;
                urlVariations.push(urlWithMedia);
              }

              // Try without token
              const urlWithoutToken = imageUrl.replace(/[?&]token=[^&]*/, "");
              const publicUrl = urlWithoutToken.includes("?")
                ? `${urlWithoutToken}&alt=media`
                : `${urlWithoutToken}?alt=media`;
              urlVariations.push(publicUrl);
            }

            console.log("🔧 URL variations to try:", urlVariations.length);

            // Try each variation
            for (let i = 0; i < urlVariations.length; i++) {
              const urlVariation = urlVariations[i];
              try {
                console.log(
                  `🔄 Trying URL variation ${i + 1}/${urlVariations.length}:`,
                  urlVariation
                );
                const result = await loadImageForPDF(urlVariation);
                console.log("✅ Successfully loaded with variation");
                resolve(result);
                return;
              } catch (error) {
                console.log(`❌ Variation ${i + 1} failed:`, error.message);
              }
            }

            // If all variations fail, create a placeholder image
            console.log(
              "⚠️ All image loading strategies failed, creating placeholder"
            );
            const placeholder = createPlaceholderImage(
              "Failed to load image with all URL variations"
            );
            resolve(placeholder);
          } catch (error) {
            console.error("💥 Error preparing image for PDF:", error);
            const placeholder = createPlaceholderImage(
              `Error: ${error.message}`
            );
            resolve(placeholder);
          }
        }),

        // Timeout after 15 seconds
        new Promise((_, reject) => {
          setTimeout(() => {
            console.log("⏰ prepareImageForPDF timed out after 15 seconds");
            reject(new Error("Image preparation timed out"));
          }, 15000);
        }),
      ]).catch((error) => {
        console.log(
          "⏰ prepareImageForPDF caught timeout, returning placeholder"
        );
        return createPlaceholderImage(`Timeout: ${error.message}`);
      });
    };

    // Create a placeholder image when actual image fails to load
    const createPlaceholderImage = (
      errorMessage = "Failed to load from storage"
    ) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = 300;
      canvas.height = 200;

      // Background
      ctx.fillStyle = "#f3f4f6";
      ctx.fillRect(0, 0, 300, 200);

      // Border
      ctx.strokeStyle = "#d1d5db";
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 298, 198);

      // Icon (simple camera icon)
      ctx.fillStyle = "#9ca3af";
      ctx.fillRect(130, 80, 40, 30);
      ctx.fillRect(140, 70, 20, 10);
      ctx.beginPath();
      ctx.arc(150, 95, 8, 0, 2 * Math.PI);
      ctx.fill();

      // Text
      ctx.fillStyle = "#6b7280";
      ctx.font = "14px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Image not available", 150, 130);
      ctx.font = "12px Arial";
      // Truncate long error messages
      const displayError =
        errorMessage.length > 30
          ? errorMessage.substring(0, 27) + "..."
          : errorMessage;
      ctx.fillText(displayError, 150, 150);

      const dataURL = canvas.toDataURL("image/jpeg", 0.8);
      return {
        dataURL,
        width: 300,
        height: 200,
        isPlaceholder: true,
        errorMessage: errorMessage,
      };
    };

    // Enhanced PDF Download Functions with Elegant Modern Styling
    
const downloadIndividualReportPDF = async (report) => {
  console.log("🔍 DEBUG: Report data:", report);
  console.log("🔍 DEBUG: User data:", user);

  if (pdfGenerating) {
    alert("Another PDF is currently being generated. Please wait...");
    return;
  }

  try {
    setGeneratingReportId(report.id);
    setPdfGenerating(true);
    setLoadingProgress(0);
    setLoadingMessage("Initializing elegant PDF generation...");

    console.log(
      "🚀 Starting elegant PDF generation for report:",
      report.id
    );

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;

    // Enhanced color palette for modern design
    const colors = {
      primary: [37, 99, 235], // Blue-600
      primaryLight: [219, 234, 254], // Blue-100
      secondary: [99, 102, 241], // Indigo-500
      accent: [236, 72, 153], // Pink-500
      success: [34, 197, 94], // Green-500
      warning: [245, 158, 11], // Amber-500
      danger: [239, 68, 68], // Red-500
      gray: [107, 114, 128], // Gray-500
      lightGray: [249, 250, 251], // Gray-50
      darkGray: [31, 41, 55], // Gray-800
      white: [255, 255, 255],
    };

    // Professional header with clean design
    const addHeader = async () => {
      // Primary header background
      pdf.setFillColor(...colors.primary);
      pdf.rect(0, 0, pageWidth, 45, "F");

      // Add subtle accent line
      pdf.setFillColor(...colors.accent);
      pdf.rect(0, 42, pageWidth, 3, "F");

      // Load and add logo without background
      const logo = await prepareImageForPDF('/logo.png');
      const logoHeight = 15;
      const logoWidth = (logoHeight * logo.width) / logo.height;
      pdf.addImage(logo.dataURL, 'PNG', margin, 12, logoWidth, logoHeight, '', 'NONE');

      // LankaAlert logo/title
      pdf.setTextColor(...colors.white);
      pdf.setFontSize(24);
      pdf.setFont("helvetica", "bold");
      pdf.text("LankaAlert", margin + logoWidth + 5, 22);

      // Elegant subtitle
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      pdf.text("Disaster Management & Early Warning System", margin, 32);

      // Professional header info on the right
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      const headerRight = pageWidth - margin - 5;
      pdf.text("INDIVIDUAL REPORT", headerRight, 18, { align: "right" });
      pdf.text(
        `Generated: ${new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}`,
        headerRight,
        28,
        { align: "right" }
      );
      pdf.text("Confidential Document", headerRight, 36, {
        align: "right",
      });

      return 55; // Return where content should start
    };

    // Professional footer with elegant design
    const addFooter = () => {
      const footerY = pageHeight - 25;

      // Add signature line above footer
      const signatureY = footerY - 15;
      pdf.setDrawColor(...colors.gray);
      pdf.setLineWidth(0.5);
      pdf.line(margin, signatureY, margin + 150, signatureY);
      pdf.setFontSize(8);
      pdf.setTextColor(...colors.gray);
      pdf.text('Reporter Signature', margin, signatureY - 5);

      // Footer accent line
      pdf.setFillColor(...colors.accent);
      pdf.rect(0, footerY - 5, pageWidth, 2, "F");

      // Footer background
      pdf.setFillColor(...colors.lightGray);
      pdf.rect(0, footerY - 3, pageWidth, 20, "F");

      // Professional footer content
      pdf.setTextColor(...colors.gray);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");

      // Left side - Organization info
      pdf.text(
        "LankaAlert - Protecting Sri Lanka Together",
        margin,
        footerY + 8
      );
      pdf.text(
        "Ministry of Disaster Management | Emergency Response Division",
        margin,
        footerY + 16
      );

      // Center - Contact information
      const centerX = pageWidth / 2;
      pdf.text(
        "Email: contact@lankaalert.gov.lk | Phone: 1919 (Emergency Hotline)",
        centerX,
        footerY + 8,
        { align: "center" }
      );
      pdf.text(
        "Website: www.lankaalert.gov.lk | Follow @LankaAlert",
        centerX,
        footerY + 16,
        { align: "center" }
      );

      // Right side - Page info (placeholder - will be updated after content generation)
      // REMOVED the problematic line that was here
    };

    // Add enhanced header
    setLoadingProgress(15);
    setLoadingMessage("Creating professional document structure...");
    yPos = await addHeader();
    yPos += 15;

    // Modern report title section with card-like design
    pdf.setFillColor(...colors.primaryLight);
    pdf.rect(margin, yPos - 8, pageWidth - 2 * margin, 35, "F");
    pdf.setDrawColor(...colors.primary);
    pdf.setLineWidth(0.5);
    pdf.rect(margin, yPos - 8, pageWidth - 2 * margin, 35, "S");

    pdf.setTextColor(...colors.darkGray);
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text(`${report.title || "Disaster Report"}`, margin + 10, yPos + 8);

    // Report metadata
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...colors.gray);
    pdf.text(
      `Reported by: ${
        report.reporterName ? `${report.reporterName} (${report.reporterEmail || 'No email'})` : 
        user?.email || report.reporterEmail || "Anonymous Reporter"
      }`,
      margin + 10,
      yPos + 18
    );
    yPos += 45;

    // Severity indicator with clean badge design
    const severityConfig = {
      high: {
        color: colors.danger,
        label: "HIGH PRIORITY",
        bgColor: [254, 242, 242],
      },
      medium: {
        color: colors.warning,
        label: "MEDIUM PRIORITY",
        bgColor: [255, 251, 235],
      },
      low: {
        color: colors.success,
        label: "LOW PRIORITY",
        bgColor: [240, 253, 244],
      },
    };

    const severity =
      severityConfig[report.severity?.toLowerCase()] || severityConfig.low;

    // Severity badge background
    pdf.setFillColor(...severity.bgColor);
    pdf.rect(pageWidth - margin - 85, yPos - 5, 75, 20, "F");
    pdf.setDrawColor(...severity.color);
    pdf.setLineWidth(1);
    pdf.rect(pageWidth - margin - 85, yPos - 5, 75, 20, "S");

    // Severity text
    pdf.setTextColor(...severity.color);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text(severity.label, pageWidth - margin - 47.5, yPos + 7, {
      align: "center",
    });
    yPos += 25;

    // Main information section with clean design
    pdf.setTextColor(...colors.darkGray);
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Report Information", margin, yPos);
    yPos += 20;

    // Information cards with clean styling
    const infoSections = [
      {
        title: "Location Details",
        items: [
          {
            label: "Primary Location",
            value: report.locationDescription || "Not specified",
          },
          { label: "District", value: report.district || "Not specified" },
          { label: "City/Town", value: report.city || "Not specified" },
          {
            label: "GPS Coordinates",
            value:
              report.latitude && report.longitude
                ? `${parseFloat(report.latitude).toFixed(6)}, ${parseFloat(
                    report.longitude
                  ).toFixed(6)}`
                : "Not available",
          },
        ],
      },
      {
        title: "Incident Details",
        items: [
          {
            label: "Disaster Type",
            value: report.disasterType || "Not classified",
          },
          {
            label: "Severity Level",
            value:
              (report.severity || "medium").charAt(0).toUpperCase() +
              (report.severity || "medium").slice(1),
          },
          {
            label: "Reported By",
            value:
              user?.email || report.reporterEmail || "Anonymous Reporter",
          },
          {
            label: "Report Date",
            value: report.createdAt?.toDate
              ? report.createdAt.toDate().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Not available",
          },
        ],
      },
      {
        title: "Assessment Metrics",
        items: [
          {
            label: "Points Awarded",
            value: `${calculateReportPoints(report, reports)} points`,
          },
          {
            label: "Report Quality",
            value:
              report.description?.length > 100
                ? "Detailed"
                : report.description?.length > 50
                ? "Good"
                : report.description?.length > 0
                ? "Basic"
                : "Minimal",
          },
          { label: "Status", value: "Active Report" },
        ],
      },
    ];

    console.log("🔍 DEBUG: Info sections:", infoSections);

    setLoadingProgress(40);
    setLoadingMessage("Formatting report information...");

    infoSections.forEach((section, sectionIndex) => {
      console.log(
        "🔍 DEBUG: Processing section:",
        section.title,
        section.items
      );

      // Check if we need a new page before section header
      if (yPos > pageHeight - 60) {
        pdf.addPage();
        yPos = 40; // Reset yPos for new page
      }

      // Section header with modern styling
      pdf.setFillColor(...colors.lightGray);
      pdf.rect(margin, yPos - 3, pageWidth - 2 * margin, 18, "F");
      pdf.setDrawColor(...colors.primary);
      pdf.setLineWidth(0.3);
      pdf.rect(margin, yPos - 3, pageWidth - 2 * margin, 18, "S");

      pdf.setTextColor(...colors.primary);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text(section.title, margin + 8, yPos + 8);
      yPos += 25;

      // Section items with alternating backgrounds
      section.items.forEach((item, index) => {
        // Check if we need a new page before each item
        if (yPos > pageHeight - 40) {
          pdf.addPage();
          yPos = 40; // Reset yPos for new page
        }

        // Alternating row colors for better readability
        if (index % 2 === 0) {
          pdf.setFillColor(252, 252, 252);
          pdf.rect(margin, yPos - 3, pageWidth - 2 * margin, 12, "F");
        }

        pdf.setTextColor(...colors.darkGray);
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.text(`${item.label}:`, margin + 12, yPos + 4);

        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...colors.gray);
        pdf.text(item.value, margin + 85, yPos + 4);
        yPos += 12;
      });

      yPos += 15; // Space between sections
    });

    // Clean description section
    if (report.description && report.description.trim()) {
      // Check if we need a new page for description section
      if (yPos > pageHeight - 80) {
        pdf.addPage();
        yPos = 40; // Reset yPos for new page
      }

      pdf.setTextColor(...colors.darkGray);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Detailed Description", margin, yPos);
      yPos += 10;

      // Description container with clean styling
      const descriptionHeight = Math.max(
        35,
        Math.ceil(report.description.length / 80) * 6
      );
      pdf.setFillColor(250, 250, 250);
      pdf.rect(
        margin,
        yPos - 5,
        pageWidth - 2 * margin,
        descriptionHeight,
        "F"
      );
      pdf.setDrawColor(...colors.primaryLight);
      pdf.setLineWidth(0.5);
      pdf.rect(
        margin,
        yPos - 5,
        pageWidth - 2 * margin,
        descriptionHeight,
        "S"
      );

      // Left border accent
      pdf.setFillColor(...colors.accent);
      pdf.rect(margin, yPos - 5, 4, descriptionHeight, "F");

      pdf.setTextColor(...colors.darkGray);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");

      const splitDescription = pdf.splitTextToSize(
        report.description,
        pageWidth - 2 * margin - 20
      );
      pdf.text(splitDescription, margin + 15, yPos + 8);
      yPos += descriptionHeight + 30;
    }

    // Professional document verification section
    pdf.setFillColor(...colors.primaryLight);
    pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 25, "F");
    pdf.setDrawColor(...colors.primary);
    pdf.setLineWidth(0.3);
    pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 25, "S");

    pdf.setTextColor(...colors.primary);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("🔒 Document Verification", margin + 10, yPos + 5);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...colors.gray);
    pdf.text(
      `This document was automatically generated on ${new Date().toISOString()} and contains verified disaster report information.`,
      margin + 10,
      yPos + 13
    );

    // Add professional footer
    addFooter();

    setLoadingProgress(90);
    setLoadingMessage("Finalizing elegant PDF...");

    // FIXED: Update page numbers on all pages
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);

      // Position for page number (same as footer)
      const footerY = pageHeight - 25;

      // Clear only a small, precise area for the page number
      pdf.setFillColor(...colors.lightGray);
      pdf.rect(pageWidth - margin - 35, footerY + 8, 30, 8, "F");

      // Add correct page number
      pdf.setTextColor(...colors.gray);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - margin,
        footerY + 12,
        {
          align: "right",
        }
      );
    }

    const filename = `LankaAlert-Report-${
      report.title?.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 20) ||
      report.id?.substring(0, 8) ||
      Date.now()
    }.pdf`;

    pdf.save(filename);

    setLoadingProgress(100);
    setLoadingMessage("Elegant PDF download complete!");

    // Call success callback if provided
    if (onSuccess) {
      onSuccess(
        `Professional PDF for "${
          report.title || "Report"
        }" downloaded successfully!`
      );
    }
  } catch (error) {
    console.error("Error generating elegant PDF:", error);

    // Call error callback if provided
    if (onError) {
      onError("Failed to generate professional PDF. Please try again.");
    }

    alert("Error generating PDF. Please try again.");
  } finally {
    // Reset loading states
    setTimeout(() => {
      setPdfGenerating(false);
      setGeneratingReportId(null);
      setLoadingProgress(0);
      setLoadingMessage("");
    }, 1000);
  }
};

    const downloadAllReportsPDF = async () => {
      try {
        if (reports.length === 0) {
          alert("No reports to download.");
          return;
        }

        // Set loading states
        setPdfGenerating(true);
        setGeneratingReportId("all");
        setLoadingProgress(5);
        setLoadingMessage("Initializing combined PDF generation...");

        const pdf = new jsPDF();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20;
        let currentPage = 1;

        // Enhanced header function
        const addHeader = async (pageNum, totalPages) => {
          // Header background gradient effect
          pdf.setFillColor(59, 130, 246); // Blue-500
          pdf.rect(0, 0, pageWidth, 45, "F");

          // Load and add logo without background
          const logo = await prepareImageForPDF('/logo.png');
          const logoHeight = 20;
          const logoWidth = (logoHeight * logo.width) / logo.height;
          pdf.addImage(logo.dataURL, 'PNG', margin, 12, logoWidth, logoHeight, '', 'NONE');

          // LankaAlert logo/title
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(20);
          pdf.setFont(undefined, "bold");
          pdf.text("LankaAlert", margin + logoWidth + 5, 20);

          // Subtitle
          pdf.setFontSize(12);
          pdf.setFont(undefined, "normal");
          pdf.text("Comprehensive Disaster Reports", margin + logoWidth + 5, 32);

          // Page info
          pdf.text(
            `Page ${pageNum} of ${totalPages}`,
            pageWidth - margin - 40,
            20
          );
          pdf.text(
            `${new Date().toLocaleDateString()}`,
            pageWidth - margin - 40,
            32
          );

          return 55; // Return where content should start
        };

        // Enhanced footer function
        const addFooter = (pageNum) => {
          const footerY = pageHeight - 25;

          // Footer background
          pdf.setFillColor(249, 250, 251); // Gray-50
          pdf.rect(0, footerY - 10, pageWidth, 35, "F");

          // Footer line
          pdf.setDrawColor(59, 130, 246);
          pdf.setLineWidth(1);
          pdf.line(margin, footerY, pageWidth - margin, footerY);

          // Footer content
          pdf.setTextColor(107, 114, 128); // Gray-500
          pdf.setFontSize(8);
          pdf.setFont(undefined, "normal");
          pdf.text(
            "LankaAlert - Protecting Sri Lanka Together",
            margin,
            footerY + 8
          );
          pdf.text(
            `Generated on ${new Date().toLocaleString()}`,
            pageWidth / 2,
            footerY + 8,
            { align: "center" }
          );
          pdf.text(`Page ${pageNum}`, pageWidth - margin - 20, footerY + 8);

          // Contact info
          pdf.setFontSize(7);
          pdf.text(
            "Email: support@lankaalert.lk | Phone: +94-11-234-5678 | Website: www.lankaalert.lk",
            pageWidth / 2,
            footerY + 15,
            { align: "center" }
          );
        };

        // Enhanced title page
        let yPos = await addHeader(1, "?");

        // Title page content with beautiful styling
        pdf.setFillColor(239, 246, 255); // Blue-50
        pdf.rect(
          margin,
          yPos,
          pageWidth - 2 * margin,
          pageHeight - yPos - 60,
          "F"
        );

        // Main title
        pdf.setTextColor(30, 64, 175); // Blue-800
        pdf.setFontSize(28);
        pdf.setFont(undefined, "bold");
        pdf.text("Disaster Reports", pageWidth / 2, yPos + 80, {
          align: "center",
        });
        pdf.text("Compilation", pageWidth / 2, yPos + 110, { align: "center" });

        // Summary stats
        pdf.setTextColor(75, 85, 99); // Gray-600
        pdf.setFontSize(14);
        pdf.setFont(undefined, "normal");
        pdf.text(
          `Total Reports: ${reports.length}`,
          pageWidth / 2,
          yPos + 150,
          { align: "center" }
        );

        const severityCount = {
          high: reports.filter((r) => r.severity === "high").length,
          medium: reports.filter((r) => r.severity === "medium").length,
          low: reports.filter((r) => r.severity === "low").length,
        };

        pdf.text(
          `High Priority: ${severityCount.high} | Medium: ${severityCount.medium} | Low: ${severityCount.low}`,
          pageWidth / 2,
          yPos + 170,
          { align: "center" }
        );

        // Generated by
        pdf.setFontSize(12);
        pdf.text(
          `Generated by: ${user?.name || user?.email || "System"}`,
          pageWidth / 2,
          yPos + 200,
          { align: "center" }
        );

        addFooter(1);

        // Process each report with enhanced styling
        for (let reportIndex = 0; reportIndex < reports.length; reportIndex++) {
          const report = reports[reportIndex];

          // Update progress
          const reportProgress =
            Math.floor(((reportIndex + 1) / reports.length) * 80) + 10; // 10-90%
          setLoadingProgress(reportProgress);
          setLoadingMessage(
            `Processing report ${reportIndex + 1} of ${reports.length}: ${
              report.title || "Untitled"
            }`
          );

          // Add new page for each report
          pdf.addPage();
          currentPage++;
          yPos = await addHeader(currentPage, Math.ceil(reports.length * 1.2) + 1);
          yPos += 10;

          // Report header with colored background based on severity
          const severityColors = {
            high: [239, 68, 68], // Red
            medium: [245, 158, 11], // Orange
            low: [34, 197, 94], // Green
          };

          const severityColor =
            severityColors[report.severity?.toLowerCase()] ||
            severityColors.low;
          pdf.setFillColor(...severityColor);
          pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 30, "F");

          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(16);
          pdf.setFont(undefined, "bold");
          pdf.text(
            `Report ${reportIndex + 1}: ${report.title || "Untitled Report"}`,
            margin + 10,
            yPos + 10
          );

          pdf.setFontSize(10);
          pdf.setFont(undefined, "normal");
          pdf.text(
            `${report.disasterType || "Unknown Type"} • ${
              report.severity?.toUpperCase() || "UNKNOWN"
            } Priority`,
            margin + 10,
            yPos + 20
          );
          yPos += 40;

          // Report details in styled information box
          pdf.setTextColor(31, 41, 55); // Gray-800
          pdf.setFontSize(11);
          pdf.setFont(undefined, "bold");
          pdf.text("Report Information", margin, yPos);
          yPos += 15;

          // Create styled details grid
          pdf.setFillColor(249, 250, 251); // Gray-50
          pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 70, "F");
          pdf.setDrawColor(229, 231, 235); // Gray-200
          pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 70, "S");

          pdf.setTextColor(55, 65, 81); // Gray-700
          pdf.setFontSize(9);
          pdf.setFont(undefined, "normal");

          const details = [
            { label: "Location:", value: report.locationDescription || "N/A" },
            { label: "District:", value: report.district || "N/A" },
            { label: "City:", value: report.city || "N/A" },
            {
              label: "Coordinates:",
              value: `${report.latitude || "N/A"}, ${
                report.longitude || "N/A"
              }`,
            },
            {
              label: "Reporter:",
              value: user?.email || report.reporterEmail || "N/A",
            },
            {
              label: "Reported:",
              value: report.createdAt?.toDate
                ? report.createdAt.toDate().toLocaleString()
                : "N/A",
            },
            {
              label: "Points:",
              value: `${calculateReportPoints(report, reports)} points`,
            },
          ];

          details.forEach((detail, index) => {
            const row = Math.floor(index / 2);
            const col = index % 2;
            const x = margin + 10 + (col * (pageWidth - 2 * margin)) / 2;
            const y = yPos + row * 10;

            pdf.setFont(undefined, "bold");
            pdf.text(detail.label, x, y);
            pdf.setFont(undefined, "normal");
            const maxWidth = (pageWidth - 2 * margin) / 2 - 60;
            const wrappedValue = pdf.splitTextToSize(detail.value, maxWidth);
            pdf.text(wrappedValue[0] || detail.value, x + 50, y);
          });

          yPos += 80;

          // Enhanced description section
          if (report.description) {
            pdf.setTextColor(31, 41, 55); // Gray-800
            pdf.setFontSize(11);
            pdf.setFont(undefined, "bold");
            pdf.text("Description", margin, yPos);
            yPos += 15;

            pdf.setFillColor(254, 249, 195); // Yellow-50
            const descHeight = Math.min(
              50,
              Math.max(
                30,
                pdf.splitTextToSize(
                  report.description,
                  pageWidth - 2 * margin - 20
                ).length * 4
              )
            );
            pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, descHeight, "F");
            pdf.setDrawColor(253, 224, 71); // Yellow-300
            pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, descHeight, "S");

            pdf.setTextColor(55, 65, 81); // Gray-700
            pdf.setFontSize(9);
            pdf.setFont(undefined, "normal");

            const splitDescription = pdf.splitTextToSize(
              report.description,
              pageWidth - 2 * margin - 20
            );
            pdf.text(splitDescription.slice(0, 5), margin + 10, yPos + 5); // Limit to 5 lines
            if (splitDescription.length > 5) {
              pdf.setFont(undefined, "italic");
              pdf.text("... (truncated for space)", margin + 10, yPos + 30);
            }
            yPos += descHeight + 15;
          }

          // Add signature line on the last page only
          if (reportIndex === reports.length - 1) {
            // Add signature line
            const signatureY = pageHeight - 40; // Position above footer
            pdf.setDrawColor(107, 114, 128); // Gray color
            pdf.setLineWidth(0.5);
            pdf.line(margin, signatureY, margin + 150, signatureY);
            
            // Add signature label
            pdf.setTextColor(107, 114, 128);
            pdf.setFontSize(8);
            pdf.text('Reporter Signature', margin, signatureY - 5);
          }

          // Add footer to each page
          addFooter(currentPage);
        }

        // Save PDF with descriptive filename
        const filename = `LankaAlert-AllReports-${
          new Date().toISOString().split("T")[0]
        }-${reports.length}reports.pdf`;

        setLoadingProgress(95);
        setLoadingMessage("Finalizing PDF...");

        pdf.save(filename);

        console.log(`✅ Combined PDF generated successfully: ${filename}`);
        setLoadingProgress(100);
        setLoadingMessage("Combined PDF download complete!");

        // Call success callback if provided
        if (onSuccess) {
          onSuccess(
            `PDF with ${reports.length} reports downloaded successfully!`
          );
        }
      } catch (error) {
        console.error("❌ Error generating combined PDF:", error);

        // Call error callback if provided
        if (onError) {
          onError("Failed to generate PDF. Please try again.");
        }

        // More specific error messages
        let errorMessage = "Error generating combined PDF. ";
        if (error.message?.includes("Failed to load image")) {
          errorMessage +=
            "Some images could not be loaded. This might be due to network issues or image access restrictions.";
        } else if (error.message?.includes("Canvas")) {
          errorMessage +=
            "Image processing failed. Some images might be corrupted or in an unsupported format.";
        } else {
          errorMessage +=
            "Please try again or contact support if the issue persists.";
        }

        alert(errorMessage);
      } finally {
        // Reset loading states
        setTimeout(() => {
          setPdfGenerating(false);
          setGeneratingReportId(null);
          setLoadingProgress(0);
          setLoadingMessage("");
        }, 1000); // Show completion message for 1 second
        console.log("🏁 Combined PDF generation completed");
      }
    };

    return (
      <div className={className}>
        {/* Download Buttons */}
        <div className="mb-4 flex flex-wrap gap-3">
          <button
            onClick={downloadAllReportsPDF}
            disabled={reports.length === 0 || pdfGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {pdfGenerating && generatingReportId === "all" ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Download All Reports PDF
            {reports.length > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                {reports.length}
              </span>
            )}
          </button>

          <div className="text-sm text-gray-600 flex items-center">
            <Download className="h-4 w-4 mr-1" />
            Individual downloads available in each row
          </div>
        </div>

        {/* Progress Indicator */}
        {pdfGenerating && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span className="text-sm font-medium text-blue-700">
                Generating PDF...
              </span>
            </div>

            {loadingProgress > 0 && (
              <div className="mb-2">
                <div className="flex justify-between text-xs text-blue-600 mb-1">
                  <span>{loadingMessage}</span>
                  <span>{loadingProgress}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <p className="text-xs text-blue-600">
              Please wait while we process the images and generate your PDF...
            </p>
          </div>
        )}

        {/* Expose PDF functions for individual report buttons */}
        <div style={{ display: "none" }}>
          {/* This is used by parent component to get access to the PDF functions */}
        </div>
      </div>
    );
  }
);

// Set display name for debugging
ReportsPDFGenerator.displayName = "ReportsPDFGenerator";

// Export the individual PDF function for use in parent component
export { ReportsPDFGenerator };
export default ReportsPDFGenerator;
