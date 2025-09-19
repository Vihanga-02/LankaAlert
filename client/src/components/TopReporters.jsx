import React, { useEffect, useState } from "react";
import { Award, MapPin, TrendingUp } from "lucide-react";
import { db } from "../services/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getTotalPoints } from "../services/rewardService";

const TopReporters = () => {
  const [topReporters, setTopReporters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopReporters = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1️⃣ Fetch all users who are reporters
        const usersCollection = collection(db, "users");
        const usersSnapshot = await getDocs(usersCollection);

        const reporters = [];
        usersSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.isReporter) {
            reporters.push({
              name: data.name,
              email: data.email,
              district: data.district || "Unknown",
              avatar: data.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase(),
            });
          }
        });

        // 2️⃣ Fetch all disaster reports
        const reportsCollection = collection(db, "disasterReports");
        const reportsSnapshot = await getDocs(reportsCollection);
        const allReports = reportsSnapshot.docs.map((doc) => doc.data());

        // 3️⃣ Get actual points from rewards system for each reporter
        const reportersWithPoints = await Promise.all(
          reporters.map(async (rep) => {
            const userReports = allReports.filter(
              (r) => r.reporterEmail === rep.email
            );

            // Get actual total points from rewards system
            let actualPoints = 0;
            try {
              actualPoints = await getTotalPoints(rep.email);
            } catch (error) {
              console.error(`Error getting points for ${rep.email}:`, error);
              // Fallback to old calculation if rewards system fails
              actualPoints = userReports.length * 50;
            }

            let badge = "Bronze";
            if (actualPoints >= 1000) badge = "Gold";
            else if (actualPoints >= 500) badge = "Silver";

            return {
              ...rep,
              reports: userReports.length,
              points: actualPoints,
              badge,
            };
          })
        );

        // 4️⃣ Sort by points descending and take top 4
        const top4 = reportersWithPoints
          .sort((a, b) => b.points - a.points)
          .slice(0, 4);

        setTopReporters(top4);
      } catch (error) {
        console.error("Error fetching top reporters:", error);
        setError("Failed to load top reporters. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTopReporters();
  }, []);

  const getBadgeColor = (badge) => {
    switch (badge.toLowerCase()) {
      case "gold":
        return "text-yellow-600 bg-yellow-100 border-yellow-300";
      case "silver":
        return "text-gray-600 bg-gray-100 border-gray-300";
      case "bronze":
        return "text-orange-600 bg-orange-100 border-orange-300";
      default:
        return "text-blue-600 bg-blue-100 border-blue-300";
    }
  };

  const getAvatarColor = (index) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-indigo-500",
      "bg-pink-500",
    ];
    return colors[index % colors.length];
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Award className="h-8 w-8 text-blue-600" />
            <h2 className="text-3xl font-bold text-gray-900">Top Reporters</h2>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Recognizing our dedicated community reporters who help keep Sri
            Lanka safe with accurate and timely disaster reports
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-gray-200 rounded-lg shadow-md p-6 animate-pulse"
              >
                <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-4"></div>
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-300 rounded"></div>
                  <div className="h-3 bg-gray-300 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="bg-red-50 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Success State */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {topReporters.length > 0 ? (
              topReporters.map((reporter, index) => (
                <div
                  key={reporter.email}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 relative overflow-hidden"
                >
                  {/* Rank Badge */}
                  <div className="absolute top-4 right-4">
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-bold border ${getBadgeColor(
                        reporter.badge
                      )}`}
                    >
                      #{index + 1}
                    </div>
                  </div>

                  {/* Avatar */}
                  <div className="flex justify-center mb-4">
                    <div
                      className={`w-16 h-16 ${getAvatarColor(
                        index
                      )} rounded-full flex items-center justify-center text-white font-bold text-lg`}
                    >
                      {reporter.avatar}
                    </div>
                  </div>

                  {/* Reporter Info */}
                  <div className="text-center mb-4">
                    <h3 className="font-bold text-gray-900 text-lg mb-1">
                      {reporter.name}
                    </h3>
                    <div className="flex items-center justify-center space-x-1 text-sm text-gray-500">
                      <MapPin className="h-4 w-4" />
                      <span>{reporter.district}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-gray-600">Points</span>
                      </div>
                      <span className="font-bold text-blue-600">
                        {reporter.points.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-gray-600">Reports</span>
                      </div>
                      <span className="font-bold text-green-600">
                        {reporter.reports}
                      </span>
                    </div>
                  </div>

                  {/* Badge */}
                  <div className="mt-4 text-center">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getBadgeColor(
                        reporter.badge
                      )}`}
                    >
                      <Award className="h-4 w-4 mr-1" />
                      {reporter.badge} Reporter
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto">
                  <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No reporters found</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Check back later to see our top community reporters!
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default TopReporters;
