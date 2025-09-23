// src/components/DisasterAlertForm.jsx
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import MapView from "./MapView";
import { db } from "../services/firebase";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { sendSms } from "../services/smsService.js";

const DisasterAlertForm = ({
  report,
  onClose,
  createAlert, // function passed from context
  districts = [],
  districtCities = {},
  zones = [],
}) => {
  // --- Helpers ---
// ✅ Get current date in Sri Lanka timezone (YYYY-MM-DD)
// Get Sri Lanka date (YYYY-MM-DD)
// Format YYYY-MM-DD in SL time without UTC conversion
const getSLDate = () => {
  const now = new Date();
  const offset = (5.5 * 60 + now.getTimezoneOffset()) * 60000;
  const local = new Date(now.getTime() + offset);
  const year = local.getFullYear();
  const month = String(local.getMonth() + 1).padStart(2, "0");
  const day = String(local.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getSLTime = () => {
  const now = new Date();
  const offset = (5.5 * 60 + now.getTimezoneOffset()) * 60000;
  const local = new Date(now.getTime() + offset);
  const hours = String(local.getHours()).padStart(2, "0");
  const minutes = String(local.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};



// ✅ Extract validUntil date/time (from Firestore or plain object)
const getValidUntilParts = (r) => {
  if (!r) return { validUntilDate: "", validUntilTime: "" };

  if (r.validUntil && typeof r.validUntil.toDate === "function") {
    const d = r.validUntil.toDate();
    return {
      validUntilDate: d.toISOString().split("T")[0],
      validUntilTime: d.toTimeString().slice(0, 5),
    };
  }

  if (r.validUntilDate && r.validUntilTime) {
    return {
      validUntilDate: r.validUntilDate,
      validUntilTime: r.validUntilTime,
    };
  }

  return { validUntilDate: "", validUntilTime: "" };
};

// ✅ Extract start date/time (fallback to current Sri Lanka date/time)
const getStartParts = (r) => ({
  startDate: r?.startDate || getSLDate(),
  startTime: r?.startTime || getSLTime(),
});

// --- Init state ---
const { validUntilDate: initValidDate, validUntilTime: initValidTime } = getValidUntilParts(report);
const { startDate: initStartDate, startTime: initStartTime } = getStartParts(report);


  const [formData, setFormData] = useState({
    disasterName: report?.disasterName || "",
    description: report?.description || "",
    severity: report?.severity || "low",
    district: report?.district || "",
    city: report?.city || "",
    nearestSafeZone: report?.nearestSafeZone || null,
    startDate: initStartDate,
    startTime: initStartTime,
    validUntilDate: initValidDate || initStartDate,
    validUntilTime: initValidTime || initStartTime,
    sendSms: report?.sendSms || false,
     reportId: report?.reportId || null, // ✅ preserve reportId if updating
  });

  const [selectedZone, setSelectedZone] = useState(formData.nearestSafeZone);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [errors, setErrors] = useState(null);

  // --- Fetch users ---
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchUsers();
  }, []);

  // --- Filter users for SMS ---
  useEffect(() => {
    if (formData.sendSms && (formData.district || formData.city)) {
      setFilteredUsers(
        users.filter((u) => {
          const districtMatch = formData.district ? u.district === formData.district : true;
          const cityMatch = formData.city ? u.city === formData.city : true;
          return districtMatch && cityMatch && u.smsSubscribed === true;
        })
      );
    } else {
      setFilteredUsers([]);
    }
  }, [formData.sendSms, formData.district, formData.city, users]);

  // --- SMS message ---
  const smsMessage = `Disaster Alert: ${formData.disasterName}
Severity: ${formData.severity?.toUpperCase()}
Location: ${formData.city || formData.district}
Description: ${formData.description}
Start: ${formData.startDate} ${formData.startTime}
Valid Until: ${formData.validUntilDate} ${formData.validUntilTime}
${
  formData.nearestSafeZone
    ? `Nearest Safe Zone: ${formData.nearestSafeZone.name} (Lat: ${formData.nearestSafeZone.latitude}, Lng: ${formData.nearestSafeZone.longitude})`
    : ""
}`;

// --- Validation ---
const validateDates = () => {
  try {
    const now = new Date();
    const start = new Date(`${formData.startDate}T${formData.startTime}`);
    const validUntil = new Date(`${formData.validUntilDate}T${formData.validUntilTime}`);

    if (isNaN(start) || isNaN(validUntil)) return "Invalid start or end date/time.";

    // 1. Start can't be in the future (date + time)
    if (start > now) return "Start date/time cannot be in the future.";

    // 2. Valid until can't be in the past (date + time)
    if (validUntil < now) return "Valid until date/time cannot be in the past.";

    // 3. Valid until must be strictly after start
    if (validUntil <= start) return "Valid until must be after start date/time.";

    return null;
  } catch {
    return "Invalid date/time format.";
  }
};



  // --- Payload builder ---
  const buildPayload = () => {
  const validUntil = new Date(`${formData.validUntilDate}T${formData.validUntilTime}`);

  return {
    disasterName: formData.disasterName,
    description: formData.description,
    severity: formData.severity,
    district: formData.district,
    city: formData.city,
    nearestSafeZone: formData.nearestSafeZone
      ? {
          id: formData.nearestSafeZone.id,
          name: formData.nearestSafeZone.name,
          latitude: formData.nearestSafeZone.latitude,
          longitude: formData.nearestSafeZone.longitude,
        }
      : null,
    startDate: formData.startDate,
    startTime: formData.startTime,
    validUntilDate: formData.validUntilDate,
    validUntilTime: formData.validUntilTime,
    validUntil: Timestamp.fromDate(validUntil),
    active: new Date() <= validUntil,
    sendSms: !!formData.sendSms,
    // ✅ ADD THIS
    reportId: formData.reportId || null,
  };
};


  // --- Handlers ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors(null);

    const vErr = validateDates();
    if (vErr) {
      setErrors(vErr);
      return;
    }

    if (formData.sendSms && filteredUsers.length > 0) {
      setShowConfirmPopup(true);
    } else {
      try {
        await createAlert(buildPayload());
      } catch (err) {
        console.error("Failed to create alert:", err);
      } finally {
        onClose();
      }
    }
  };

  const handleConfirm = async () => {
    setShowConfirmPopup(false);
    try {
      for (const u of filteredUsers) {
        if (u.phone) {
          try {
            await sendSms(u.phone, smsMessage);
          } catch (err) {
            console.error("Failed to send to", u.phone, err);
          }
        }
      }
    } catch (err) {
      console.error("SMS sending error:", err);
    } finally {
      try {
        await createAlert(buildPayload());
      } catch (err) {
        console.error("Failed to create alert:", err);
      } finally {
        onClose();
      }
    }
  };

  // --- UI ---
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
          <X className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold mb-6">
          {report ? "Update Disaster Alert" : "Create Disaster Alert"}
        </h2>

        {errors && <div className="mb-4 text-sm text-red-700 bg-red-50 p-3 rounded">{errors}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Disaster Name */}
          <div>
            <label className="block text-sm font-medium">Disaster Name</label>
            <input
              type="text"
              value={formData.disasterName}
              onChange={(e) => setFormData({ ...formData, disasterName: e.target.value })}
              className="w-full border rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
              rows={3}
              required
            />
          </div>

          {/* Severity */}
          <div>
            <label className="block text-sm font-medium">Severity</label>
            <select
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
              className="w-full border rounded-lg p-2 mt-1"
            >
              <option value="low">🟢 Low</option>
              <option value="medium">🟡 Medium</option>
              <option value="high">🔴 High</option>
            </select>
          </div>

          {/* District & City */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">District</label>
              <select
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value, city: "" })}
                className="w-full border rounded-lg p-2 mt-1"
                required
              >
                <option value="">Select District</option>
                {districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">City</label>
              <select
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full border rounded-lg p-2 mt-1"
                disabled={!formData.district}
                required
              >
                <option value="">Select City</option>
                {(districtCities[formData.district] || []).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Start Date + Start Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                max={getSLDate()} // 🚫 cannot select a future date
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    startDate: e.target.value,
                    startTime:
                      e.target.value === getSLDate() &&
                      formData.startTime > getSLTime()
                        ? getSLTime()
                        : formData.startTime,
                  })
                }
                className="w-full border rounded-lg p-2 mt-1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Start Time</label>
              <input
                type="time"
                value={formData.startTime}
                max={
                  formData.startDate === getSLDate()
                    ? getSLTime() // 🚫 disallow future time if today
                    : undefined
                }
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
                className="w-full border rounded-lg p-2 mt-1"
                required
              />
            </div>
          </div>

          {/* Valid Until Date + Time */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium">Valid Until Date</label>
              <input
                type="date"
                value={formData.validUntilDate}
                min={getSLDate()} // 🚫 cannot be in the past
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    validUntilDate: e.target.value,
                    validUntilTime:
                      e.target.value === getSLDate() &&
                      formData.validUntilTime < getSLTime()
                        ? getSLTime()
                        : formData.validUntilTime,
                  })
                }
                className="w-full border rounded-lg p-2 mt-1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Valid Until Time</label>
              <input
                type="time"
                value={formData.validUntilTime}
                min={
                  formData.validUntilDate === getSLDate()
                    ? getSLTime() // 🚫 must be future time if today
                    : undefined
                }
                onChange={(e) =>
                  setFormData({ ...formData, validUntilTime: e.target.value })
                }
                className="w-full border rounded-lg p-2 mt-1"
                required
              />
            </div>
          </div>
          {/* Safe Zone */}
          <div>
            <label className="block text-sm font-medium">Nearest Safe Zone (optional)</label>
            <div className="h-64 border rounded-lg overflow-hidden mt-2">
              <MapView
                zones={zones}
                selectedZone={selectedZone}
                onSelectSafeZone={(zone) => {
                  setFormData({
                    ...formData,
                    nearestSafeZone: {
                      id: zone.id,
                      name: zone.name,
                      latitude: zone.latitude,
                      longitude: zone.longitude,
                    },
                  });
                  setSelectedZone(zone);
                }}
              />
            </div>
            {formData.nearestSafeZone && (
              <p className="mt-2 text-sm text-green-600">
                ✅ Selected: {formData.nearestSafeZone.name}
              </p>
            )}
          </div>

          {/* SMS */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.sendSms}
                onChange={(e) => setFormData({ ...formData, sendSms: e.target.checked })}
                className="mr-2"
              />
              Send SMS Alerts
            </label>
            {formData.sendSms && (
              <div className="mt-2 p-3 border rounded-lg bg-gray-50 text-sm">
                <h3 className="font-semibold mb-2">📌 Users in {formData.city || formData.district || "area"}</h3>
                {filteredUsers.length > 0 ? (
                  <p>{filteredUsers.length} users will receive this alert.</p>
                ) : (
                  <p className="text-gray-500">No users found.</p>
                )}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-100">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {report ? "Update Alert" : "Create Alert"}
            </button>
          </div>
        </form>
      </div>

      {/* Confirm SMS Popup */}
      {showConfirmPopup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-lg w-full shadow-lg">
            <h3 className="text-lg font-bold mb-3">Confirm SMS Sending</h3>
            <p className="text-sm text-gray-600 mb-4">
              You are about to send this SMS to {filteredUsers.length} users:
            </p>
            <pre className="bg-gray-100 p-3 rounded text-sm whitespace-pre-wrap mb-4">
              {smsMessage}
            </pre>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmPopup(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Confirm & Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisasterAlertForm;
