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
import { Bell, Pencil, Trash2, CheckCircle, XCircle } from "lucide-react";
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

  // ───────────── Export PDF ─────────────
  const exportPDF = () => {
    const doc = new jsPDF("p", "pt", "a4");
    
    // Add title and timestamp first
    doc.setFontSize(18);
    doc.text("Notifications Report", 40, 40);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 40, 60);
    
    // Try to add logo if available, but don't wait for it
    const logoUrl = "/logo.png";
    try {
      // Add image synchronously (if already cached)
      doc.addImage(logoUrl, "PNG", 500, 20, 60, 60);
    } catch (e) {
      console.log("Logo not available or failed to load:", e);
    }
    
    // Create table
    autoTable(doc, {
      startY: 80,
      head: [["Zone", "Title", "Message", "Status", "Created At"]],
      body: notifications.map((n) => {
        // Get zone name instead of just ID
        const zone = zones.find(z => z.id === n.zoneId);
        const zoneName = zone ? `${zone.city} - ${zone.subCategory}` : n.zoneId;
        
        return [
          zoneName,
          n.title,
          n.message,
          n.status,
          new Date(n.createdAt).toLocaleString(),
        ];
      }),
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: { fillColor: [41, 128, 185] },
      columnStyles: {
        2: { cellWidth: 200 }, // Make message column wider
        4: { cellWidth: 120 }  // Make date column narrower
      }
    });
    
    // Save PDF
    doc.save("notifications_report.pdf");
  };

  // ───────────── UI ─────────────
  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Bell className="h-7 w-7 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Manage Notifications</h1>
        </div>
        <button
          onClick={exportPDF}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Export PDF
        </button>
      </div>

      {/* Form */}
      <div className="bg-white p-6 rounded-xl shadow space-y-4 mb-10">
        <select
          value={selectedZone}
          onChange={(e) => setSelectedZone(e.target.value)}
          className="border rounded p-2 w-full"
        >
          <option value="">Select Zone</option>
          {zones.map((zone) => (
            <option key={zone.id} value={zone.id}>
              {zone.city} - {zone.subCategory}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Notification Title"
          className="border rounded p-2 w-full"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          placeholder="Notification Message"
          className="border rounded p-2 w-full"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        {editingId ? (
          <div className="flex space-x-3">
            <button
              onClick={() => updateNotification(editingId)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Update
            </button>
            <button
              onClick={resetForm}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={createNotification}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Notification"}
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-3">Zone</th>
              <th className="p-3">Title</th>
              <th className="p-3">Message</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {notifications.map((n) => {
              const zone = zones.find(z => z.id === n.zoneId);
              const zoneName = zone ? `${zone.city} - ${zone.subCategory}` : n.zoneId;
              
              return (
                <tr key={n.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{zoneName}</td>
                  <td className="p-3">{n.title}</td>
                  <td className="p-3">{n.message}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        n.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {n.status}
                    </span>
                  </td>
                  <td className="p-3 flex space-x-2">
                    <button onClick={() => startEdit(n)} className="text-blue-600 hover:text-blue-800">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => toggleStatus(n.id, n.status)} className="text-green-600 hover:text-green-800">
                      {n.status === "active" ? <XCircle size={18} /> : <CheckCircle size={18} />}
                    </button>
                    <button onClick={() => deleteNotification(n.id)} className="text-red-600 hover:text-red-800">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {notifications.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center p-4 text-gray-500">
                  No notifications yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}