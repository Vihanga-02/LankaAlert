// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import {
  Users,
  AlertTriangle,
  Bell,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Package,
} from "lucide-react";
import { useDisasterReports } from "../../context/DisasterReportsContext";
import { useDisasterAlert } from "../../context/DisasterAlertContext";
import { useEmergency } from "../../context/EmergencyContext";
import { UserService } from "../../services/UserService";

/* ---------- helpers ---------- */
const toDateSafe = (v) => {
  if (!v) return null;
  if (typeof v === "object" && typeof v.toDate === "function") {
    try {
      return v.toDate();
    } catch {
      return null;
    }
  }
  if (v instanceof Date) return v;
  if (typeof v === "number") return new Date(v);
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d) ? null : d;
  }
  return null;
};

const formatTimeAgo = (date) => {
  if (!date) return "N/A";
  const diffMs = Date.now() - date.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
};

const useNow = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(t);
  }, []);
  return now;
};

const AdminDashboard = () => {
  const now = useNow();

  // contexts
  const { reports = [], fetchReports } = useDisasterReports();
  const { alerts = [], loading: alertsLoading, fetchAlerts } = useDisasterAlert();
  const { allRequests = [], isLoading: requestsLoading } = useEmergency();

  // local state
  const [reportCount, setReportCount] = useState(0);
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [reporterCount, setReporterCount] = useState(0);

  /* ---------- Fetch on mount ---------- */
  useEffect(() => {
    if (typeof fetchReports === "function") {
      fetchReports().catch((e) => console.error("fetchReports error:", e));
    }
    if (typeof fetchAlerts === "function") {
      fetchAlerts().catch((e) => console.error("fetchAlerts error:", e));
    }
    // fetch users
    const loadUsers = async () => {
      try {
        const users = await UserService.getAllUsers();
        const normalUsers = users.filter(
          (u) => u.role === "user" && !u.isReporter && !u.isAdmin
        );
        const reporters = users.filter((u) => u.isReporter);
        setUserCount(normalUsers.length);
        setReporterCount(reporters.length);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- derived counts ---------- */
  useEffect(() => {
    setReportCount(Array.isArray(reports) ? reports.length : 0);
  }, [reports]);

  useEffect(() => {
    if (!Array.isArray(alerts)) {
      setActiveAlertsCount(0);
      return;
    }
    const count = alerts.reduce((acc, a) => {
      try {
        let start = null;
        if (a.startDate && a.startTime) {
          start = toDateSafe(`${a.startDate}T${a.startTime}`);
        } else if (a.startAt) {
          start = toDateSafe(a.startAt);
        } else if (a.createdAt) {
          start = toDateSafe(a.createdAt);
        }
        let validUntil = null;
        if (a.validUntil && typeof a.validUntil.toDate === "function") {
          validUntil = toDateSafe(a.validUntil);
        } else if (a.validUntilDate && a.validUntilTime) {
          validUntil = toDateSafe(`${a.validUntilDate}T${a.validUntilTime}`);
        } else if (a.expiresAt) {
          validUntil = toDateSafe(a.expiresAt);
        }
        if (!start || !validUntil) return acc;
        if (now >= start && now <= validUntil) return acc + 1;
        return acc;
      } catch {
        return acc;
      }
    }, 0);
    setActiveAlertsCount(count);
  }, [alerts, now]);

  useEffect(() => {
    if (!Array.isArray(allRequests)) {
      setPendingRequestsCount(0);
      return;
    }
    const count = allRequests.reduce((acc, r) => {
      const status = (r.status || "pending").toString().toLowerCase();
      if (status === "complete" || status === "completed") return acc;
      return acc + 1;
    }, 0);
    setPendingRequestsCount(count);
  }, [allRequests]);

  /* ---------- Stats ---------- */
  const stats = [
    {
      name: "Total Users",
      value: userCount,
      change: "+0%",
      changeType: "increase",
      icon: Users,
      color: "bg-blue-500",
    },
    {
      name: "Total Reporters",
      value: reporterCount,
      change: "+0%",
      changeType: "increase",
      icon: Users,
      color: "bg-indigo-500",
    },
    {
      name: "Active Alerts",
      value: alertsLoading ? "..." : activeAlertsCount,
      change: "+0%",
      changeType: "increase",
      icon: Bell,
      color: "bg-red-500",
    },
    {
      name: "Emergency Requests",
      value: requestsLoading ? "..." : pendingRequestsCount,
      change: "+0%",
      changeType: "decrease",
      icon: HelpCircle,
      color: "bg-orange-500",
    },
    {
      name: "Reports",
      value: typeof reportCount === "number" ? reportCount : "0",
      change: "+0%",
      changeType: "increase",
      icon: Activity,
      color: "bg-green-500",
    },
  ];

  /* ---------- Recent Lists ---------- */
  const recentAlerts = Array.isArray(alerts)
    ? [...alerts]
        .sort((a, b) => {
          const da =
            toDateSafe(a.createdAt) ||
            (a.startDate && a.startTime && toDateSafe(`${a.startDate}T${a.startTime}`)) ||
            new Date(0);
          const db =
            toDateSafe(b.createdAt) ||
            (b.startDate && b.startTime && toDateSafe(`${b.startDate}T${b.startTime}`)) ||
            new Date(0);
          return db - da;
        })
        .slice(0, 3)
        .map((a) => {
          const created = toDateSafe(a.createdAt) || toDateSafe(`${a.startDate}T${a.startTime}`);
          return {
            id: a.id,
            type: a.disasterName || a.title || "Alert",
            location: `${a.district || "N/A"}${a.city ? " - " + a.city : ""}`,
            severity: (a.severity || "unknown").toString(),
            timeAgo: formatTimeAgo(created),
            status: (() => {
              const start = a.startDate && a.startTime ? toDateSafe(`${a.startDate}T${a.startTime}`) : null;
              const validUntil =
                a.validUntil && typeof a.validUntil.toDate === "function"
                  ? toDateSafe(a.validUntil)
                  : a.validUntilDate && a.validUntilTime
                  ? toDateSafe(`${a.validUntilDate}T${a.validUntilTime}`)
                  : null;
              if (!start || !validUntil) return "Unknown";
              const isActive = now >= start && now <= validUntil;
              return isActive ? "Active" : "Inactive";
            })(),
          };
        })
    : [];

  const recentRequests = Array.isArray(allRequests)
    ? [...allRequests]
        .sort((a, b) => {
          const da = toDateSafe(a.createdAt) || new Date(0);
          const db = toDateSafe(b.createdAt) || new Date(0);
          return db - da;
        })
        .slice(0, 3)
        .map((r) => {
          const created = toDateSafe(r.createdAt);
          return {
            id: r.id,
            user: r.name || r.user?.name || "Unknown",
            location: r.location || r.user?.location || "N/A",
            need: (r.needsHelp && r.needsHelp.join ? r.needsHelp.join(", ") : r.need) || "N/A",
            priority: (r.priority || r.urgency || "Medium").toString(),
            timeAgo: formatTimeAgo(created),
            status: r.status || "Pending",
          };
        })
    : [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="mt-2 text-gray-600">Welcome to Lanka Alert Admin Dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <div className="flex items-center">
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Alerts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Alerts</h2>
          </div>
          <div className="p-6">
            {alertsLoading ? (
              <p className="text-gray-500">Loading alerts...</p>
            ) : recentAlerts.length === 0 ? (
              <p className="text-gray-500">No recent alerts.</p>
            ) : (
              <div className="space-y-4">
                {recentAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle
                        className={`h-5 w-5 ${
                          alert.severity.toLowerCase() === "high" ? "text-red-500" : "text-orange-500"
                        }`}
                      />
                      <div>
                        <p className="font-medium text-gray-900">{alert.type}</p>
                        <p className="text-sm text-gray-600">{alert.location}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          alert.status === "Active" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                        }`}
                      >
                        {alert.status}
                      </span>
                      <p className="text-sm text-gray-500 mt-1">{alert.timeAgo}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Emergency Requests */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Pending Emergency Requests</h2>
          </div>
          <div className="p-6">
            {requestsLoading ? (
              <p className="text-gray-500">Loading requests...</p>
            ) : recentRequests.length === 0 ? (
              <p className="text-gray-500">No pending requests.</p>
            ) : (
              <div className="space-y-4">
                {recentRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <HelpCircle
                        className={`h-5 w-5 ${
                          req.priority.toLowerCase() === "high" ? "text-red-500" : "text-orange-500"
                        }`}
                      />
                      <div>
                        <p className="font-medium text-gray-900">{req.user}</p>
                        <p className="text-sm text-gray-600">
                          {req.location} • {req.need}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          req.status.toString().toLowerCase() === "complete"
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {req.status}
                      </span>
                      <p className="text-sm text-gray-500 mt-1">{req.timeAgo}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <button className="flex items-center justify-center p-4 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-100 transition-colors">
            <div className="text-center">
              <Bell className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-blue-600">Send Alert</span>
            </div>
          </button>
          <button className="flex items-center justify-center p-4 bg-green-50 border-2 border-dashed border-green-300 rounded-lg hover:bg-green-100 transition-colors">
            <div className="text-center">
              <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-green-600">Manage Users</span>
            </div>
          </button>
          <button className="flex items-center justify-center p-4 bg-orange-50 border-2 border-dashed border-orange-300 rounded-lg hover:bg-orange-100 transition-colors">
            <div className="text-center">
              <Package className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-orange-600">Update Inventory</span>
            </div>
          </button>
          <button className="flex items-center justify-center p-4 bg-purple-50 border-2 border-dashed border-purple-300 rounded-lg hover:bg-purple-100 transition-colors">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-purple-600">Add Disaster</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
