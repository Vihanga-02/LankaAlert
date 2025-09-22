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
      console.log("validateForm called - Before validation");
      console.log("Current formData:", formData);

      // Mark all fields as touched first
      setTouched({
        disasterType: true,
        title: true,
        description: true,
        severity: true,
        locationDescription: true,
        latitude: true,
        longitude: true,
      });

      // Then validate all fields
      const isValid = validateAllFields();

      console.log("Validation completed - isValid:", isValid);

      return isValid;
    },
    getErrors: () => errors,
    isFormValid: () => Object.keys(errors).length === 0,
    // For testing - manually trigger validation
    triggerValidation: () => {
      setTouched({
        disasterType: true,
        title: true,
        description: true,
        severity: true,
        locationDescription: true,
        latitude: true,
        longitude: true,
      });
      validateAllFields();
    },
  }));

  // Validation rules
  const validateField = (name, value) => {
    const fieldErrors = {};
    // Handle undefined, null, or empty values
    const fieldValue = value || "";

    switch (name) {
      case "disasterType":
        if (!fieldValue || fieldValue.toString().trim() === "") {
          fieldErrors.disasterType = "Please select a disaster type";
        }
        break;

      case "title":
        if (!fieldValue || fieldValue.toString().trim() === "") {
          fieldErrors.title = "Disaster title is required";
        } else if (fieldValue.toString().trim().length < 10) {
          fieldErrors.title = "Title must be at least 10 characters long";
        } else if (fieldValue.toString().trim().length > 100) {
          fieldErrors.title = "Title must not exceed 100 characters";
        }
        break;

      case "description":
        if (!fieldValue || fieldValue.toString().trim() === "") {
          fieldErrors.description = "Description is required";
        } else if (fieldValue.toString().trim().length < 20) {
          fieldErrors.description =
            "Description must be at least 20 characters long";
        } else if (fieldValue.toString().trim().length > 1000) {
          fieldErrors.description =
            "Description must not exceed 1000 characters";
        }
        break;

      case "severity":
        if (!fieldValue || fieldValue.toString().trim() === "") {
          fieldErrors.severity = "Please select a severity level";
        }
        break;

      case "locationDescription":
        if (!fieldValue || fieldValue.toString().trim() === "") {
          fieldErrors.locationDescription = "Location description is required";
        } else if (fieldValue.toString().trim().length < 5) {
          fieldErrors.locationDescription =
            "Location description must be at least 5 characters long";
        }
        break;

      case "latitude":
        if (!fieldValue || fieldValue.toString().trim() === "") {
          fieldErrors.latitude = "Latitude is required";
        } else {
          const lat = parseFloat(fieldValue);
          if (isNaN(lat) || lat < -90 || lat > 90) {
            fieldErrors.latitude = "Latitude must be between -90 and 90";
          }
        }
        break;

      case "longitude":
        if (!fieldValue || fieldValue.toString().trim() === "") {
          fieldErrors.longitude = "Longitude is required";
        } else {
          const lng = parseFloat(fieldValue);
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
    console.log("validateAllFields called");
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
      const fieldValue = formData[field];
      const fieldErrors = validateField(field, fieldValue);
      console.log(`Field ${field}:`, fieldValue, "Errors:", fieldErrors);
      Object.assign(allErrors, fieldErrors);
    });

    console.log("All validation errors:", allErrors);
    setErrors(allErrors);
    console.log("After setErrors, errors state should be updated");
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
    setErrors((prev) => {
      const newErrors = { ...prev, ...fieldErrors };

      // Remove error for this field if validation passes
      if (!fieldErrors[name]) {
        delete newErrors[name];
      }

      return newErrors;
    });
  };

  // Handle field blur to show validation errors
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    const fieldErrors = validateField(name, formData[name]);
    setErrors((prev) => {
      const newErrors = { ...prev, ...fieldErrors };

      // Remove error for this field if validation passes
      if (!fieldErrors[name]) {
        delete newErrors[name];
      }

      return newErrors;
    });
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
    <div className="max-w-2xl space-y-8 mx-auto bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen p-6">
      {/* Validation Summary - Show when there are errors and at least one field is touched */}
      {(() => {
        const hasErrors = Object.keys(errors).length > 0;
        const hasTouched = Object.keys(touched).length > 0;
        console.log(
          "Error card render check - hasErrors:",
          hasErrors,
          "hasTouched:",
          hasTouched
        );
        console.log("Current errors:", errors);
        console.log("Current touched:", touched);
        return hasErrors && hasTouched;
      })() && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-400 rounded-lg p-4 shadow-md">
          <h3 className="text-sm font-semibold text-red-800 mb-3 flex items-center">
            <span className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mr-2">
              <span className="text-white text-xs">!</span>
            </span>
            Please fix the following errors:
          </h3>
          <ul className="text-sm text-red-700 space-y-2">
            {Object.entries(errors)
              .filter(
                ([field, error]) => error && error.toString().trim() !== ""
              ) // Only show non-empty errors
              .map(([field, error]) => (
                <li key={field} className="flex items-center">
                  <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                  {error}
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Disaster Information */}
      <div className="bg-white shadow-xl rounded-2xl p-8 border border-slate-200 backdrop-blur-sm">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center">
          <span className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white text-lg">⚠️</span>
          </span>
          Disaster Information
        </h2>

        {/* Disaster Type */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-3 text-slate-700">
            Disaster Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {disasterTypes.map((type) => (
              <label
                key={type.id}
                className={`flex items-center gap-3 border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${
                  formData.disasterType === type.id
                    ? "border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg"
                    : errors.disasterType && touched.disasterType
                    ? "border-red-400 bg-gradient-to-r from-red-50 to-pink-50"
                    : "border-slate-300 bg-white hover:border-blue-300 hover:bg-blue-50"
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
                <span className="text-2xl">{type.icon}</span>
                <span className="font-medium text-slate-700">{type.name}</span>
              </label>
            ))}
          </div>
          {errors.disasterType && touched.disasterType && (
            <p className="text-red-500 text-sm mt-2 flex items-center">
              <span className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center mr-2">
                <span className="text-white text-xs">!</span>
              </span>
              {errors.disasterType}
            </p>
          )}
        </div>

        {/* Title */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-3 text-slate-700">
            Disaster Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="e.g., Heavy flooding in Colombo"
            className={`w-full border-2 rounded-xl p-4 transition-all duration-300 ${
              errors.title && touched.title
                ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            } focus:outline-none bg-white`}
          />
          {errors.title && touched.title && (
            <p className="text-red-500 text-sm mt-2 flex items-center">
              <span className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center mr-2">
                <span className="text-white text-xs">!</span>
              </span>
              {errors.title}
            </p>
          )}
          <p className="text-slate-500 text-xs mt-2 flex items-center">
            <span className="w-4 h-4 bg-slate-400 rounded-full flex items-center justify-center mr-2">
              <span className="text-white text-xs">i</span>
            </span>
            {formData.title ? formData.title.length : 0}/100 characters
          </p>
        </div>

        {/* Severity */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-3 text-slate-700">
            Severity Level <span className="text-red-500">*</span>
          </label>
          <select
            name="severity"
            value={formData.severity}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full border-2 rounded-xl p-4 transition-all duration-300 ${
              errors.severity && touched.severity
                ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            } focus:outline-none bg-white`}
          >
            <option value="">Select severity level</option>
            <option value="low">🟢 Low</option>
            <option value="medium">🟡 Medium</option>
            <option value="high">🔴 High</option>
          </select>
          {errors.severity && touched.severity && (
            <p className="text-red-500 text-sm mt-2 flex items-center">
              <span className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center mr-2">
                <span className="text-white text-xs">!</span>
              </span>
              {errors.severity}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-3 text-slate-700">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Provide detailed information about the disaster..."
            rows={4}
            className={`w-full border-2 rounded-xl p-4 transition-all duration-300 resize-none ${
              errors.description && touched.description
                ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            } focus:outline-none bg-white`}
          />
          {errors.description && touched.description && (
            <p className="text-red-500 text-sm mt-2 flex items-center">
              <span className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center mr-2">
                <span className="text-white text-xs">!</span>
              </span>
              {errors.description}
            </p>
          )}
          <p className="text-slate-500 text-xs mt-2 flex items-center">
            <span className="w-4 h-4 bg-slate-400 rounded-full flex items-center justify-center mr-2">
              <span className="text-white text-xs">i</span>
            </span>
            {formData.description ? formData.description.length : 0}/1000
            characters
          </p>
        </div>
      </div>

      {/* Image Upload Section */}
      <div className="bg-white shadow-xl rounded-2xl p-8 border border-slate-200 backdrop-blur-sm">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center">
          <span className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center mr-3">
            <Camera className="w-5 h-5 text-white" />
          </span>
          Disaster Images
        </h2>

        {/* Upload Area */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-3 text-slate-700">
            Upload Images (Max 5, 5MB each)
          </label>
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 transition-all duration-300 bg-gradient-to-br from-slate-50 to-blue-50 hover:from-blue-50 hover:to-indigo-50">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <p className="text-slate-700 mb-2 font-medium text-lg">
                Click to upload disaster images
              </p>
              <p className="text-sm text-slate-500">
                Supports JPG, PNG, GIF up to 5MB each
              </p>
            </label>
          </div>
        </div>

        {/* Image Previews */}
        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {imagePreviews.map((image) => (
              <div key={image.id} className="relative group">
                <div className="relative overflow-hidden rounded-xl border-2 border-slate-200 shadow-md transition-all duration-300 hover:shadow-xl">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-36 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-600 mt-2 truncate font-medium">
                  {image.name}
                </p>
              </div>
            ))}
          </div>
        )}

        {selectedImages.length > 0 && (
          <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-700 font-medium flex items-center">
              <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center mr-2">
                <span className="text-white text-xs">✓</span>
              </span>
              {selectedImages.length} image(s) selected
            </p>
          </div>
        )}
      </div>

      {/* Location Information */}
      <div className="bg-white shadow-xl rounded-2xl p-8 border border-slate-200 backdrop-blur-sm">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center">
          <span className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center mr-3">
            <MapPin className="w-5 h-5 text-white" />
          </span>
          Location Information
        </h2>

        {/* Location Description */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-3 text-slate-700">
            Location Description <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="locationDescription"
            value={formData.locationDescription}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="e.g., Colombo 07, near Manning Market"
            className={`w-full border-2 rounded-xl p-4 transition-all duration-300 ${
              errors.locationDescription && touched.locationDescription
                ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            } focus:outline-none bg-white`}
          />
          {errors.locationDescription && touched.locationDescription && (
            <p className="text-red-500 text-sm mt-2 flex items-center">
              <span className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center mr-2">
                <span className="text-white text-xs">!</span>
              </span>
              {errors.locationDescription}
            </p>
          )}
        </div>

        {/* Latitude & Longitude */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-semibold mb-3 text-slate-700">
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
              className={`w-full border-2 rounded-xl p-4 transition-all duration-300 ${
                errors.latitude && touched.latitude
                  ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                  : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              } focus:outline-none bg-white`}
            />
            {errors.latitude && touched.latitude && (
              <p className="text-red-500 text-sm mt-2 flex items-center">
                <span className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center mr-2">
                  <span className="text-white text-xs">!</span>
                </span>
                {errors.latitude}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold mb-3 text-slate-700">
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
              className={`w-full border-2 rounded-xl p-4 transition-all duration-300 ${
                errors.longitude && touched.longitude
                  ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                  : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              } focus:outline-none bg-white`}
            />
            {errors.longitude && touched.longitude && (
              <p className="text-red-500 text-sm mt-2 flex items-center">
                <span className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center mr-2">
                  <span className="text-white text-xs">!</span>
                </span>
                {errors.longitude}
              </p>
            )}
          </div>
        </div>

        {/* Current Location Button */}
        <button
          type="button"
          onClick={handleCurrentLocation}
          className="flex items-center gap-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 mb-6"
        >
          <MapPin className="w-5 h-5" />
          Use Current Location
        </button>

        {/* Google Map */}
        {formData.latitude && formData.longitude && (
          <div className="h-72 w-full rounded-2xl overflow-hidden border-2 border-slate-300 shadow-xl">
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
