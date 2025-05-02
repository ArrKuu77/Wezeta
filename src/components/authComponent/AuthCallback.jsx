// src/components/auth/AuthCallback.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../supabaseClient";
import { useAuth } from "./context/AuthContext";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { setSession } = useAuth();

  useEffect(() => {
    const handleRedirect = async () => {
      // Supabase handles OAuth tokens automatically and stores session
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Session fetch error:", error.message);
        alert("Login failed. Try again.");
        navigate("/login");
        return;
      }

      if (data.session) {
        setSession(data.session);
        navigate("/"); // Go to home or dashboard
      }
    };

    handleRedirect();
  }, [navigate, setSession]);

  return (
    <div className="flex items-center justify-center h-screen text-yellow-500 bg-black">
      <p className="text-lg animate-pulse">Logging you in with Google...</p>
    </div>
  );
};

export default AuthCallback;
