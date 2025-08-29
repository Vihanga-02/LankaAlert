import React, { createContext, useContext, useState } from "react";
import { awardPoints, getReporterRewards, getTotalPoints } from "../services/rewardService";

const RewardContext = createContext();

export const useRewards = () => useContext(RewardContext);

export const RewardProvider = ({ children }) => {
  const [rewards, setRewards] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);

  // Award points to reporter and update state
  const givePoints = async (reporter) => {
    await awardPoints(reporter);
    await fetchRewards(reporter.email);
  };

  // Fetch all rewards for reporter
  const fetchRewards = async (email) => {
    const reporterRewards = await getReporterRewards(email);
    const total = await getTotalPoints(email);

    setRewards(reporterRewards);
    setTotalPoints(total);
  };

  return (
    <RewardContext.Provider
      value={{
        rewards,
        totalPoints,
        givePoints,
        fetchRewards,
      }}
    >
      {children}
    </RewardContext.Provider>
  );
};
