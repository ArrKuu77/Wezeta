import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../../../../supabaseClient";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(undefined);
  const [photo, setPhoto] = useState(null);
  const [googlePhoto, setGooglePhoto] = useState(null);

  const getMedia = async (userId) => {
    const { data, error } = await supabase.storage
      .from("user-photo")
      .list(`${userId}/`, {
        limit: 1,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (data) setPhoto(data);
    else console.warn("Storage fetch error:", error);
  };

  // 🟢 Load session and subscribe to auth changes
  useEffect(() => {
    const loadSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error || !session) {
          setSession(null);
          localStorage.removeItem("profileCreated");
        } else {
          setSession(session);
        }
      } catch (err) {
        console.error("Session fetch failed:", err.message);
        setSession(null);
        localStorage.removeItem("profileCreated");
      }
    };

    loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session) {
          localStorage.removeItem("profileCreated");
        }
        setSession(session);
      }
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

  // 🔁 Auto-insert new user into 'user-data' table
  useEffect(() => {
    const checkAndInsertUser = async () => {
      if (!session?.user || localStorage.getItem("profileCreated")) return;

      const user = session.user;

      const { data: existingUser, error: fetchError } = await supabase
        .from("user_data")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!existingUser && !fetchError) {
        const { data: insertedUser, error: insertError } = await supabase
          .from("user_data")
          .insert({
            user_name: user.user_metadata?.full_name,
            user_email: user.email,
            user_id: user.id,
          })
          .select()
          .single();

        if (insertedUser) {
          localStorage.setItem("profileCreated", "true");
          alert("Welcome! Your profile was created.");
        } else {
          console.error("Insert error:", insertError);
        }
      }
    };

    checkAndInsertUser();
  }, [session]);

  const getURL = () => {
    let url = import.meta.env.VITE_SITE_URL || window.location.origin;
    return url.endsWith("/") ? url : `${url}/`;
  };

  const LoginUser = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { success: false, error: error.message };

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const SignUpUser = async (email, password, name) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name, name },
        },
      });

      if (error) return { success: false, error: error.message };

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const LoginWithGoogle = async () => {
    try {
      const redirectTo = `${getURL()}auth/callback`;
      // console.log("Redirect URL:", redirectTo);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (error) throw error;
    } catch (err) {
      console.error("Google login failed:", err.message);
      alert("Google login failed.");
    }
  };

  const updateUserMetaPhoto = async (
    userPhoto,
    userChangeName,
    newPassword = null
  ) => {
    const payload = {
      data: {
        avatar_url: userPhoto || null,
        picture: userPhoto || null,
        full_name: userChangeName,
        name: userChangeName,
      },
    };

    if (newPassword) payload.password = newPassword;

    const { data, error } = await supabase.auth.updateUser(payload);
    return error
      ? { success: false, error: error.message }
      : { success: true, data };
  };

  const LogoutUser = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("Logout failed: " + error.message);
    } else {
      alert("User signed out.");
      localStorage.removeItem("profileCreated");
      setSession(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        setSession,
        photo,
        setPhoto,
        googlePhoto,
        setGooglePhoto,
        getMedia,
        LoginUser,
        SignUpUser,
        LoginWithGoogle,
        updateUserMetaPhoto,
        LogoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
