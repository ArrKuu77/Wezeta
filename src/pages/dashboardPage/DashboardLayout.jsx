import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

const DashboardLayout = () => {
  return (
    <>
      {/* Sticky Navbar */}
      <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-md shadow-md">
        <Navbar />
      </nav>

      {/* Main content */}
      <main className="min-h-screen bg-gray-950 text-yellow-400">
        <div className="w-11/12 mx-auto py-6">
          <Outlet />
        </div>
      </main>
    </>
  );
};

export default DashboardLayout;
