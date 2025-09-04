import React, { useState, useEffect, useCallback } from "react";
import {
  GoogleMap,
  DirectionsRenderer,
  Marker,
  useLoadScript,
} from "@react-google-maps/api";
import { Route } from "lucide-react";
import RouteForm from "../components/RouteForm";
import { useMapZone } from "../context/MapZoneContext";
import { analyzeRouteRisk, compareRoutesByRisk } from "../utils/routeAnalysis";

const mapContainerStyle = { width: "100%", height: "100vh" };
const defaultCenter = { lat: 7.8731, lng: 80.7718 };
const libraries = ["places"];

// Custom icons for danger/safe zones
const dangerIcons = {
  floods: { url: "/flood.png", w: 40, h: 40 },
  landslides: { url: "/landslide.png", w: 40, h: 40 },
  "high wind": { url: "/highwind.png", w: 40, h: 40 },
  "power cuts": { url: "/nopower.png", w: 40, h: 40 },
  "water cuts": { url: "/nowater.png", w: 40, h: 40 },
  "elephants moving": { url: "/elephant1.png", w: 40, h: 40 },
};
const safeIcon = { url: "/safezone.png", w: 40, h: 40 };

export default function RiskRoute() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY_Chenuka,
    libraries,
  });

  const { zones } = useMapZone();
  const [map, setMap] = useState(null);
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [alternateRoutes, setAlternateRoutes] = useState([]);
  const [routeRisks, setRouteRisks] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        (err) => console.error("Location error:", err)
      );
    }
  }, []);

  const onLoad = useCallback((map) => {
    setMap(map);
    setDirectionsService(new window.google.maps.DirectionsService());
  }, []);

  const calculateRoute = async (origin, destination) => {
    if (!directionsService) return;
    setIsAnalyzing(true);
    setDirectionsResponse(null);
    setAlternateRoutes([]);
    setRouteRisks([]);

    try {
      const request = {
        origin,
        destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true,
        optimizeWaypoints: true,
      };
      const result = await directionsService.route(request);

      if (result.routes?.length > 0) {
        const risks = result.routes.map((route) =>
          analyzeRouteRisk(
            route,
            zones
              .filter((z) => z.category === "danger")
              .map((z) => ({
                latitude: z.latitude,
                longitude: z.longitude,
                radius: 2000,
                type: z.subCategory,
                name: z.name,
              }))
          )
        );

        const sorted = [...result.routes]
          .map((r, i) => ({ route: r, risk: risks[i] }))
          .sort((a, b) => compareRoutesByRisk(a.risk, b.risk));

        setAlternateRoutes(sorted.map((s) => s.route));
        setRouteRisks(sorted.map((s) => s.risk));
        setDirectionsResponse({ ...result, routes: [sorted[0].route] });
        setSelectedRouteIndex(0);
      }
    } catch (err) {
      console.error("Route calculation failed:", err);
      alert("Could not calculate route. Try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const selectRoute = (index) => {
    setSelectedRouteIndex(index);
    if (directionsResponse) {
      setDirectionsResponse({
        ...directionsResponse,
        routes: [alternateRoutes[index]],
      });
    }
  };

  const getMarkerIcon = (category, subCategory) => {
    const key = (subCategory || "").toLowerCase();
    const config =
      category === "danger" && dangerIcons[key] ? dangerIcons[key] : safeIcon;
    return {
      url: config.url,
      scaledSize: new window.google.maps.Size(config.w, config.h),
      anchor: new window.google.maps.Point(config.w / 2, config.h),
    };
  };

  const getRiskColor = (level) => {
    switch (level) {
      case "low":
        return "bg-green-100 text-green-700 border-green-400";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-400";
      case "high":
        return "bg-red-100 text-red-700 border-red-400";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading Maps...
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={8}
        center={userLocation || defaultCenter}
        onLoad={onLoad}
        options={{ zoomControl: true, streetViewControl: false }}
      >
        {userLocation && (
          <Marker
            position={userLocation}
            icon={{
              url: `data:image/svg+xml;base64,${btoa(
                `<svg width="20" height="20"><circle cx="10" cy="10" r="8" fill="#2563eb"/></svg>`
              )}`,
              scaledSize: new window.google.maps.Size(20, 20),
            }}
          />
        )}

        {zones.map((zone) => (
          <Marker
            key={zone.id}
            position={{ lat: zone.latitude, lng: zone.longitude }}
            icon={getMarkerIcon(zone.category, zone.subCategory)}
          />
        ))}

        {directionsResponse && (
          <DirectionsRenderer
            directions={directionsResponse}
            options={{
              polylineOptions: { strokeColor: "#2563eb", strokeWeight: 6 },
            }}
          />
        )}
      </GoogleMap>

      {/* Route Form */}
      <div className="absolute top-4 left-4 z-10">
        <RouteForm
          onCalculateRoute={calculateRoute}
          isAnalyzing={isAnalyzing}
          userLocation={userLocation}
        />
      </div>

      {/* Routes Panel */}
      {alternateRoutes.length > 0 && (
        <div className="absolute top-4 right-4 z-10 bg-white rounded-xl shadow-lg p-4 w-80">
          <h3 className="font-semibold text-lg mb-3 flex items-center">
            <Route className="mr-2 h-5 w-5" /> Available Routes
          </h3>

          {alternateRoutes.map((route, i) => {
            const risk = routeRisks[i];
            const riskClasses = getRiskColor(risk?.riskLevel);

            return (
              <div
                key={i}
                onClick={() => selectRoute(i)}
                className={`p-3 rounded-lg border-2 mb-2 cursor-pointer transition ${
                  selectedRouteIndex === i
                    ? `border-blue-500 shadow-md`
                    : `border-gray-200`
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">Route {i + 1}</span>
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${riskClasses}`}
                  >
                    {risk?.riskLevel || "unknown"} risk
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  {route.legs[0]?.distance?.text} •{" "}
                  {route.legs[0]?.duration?.text}
                </p>
              </div>
            );
          })}

          {/* Legend */}
          <div className="mt-3 text-xs text-gray-500">
            <p>
              <span className="inline-block w-3 h-3 bg-green-400 rounded-full mr-1"></span>
              Low Risk
            </p>
            <p>
              <span className="inline-block w-3 h-3 bg-yellow-400 rounded-full mr-1"></span>
              Medium Risk
            </p>
            <p>
              <span className="inline-block w-3 h-3 bg-red-400 rounded-full mr-1"></span>
              High Risk
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
