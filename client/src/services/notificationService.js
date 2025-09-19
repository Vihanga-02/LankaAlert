import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export class NotificationService {
  static notificationsCollection = collection(db, "adminNotifications");

  /**
   * Send notification to admin when a report is deleted
   * @param {Object} reportData - The deleted report data
   * @param {Object} user - The user who deleted the report
   */
  static async notifyAdminReportDeleted(reportData, user) {
    try {
      const notification = {
        type: "REPORT_DELETED",
        title: "Report Deleted by Reporter",
        message: `Reporter ${user.name} (${user.email}) has deleted a disaster report.`,
        details: {
          reportId: reportData.id,
          reportTitle: reportData.title || "Untitled Report",
          disasterType: reportData.disasterType,
          location: reportData.locationDescription,
          severity: reportData.severity,
          deletedBy: {
            name: user.name,
            email: user.email,
            uid: user.uid,
          },
          originalReport: {
            ...reportData,
            images: reportData.images || [],
          },
        },
        read: false,
        priority: reportData.severity === "high" ? "high" : "normal",
        timestamp: serverTimestamp(),
      };

      const docRef = await addDoc(this.notificationsCollection, notification);
      console.log("Admin notification sent for deleted report:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error sending admin notification:", error);
      throw error;
    }
  }

  /**
   * Send notification to admin when a report is edited
   * @param {Object} originalReport - The original report data
   * @param {Object} updatedReport - The updated report data
   * @param {Object} user - The user who edited the report
   */
  static async notifyAdminReportEdited(originalReport, updatedReport, user) {
    try {
      const notification = {
        type: "REPORT_EDITED",
        title: "Report Modified by Reporter",
        message: `Reporter ${user.name} (${user.email}) has modified a disaster report.`,
        details: {
          reportId: updatedReport.id,
          reportTitle: updatedReport.title || "Untitled Report",
          editedBy: {
            name: user.name,
            email: user.email,
            uid: user.uid,
          },
          changes: this.detectChanges(originalReport, updatedReport),
          originalReport,
          updatedReport,
        },
        read: false,
        priority: updatedReport.severity === "high" ? "high" : "normal",
        timestamp: serverTimestamp(),
      };

      const docRef = await addDoc(this.notificationsCollection, notification);
      console.log("Admin notification sent for edited report:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error sending admin notification:", error);
      throw error;
    }
  }

  /**
   * Detect changes between original and updated report
   * @param {Object} original - Original report data
   * @param {Object} updated - Updated report data
   * @returns {Array} Array of change descriptions
   */
  static detectChanges(original, updated) {
    const changes = [];

    // Check common fields for changes
    const fieldsToCheck = [
      "title",
      "disasterType",
      "severity",
      "description",
      "locationDescription",
      "latitude",
      "longitude",
    ];

    fieldsToCheck.forEach((field) => {
      if (original[field] !== updated[field]) {
        changes.push({
          field,
          from: original[field],
          to: updated[field],
        });
      }
    });

    // Check image changes
    const originalImageCount = original.images?.length || 0;
    const updatedImageCount = updated.images?.length || 0;

    if (originalImageCount !== updatedImageCount) {
      changes.push({
        field: "images",
        from: `${originalImageCount} images`,
        to: `${updatedImageCount} images`,
      });
    }

    return changes;
  }

  /**
   * Send general admin notification
   * @param {string} type - Notification type
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {Object} details - Additional details
   * @param {string} priority - Notification priority (normal, high)
   */
  static async sendAdminNotification(
    type,
    title,
    message,
    details = {},
    priority = "normal"
  ) {
    try {
      const notification = {
        type,
        title,
        message,
        details,
        read: false,
        priority,
        timestamp: serverTimestamp(),
      };

      const docRef = await addDoc(this.notificationsCollection, notification);
      console.log("Admin notification sent:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error sending admin notification:", error);
      throw error;
    }
  }
}

export default NotificationService;
