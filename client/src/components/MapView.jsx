import React, { useState } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { AlertTriangle, ShieldCheck } from "lucide-react";

// Google Maps container style
const containerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "0.5rem",
};

// Custom icons for danger subcategories using URLs
const dangerIcons = {
  "Floods": "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  "Landslides": "http://maps.google.com/mapfiles/ms/icons/brown-dot.png",
  "High Wind": "http://maps.google.com/mapfiles/ms/icons/ltblue-dot.png",
  "Power Cuts": "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
  "Water Cuts": "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
  "Elephants Moving": "http://maps.google.com/mapfiles/ms/icons/purple-dot.png",
  "Default Danger": "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png", // Fallback icon
};

const safeIcon = "http://maps.google.com/mapfiles/ms/icons/green-dot.png";

function MapView({ zones }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const [selectedZone, setSelectedZone] = useState(null);

  if (!isLoaded) return <div>Loading Map...</div>;

  const center = { lat: 7.8731, lng: 80.7718 }; // Center of Sri Lanka

  // Function to select the correct icon URL based on subCategory
  const getMarkerIcon = (category, subCategory) => {
    if (category === "safe") {
      return { url: safeIcon };
    }

    const iconUrl = dangerIcons[subCategory] || dangerIcons["Default Danger"];
    return { url: iconUrl };
  };

  return (
    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={7}>
      {zones.map((zone) => (
        <Marker
          key={zone.id}
          position={{ lat: zone.latitude, lng: zone.longitude }}
          onClick={() => setSelectedZone(zone)}
          icon={getMarkerIcon(zone.category, zone.subCategory)}
        />
      ))}

      {selectedZone && (
        <InfoWindow
          position={{ lat: selectedZone.latitude, lng: selectedZone.longitude }}
          onCloseClick={() => setSelectedZone(null)}
        >
          <div className="space-y-1 text-sm">
            <h3 className="font-semibold text-base">{selectedZone.name}</h3>
            {selectedZone.category === "danger" ? (
              <p className="text-red-600 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Danger: {selectedZone.subCategory}
              </p>
            ) : (
              <p className="text-green-600 flex items-center">
                <ShieldCheck className="h-4 w-4 mr-1" />
                Safe Zone
              </p>
            )}
            {selectedZone.safeDescription && <p>{selectedZone.safeDescription}</p>}
            <p>
              {selectedZone.city}, {selectedZone.district}
            </p>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}

export default React.memo(MapView);