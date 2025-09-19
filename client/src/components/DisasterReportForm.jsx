// components/DisasterReportForm.jsx
//
// USAGE EXAMPLE:
//
// import { useRef } from 'react';
//
// const ParentComponent = () => {
//   const formRef = useRef();
//   const [formData, setFormData] = useState({...});
//
//   const handleSubmit = () => {
//     if (formRef.current?.validateForm()) {
//       // Form is valid, proceed with submission
//       console.log('Form is valid!', formData);
//     } else {
//       // Form has errors, they will be displayed automatically
//       console.log('Form has errors:', formRef.current?.getErrors());
//     }
//   };
//
//   return (
//     <div>
//       <DisasterReportForm
//         ref={formRef}
//         formData={formData}
//         setFormData={setFormData}
//       />
//       <button onClick={handleSubmit}>Submit</button>
//     </div>
//   );
// };
//
import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { MapPin, Camera, X, Upload } from "lucide-react";
import ReporterMapMarking from "./ReporterMapMarking"; // your map component

const disasterTypes = [
  { id: "flood", name: "Flood", icon: "🌊" },
  { id: "landslide", name: "Landslide", icon: "🏔️" },
  { id: "high_wind", name: "High Wind", icon: "🌪️" },
  { id: "power_cuts", name: "Power Cuts", icon: "💡" },
  { id: "other", name: "Other", icon: "⚠️" },
];

