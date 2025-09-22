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

function MapLiveTrack({ zones = [], userLocation = null, onSelectSafeZone }) {
  const [selectedZone, setSelectedZone] = useState(null);

  const center = userLocation || { lat: 7.8731, lng: 80.7718 }; // Use user location or Sri Lanka center

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
    <GoogleMap 
      mapContainerStyle={containerStyle} 
      center={center} 
      zoom={userLocation ? 12 : 7}
    >
      {/* User location marker */}
      {userLocation && (
        <Marker
          position={{ lat: userLocation.lat, lng: userLocation.lng }}
          icon={{
            url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#2563eb" width="40px" height="40px">
                <path d="M0 0h24v24H0z" fill="none"/>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(30, 30),
            anchor: new window.google.maps.Point(15, 15),
          }}
        />
      )}
      
      {/* Zone markers */}
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
                Danger: ${selectedZone.subCategory}
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