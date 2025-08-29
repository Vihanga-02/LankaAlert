import React, { useState, useEffect } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "500px",
};

// Custom icons for danger subcategories
const dangerIcons = {
  Floods: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  "Land Falling": "https://maps.google.com/mapfiles/ms/icons/orange-dot.png",
  "High Wind": "https://maps.google.com/mapfiles/ms/icons/purple-dot.png",
  "Power Cuts": "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
  "Water Cuts": "https://maps.google.com/mapfiles/ms/icons/ltblue-dot.png",
  "Elephants Moving": "https://maps.google.com/mapfiles/ms/icons/pink-dot.png",
};

function MapMarking({ lat, lng, onLocationSelect, zones = [] }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const [markerPos, setMarkerPos] = useState(lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null);
  const [selectedZone, setSelectedZone] = useState(null);

  useEffect(() => {
    if (lat && lng) setMarkerPos({ lat: parseFloat(lat), lng: parseFloat(lng) });
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
      {/* Marker for add form */}
      {markerPos && onLocationSelect && <Marker position={markerPos} />}

      {/* Display zones */}
      {zones.map((zone) => {
        const iconUrl =
          zone.category === "danger"
            ? dangerIcons[zone.subCategory] || "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
            : "http://maps.google.com/mapfiles/ms/icons/green-dot.png";

        return (
          <Marker
            key={zone.id}
            position={{ lat: zone.latitude, lng: zone.longitude }}
            onClick={() => setSelectedZone(zone)}
            icon={{ url: iconUrl }}
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
