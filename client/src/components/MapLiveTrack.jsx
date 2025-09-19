import React, { useState } from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { AlertTriangle, ShieldCheck } from "lucide-react";

const containerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "0.5rem",
};

// Custom icons (replace with your actual image paths in /public)
const dangerIcons = {
  floods: { url: "/flood.png", w: 40, h: 40 },
  landslides: { url: "/landslide.png", w: 40, h: 40 },
  "high wind": { url: "/highwind.png", w: 40, h: 40 },
  "power cuts": { url: "/nopower.png", w: 40, h: 40 },
  "water cuts": { url: "/nowater.png", w: 40, h: 40 },
  "elephants moving": { url: "/elephant1.png", w: 40, h: 40 },
};

const safeIcon = { url: "/safezone.png", w: 40, h: 40 };

function MapLiveTrack({ zones = [], onSelectSafeZone }) {
  const [selectedZone, setSelectedZone] = useState(null);

  const center = { lat: 7.8731, lng: 80.7718 }; // Sri Lanka center

  const getMarkerIcon = (category, subCategory) => {
    const key = (subCategory || "").toLowerCase();
    const config =
      category === "danger" && dangerIcons[key]
        ? dangerIcons[key]
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
          onDblClick={() => onSelectSafeZone?.(zone)}
          icon={getMarkerIcon(zone.category, zone.subCategory)}
        />
      ))}

      {selectedZone && (
        <InfoWindow
          position={{
            lat: selectedZone.latitude,
            lng: selectedZone.longitude,
          }}
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

            {selectedZone.safeDescription && (
              <p>{selectedZone.safeDescription}</p>
            )}

            <p>
              {selectedZone.city}, {selectedZone.district}
            </p>

            {selectedZone.category !== "danger" && (
              <button
                onClick={() => {
                  onSelectSafeZone?.(selectedZone);
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

export default React.memo(MapLiveTrack);
