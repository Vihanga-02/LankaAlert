// components/ReporterMapMarking.jsx
import React, { useEffect, useRef, useState } from "react";

const ReporterMapMarking = ({ disasterType, latitude, longitude, onLocationSelect }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY_DISASTER_REPORT;

  useEffect(() => {
    if (!window.google) {
      if (!document.querySelector("#google-maps-script")) {
        const script = document.createElement("script");
        script.id = "google-maps-script";
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
        script.async = true;
        document.head.appendChild(script);
        script.onload = () => initializeMap();
      }
    } else {
      initializeMap();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeMap = () => {
    const initialLat = parseFloat(latitude) || 6.9271;
    const initialLng = parseFloat(longitude) || 79.8612;

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: { lat: initialLat, lng: initialLng },
      zoom: 10,
      mapTypeControl: false,
      streetViewControl: false,
    });
    setMap(mapInstance);

    const currentMarker = new window.google.maps.Marker({
      position: { lat: initialLat, lng: initialLng },
      map: mapInstance,
      icon: getMarkerIcon(disasterType),
    });
    setMarker(currentMarker);

    // Allow clicking to change marker position
    mapInstance.addListener("click", (e) => {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();

      currentMarker.setPosition({ lat: newLat, lng: newLng });
      currentMarker.setIcon(getMarkerIcon(disasterType));

      if (onLocationSelect) {
        onLocationSelect({ latitude: newLat, longitude: newLng });
      }
    });
  };

  const getMarkerIcon = (type) => {
    const colors = {
      flood: "blue",
      landslide: "brown",
      high_wind: "purple",
      power_cuts: "orange",
      other: "red",
    };
    const color = colors[type] || "gray";

    return {
      path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
      fillColor: color,
      fillOpacity: 1,
      strokeWeight: 1,
      scale: 1.5,
    };
  };

  return (
    <div className="w-full h-64 rounded-lg border border-gray-300 overflow-hidden">
      <div ref={mapRef} className="w-full h-full"></div>
    </div>
  );
};

export default ReporterMapMarking;
