import React, { useState, useEffect } from "react";
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
  getBlob,
} from "firebase/storage";
import DisasterReportForm from "../components/DisasterReportForm";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

  // PDF generation states
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [generatingReportId, setGeneratingReportId] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("");

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

  // Calculate points for a report based on criteria
  const calculateReportPoints = (report, allReports) => {
    let points = 50; // Base verified report points

    // +20 points for reports with photos
    if (report.images && report.images.length > 0) {
      points += 20;
    }

    // +30 points for critical priority (high severity)
    if (report.severity === "high") {
      points += 30;
    }

    // +40 points for first report (check if this is the first report from this user in this location/disaster type)
    const isFirstReport =
      allReports.filter(
        (r) =>
          r.reporterEmail === report.reporterEmail &&
          r.disasterType === report.disasterType &&
          r.locationDescription === report.locationDescription &&
          new Date(r.createdAt?.toDate?.() || r.createdAt) <=
            new Date(report.createdAt?.toDate?.() || report.createdAt)
      ).length === 1;

    if (isFirstReport) {
      points += 40;
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
            console.log("✅ Got blob from Firebase Storage, size:", blob.size);

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
          console.log("❌ Firebase Storage SDK failed:", firebaseError.message);
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
          const placeholder = createPlaceholderImage(`Error: ${error.message}`);
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

  // Helper function to load image with a specific URL
  const loadImageWithUrl = async (imageUrl) => {
    return new Promise((resolve, reject) => {
      const img = new Image();

      // Set crossOrigin before setting src
      img.crossOrigin = "anonymous";

      const handleLoad = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const width = img.naturalWidth || img.width;
          const height = img.naturalHeight || img.height;

          canvas.width = width;
          canvas.height = height;

          // Clear canvas with white background
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);

          // Draw image
          ctx.drawImage(img, 0, 0);

          const dataURL = canvas.toDataURL("image/jpeg", 0.8);
          resolve({
            dataURL,
            width: width,
            height: height,
          });
        } catch (canvasError) {
          console.error("Canvas processing error:", canvasError);
          reject(new Error(`Canvas error: ${canvasError.message}`));
        }
      };

      const handleError = (error) => {
        reject(new Error(`Image load failed: ${imageUrl}`));
      };

      // Set a timeout for image loading
      const timeout = setTimeout(() => {
        reject(new Error(`Image load timeout: ${imageUrl}`));
      }, 15000); // 15 second timeout

      img.onload = () => {
        clearTimeout(timeout);
        handleLoad();
      };

      img.onerror = () => {
        clearTimeout(timeout);
        handleError();
      };

      img.src = imageUrl;
    });
  };

  // Alternative method using fetch for difficult URLs
  const loadImageWithFetch = async (imageUrl) => {
    try {
      console.log("Trying fetch method for:", imageUrl);

      // Fetch the image as a blob
      const response = await fetch(imageUrl, {
        mode: "cors",
        credentials: "omit",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const width = img.naturalWidth || img.width;
            const height = img.naturalHeight || img.height;

            canvas.width = width;
            canvas.height = height;

            // Clear canvas with white background
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, width, height);

            // Draw image
            ctx.drawImage(img, 0, 0);

            const dataURL = canvas.toDataURL("image/jpeg", 0.8);

            // Clean up object URL
            URL.revokeObjectURL(objectUrl);

            resolve({
              dataURL,
              width: width,
              height: height,
            });
          } catch (canvasError) {
            URL.revokeObjectURL(objectUrl);
            console.error("Canvas processing error:", canvasError);
            reject(new Error(`Canvas error: ${canvasError.message}`));
          }
        };

        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error(`Image load failed via fetch: ${imageUrl}`));
        };

        img.src = objectUrl;
      });
    } catch (fetchError) {
      console.error("Fetch error:", fetchError);
      throw new Error(`Fetch failed: ${fetchError.message}`);
    }
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
          value: `${calculateReportPoints(report, userReports)} points`,
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
            console.log("Image URL type:", typeof imageUrl);
            console.log("Image URL length:", imageUrl?.length);

            // Simple direct image loading - no base64 conversion needed for Firebase Storage URLs
            let imageData;
            try {
              console.log("🔄 Loading Firebase Storage image directly...");

              // Direct loading of Firebase Storage URL using existing loadImageForPDF function
              imageData = await Promise.race([
                loadImageForPDF(imageUrl),
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

              if (imageData && imageData.dataURL && !imageData.isPlaceholder) {
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
            try {
              imageData = await prepareImageForPDF(imageUrl);
              console.log("✅ prepareImageForPDF completed, imageData:", {
                hasDataURL: !!imageData.dataURL,
                width: imageData.width,
                height: imageData.height,
                isPlaceholder: !!imageData.isPlaceholder,
              });
            } catch (error) {}

            console.log("Received imageData:", {
              hasDataURL: !!imageData.dataURL,
              width: imageData.width,
              height: imageData.height,
              isPlaceholder: imageData.isPlaceholder,
              errorMessage: imageData.errorMessage,
            });

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
                `Image ${i + 1} of ${report.images.length} (Image unavailable)`,
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
      if (filteredReports.length === 0) {
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
        `Total Reports: ${filteredReports.length}`,
        pageWidth / 2,
        yPos + 150,
        { align: "center" }
      );

      const severityCount = {
        high: filteredReports.filter((r) => r.severity === "high").length,
        medium: filteredReports.filter((r) => r.severity === "medium").length,
        low: filteredReports.filter((r) => r.severity === "low").length,
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
      for (
        let reportIndex = 0;
        reportIndex < filteredReports.length;
        reportIndex++
      ) {
        const report = filteredReports[reportIndex];

        // Update progress
        const reportProgress =
          Math.floor(((reportIndex + 1) / filteredReports.length) * 80) + 10; // 10-90%
        setLoadingProgress(reportProgress);
        setLoadingMessage(
          `Processing report ${reportIndex + 1} of ${filteredReports.length}: ${
            report.title || "Untitled"
          }`
        );

        // Add new page for each report
        pdf.addPage();
        currentPage++;
        yPos = addHeader(
          currentPage,
          Math.ceil(filteredReports.length * 1.2) + 1
        );
        yPos += 10;

        // Report header with colored background based on severity
        const severityColors = {
          high: [239, 68, 68], // Red
          medium: [245, 158, 11], // Orange
          low: [34, 197, 94], // Green
        };

        const severityColor =
          severityColors[report.severity?.toLowerCase()] || severityColors.low;
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
            value: `${report.latitude || "N/A"}, ${report.longitude || "N/A"}`,
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
            value: `${calculateReportPoints(report, userReports)} points`,
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
              const imgHeight = Math.min(imgWidth * aspectRatio, maxImgHeight);

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
                pdf.text("Image preview (unavailable)", margin + 70, yPos + 10);

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
      }-${filteredReports.length}reports.pdf`;

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

  const handleReportDelete = async (reportId) => {
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
                    onChange={(e) => setSearchTerm(e.target.value)}
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

              {/* Download Buttons */}
              <div className="mb-4 flex flex-wrap gap-3">
                <button
                  onClick={downloadAllReportsPDF}
                  disabled={filteredReports.length === 0 || pdfGenerating}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {pdfGenerating && generatingReportId === "all" ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  Download All Reports PDF
                  {filteredReports.length > 0 && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      {filteredReports.length}
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
                    Please wait while we process the images and generate your
                    PDF...
                  </p>
                </div>
              )}

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
                                {userReports.filter(
                                  (r) =>
                                    r.reporterEmail === report.reporterEmail &&
                                    r.disasterType === report.disasterType &&
                                    r.locationDescription ===
                                      report.locationDescription &&
                                    new Date(
                                      r.createdAt?.toDate?.() || r.createdAt
                                    ) <=
                                      new Date(
                                        report.createdAt?.toDate?.() ||
                                          report.createdAt
                                      )
                                ).length === 1 && <span> • First: +40</span>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <div className="flex flex-col space-y-1">
                              <button
                                onClick={() =>
                                  downloadIndividualReportPDF(report)
                                }
                                disabled={
                                  pdfGenerating &&
                                  generatingReportId === report.id
                                }
                                className="text-green-600 hover:underline text-sm flex items-center gap-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Download PDF"
                              >
                                {pdfGenerating &&
                                generatingReportId === report.id ? (
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
