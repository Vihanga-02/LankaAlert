/**
 * Utility functions for analyzing route safety and danger zone intersections
 */

/**
 * Calculate the distance between two points using Haversine formula
 * @param {Object} point1 - {lat, lng}
 * @param {Object} point2 - {lat, lng}
 * @returns {number} Distance in meters
 */
export function calculateDistance(point1, point2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
  const dLng = ((point2.lng - point1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.lat * Math.PI) / 180) *
      Math.cos((point2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get all points along a route polyline
 * @param {google.maps.DirectionsRoute} route - Google Maps route object
 * @returns {Array} Array of {lat, lng} points
 */
export function getRoutePoints(route) {
  const points = [];

  route.legs.forEach((leg) => {
    leg.steps.forEach((step) => {
      const path = step.path || [];
      path.forEach((point) => {
        points.push({
          lat: typeof point.lat === "function" ? point.lat() : point.lat,
          lng: typeof point.lng === "function" ? point.lng() : point.lng,
        });
      });
    });
  });

  return points;
}

/**
 * Find the minimum distance from a route to a danger zone
 * @param {Array} routePoints - Array of {lat, lng} points
 * @param {Object} dangerZone - Danger zone object
 * @returns {number} Minimum distance in meters
 */
export function getMinimumDistanceToZone(routePoints, dangerZone) {
  let minDistance = Infinity;

  routePoints.forEach((point) => {
    const distance = calculateDistance(point, {
      lat: dangerZone.latitude,
      lng: dangerZone.longitude,
    });
    if (distance < minDistance) {
      minDistance = distance;
    }
  });

  return minDistance;
}

/**
 * Analyze a route for risk based on danger zone categories
 * @param {google.maps.DirectionsRoute} route - Google Maps route object
 * @param {Array} dangerZones - Array of danger zone objects
 * @returns {Object} Risk analysis result
 */
export function analyzeRouteRisk(route, dangerZones) {
  if (!route || !dangerZones || dangerZones.length === 0) {
    return {
      riskLevel: "safe",
      dangerZonesCount: 0,
      affectedZones: [],
      minDistanceToZone: Infinity,
      recommendations: ["✅ This route is Full Safe 🚀"],
    };
  }

  const routePoints = getRoutePoints(route);
  const affectedZones = [];
  let minDistanceToAnyZone = Infinity;

  // Risk mapping by subCategory
  const riskByType = {
    "Floods": "high",
    "Landslides": "high",
    "High Wind": "medium",
    "Elephants Moving": "medium",
    "Power Cuts": "low",
    "Water Cuts": "low",
  };

  let highRiskCount = 0;
  let mediumRiskCount = 0;
  let lowRiskCount = 0;

  dangerZones.forEach((zone) => {
    const minDistance = getMinimumDistanceToZone(routePoints, zone);

    if (minDistance < minDistanceToAnyZone) {
      minDistanceToAnyZone = minDistance;
    }

    if (minDistance <= zone.radius) {
      const riskLevel = riskByType[zone.type] || "low";

      if (riskLevel === "high") highRiskCount++;
      if (riskLevel === "medium") mediumRiskCount++;
      if (riskLevel === "low") lowRiskCount++;

      affectedZones.push({
        ...zone,
        distance: minDistance,
        riskLevel,
      });
    }
  });

  // Decide overall risk
  let riskLevel = "safe";
  if (highRiskCount > 0) {
    riskLevel = "high";
  } else if (mediumRiskCount > 0) {
    riskLevel = "medium";
  } else if (lowRiskCount > 0) {
    riskLevel = "low";
  }

  const recommendations = generateRecommendations(riskLevel, affectedZones);

  return {
    riskLevel,
    dangerZonesCount: affectedZones.length,
    affectedZones: affectedZones.sort((a, b) => a.distance - b.distance),
    minDistanceToZone: Math.round(minDistanceToAnyZone),
    highRiskCount,
    mediumRiskCount,
    lowRiskCount,
    recommendations,
  };
}

/**
 * Generate safety recommendations based on risk analysis
 */
function generateRecommendations(riskLevel, affectedZones) {
  const recs = [];

  if (riskLevel === "high") {
    recs.push("⚠️ Avoid this route – floods/landslides risk.");
  } else if (riskLevel === "medium") {
    recs.push("⚠️ Medium risk – high winds or elephant movement ahead.");
  } else if (riskLevel === "low") {
    recs.push("⚠️ Low risk – minor issues like power/water cuts.");
  } else {
    recs.push("✅ This route is Full Safe 🚀");
  }

  return [...new Set(recs)];
}

/**
 * Compare routes by risk level for sorting
 */
export function compareRoutesByRisk(routeA, routeB) {
  const riskPriority = { safe: 0, low: 1, medium: 2, high: 3 };

  const priorityA = riskPriority[routeA.riskLevel] || 0;
  const priorityB = riskPriority[routeB.riskLevel] || 0;

  if (priorityA !== priorityB) {
    return priorityA - priorityB;
  }

  return routeA.dangerZonesCount - routeB.dangerZonesCount;
}
