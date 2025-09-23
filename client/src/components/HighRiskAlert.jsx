import React, { useState } from 'react';
import { useWeatherAlertContext } from '../context/weatherAlertContext'; // Importing the context to get the alerts
import { UserService } from '../services/UserService'; // Importing the UserService to get all users
import { sendSms } from '../services/smsService'; // Importing the SMS sending function
import { CloudRain, Wind, Sun, Thermometer, AlertTriangle } from 'lucide-react'; // Importing icons for weather types

const HighRiskAlerts = () => {
  const { alerts } = useWeatherAlertContext(); // Get alerts from context

  // Filter to get all high-risk weather alerts
  const highRiskAlerts = alerts.filter(alert => alert.dangerLevel === "High Risk");

  // Form state
  const [showPopup, setShowPopup] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString(),
    city: '',
    alertType: '',
    message: '',
  });

  // Function to return the appropriate icon based on the alert type
  const getAlertIcon = (type) => {
    switch (type) {
      case "Flood":
        return <CloudRain className="h-6 w-6 text-blue-500" />;
      case "Wind":
        return <Wind className="h-6 w-6 text-green-500" />;
      case "Temperature":
        return <Thermometer className="h-6 w-6 text-yellow-500" />;
      case "UV":
        return <Sun className="h-6 w-6 text-orange-500" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-red-500" />;
    }
  };

  // Handle popup form data
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Show the popup and pre-fill the form fields
  const openPopup = (alert) => {
    setFormData({
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      city: alert.cityName,
      alertType: alert.type,
      message: alert.message,
    });
    setShowPopup(true);
  };

  // Function to handle sending the alert
  const handleSendAlert = async () => {
    // Get all users from UserService
    const users = await UserService.getAllUsers();

    // Filter users by city and if they are subscribed to SMS
    const usersToNotify = users.filter(
      (user) => user.smsSubscribed && user.city === formData.city
    );

    const formattedMessage = `
    Date: ${formData.date}
  Time: ${formData.time}
  Alert Type: ${formData.alertType} Threat
  City: ${formData.city}\n
  Message: ${formData.message}
  `;

    // Sending SMS to each user
    let usersNotified = 0;
    for (const user of usersToNotify) {
      const success = await sendSms(user.phone, formattedMessage);
      if (success) {
        usersNotified += 1;
      }
    }

    // Close popup and show the confirmation
    setShowPopup(false);
    alert(`${usersNotified} messages sent successfully.`);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">High-Risk Weather Alerts</h1>

      {/* Display high-risk weather alerts */}
      {highRiskAlerts.length === 0 ? (
        <p className="text-gray-500">No high-risk weather alerts at the moment.</p>
      ) : (
        highRiskAlerts.map((alert) => (
          <div key={alert.id} className="bg-red-100 p-4 rounded-lg shadow-md mb-4">
            <div className="flex items-center space-x-3">
              {getAlertIcon(alert.type)} {/* Display the appropriate icon */}
              <h3 className="text-lg font-semibold text-gray-700">{alert.cityName}</h3>
            </div>
            <p className="text-sm text-gray-600 mt-2">{alert.message}</p>
            <button
              onClick={() => openPopup(alert)}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none"
            >
              Send Alert
            </button>
          </div>
        ))
      )}

      {/* Popup for sending the alert */}
      {showPopup && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Send Alert</h2>
            
            {/* Form fields for date, time, city, alert type, and message */}
            <div className="mb-4">
              <label htmlFor="date" className="block text-sm text-gray-600">Date</label>
              <input
                type="text"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md"
                disabled
              />
            </div>

            <div className="mb-4">
              <label htmlFor="time" className="block text-sm text-gray-600">Time</label>
              <input
                type="text"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md"
                disabled
              />
            </div>

            <div className="mb-4">
              <label htmlFor="city" className="block text-sm text-gray-600">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md"
                disabled
              />
            </div>

            <div className="mb-4">
              <label htmlFor="alertType" className="block text-sm text-gray-600">Alert Type</label>
              <input
                type="text"
                name="alertType"
                value={formData.alertType}
                onChange={handleChange}
                className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md"
                disabled
              />
            </div>

            <div className="mb-4">
              <label htmlFor="message" className="block text-sm text-gray-600">Message</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md"
                rows="4"
                disabled
              ></textarea>
            </div>

            <div className="flex justify-between">
              <button
                onClick={handleSendAlert}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Send
              </button>
              <button
                onClick={() => setShowPopup(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HighRiskAlerts;
