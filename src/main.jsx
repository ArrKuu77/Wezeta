import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
// import App from './App.jsx'
// import authRoute from "./routes/authRouters.jsx";
import router from "./routes/router.jsx";
import { RouterProvider } from "react-router-dom";
import { AuthContextProvider } from "./components/authComponent/context/AuthContext";
import { Toaster } from "react-hot-toast";
createRoot(document.getElementById("root")).render(
  <AuthContextProvider>
    <RouterProvider router={router} />
    <Toaster position="top-right" reverseOrder={false} />
  </AuthContextProvider>
);
