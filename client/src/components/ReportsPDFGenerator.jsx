import React, { useState, forwardRef, useImperativeHandle } from "react";
import { Download, FileText } from "lucide-react";
import jsPDF from "jspdf";
import { storage } from "../services/firebase";
import { ref, getBlob, getDownloadURL } from "firebase/storage";

const ReportsPDFGenerator = forwardRef(
  ({ reports, user, calculateReportPoints, className = "" }, ref) => {
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

    // Enhanced PDF Download Functions with Beautiful Styling
    const downloadIndividualReportPDF = async (report) => {
      if (pdfGenerating) {
        alert("Another PDF is currently being generated. Please wait...");
        return;
      }

      try {
        setGeneratingReportId(report.id);
        setPdfGenerating(true);
        setLoadingProgress(0);
        setLoadingMessage("Initializing PDF generation...");

        console.log("🚀 Starting PDF generation for report:", report.id);

        const pdf = new jsPDF();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20;
        let yPos = margin;

        // Add header function
        const addHeader = () => {
          // Header background
          pdf.setFillColor(59, 130, 246); // Blue-500
          pdf.rect(0, 0, pageWidth, 40, "F");

          // LankaAlert logo/title
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(18);
          pdf.setFont(undefined, "bold");
          pdf.text("LankaAlert", margin, 20);

          // Subtitle
          pdf.setFontSize(10);
          pdf.setFont(undefined, "normal");
          pdf.text("Disaster Management System", margin, 30);

          // Date and time
          pdf.text(
            `Generated: ${new Date().toLocaleString()}`,
            pageWidth - margin - 50,
            20
          );
          pdf.text("Individual Report", pageWidth - margin - 50, 30);

          return 50; // Return where content should start
        };

        // Add footer function
        const addFooter = () => {
          const footerY = pageHeight - 25;

          // Footer line
          pdf.setDrawColor(59, 130, 246);
          pdf.setLineWidth(0.5);
          pdf.line(margin, footerY, pageWidth - margin, footerY);

          // Footer text
          pdf.setTextColor(107, 114, 128); // Gray-500
          pdf.setFontSize(8);
          pdf.setFont(undefined, "normal");
          pdf.text("LankaAlert - Keeping Sri Lanka Safe", margin, footerY + 10);
          pdf.text(`Page 1 of 1`, pageWidth - margin - 30, footerY + 10);
          pdf.text(
            "Email: support@lankaalert.lk | Website: www.lankaalert.lk",
            pageWidth / 2,
            footerY + 15,
            { align: "center" }
          );
        };

        // Add header
        setLoadingProgress(10);
        setLoadingMessage("Building PDF structure...");
        yPos = addHeader();
        yPos += 10;

        // Report title with colored background
        pdf.setFillColor(239, 246, 255); // Blue-50
        pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 25, "F");
        pdf.setTextColor(30, 64, 175); // Blue-800
        pdf.setFontSize(16);
        pdf.setFont(undefined, "bold");
        pdf.text(
          `Disaster Report: ${report.title || "Untitled Report"}`,
          margin + 10,
          yPos + 10
        );
        yPos += 35;

        // Report ID and status
        pdf.setTextColor(75, 85, 99); // Gray-600
        pdf.setFontSize(10);
        pdf.setFont(undefined, "normal");
        pdf.text(`Report ID: ${report.id || "N/A"}`, margin, yPos);

        // Severity badge
        const severityColors = {
          high: { bg: [239, 68, 68], text: [255, 255, 255] }, // Red
          medium: { bg: [245, 158, 11], text: [255, 255, 255] }, // Orange
          low: { bg: [34, 197, 94], text: [255, 255, 255] }, // Green
        };

        const severityColor =
          severityColors[report.severity?.toLowerCase()] || severityColors.low;
        pdf.setFillColor(...severityColor.bg);
        pdf.rect(pageWidth - margin - 60, yPos - 8, 50, 12, "F");
        pdf.setTextColor(...severityColor.text);
        pdf.setFont(undefined, "bold");
        pdf.text(
          `${(report.severity || "LOW").toUpperCase()}`,
          pageWidth - margin - 35,
          yPos - 1,
          { align: "center" }
        );
        yPos += 20;

        // Details section
        pdf.setTextColor(31, 41, 55); // Gray-800
        pdf.setFontSize(12);
        pdf.setFont(undefined, "bold");
        pdf.text("Report Details", margin, yPos);
        yPos += 15;

        // Create a styled details box
        pdf.setFillColor(249, 250, 251); // Gray-50
        pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 80, "F");
        pdf.setDrawColor(229, 231, 235); // Gray-200
        pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 80, "S");

        pdf.setTextColor(55, 65, 81); // Gray-700
        pdf.setFontSize(10);
        pdf.setFont(undefined, "normal");

        const details = [
          { label: "Disaster Type:", value: report.disasterType || "N/A" },
          { label: "Location:", value: report.locationDescription || "N/A" },
          { label: "District:", value: report.district || "N/A" },
          { label: "City:", value: report.city || "N/A" },
          {
            label: "Coordinates:",
            value: `${report.latitude || "N/A"}, ${report.longitude || "N/A"}`,
          },
          { label: "Reporter:", value: report.reporterEmail || "N/A" },
          {
            label: "Date Created:",
            value: report.createdAt?.toDate
              ? report.createdAt.toDate().toLocaleString()
              : "N/A",
          },
          {
            label: "Points Earned:",
            value: `${calculateReportPoints(report, reports)} points`,
          },
        ];

        details.forEach((detail, index) => {
          const detailY = yPos + index * 8;
          pdf.setFont(undefined, "bold");
          pdf.text(detail.label, margin + 10, detailY);
          pdf.setFont(undefined, "normal");
          pdf.text(detail.value, margin + 80, detailY);
        });

        yPos += 90;

        // Description section
        if (report.description) {
          pdf.setTextColor(31, 41, 55); // Gray-800
          pdf.setFontSize(12);
          pdf.setFont(undefined, "bold");
          pdf.text("Description", margin, yPos);
          yPos += 15;

          pdf.setFillColor(254, 249, 195); // Yellow-50
          pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 40, "F");
          pdf.setDrawColor(253, 224, 71); // Yellow-300
          pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 40, "S");

          pdf.setTextColor(55, 65, 81); // Gray-700
          pdf.setFontSize(10);
          pdf.setFont(undefined, "normal");

          const splitDescription = pdf.splitTextToSize(
            report.description,
            pageWidth - 2 * margin - 20
          );
          pdf.text(splitDescription, margin + 10, yPos + 5);
          yPos += Math.max(40, splitDescription.length * 5) + 15;
        }

        // Images section
        if (report.images && report.images.length > 0) {
          pdf.setTextColor(31, 41, 55); // Gray-800
          pdf.setFontSize(12);
          pdf.setFont(undefined, "bold");
          pdf.text(`Images (${report.images.length})`, margin, yPos);
          yPos += 15;

          for (let i = 0; i < report.images.length; i++) {
            const imageUrl = report.images[i];
            try {
              // Update progress
              const imageProgress = ((i + 1) / report.images.length) * 80; // Images take 80% of total progress
              setLoadingProgress(20 + imageProgress); // 20% for PDF setup + image progress
              setLoadingMessage(
                `Processing image ${i + 1} of ${report.images.length}...`
              );

              // Check if we need a new page
              if (yPos + 100 > pageHeight - 40) {
                pdf.addPage();
                yPos = addHeader() + 20;
              }

              console.log(`Processing image ${i + 1}:`, imageUrl);

              // Simple direct image loading - no base64 conversion needed for Firebase Storage URLs
              let imageData;
              try {
                console.log("🔄 Loading Firebase Storage image directly...");

                // Direct loading of Firebase Storage URL using existing loadImageForPDF function
                imageData = await Promise.race([
                  prepareImageForPDF(imageUrl),
                  new Promise((_, reject) =>
                    setTimeout(
                      () =>
                        reject(
                          new Error("Image load timeout - using placeholder")
                        ),
                      5000
                    )
                  ),
                ]);

                if (
                  imageData &&
                  imageData.dataURL &&
                  !imageData.isPlaceholder
                ) {
                  console.log("✅ Successfully loaded actual image:", {
                    width: imageData.width,
                    height: imageData.height,
                  });
                } else {
                  console.log("⚠️ Image loading returned placeholder data");
                }
              } catch (error) {
                console.error("❌ Image loading failed quickly:", error);
                console.log("🔧 Creating informative placeholder...");

                // Create a more informative placeholder with report details
                const placeholderText = `Image ${i + 1} from ${
                  report.disasterType || "disaster"
                } report in ${report.location || "unknown location"}`;
                imageData = createPlaceholderImage(placeholderText);
              }

              // Image frame
              pdf.setFillColor(255, 255, 255);
              pdf.rect(margin, yPos - 5, 120, 85, "F");
              pdf.setDrawColor(229, 231, 235);
              pdf.rect(margin, yPos - 5, 120, 85, "S");

              // Add image with proper dimensions
              const imgWidth = 110;
              const aspectRatio = imageData.height / imageData.width;
              const imgHeight = Math.min(imgWidth * aspectRatio, 75);

              pdf.addImage(
                imageData.dataURL,
                "JPEG",
                margin + 5,
                yPos,
                imgWidth,
                imgHeight
              );

              // Image caption with improved messaging
              pdf.setTextColor(107, 114, 128);
              pdf.setFontSize(8);

              // Check if this is a placeholder image
              if (
                imageData.isPlaceholder ||
                (imageData.width === 300 && imageData.height === 200)
              ) {
                pdf.text(
                  `Image ${i + 1} of ${
                    report.images.length
                  } (Image unavailable)`,
                  margin + 5,
                  yPos + imgHeight + 10
                );

                // Add error details in smaller text if available
                if (imageData.errorMessage) {
                  pdf.setTextColor(239, 68, 68); // Red for error
                  pdf.setFontSize(7);
                  const errorText =
                    imageData.errorMessage.length > 50
                      ? imageData.errorMessage.substring(0, 47) + "..."
                      : imageData.errorMessage;
                  pdf.text(
                    `Error: ${errorText}`,
                    margin + 5,
                    yPos + imgHeight + 20
                  );
                  pdf.setTextColor(107, 114, 128); // Reset color
                  pdf.setFontSize(8); // Reset font size
                }
              } else {
                pdf.text(
                  `Image ${i + 1} of ${report.images.length}`,
                  margin + 5,
                  yPos + imgHeight + 10
                );
              }

              yPos +=
                imageData.isPlaceholder || imageData.errorMessage ? 105 : 95; // Extra space for error message
            } catch (error) {
              console.error(`Error processing image ${i + 1}:`, error);

              // This should not happen now since we return placeholder images
              // But keeping as ultimate fallback
              pdf.setTextColor(239, 68, 68); // Red
              pdf.setFont(undefined, "italic");
              pdf.text(`Image ${i + 1}: Processing error`, margin, yPos);
              yPos += 15;
            }
          }
        }

        // Add footer
        addFooter();

        console.log("📄 About to save PDF...");
        setLoadingProgress(95);
        setLoadingMessage("Finalizing PDF download...");

        // Save PDF
        const filename = `LankaAlert-Report-${
          report.title?.replace(/[^a-zA-Z0-9]/g, "_") || report.id || Date.now()
        }.pdf`;

        console.log("📁 Saving PDF with filename:", filename);

        try {
          pdf.save(filename);
          console.log("✅ PDF save() method completed successfully");
        } catch (saveError) {
          console.error("❌ Error during PDF save:", saveError);
          throw new Error(`PDF save failed: ${saveError.message}`);
        }

        console.log("✅ PDF generated and downloaded successfully");
        setLoadingProgress(100);
        setLoadingMessage("PDF download complete!");
      } catch (error) {
        console.error("Error generating PDF:", error);

        // More specific error messages
        let errorMessage = "Error generating PDF. ";
        if (error.message?.includes("Failed to load image")) {
          errorMessage +=
            "Some images could not be loaded. This might be due to network issues or image access restrictions.";
        } else if (error.message?.includes("Canvas")) {
          errorMessage +=
            "Image processing failed. The images might be corrupted or in an unsupported format.";
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
        const addHeader = (pageNum, totalPages) => {
          // Header background gradient effect
          pdf.setFillColor(59, 130, 246); // Blue-500
          pdf.rect(0, 0, pageWidth, 45, "F");

          // LankaAlert logo/title
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(20);
          pdf.setFont(undefined, "bold");
          pdf.text("LankaAlert", margin, 20);

          // Subtitle
          pdf.setFontSize(12);
          pdf.setFont(undefined, "normal");
          pdf.text("Comprehensive Disaster Reports", margin, 32);

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
        let yPos = addHeader(1, "?");

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
          yPos = addHeader(currentPage, Math.ceil(reports.length * 1.2) + 1);
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
            { label: "Reporter:", value: report.reporterEmail || "N/A" },
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

          // Enhanced images section (compact for combined PDF)
          if (report.images && report.images.length > 0) {
            pdf.setTextColor(31, 41, 55); // Gray-800
            pdf.setFontSize(11);
            pdf.setFont(undefined, "bold");
            pdf.text(`Images (${report.images.length} attached)`, margin, yPos);
            yPos += 15;

            // Show first image thumbnail with enhanced loading
            try {
              if (report.images[0]) {
                console.log(
                  `Processing thumbnail for report ${reportIndex + 1}:`,
                  report.images[0]
                );

                // Update progress for image processing
                setLoadingMessage(
                  `Processing thumbnail for report ${reportIndex + 1}: ${
                    report.title || "Untitled"
                  }`
                );

                // Use enhanced image preparation
                const imageData = await prepareImageForPDF(report.images[0]);

                // Image frame with shadow effect
                pdf.setFillColor(255, 255, 255);
                pdf.rect(margin, yPos - 2, 60, 45, "F");
                pdf.setDrawColor(229, 231, 235);
                pdf.setLineWidth(1);
                pdf.rect(margin, yPos - 2, 60, 45, "S");

                // Calculate proper dimensions for thumbnail
                const imgWidth = 50;
                const maxImgHeight = 35;
                const aspectRatio = imageData.height / imageData.width;
                const imgHeight = Math.min(
                  imgWidth * aspectRatio,
                  maxImgHeight
                );

                pdf.addImage(
                  imageData.dataURL,
                  "JPEG",
                  margin + 5,
                  yPos,
                  imgWidth,
                  imgHeight
                );

                // Image caption with improved messaging
                pdf.setTextColor(107, 114, 128);
                pdf.setFontSize(8);

                // Check if this is a placeholder image
                if (
                  imageData.isPlaceholder ||
                  (imageData.width === 300 && imageData.height === 200)
                ) {
                  pdf.text(
                    "Image preview (unavailable)",
                    margin + 70,
                    yPos + 10
                  );

                  // Add brief error indication
                  if (imageData.errorMessage) {
                    pdf.setTextColor(239, 68, 68); // Red for error
                    pdf.setFontSize(7);
                    pdf.text("Image loading failed", margin + 70, yPos + 20);
                    pdf.setTextColor(107, 114, 128); // Reset color
                    pdf.setFontSize(8); // Reset font size
                  }
                } else {
                  pdf.text("First image preview", margin + 70, yPos + 10);
                }

                if (report.images.length > 1) {
                  pdf.setFont(undefined, "bold");
                  pdf.text(
                    `+${report.images.length - 1} more images`,
                    margin + 70,
                    yPos + 20
                  );
                }
                yPos += 50;
              }
            } catch (error) {
              // This should not happen now since we return placeholder images
              pdf.setTextColor(239, 68, 68); // Red
              pdf.setFontSize(9);
              pdf.text(
                `Images: ${report.images.length} (preview unavailable)`,
                margin,
                yPos
              );
              yPos += 15;
            }
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
      } catch (error) {
        console.error("❌ Error generating combined PDF:", error);

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
