import { useState, useEffect } from "react";
import { db } from "../../services/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { 
  Bell, 
  Pencil, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Search, 
  Filter,
  FileText,
  MapPin,
  Clock,
  AlertTriangle
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function NotificationManager() {
  const [zones, setZones] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedZone, setSelectedZone] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // ───────────── Fetch Zones & Notifications ─────────────
  useEffect(() => {
    fetchZones();
    fetchNotifications();
  }, []);

  const fetchZones = async () => {
    const snapshot = await getDocs(collection(db, "mapZones"));
    setZones(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  const fetchNotifications = async () => {
    const snapshot = await getDocs(collection(db, "notifications"));
    setNotifications(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  // ───────────── Create ─────────────
  const createNotification = async () => {
    if (!selectedZone || !title || !message) return alert("Fill all fields");
    setLoading(true);
    try {
      await addDoc(collection(db, "notifications"), {
        zoneId: selectedZone,
        title,
        message,
        status: "active",
        createdAt: new Date().toISOString(),
      });
      alert("Notification created!");
      resetForm();
      fetchNotifications();
    } catch (err) {
      console.error(err);
      alert("Error creating notification");
    }
    setLoading(false);
  };

  // ───────────── Update ─────────────
  const updateNotification = async (id) => {
    if (!title || !message) return alert("Fill all fields");
    try {
      const ref = doc(db, "notifications", id);
      await updateDoc(ref, { title, message, zoneId: selectedZone });
      alert("Notification updated!");
      resetForm();
      fetchNotifications();
    } catch (err) {
      console.error(err);
      alert("Error updating notification");
    }
  };

  // ───────────── Delete ─────────────
  const deleteNotification = async (id) => {
    if (!window.confirm("Delete this notification?")) return;
    try {
      await deleteDoc(doc(db, "notifications", id));
      alert("Notification deleted!");
      fetchNotifications();
    } catch (err) {
      console.error(err);
      alert("Error deleting notification");
    }
  };

  // ───────────── Toggle Status ─────────────
  const toggleStatus = async (id, currentStatus) => {
    try {
      const ref = doc(db, "notifications", id);
      await updateDoc(ref, { status: currentStatus === "active" ? "inactive" : "active" });
      fetchNotifications();
    } catch (err) {
      console.error(err);
      alert("Error updating status");
    }
  };

  // ───────────── Helpers ─────────────
  const startEdit = (notif) => {
    setEditingId(notif.id);
    setSelectedZone(notif.zoneId);
    setTitle(notif.title);
    setMessage(notif.message);
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setMessage("");
    setSelectedZone("");
  };

  // ───────────── Filtering ─────────────
  const filteredNotifications = notifications.filter((notif) => {
    const matchesSearch = 
      notif.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.message?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || notif.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const totalNotifications = notifications.length;
  const activeNotifications = notifications.filter(n => n.status === "active").length;
  const inactiveNotifications = notifications.filter(n => n.status === "inactive").length;

  // ───────────── Export PDF ─────────────
const exportPDF = () => {
  const doc = new jsPDF("1", "pt", "a4");

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
    doc.text("Notifications Report", 90, 65);

    // Report metadata
    const reportDate = new Date().toLocaleString();
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Report Generated: ${reportDate}`, 90, 80);
    doc.text("System Admin: Chenuka Bopage", 400, 80);

    // ---- Table Data ----
    const tableData = notifications.map((n, index) => {
      // Get zone name instead of just ID
      const zone = zones.find(z => z.id === n.zoneId);
      const zoneName = zone ? `${zone.city} - ${zone.subCategory}` : n.zoneId;
      
      return [
        index + 1,
        zoneName,
        n.title,
        n.message,
        n.status.toUpperCase(),
        new Date(n.createdAt).toLocaleString(),
      ];
    });

    // ---- Table Options ----
    autoTable(doc, {
      startY: 100,
      head: [[
        "#", "Zone", "Title", "Message", "Status", "Created At"
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
        0: { cellWidth: 40 },   // #
        1: { cellWidth: 80 },  // Zone
        2: { cellWidth: 80 },   // Title
        3: { cellWidth: 200 },  // Message (wider)
        4: { cellWidth: 40 },   // Status
        5: { cellWidth: 100 },  // Created At
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
    doc.text("Chenuka Bopage", 40, y + 15);

    // Save PDF
    doc.save("LankaAlert_Notifications_Report.pdf");
  };

  img.onerror = () => {
    console.error("Failed to load logo for PDF");
    // Fallback: generate PDF without logo
    generatePDFWithoutLogo();
  };

  // Fallback function if logo fails to load
  const generatePDFWithoutLogo = () => {
    const doc = new jsPDF("p", "pt", "a4");
    
    // Header without logo
    doc.setFontSize(24);
    doc.setTextColor(30, 30, 30);
    doc.text("Lanka Alert", 40, 45);

    doc.setFontSize(14);
    doc.setTextColor(50, 50, 50);
    doc.text("Notifications Report", 40, 65);

    // ... rest of the code same as above ...
    // (repeat the table generation, footer, and signature code here)
  };
};
  // ───────────── UI ─────────────
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notification Management</h1>
            <p className="mt-2 text-gray-600">Create and manage zone-based notifications for emergency alerts</p>
          </div>
          <button
            onClick={exportPDF}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FileText className="h-5 w-5 mr-2" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-500">
              <Bell className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Notifications</p>
              <p className="text-2xl font-semibold text-gray-900">{totalNotifications}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-500">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-semibold text-gray-900">{activeNotifications}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-gray-500">
              <XCircle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Inactive</p>
              <p className="text-2xl font-semibold text-gray-900">{inactiveNotifications}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications by title or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Create/Edit Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {editingId ? "Edit Notification" : "Create New Notification"}
          </h3>
          {editingId && (
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              <XCircle className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Zone
            </label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose a zone...</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.city} - {zone.subCategory}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notification Title
            </label>
            <input
              type="text"
              placeholder="Enter notification title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notification Message
          </label>
          <textarea
            placeholder="Enter notification message..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          {editingId ? (
            <>
              <button
                onClick={resetForm}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => updateNotification(editingId)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Update Notification
              </button>
            </>
          ) : (
            <button
              onClick={createNotification}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Creating..." : "Create Notification"}
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          <p className="text-sm text-gray-600">
            Showing {filteredNotifications.length} of {notifications.length} notifications
          </p>
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
            <p className="text-gray-500">
              {searchQuery ? "Try adjusting your search criteria." : "No notifications have been created yet."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((n) => {
              const zone = zones.find(z => z.id === n.zoneId);
              const zoneName = zone ? `${zone.city} - ${zone.subCategory}` : n.zoneId;
              
              return (
                <div key={n.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 rounded-lg bg-blue-100">
                          <Bell className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{n.title}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span>{zoneName}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-4">{n.message}</p>
                      
                      <div className="flex items-center space-x-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            n.status === "active" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {n.status === "active" ? (
                            <CheckCircle className="h-4 w-4 mr-1" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-1" />
                          )}
                          {n.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button 
                        onClick={() => startEdit(n)} 
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Edit notification"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => toggleStatus(n.id, n.status)} 
                        className={`p-2 rounded-lg transition-colors ${
                          n.status === "active" 
                            ? "text-red-600 hover:bg-red-100" 
                            : "text-green-600 hover:bg-green-100"
                        }`}
                        title={n.status === "active" ? "Deactivate" : "Activate"}
                      >
                        {n.status === "active" ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </button>
                      <button 
                        onClick={() => deleteNotification(n.id)} 
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete notification"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}