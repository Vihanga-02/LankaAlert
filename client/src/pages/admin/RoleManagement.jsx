// src/pages/admin/RoleManagement.jsx
import React, { useEffect, useState } from "react";
import {
  Users,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Trash,
} from "lucide-react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
  deleteUser as firebaseDeleteUser,
} from "firebase/auth";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  setDoc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { db, auth, firebaseConfig } from "../../services/firebase";

// Optional: reusable service for delete
export const deleteUserFromFirestore = async (uid) => {
  try {
    await deleteDoc(doc(db, "users", uid));
    console.log("Deleted user:", uid);
  } catch (err) {
    console.error("Error deleting user:", err);
  }
};

const RoleManagement = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [reporters, setReporters] = useState([]);
  const [pendingReporters, setPendingReporters] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", password: "" });
  const [formError, setFormError] = useState("");

  const fetchUsers = async () => {
    const querySnapshot = await getDocs(collection(db, "users"));
    const allUsers = [];
    const approvedReporters = [];
    const pending = [];
    const adminsList = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const user = { id: docSnap.id, ...data };

      if (data.role === "admin") {
        adminsList.push(user);
      } else if (data.isReporter) {
        approvedReporters.push(user);
      } else if (data.requestedReporter) {
        pending.push(user);
      } else {
        allUsers.push(user);
      }
    });

    setUsers(allUsers);
    setReporters(approvedReporters);
    setPendingReporters(pending);
    setAdmins(adminsList);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApproveReporter = async (id) => {
    const userRef = doc(db, "users", id);
    await updateDoc(userRef, {
      isReporter: true,
      requestedReporter: false,
    });
    fetchUsers();
  };

  const handleRejectReporter = async (id) => {
    const userRef = doc(db, "users", id);
    await updateDoc(userRef, {
      requestedReporter: false,
      district: "",
      workId: "",
      office: "",
    });
    fetchUsers();
  };

  const handleCreateAdmin = async () => {
    const { name, email, password } = newAdmin;
    setFormError("");
    try {
      if (!name || !email || !password) {
        setFormError("All fields are required.");
        return;
      }

      const secondaryApp = initializeApp(firebaseConfig, "Secondary");
      const secondaryAuth = getAuth(secondaryApp);

      const cred = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        password
      );

      const userData = {
        uid: cred.user.uid,
        name,
        email,
        role: "admin",
        isAdmin: true,
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, "users", cred.user.uid), userData);

      await signOut(secondaryAuth);

      setNewAdmin({ name: "", email: "", password: "" });
      setShowAdminForm(false);
      fetchUsers();
    } catch (error) {
      console.error(error);
      setFormError(error.message);
    }
  };

  const handleDeleteUser = async (user) => {
    if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
      try {
        // Delete from Firestore
        await deleteUserFromFirestore(user.id);

        // Optional: If user is admin in Firebase Auth
        if (user.uid) {
          const tempAuth = getAuth();
          const tempUser = tempAuth.currentUser;
          if (tempUser && tempUser.uid !== user.uid) {
            // delete user from Firebase Auth (requires admin SDK for real deletion in production)
            // firebaseDeleteUser requires the user to be logged in as that account
            // For now, we delete Firestore data only
          }
        }

        fetchUsers();
      } catch (err) {
        console.error("Failed to delete user:", err);
      }
    }
  };

  const tabs = [
    { id: "users", name: "Users", count: users.length },
    { id: "reporters", name: "Reporters", count: reporters.length },
    { id: "pending", name: "Pending Approval", count: pendingReporters.length },
    { id: "admins", name: "Admins", count: admins.length },
  ];

  const filteredData = () => {
    const search = searchTerm.toLowerCase();
    const list = {
      users,
      reporters,
      pending: pendingReporters,
      admins,
    }[activeTab] || [];

    return list.filter(
      (u) =>
        u.name?.toLowerCase().includes(search) ||
        u.email?.toLowerCase().includes(search)
    );
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "admin":
        return "bg-blue-100 text-blue-800";
      case "reporter":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
        <p className="text-gray-600 mt-2">
          Manage user accounts, reporters, and administrators
        </p>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.name}
              <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2.5 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          />
        </div>

        {activeTab === "admins" && (
          <button
            onClick={() => setShowAdminForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="h-4 w-4" />
            Add Admin
          </button>
        )}
      </div>

      {showAdminForm && (
        <div className="bg-white border p-6 rounded-lg mb-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Create Admin Account</h2>
          {formError && (
            <p className="text-red-500 text-sm mb-2 break-words">{formError}</p>
          )}
          <div className="grid gap-4">
            <input
              type="text"
              placeholder="Full Name"
              value={newAdmin.name}
              onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
              className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
            <input
              type="email"
              placeholder="Email"
              value={newAdmin.email}
              onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
              className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
            <input
              type="password"
              placeholder="Password"
              value={newAdmin.password}
              onChange={(e) =>
                setNewAdmin({ ...newAdmin, password: e.target.value })
              }
              className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
            <div className="flex space-x-3">
              <button
                onClick={handleCreateAdmin}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
              >
                Create Admin
              </button>
              <button
                onClick={() => setShowAdminForm(false)}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Pending Approval Section */}
        {activeTab === "pending" && (
          <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
            {filteredData().length > 0 ? (
              filteredData().map((applicant) => (
                <div
                  key={applicant.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div className="min-w-[220px]">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {applicant.name}
                      </h3>
                      <p className="text-gray-600 truncate max-w-xs">{applicant.email}</p>
                      {applicant.phone && (
                        <p className="text-sm text-gray-500">Phone: {applicant.phone}</p>
                      )}
                      <p className="text-sm text-gray-500">
                        District: {applicant.district || "N/A"}
                      </p>
                      <p className="text-sm text-gray-500">
                        District Office: {applicant.districtOffice || "N/A"}
                      </p>
                      <p className="text-sm text-gray-500">
                        Office ID: {applicant.workId || "N/A"}
                      </p>
                    </div>
                    <div className="flex gap-3 items-center">
                      <button
                        onClick={() => handleApproveReporter(applicant.id)}
                        title="Approve Reporter"
                        className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleRejectReporter(applicant.id)}
                        title="Reject Reporter"
                        className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(applicant)}
                        title="Delete User"
                        className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                      >
                        <Trash className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <NoDataMessage message="No pending reporter requests found." />
            )}
          </div>
        )}

        {/* Users, Reporters, Admins Section */}
        {(activeTab === "users" ||
          activeTab === "reporters" ||
          activeTab === "admins") && (
          <div className="p-6 max-h-[600px] overflow-y-auto space-y-4">
            {filteredData().length > 0 ? (
              filteredData().map((user) => (
                <div
                  key={user.id}
                  className="border border-gray-200 rounded-lg px-5 py-4 flex justify-between items-center hover:shadow-md transition"
                >
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 truncate max-w-[320px]">
                      {user.name}
                    </h4>
                    <p className="text-sm text-gray-600 truncate max-w-[320px]">
                      {user.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getRoleBadge(
                        activeTab === "users"
                          ? "user"
                          : activeTab === "reporters"
                          ? "reporter"
                          : "admin"
                      )}`}
                    >
                      {activeTab === "users"
                        ? "User"
                        : activeTab === "reporters"
                        ? "Reporter"
                        : "Admin"}
                    </span>
                    <button
                      onClick={() => handleDeleteUser(user)}
                      title="Delete User"
                      className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                    >
                      <Trash className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <NoDataMessage message="No users found." />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const NoDataMessage = ({ message }) => (
  <div className="text-center py-16 text-gray-500 italic select-none">{message}</div>
);

export default RoleManagement;
