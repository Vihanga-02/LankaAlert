import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { MapZoneProvider } from "./context/MapZoneContext";
import { DisasterReportsProvider } from "./context/DisasterReportsContext";
import { RewardProvider } from "./context/RewardContext";
import { DisasterAlertProvider } from "./context/DisasterAlertContext";
import { GoogleMapsProvider } from "./context/GoogleMapsProvider"; // ✅ Added

// Public & User Pages
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Chatbot from "./components/Chatbot";
import Home from "./pages/Home";
import Alerts from "./pages/Alerts";
import LiveTracking from "./pages/LiveTracking";
import RiskRoute from "./pages/RiskRoute";
import EmergencyHelp from "./pages/EmergencyHelp";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import ReportDisaster from "./pages/ReportDisaster";

// Admin Pages
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import RoleManagement from "./pages/admin/RoleManagement";
import DisasterAlertManagement from "./pages/admin/DisasterAlertManagement";
import MapUpdate from "./pages/admin/MapUpdate";
import EmergencyRequests from "./pages/admin/EmergencyRequests";
import InventoryManagement from "./pages/admin/InventoryManagement";
import WeatherAlertManagement from "./pages/admin/WeatherAlertManagement";

// ─────────────────────────────
// Route Guards
// ─────────────────────────────
const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isAdmin) return <Navigate to="/" replace />;
  return children;
};

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user || user.isAdmin) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user?.isAdmin) return <Navigate to="/admin" replace />;
  if (user) return <Navigate to="/" replace />;
  return children;
};

// Wrapper layout for public/user UI
const UserLayout = () => (
  <div className="min-h-screen bg-gray-50 flex flex-col">
    <Navbar />
    <main className="flex-grow">
      <Outlet />
    </main>
    <Footer />
    <Chatbot />
  </div>
);

// ─────────────────────────────
// Unified App
// ─────────────────────────────
function App() {
  return (
    <AuthProvider>
      <DisasterReportsProvider>
        <DisasterAlertProvider>
          <RewardProvider>
            <MapZoneProvider>
              <GoogleMapsProvider> {/* ✅ All maps use one loader */}
                <Router>
                  <Routes>
                    {/* Login & Register */}
                    <Route
                      path="/login"
                      element={<PublicRoute><Login /></PublicRoute>}
                    />
                    <Route
                      path="/register"
                      element={<PublicRoute><Register /></PublicRoute>}
                    />

                    {/* Admin Routes */}
                    <Route
                      path="/admin"
                      element={<AdminRoute><AdminLayout /></AdminRoute>}
                    >
                      <Route index element={<AdminDashboard />} />
                      <Route path="roles" element={<RoleManagement />} />
                      <Route path="disasteralerts" element={<DisasterAlertManagement />} />
                      <Route path="weatheralerts" element={<WeatherAlertManagement />} />
                      <Route path="map" element={<MapUpdate />} />
                      <Route path="emergency" element={<EmergencyRequests />} />
                      <Route path="inventory" element={<InventoryManagement />} />
                    </Route>

                    {/* User/Public Routes with layout */}
                    <Route element={<UserLayout />}>
                      <Route path="/" element={<Home />} />
                      <Route path="/alerts" element={<Alerts />} />
                      <Route path="/live-tracking" element={<LiveTracking />} />
                      <Route path="/risk-route" element={<RiskRoute />} />
                      <Route path="/emergency-help" element={<EmergencyHelp />} />
                      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                      <Route path="/report-disaster" element={<PrivateRoute><ReportDisaster /></PrivateRoute>} />
                    </Route>

                    {/* Catch-All Redirect */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Router>
              </GoogleMapsProvider>
            </MapZoneProvider>
          </RewardProvider>
        </DisasterAlertProvider>
      </DisasterReportsProvider>
    </AuthProvider>
  );
}

export default App;
