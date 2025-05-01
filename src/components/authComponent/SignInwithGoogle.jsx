import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import React, { useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import { supabase } from "../../../supabaseClient";
import { Navigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
const SignInwithGoogle = () => {
  const { session, setSession, LoginWithGoogle } = useAuth();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);
  // console.log(session);
  const LogoutFun = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("Error signing out:", error);
    } else {
      alert("Signed out successfully");
    }
    setSession(null);
  };

  return (
    <div>
      {!session ? (
        <div className=" w-[1/2] mx-auto ">
          {/* <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} /> */}
          <button
            className=" border border-gray-400 hover:border-gray-800 shadow-md shadow-blue-500/80 bg-gradient-to-br from-gray-600 via-gray-950 to-black cursor-pointer select-none w-full text-yellow-500 flex disabled:pointer-events-none disabled:opacity-80 justify-center items-center gap-3  hover:bg-gradient-to-br hover:from-black hover:via-gray-950 hover:to-gray-600  focus:ring-4 focus:outline-none focus:ring-neutral-300 font-medium rounded text-sm px-5 py-2.5 text-center dark:bg-neutral-600 dark:hover:bg-neutral-700 dark:focus:ring-neutral-800"
            onClick={LoginWithGoogle}
          >
            LoginWithGoogle
            <FcGoogle className="text-2xl" />
          </button>
        </div>
      ) : (
        <Navigate to="/" replace={true} />
      )}
    </div>
  );
};

export default SignInwithGoogle;
