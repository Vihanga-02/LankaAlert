import React, { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../services/firebase";

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications in real-time
  useEffect(() => {
    const notificationsRef = collection(db, "adminNotifications");
    const q = query(notificationsRef, orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setNotifications(notificationsList);

      // Count unread notifications
      const unread = notificationsList.filter(
        (notification) => !notification.read
      ).length;
      setUnreadCount(unread);
    });

    return () => unsubscribe();
  }, []);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, "adminNotifications", notificationId), {
        read: true,
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.read);
      await Promise.all(
        unreadNotifications.map((notification) =>
          updateDoc(doc(db, "adminNotifications", notification.id), {
            read: true,
          })
        )
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const formatNotificationTime = (timestamp) => {
    if (!timestamp) return "";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes} min ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      high: "bg-red-100 text-red-800",
      medium: "bg-orange-100 text-orange-800",
      low: "bg-yellow-100 text-yellow-800",
    };
    return colors[severity] || "bg-gray-100 text-gray-800";
  };

  const renderNotificationDetails = (notification) => {
    const { type, details } = notification;
    if (!details) return null;

    const isDeleted = type === "REPORT_DELETED";
    const bgColor = isDeleted ? "bg-gray-50" : "bg-blue-50";
    const title = isDeleted
      ? "Deleted Report Details:"
      : "Edited Report Details:";

    return (
      <div className={`mt-2 p-2 ${bgColor} rounded-md`}>
        <p className="text-xs font-semibold text-gray-700 mb-1">{title}</p>
        <div className="space-y-1">
          <p className="text-xs text-gray-600">
            <span className="font-medium">Title:</span> {details.reportTitle}
          </p>
          {isDeleted && (
            <p className="text-xs text-gray-600">
              <span className="font-medium">Type:</span> {details.disasterType}
            </p>
          )}
          {isDeleted && (
            <p className="text-xs text-gray-600">
              <span className="font-medium">Severity:</span>
              <span
                className={`ml-1 px-1 py-0.5 rounded text-xs ${getSeverityColor(
                  details.severity
                )}`}
              >
                {details.severity}
              </span>
            </p>
          )}
          {isDeleted && (
            <p className="text-xs text-gray-600">
              <span className="font-medium">Location:</span> {details.location}
            </p>
          )}
          {!isDeleted && details.changes?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-700">Changes made:</p>
              {details.changes.slice(0, 3).map((change, index) => (
                <p key={index} className="text-xs text-gray-600 ml-2">
                  • {change.field}: {String(change.from).substring(0, 20)}... →{" "}
                  {String(change.to).substring(0, 20)}...
                </p>
              ))}
              {details.changes.length > 3 && (
                <p className="text-xs text-gray-500 ml-2">
                  +{details.changes.length - 3} more changes
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={toggleNotifications}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Notifications
            </h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${
                    !notification.read ? "bg-blue-50" : ""
                  }`}
                  onClick={() => markNotificationAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      {renderNotificationDetails(notification)}
                      <p className="text-xs text-gray-400 mt-2">
                        {formatNotificationTime(notification.timestamp)}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="h-2 w-2 bg-blue-500 rounded-full ml-2 mt-1"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
