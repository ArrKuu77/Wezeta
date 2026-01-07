// src/components/auth/AuthCallback.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../supabaseClient";
import { useAuth } from "./context/AuthContext";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { setSession } = useAuth();

  useEffect(() => {
    const handleOAuth = async () => {
      // 🔥 REQUIRED for OAuth
      const { data, error } = await supabase.auth.exchangeCodeForSession(
        window.location.href
      );

      if (error) {
        console.error("OAuth error:", error.message);
        navigate("/login", { replace: true });
        return;
      }

      setSession(data.session);
      navigate("/", { replace: true });
    };

    handleOAuth();
  }, [navigate, setSession]);

  return (
    <div className="flex items-center justify-center h-screen text-yellow-500 bg-black">
      <p className="text-lg animate-pulse">Logging you in with Google...</p>
    </div>
  );
};

export default AuthCallback;
