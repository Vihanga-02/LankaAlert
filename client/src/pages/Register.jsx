import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Lock, Eye, EyeOff, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', district: '', city: '',
    password: '', confirmPassword: '', smsSubscribed: true,
    farmerAlerts: false, fishermenAlerts: false, applyAsReporter: false,
    reporterOfficeId: '', reporterOfficeLocation: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const districts = [
    'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'NuwaraEliya',
    'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
    'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
    'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
    'Moneragala', 'Ratnapura', 'Kegalle'
  ];

  const districtCities = {
  Colombo: ["Colombo", "Homagama", "Awissawella", "Kaduwela", "Moratuwa","Maharagama","Kottawa"],
  Gampaha: ["Negombo", "Ja-Ela", "Wattala", "Kelaniya", "Ragama"],
  Kalutara: ["Kalutara", "Beruwala", "Panadura", "Horana", "Matugama"],
  Kandy: ["Kandy", "Peradeniya", "Gampola", "Akurana", "Kadugannawa"],
  Matale: ["Matale", "Dambulla", "Rattota", "Ukuwela"],
  NuwaraEliya: ["Nuwara Eliya", "Hatton", "Talawakele", "Ambewela"],
  Galle: ["Galle", "Hikkaduwa", "Ambalangoda", "Unawatuna", "Karapitiya"],
  Matara: ["Matara", "Dikwella", "Weligama", "Tangalle", "Kamburupitiya"],
  Hambantota: ["Hambantota", "Tissamaharama", "Bellanwila", "Weeraketiya"],
  Jaffna: ["Jaffna", "Chavakachcheri", "Point Pedro", "Nallur", "Tellippalai"],
  Kilinochchi: ["Kilinochchi", "Pooneryn", "Karachchi", "Elephant Pass"],
  Mannar: ["Mannar", "Musali", "Madhu", "Nanattan"],
  Vavuniya: ["Vavuniya", "Vavuniya North", "Vavuniya South", "Vavuniya Urban"],
  Mullaitivu: ["Mullaitivu", "Oddusuddan", "Puthukkudiyiruppu", "Maritimepattu"],
  Batticaloa: ["Batticaloa", "Kalmunai", "Eravur", "Kalkudah", "Manmunai"],
  Ampara: ["Ampara", "Kalmunai", "Samanthurai", "Padiyathalawa", "Uhana"],
  Trincomalee: ["Trincomalee", "Kinniya", "Muttur", "Verugal", "Seruwila"],
  Kurunegala: ["Kurunegala", "Maho", "Dambulla", "Alawwa", "Kuliyapitiya","Polgahawela"],
  Puttalam: ["Puttalam", "Chilaw", "Nawagathena", "Mannar", "Kalpitiya"],
  Anuradhapura: ["Anuradhapura", "Mihintale", "Padaviya", "Kebithigollewa", "Thalawa"],
  Polonnaruwa: ["Polonnaruwa", "Batticaloa", "Dimbulagala", "Lankapura", "Welikanda"],
  Badulla: ["Badulla", "Hali-Ela", "Ella", "Mahiyanganaya", "Passara"],
  Moneragala: ["Moneragala", "Buttala", "Bibile", "Medagama", "Kataragama"],
  Ratnapura: ["Ratnapura", "Balangoda", "Elapatha", "Kuruwita", "Embilipitiya"],
  Kegalle: ["Kegalle", "Deraniyagala", "Ruwanwella", "Mawanella", "Yatiyantota"]
};

const [availableCities, setAvailableCities] = useState([]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Handle district change to update available cities
    if (name === "district") {
      setAvailableCities(districtCities[value] || []);
      setFormData(prev => ({
        ...prev,
        district: value,
        city: ""
  }));
}
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?94\d{9}$|^0\d{9}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid Sri Lankan phone number';
    }
    
    if (!formData.district) {
      newErrors.district = 'District is required';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.applyAsReporter) {
  if (!formData.reporterOfficeId.trim()) {
    newErrors.reporterOfficeId = 'Work ID is required for reporter application';
  }
  if (!formData.reporterOfficeLocation.trim()) {
    newErrors.reporterOfficeLocation = 'District office is required for reporter application';
  }
}
   
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const result = await register(formData);
      if (result.success) {
        if (formData.applyAsReporter) {
          alert('Registration successful! Your reporter application has been submitted for review. You will receive an email once approved.');
        } else {
          alert('Registration successful! Welcome to Lanka Alert.');
        }
        navigate('/');
      } else {
        setErrors({ general: result.error || 'Registration failed. Please try again.' });
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <MapPin className="h-10 w-10 text-blue-600" />
            <span className="text-3xl font-bold text-blue-900">Lanka Alert</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in here
            </Link>
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {errors.general && (
              <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm">
                {errors.general}
              </div>
            )}

            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="+94 123 456 789"
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            {/* Location Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* District */}
              <div>
                <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-2">
                  District *
                </label>
                <select
                  id="district"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  className={`block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.district ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select District</option>
                  {districts.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
                {errors.district && (
                  <p className="mt-1 text-sm text-red-600">{errors.district}</p>
                )}
              </div>

             {/* City */}
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <select
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.city ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={!availableCities.length} // disable if no cities
                  >
                    <option value="">Select City</option>
                    {availableCities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                  )}
                </div>

            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-blue-900 mb-3">Notification Preferences</h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="smsSubscribed"
                    checked={formData.smsSubscribed}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Subscribe to SMS alerts for weather warnings</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="farmerAlerts"
                    checked={formData.farmerAlerts}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Receive specialized alerts for farmers</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="fishermenAlerts"
                    checked={formData.fishermenAlerts}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Receive specialized alerts for fishermen</span>
                </label>
              </div>
            </div>

            {/* Reporter Application */}
            <div className="bg-green-50 p-4 rounded-lg">
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  name="applyAsReporter"
                  checked={formData.applyAsReporter}
                  onChange={handleInputChange}
                  className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <div>
                  <span className="text-sm font-medium text-green-900 flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    Apply as Community Reporter
                  </span>
                  <p className="text-xs text-green-700 mt-1">
                    Available for district office workers and verified community members. 
                    Your application will be reviewed by our admin team.
                  </p>
                </div>
              </label>
            </div>

            {formData.applyAsReporter && (
  <div className="mt-4 space-y-4">
    {/* Reporter Office Work ID */}
    <div>
      <label htmlFor="reporterOfficeId" className="block text-sm font-medium text-gray-700 mb-1">
        Your District Office Work ID *
      </label>
      <input
        id="reporterOfficeId"
        name="reporterOfficeId"
        type="text"
        value={formData.reporterOfficeId}
        onChange={handleInputChange}
        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        placeholder="Enter your official ID"
      />
      {errors.reporterOfficeId && (
        <p className="mt-1 text-sm text-red-600">{errors.reporterOfficeId}</p>
      )}
    </div>

    {/* Reporter District Office */}
    <div>
      <label htmlFor="reporterOfficeLocation" className="block text-sm font-medium text-gray-700 mb-1">
        District Office Location *
      </label>
      <input
        id="reporterOfficeLocation"
        name="reporterOfficeLocation"
        type="text"
        value={formData.reporterOfficeLocation}
        onChange={handleInputChange}
        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        placeholder="Enter office location"
      />
      {errors.reporterOfficeLocation && (
        <p className="mt-1 text-sm text-red-600">{errors.reporterOfficeLocation}</p>
      )}
    </div>
  </div>
)}
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600 mt-6">
          <p>
            By creating an account, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:text-blue-500">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-blue-600 hover:text-blue-500">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;