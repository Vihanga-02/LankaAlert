import React, { useState, useEffect } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "500px",
};

// ✅ Custom icons for danger categories
const dangerIcons = {
  Floods: {
    url: "/flood.png",
    scaledSize: { w: 40, h: 40 },
    anchor: { x: 20, y: 40 },
  },
  "Landslides": {
    url: "/landslide.png",
    scaledSize: { w: 40, h: 40 },
    anchor: { x: 20, y: 40 },
  },
  "High Wind": {
    url: "/highwind.png",
    scaledSize: { w: 40, h: 40 },
    anchor: { x: 20, y: 40 },
  },
  "Power Cuts": {
    url: "/nopower.png",
    scaledSize: { w: 40, h: 40 },
    anchor: { x: 20, y: 40 },
  },
  "Water Cuts": {
    url: "/nowater.png",
    scaledSize: { w: 40, h: 40 },
    anchor: { x: 20, y: 40 },
  },
  "Elephants Moving": {
    url: "/elephant1.png",
    scaledSize: { w: 40, h: 40 },
    anchor: { x: 20, y: 40 },
  },
};

// ✅ Custom icon for safe zones
const safeIcon = {
  url: "/safezone.png", // put in public/
  scaledSize: { w: 40, h: 40 },
  anchor: { x: 20, y: 40 },
};

function MapMarking({ lat, lng, onLocationSelect, zones = [] }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const [markerPos, setMarkerPos] = useState(
    lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null
  );
  const [selectedZone, setSelectedZone] = useState(null);

  useEffect(() => {
    if (lat && lng) {
      setMarkerPos({ lat: parseFloat(lat), lng: parseFloat(lng) });
    }
  }, [lat, lng]);

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={markerPos || { lat: 6.9271, lng: 79.8612 }}
      zoom={markerPos ? 12 : 7}
      onClick={(e) => {
        if (!onLocationSelect) return;
        const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        setMarkerPos(newPos);
        onLocationSelect(newPos.lat.toFixed(6), newPos.lng.toFixed(6));
      }}
    >
      {/* Marker for manual add */}
      {markerPos && onLocationSelect && <Marker position={markerPos} />}

      {/* Display zones with icons */}
      {zones.map((zone) => {
        const config =
          zone.category === "danger" && dangerIcons[zone.subCategory]
            ? dangerIcons[zone.subCategory]
            : safeIcon;

        const iconConfig = {
          url: config.url,
          scaledSize: new window.google.maps.Size(config.scaledSize.w, config.scaledSize.h),
          anchor: config.anchor
            ? new window.google.maps.Point(config.anchor.x, config.anchor.y)
            : undefined,
        };

        return (
          <Marker
            key={zone.id}
            position={{ lat: zone.latitude, lng: zone.longitude }}
            onClick={() => setSelectedZone(zone)}
            icon={iconConfig}
          />
        );
      })}

      {/* Info window */}
      {selectedZone && (
        <InfoWindow
          position={{ lat: selectedZone.latitude, lng: selectedZone.longitude }}
          onCloseClick={() => setSelectedZone(null)}
        >
          <div className="space-y-1 text-sm">
            <h3 className="font-semibold text-base">{selectedZone.name}</h3>
            {selectedZone.category === "danger" ? (
              <p className="text-red-600">Danger: {selectedZone.subCategory}</p>
            ) : (
              <p className="text-green-600">Safe Zone</p>
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

export default React.memo(MapMarking);
