import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { supabase } from "../../../supabaseClient";
import { useAuth } from "./context/AuthContext";

const SignInWithGoogle = () => {
  const { session, setSession, LoginWithGoogle } = useAuth();

  useEffect(() => {
    // Load session on mount
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };

    loadSession();

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [setSession]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("Error signing out: " + error.message);
    } else {
      alert("Signed out successfully");
      setSession(null);
    }
  };

  if (session) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="max-w-md mx-auto mt-12 px-4">
      <button
        onClick={LoginWithGoogle}
        className="w-full flex items-center justify-center gap-3 border border-gray-400 hover:border-gray-800 shadow-md shadow-blue-500/80 bg-gradient-to-br from-gray-600 via-gray-950 to-black hover:from-black hover:via-gray-950 hover:to-gray-600 text-yellow-500 font-medium rounded text-sm px-5 py-2.5 focus:ring-4 focus:outline-none focus:ring-neutral-300 dark:bg-neutral-600 dark:hover:bg-neutral-700 dark:focus:ring-neutral-800"
      >
        Login with Google <FcGoogle className="text-2xl" />
      </button>
    </div>
  );
};

export default SignInWithGoogle;
