import React, { useState } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { AlertTriangle, ShieldCheck } from "lucide-react";

const containerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "0.5rem",
};

const dangerIcons = {
  Floods: { url: "/floodNew.png", w: 40, h: 40 },
  Landslides: { url: "/landslideNew.png", w: 40, h: 40 },
  "High Wind": { url: "/highwind.png", w: 40, h: 40 },
  "Power Cuts": { url: "/nopower.png", w: 40, h: 40 },
  "Water Cuts": { url: "/nowater.png", w: 40, h: 40 },
  "Elephants Moving": { url: "/elephant1.png", w: 40, h: 40 },
};

const safeIcon = { url: "/safezone.png", w: 40, h: 40 };

function MapView({ zones = [], onSelectSafeZone }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const [selectedZone, setSelectedZone] = useState(null);

  if (!isLoaded) return <div>Loading Map...</div>;

  const center = { lat: 7.8731, lng: 80.7718 }; // Center of Sri Lanka

  const getMarkerIcon = (category, subCategory) => {
    const config =
      category === "danger" && dangerIcons[subCategory]
        ? dangerIcons[subCategory]
        : safeIcon;

    return {
      url: config.url,
      scaledSize: new window.google.maps.Size(config.w, config.h),
      anchor: new window.google.maps.Point(config.w / 2, config.h),
    };
  };

  return (
    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={7}>
      {zones.map((zone) => (
        <Marker
          key={zone.id}
          position={{ lat: zone.latitude, lng: zone.longitude }}
          onClick={() => setSelectedZone(zone)}
          onDblClick={() => onSelectSafeZone(zone)}
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
            {selectedZone.category !== "danger" && (
              <button
                onClick={() => {
                  onSelectSafeZone(selectedZone);
                  setSelectedZone(null);
                }}
                className="mt-1 px-2 py-1 bg-blue-500 text-white rounded text-xs"
              >
                Select as Safe Zone
              </button>
            )}
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}

export default React.memo(MapView);
