// App.jsx
import { Auth } from "@supabase/auth-ui-react";
import { useEffect, useState } from "react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createClient } from "@supabase/supabase-js";
// import "./App.css";

// ✅ Create the Supabase client **outside** the component
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function App() {
  const [session, setSession] = useState(null);

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
  // const LoginFun = async () => {
  //   const { error } = await supabase.auth.signInWithOAuth({
  //     provider: "google",
  //   });
  //   if (error) {
  //     alert("Error signing in:", error);
  //   } else {
  //     alert("Signed in successfully");
  //   }
  // };
  return (
    <div>
      {!session ? (
        <div className=" w-[1/2] mx-auto mt-10">
          <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} />
          {/* <button onClick={LoginFun}>Login</button> */}
        </div>
      ) : (
        <div>
          <h1>Logged in! </h1>
          <button onClick={LogoutFun}>Logout</button>
        </div>
      )}
    </div>
  );
}

export default App;
