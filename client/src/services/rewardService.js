import { db } from "./firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";

// Reference to the rewards collection
const rewardsCollection = collection(db, "reporterRewards");

/**
 * Award points to a reporter
 */
export const awardPoints = async (reporter) => {
  try {
    const rewardDoc = {
      name: reporter.name,
      email: reporter.email,
      points: 50, // Always +50 for each submission
      date: new Date().toISOString(),
    };

    await addDoc(rewardsCollection, rewardDoc);
    console.log("✅ Reward points added for", reporter.email);
  } catch (error) {
    console.error("❌ Error awarding points:", error);
    throw error;
  }
};

/**
 * Get all rewards for a reporter
 */
export const getReporterRewards = async (email) => {
  try {
    const q = query(rewardsCollection, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    let rewards = [];
    querySnapshot.forEach((doc) => {
      rewards.push({ id: doc.id, ...doc.data() });
    });

    return rewards;
  } catch (error) {
    console.error("❌ Error fetching rewards:", error);
    throw error;
  }
};

/**
 * Get total points for a reporter
 */
export const getTotalPoints = async (email) => {
  const rewards = await getReporterRewards(email);
  return rewards.reduce((sum, r) => sum + r.points, 0);
};
