import React, { useState, useRef, useEffect } from "react";
import { Search, Navigation, MapPin, Loader2 } from "lucide-react";

export default function RouteForm({ onCalculateRoute, isAnalyzing, userLocation }) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);

  const originRef = useRef(null);
  const destinationRef = useRef(null);
  const autocompleteService = useRef(null);

  // ✅ Ensure AutocompleteService only initializes when Maps is ready
  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
    }
  }, []);

  // Function to sanitize input to only allow letters, numbers, and spaces
  const sanitizeInput = (input) => {
    return input.replace(/[^a-zA-Z0-9\s]/g, '');
  };

  const fetchSuggestions = (input, setSuggestions) => {
    if (!autocompleteService.current || input.length < 3) {
      setSuggestions([]);
      return;
    }
    autocompleteService.current.getPlacePredictions(
      {
        input,
        componentRestrictions: { country: "LK" },
      },
      (predictions, status) => {
        if (
          status === window.google.maps.places.PlacesServiceStatus.OK &&
          predictions
        ) {
          setSuggestions(predictions);
        } else {
          setSuggestions([]);
        }
      }
    );
  };

  const handleOriginChange = (e) => {
    const value = sanitizeInput(e.target.value);
    setOrigin(value);
    fetchSuggestions(value, setOriginSuggestions);
  };

  const handleDestinationChange = (e) => {
    const value = sanitizeInput(e.target.value);
    setDestination(value);
    fetchSuggestions(value, setDestinationSuggestions);
  };

  const handleSelectSuggestion = (suggestion, type) => {
    if (type === "origin") {
      setOrigin(suggestion.description);
      setOriginSuggestions([]);
    } else {
      setDestination(suggestion.description);
      setDestinationSuggestions([]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let originLocation = origin;
    if (useCurrentLocation && userLocation) {
      originLocation = userLocation;
    }

    if (!originLocation || !destination) {
      alert("Please enter both origin and destination");
      return;
    }

    onCalculateRoute(originLocation, destination);
  };

  const handleUseCurrentLocation = () => {
    setUseCurrentLocation(!useCurrentLocation);
    if (!useCurrentLocation && userLocation) {
      setOrigin("Current Location");
      setOriginSuggestions([]);
    } else {
      setOrigin("");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 w-80">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Navigation className="mr-2 h-5 w-5 text-blue-600" />
        Risk Route Analyzer
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Origin Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            From
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              ref={originRef}
              type="text"
              value={origin}
              onChange={handleOriginChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter starting location"
              disabled={useCurrentLocation}
              pattern="[a-zA-Z0-9\s]*"
              title="Only letters, numbers, and spaces are allowed"
            />
            {originSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-auto">
                {originSuggestions.map((suggestion) => (
                  <li
                    key={suggestion.place_id}
                    onClick={() =>
                      handleSelectSuggestion(suggestion, "origin")
                    }
                    className="p-2 cursor-pointer hover:bg-gray-100"
                  >
                    {suggestion.description}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {userLocation && (
            <div className="mt-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={useCurrentLocation}
                  onChange={handleUseCurrentLocation}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-600">
                  Use current location
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Destination Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            To
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              ref={destinationRef}
              type="text"
              value={destination}
              onChange={handleDestinationChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter destination"
              pattern="[a-zA-Z0-9\s]*"
              title="Only letters, numbers, and spaces are allowed"
            />
            {destinationSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-auto">
                {destinationSuggestions.map((suggestion) => (
                  <li
                    key={suggestion.place_id}
                    onClick={() =>
                      handleSelectSuggestion(suggestion, "destination")
                    }
                    className="p-2 cursor-pointer hover:bg-gray-100"
                  >
                    {suggestion.description}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isAnalyzing}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
              Analyzing Route...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Find Safe Route
            </>
          )}
        </button>
      </form>

      <div className="mt-4 text-xs text-gray-500">
        <p>🟢 Low Risk • 🟡 Medium Risk • 🔴 High Risk</p>
      </div>
    </div>
  );
}