const DisasterReportForm = forwardRef(({ formData, setFormData }, ref) => {
  const [mapLocation, setMapLocation] = useState({
    latitude: "",
    longitude: "",
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Validation states
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Expose validation function to parent component
  useImperativeHandle(ref, () => ({
    validateForm: () => {
      const isValid = validateAllFields();
      // Mark all fields as touched to show validation errors
      setTouched({
        disasterType: true,
        title: true,
        description: true,
        severity: true,
        locationDescription: true,
        latitude: true,
        longitude: true,
      });
      return isValid;
    },
    getErrors: () => errors,
    isFormValid: () => Object.keys(errors).length === 0,
  }));

  // Validation rules
  const validateField = (name, value) => {
    const fieldErrors = {};

    switch (name) {
      case "disasterType":
        if (!value || value.trim() === "") {
          fieldErrors.disasterType = "Please select a disaster type";
        }
        break;

      case "title":
        if (!value || value.trim() === "") {
          fieldErrors.title = "Disaster title is required";
        } else if (value.trim().length < 10) {
          fieldErrors.title = "Title must be at least 10 characters long";
        } else if (value.trim().length > 100) {
          fieldErrors.title = "Title must not exceed 100 characters";
        }
        break;

      case "description":
        if (!value || value.trim() === "") {
          fieldErrors.description = "Description is required";
        } else if (value.trim().length < 20) {
          fieldErrors.description =
            "Description must be at least 20 characters long";
        } else if (value.trim().length > 1000) {
          fieldErrors.description =
            "Description must not exceed 1000 characters";
        }
        break;

      case "severity":
        if (!value || value.trim() === "") {
          fieldErrors.severity = "Please select a severity level";
        }
        break;

      case "locationDescription":
        if (!value || value.trim() === "") {
          fieldErrors.locationDescription = "Location description is required";
        } else if (value.trim().length < 5) {
          fieldErrors.locationDescription =
            "Location description must be at least 5 characters long";
        }
        break;

      case "latitude":
        if (!value || value.trim() === "") {
          fieldErrors.latitude = "Latitude is required";
        } else {
          const lat = parseFloat(value);
          if (isNaN(lat) || lat < -90 || lat > 90) {
            fieldErrors.latitude = "Latitude must be between -90 and 90";
          }
        }
        break;

      case "longitude":
        if (!value || value.trim() === "") {
          fieldErrors.longitude = "Longitude is required";
        } else {
          const lng = parseFloat(value);
          if (isNaN(lng) || lng < -180 || lng > 180) {
            fieldErrors.longitude = "Longitude must be between -180 and 180";
          }
        }
        break;

      default:
        break;
    }

    return fieldErrors;
  };

  // Validate all fields
  const validateAllFields = () => {
    const allErrors = {};
    const fields = [
      "disasterType",
      "title",
      "description",
      "severity",
      "locationDescription",
      "latitude",
      "longitude",
    ];

    fields.forEach((field) => {
      const fieldErrors = validateField(field, formData[field]);
      Object.assign(allErrors, fieldErrors);
    });

    setErrors(allErrors);
    return Object.keys(allErrors).length === 0;
  };

  // Check if form is valid for submission
  const isFormValid = () => {
    return validateAllFields();
  };

  // Initialize images from formData when editing existing reports
  useEffect(() => {
    if (!formData.images || formData.images.length === 0) {
      setSelectedImages([]);
      setImagePreviews([]);
    } else {
      // Handle existing images (URLs) when editing
      const existingImages = formData.images
        .map((img, index) => {
          if (typeof img === "string") {
            // This is an existing image URL
            return {
              id: `existing-${index}`,
              url: img,
              isExisting: true,
            };
          } else if (img.base64) {
            // This is a new image with base64 data
            return {
              id: img.id || `new-${index}`,
              file: img.file,
              base64: img.base64,
              name: img.name,
              size: img.size,
            };
          }
          return null;
        })
        .filter(Boolean);

      const existingPreviews = formData.images
        .map((img, index) => {
          if (typeof img === "string") {
            // This is an existing image URL
            return {
              id: `existing-${index}`,
              url: img,
              name: `Image ${index + 1}`,
              isExisting: true,
            };
          } else if (img.base64) {
            // This is a new image with base64 data
            return {
              id: img.id || `new-${index}`,
              url: img.base64,
              name: img.name,
            };
          }
          return null;
        })
        .filter(Boolean);

      setSelectedImages(existingImages);
      setImagePreviews(existingPreviews);
    }
  }, [formData.images]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Update form data
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Mark field as touched
    setTouched((prev) => ({ ...prev, [name]: true }));

    // Validate field and update errors
    const fieldErrors = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      ...fieldErrors,
      // Remove error for this field if validation passes
      [name]: fieldErrors[name] || undefined,
    }));
  };

  // Handle field blur to show validation errors
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    const fieldErrors = validateField(name, formData[name]);
    setErrors((prev) => ({
      ...prev,
      ...fieldErrors,
    }));
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));
        setMapLocation({ latitude: lat, longitude: lng });
      });
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  // Image handling functions
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);

    if (files.length + selectedImages.length > 5) {
      alert("You can upload maximum 5 images");
      return;
    }

    const processFiles = async () => {
      const newImages = [];
      const newPreviews = [];

      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          // 5MB limit
          alert(`${file.name} is too large. Maximum file size is 5MB.`);
          continue;
        }

        if (!file.type.startsWith("image/")) {
          alert(`${file.name} is not an image file.`);
          continue;
        }

        try {
          const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          const imageId = Date.now() + Math.random();

          newImages.push({
            id: imageId,
            file,
            base64,
            name: file.name,
            size: file.size,
          });

          newPreviews.push({
            id: imageId,
            url: base64,
            name: file.name,
          });
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          alert(`Error processing ${file.name}`);
        }
      }

      if (newImages.length > 0) {
        const updatedImages = [...selectedImages, ...newImages];
        const updatedPreviews = [...imagePreviews, ...newPreviews];

        setSelectedImages(updatedImages);
        setImagePreviews(updatedPreviews);

        // Update form data with mixed array of existing URLs and new images
        const currentImages = formData.images || [];
        const newImageObjects = newImages.map((img) => ({
          id: img.id,
          base64: img.base64,
          name: img.name,
          size: img.size,
        }));

        setFormData((prev) => ({
          ...prev,
          images: [...currentImages, ...newImageObjects],
        }));
      }
    };

    processFiles();
  };

  const removeImage = (imageId) => {
    const updatedImages = selectedImages.filter((img) => img.id !== imageId);
    const updatedPreviews = imagePreviews.filter((img) => img.id !== imageId);

    setSelectedImages(updatedImages);
    setImagePreviews(updatedPreviews);

    // Update form data - handle both existing URLs and new images
    const updatedFormImages = updatedImages.map((img) => {
      if (img.isExisting) {
        // Keep existing image URLs as strings
        return img.url;
      } else {
        // Keep new images as objects with base64 data
        return {
          id: img.id,
          base64: img.base64,
          name: img.name,
          size: img.size,
        };
      }
    });

    setFormData((prev) => ({
      ...prev,
      images: updatedFormImages,
    }));
  };

  return (
    <div className="max-w-2xl space-y-6 mx-auto">
      {/* Validation Summary - Only show if there are errors and some fields are touched */}
      {Object.keys(errors).length > 0 && Object.keys(touched).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-red-800 mb-2">
            Please fix the following errors:
          </h3>
          <ul className="text-sm text-red-700 space-y-1">
            {Object.entries(errors).map(([field, error]) => (
              <li key={field} className="flex items-center">
                <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disaster Information */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Disaster Information</h2>

        {/* Disaster Type */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Disaster Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {disasterTypes.map((type) => (
              <label
                key={type.id}
                className={`flex items-center gap-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50 ${
                  formData.disasterType === type.id
                    ? "border-blue-500 bg-blue-50"
                    : errors.disasterType && touched.disasterType
                    ? "border-red-500 bg-red-50"
                    : "border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="disasterType"
                  value={type.id}
                  checked={formData.disasterType === type.id}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="hidden"
                />
                <span className="text-xl">{type.icon}</span>
                <span>{type.name}</span>
              </label>
            ))}
          </div>
          {errors.disasterType && touched.disasterType && (
            <p className="text-red-500 text-sm mt-1">{errors.disasterType}</p>
          )}
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Disaster Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="e.g., Heavy flooding in Colombo"
            className={`w-full border rounded-lg p-2 ${
              errors.title && touched.title
                ? "border-red-500 bg-red-50 focus:border-red-500"
                : "border-gray-300 focus:border-blue-500"
            } focus:outline-none focus:ring-1 focus:ring-blue-500`}
          />
          {errors.title && touched.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title}</p>
          )}
          <p className="text-gray-500 text-xs mt-1">
            {formData.title ? formData.title.length : 0}/100 characters
          </p>
        </div>

        {/* Severity */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Severity Level <span className="text-red-500">*</span>
          </label>
          <select
            name="severity"
            value={formData.severity}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full border rounded-lg p-2 ${
              errors.severity && touched.severity
                ? "border-red-500 bg-red-50 focus:border-red-500"
                : "border-gray-300 focus:border-blue-500"
            } focus:outline-none focus:ring-1 focus:ring-blue-500`}
          >
            <option value="">Select severity level</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          {errors.severity && touched.severity && (
            <p className="text-red-500 text-sm mt-1">{errors.severity}</p>
          )}
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Provide detailed information about the disaster..."
            rows={4}
            className={`w-full border rounded-lg p-2 ${
              errors.description && touched.description
                ? "border-red-500 bg-red-50 focus:border-red-500"
                : "border-gray-300 focus:border-blue-500"
            } focus:outline-none focus:ring-1 focus:ring-blue-500`}
          />
          {errors.description && touched.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
          )}
          <p className="text-gray-500 text-xs mt-1">
            {formData.description ? formData.description.length : 0}/1000
            characters
          </p>
        </div>
      </div>

      {/* Image Upload Section */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Camera className="w-5 h-5 mr-2" />
          Disaster Images
        </h2>

        {/* Upload Area */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Upload Images (Max 5, 5MB each)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600 mb-2">
                Click to upload disaster images
              </p>
              <p className="text-sm text-gray-500">
                Supports JPG, PNG, GIF up to 5MB each
              </p>
            </label>
          </div>
        </div>

        {/* Image Previews */}
        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {imagePreviews.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-32 object-cover rounded-lg border border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => removeImage(image.id)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="text-xs text-gray-600 mt-1 truncate">
                  {image.name}
                </p>
              </div>
            ))}
          </div>
        )}

        {selectedImages.length > 0 && (
          <p className="text-sm text-gray-600 mt-2">
            {selectedImages.length} image(s) selected
          </p>
        )}
      </div>

      {/* Location Information */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Location Information</h2>

        {/* Location Description */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Location Description <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="locationDescription"
            value={formData.locationDescription}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="e.g., Colombo 07, near Manning Market"
            className={`w-full border rounded-lg p-2 ${
              errors.locationDescription && touched.locationDescription
                ? "border-red-500 bg-red-50 focus:border-red-500"
                : "border-gray-300 focus:border-blue-500"
            } focus:outline-none focus:ring-1 focus:ring-blue-500`}
          />
          {errors.locationDescription && touched.locationDescription && (
            <p className="text-red-500 text-sm mt-1">
              {errors.locationDescription}
            </p>
          )}
        </div>

        {/* Latitude & Longitude */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Latitude <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="latitude"
              value={formData.latitude}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="6.9271"
              step="any"
              min="-90"
              max="90"
              className={`w-full border rounded-lg p-2 ${
                errors.latitude && touched.latitude
                  ? "border-red-500 bg-red-50 focus:border-red-500"
                  : "border-gray-300 focus:border-blue-500"
              } focus:outline-none focus:ring-1 focus:ring-blue-500`}
            />
            {errors.latitude && touched.latitude && (
              <p className="text-red-500 text-sm mt-1">{errors.latitude}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Longitude <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="longitude"
              value={formData.longitude}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="79.8612"
              step="any"
              min="-180"
              max="180"
              className={`w-full border rounded-lg p-2 ${
                errors.longitude && touched.longitude
                  ? "border-red-500 bg-red-50 focus:border-red-500"
                  : "border-gray-300 focus:border-blue-500"
              } focus:outline-none focus:ring-1 focus:ring-blue-500`}
            />
            {errors.longitude && touched.longitude && (
              <p className="text-red-500 text-sm mt-1">{errors.longitude}</p>
            )}
          </div>
        </div>

        {/* Current Location Button */}
        <button
          type="button"
          onClick={handleCurrentLocation}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mb-4"
        >
          <MapPin className="w-5 h-5" />
          Use Current Location
        </button>

        {/* Google Map */}
        {formData.latitude && formData.longitude && (
          <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-300">
            <ReporterMapMarking
              disasterType={formData.disasterType}
              latitude={parseFloat(formData.latitude)}
              longitude={parseFloat(formData.longitude)}
              onLocationSelect={(coords) => {
                setFormData((prev) => ({
                  ...prev,
                  latitude: coords.latitude.toFixed(6),
                  longitude: coords.longitude.toFixed(6),
                }));
                setMapLocation(coords);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
});

DisasterReportForm.displayName = "DisasterReportForm";

export default DisasterReportForm;
