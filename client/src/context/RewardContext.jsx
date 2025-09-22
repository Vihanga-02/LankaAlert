import React, { createContext, useContext, useState } from "react";
import {
  awardPoints,
  deductPoints,
  getReporterRewards,
  getTotalPoints,
  calculateReportPoints,
} from "../services/rewardService";

const RewardContext = createContext();

export const useRewards = () => useContext(RewardContext);

export const RewardProvider = ({ children }) => {
  const [rewards, setRewards] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);

  // Award points to reporter based on report quality and update state
  const givePoints = async (reporter, reportData = null) => {
    console.log("🚀 givePoints called with:", { reporter, reportData });

    if (reportData) {
      // Calculate dynamic points based on report quality
      const points = calculateReportPoints(reportData);
      const wordCount = reportData.description
        ? reportData.description
            .trim()
            .split(/\s+/)
            .filter((word) => word.length > 0).length
        : 0;
      const reason = `Report submission (${points} points - ${wordCount} words)`;

      console.log(`💰 Awarding ${points} points for ${wordCount} words`);
      await awardPoints(reporter, points, reason);
    } else {
      // Fallback to default points system
      console.log("⚠️ No reportData provided, using default 50 points");
      await awardPoints(reporter);
    }
    await fetchRewards(reporter.email);
  };

  // Fetch all rewards for reporter
  const fetchRewards = async (email) => {
    const reporterRewards = await getReporterRewards(email);
    const total = await getTotalPoints(email);

    setRewards(reporterRewards);
    setTotalPoints(total);
  };

  // Deduct points from reporter (for deleted reports)
  const removePoints = async (
    reporter,
    pointsToDeduct,
    reason = "Report deleted"
  ) => {
    console.log("🔻 removePoints called with:", {
      reporter,
      pointsToDeduct,
      reason,
    });

    await deductPoints(reporter, pointsToDeduct, reason);
    await fetchRewards(reporter.email);
  };

  return (
    <RewardContext.Provider
      value={{
        rewards,
        totalPoints,
        givePoints,
        removePoints,
        fetchRewards,
      }}
    >
      {children}
    </RewardContext.Provider>
  );
};
