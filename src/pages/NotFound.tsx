import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">404 - Page Not Found</h1>
      <p className="text-gray-600 mb-6">Oops! The page you are looking for does not exist.</p>
      <Link to="/" className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600">
        Go Home
      </Link>
    </div>
  );
};

export default NotFound;
