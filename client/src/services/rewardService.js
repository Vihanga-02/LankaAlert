import { db } from "./firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";

// Reference to the rewards collection
const rewardsCollection = collection(db, "reporterRewards");

/**
 * Test function to verify word counting works
 */
export const testWordCounting = () => {
  console.log("=== Testing Word Count Function ===");

  const testCases = [
    {
      description: "Short test",
      expected: "Less than 10 words - 10 base points only",
    },
    {
      description: "This is a test description that has exactly ten words here",
      expected: "10 words - 10 base + 10 description = 20 points",
    },
    {
      description:
        "This is a longer test description that should have more than twenty words to test the medium description bonus points system properly",
      expected: "20+ words - 10 base + 20 description = 30 points",
    },
    {
      description:
        "This is a very long and detailed test description that contains significantly more than fifty words to properly test the maximum description bonus points system. It includes multiple sentences and provides comprehensive information about the disaster situation. This should trigger the highest description bonus of thirty points in addition to the base ten points, resulting in a total of forty points just from the description alone.",
      expected: "50+ words - 10 base + 30 description = 40 points",
    },
  ];

  testCases.forEach((testCase, index) => {
    console.log(`\n--- Test Case ${index + 1} ---`);
    console.log("Description:", testCase.description);
    console.log("Expected:", testCase.expected);

    const wordCount = testCase.description
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
    console.log("Actual word count:", wordCount);

    const mockReportData = {
      description: testCase.description,
      images: [],
      latitude: "",
      longitude: "",
      locationDescription: "",
    };

    const points = calculateReportPoints(mockReportData);
    console.log("Calculated points:", points);
  });

  console.log("\n=== Test Complete ===");
};

/**
 * Calculate dynamic points based on report quality
 */
export const calculateReportPoints = (reportData) => {
  const {
    description,
    images,
    latitude,
    longitude,
    locationDescription,
    severity,
  } = reportData;

  let points = 0;

  // Base points for submitting report (original system)
  points += 50;

  // Original system bonuses
  // Bonus points for including images (original +20)
  if (images && images.length > 0) {
    points += 20;
  }

  // Bonus points for critical priority (original +30)
  if (severity === "high") {
    points += 30;
  }

  // NEW: Points based on description length (word count) - ADDITIONAL BONUS
  if (description) {
    const wordCount = description
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;

    if (wordCount >= 50) {
      points += 30; // Detailed description (50+ words)
    } else if (wordCount >= 20) {
      points += 20; // Good description (20-49 words)
    } else if (wordCount >= 10) {
      points += 10; // Basic description (10-19 words)
    }
    // Less than 10 words gets no description bonus
  }

  // Bonus points for providing location (keep this as extra bonus)
  if (
    (latitude && longitude) ||
    (locationDescription && locationDescription.trim().length > 0)
  ) {
    points += 5;
  }

  return points;
};

/**
 * Award points to a reporter with custom point amount
 */
export const awardPoints = async (
  reporter,
  customPoints = null,
  reason = "Report submission"
) => {
  try {
    const points = customPoints || 50; // Use custom points or default to 50

    const rewardDoc = {
      name: reporter.name,
      email: reporter.email,
      points: points,
      reason: reason,
      date: new Date().toISOString(),
    };

    await addDoc(rewardsCollection, rewardDoc);
    console.log(
      `✅ ${points} reward points added for ${reporter.email} - ${reason}`
    );
  } catch (error) {
    console.error("❌ Error awarding points:", error);
    throw error;
  }
};

/**
 * Deduct points from a reporter (for when reports are deleted)
 */
export const deductPoints = async (
  reporter,
  pointsToDeduct,
  reason = "Report deleted"
) => {
  try {
    const negativePoints = -Math.abs(pointsToDeduct); // Ensure negative value

    const rewardDoc = {
      name: reporter.name,
      email: reporter.email,
      points: negativePoints,
      reason: reason,
      date: new Date().toISOString(),
    };

    await addDoc(rewardsCollection, rewardDoc);
    console.log(
      `✅ ${Math.abs(negativePoints)} points deducted from ${
        reporter.email
      } - ${reason}`
    );
  } catch (error) {
    console.error("❌ Error deducting points:", error);
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
