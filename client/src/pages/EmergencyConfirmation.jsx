import React from "react";
import { useLocation, Link } from "react-router-dom";

const Confirmation = () => {
  const location = useLocation();
  const { docId } = location.state || {};

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow rounded-lg mt-8 text-center">
      <h2 className="text-2xl font-bold text-green-600 mb-4">
        ✅ Request Submitted Successfully!
      </h2>
      <p className="text-gray-700 mb-4">
        Thank you for submitting your emergency request. Our team has received
        your details and will respond as quickly as possible.
      </p>

      {docId && (
        <p className="text-gray-900 font-semibold mb-6">
          📌 Your Reference ID:{" "}
          <span className="text-blue-600">{docId}</span>
        </p>
      )}

      <Link
        to="/"
        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
};

export default Confirmation;
