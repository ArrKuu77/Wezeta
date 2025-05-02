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
      .list(userId + "/", {
        limit: 1,
        offset: 0,
        sortBy: { column: "created_at", order: "desc" },
      });
    if (data) {
      // console.log(data);
      setPhoto(data);
    } else {
      // console.log("getMedia", error);
    }
  };

  const getURL = () => {
    let url =
      import.meta.env.VITE_SITE_URL ??
      window?.location?.origin ??
      "http://localhost:3000";

    // Ensure protocol and trailing slash
    url = url.startsWith("http") ? url : `https://${url}`;
    return url.endsWith("/") ? url : `${url}/`;
  };

  const LoginUser = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // console.log(data, error);

      if (!error) {
        const { user } = data;

        // 🔍 Step 1: Check if user already exists
        const { data: existingUser, error: fetchError } = await supabase
          .from("user-data")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        // ⚠️ Handle fetch error (ignore 406 because it means "not found")
        if (fetchError && fetchError.code !== "PGRST116") {
          console.error("Error checking user existence:", fetchError);
          return { success: false, error: fetchError };
        }

        // ✅ If not found, insert new user
        if (!existingUser) {
          const { data: insertedUser, error: insertError } = await supabase
            .from("user-data")
            .insert({
              user_name: user.user_metadata.full_name,
              user_email: user.email,
              user_id: user.id,
            })
            .select()
            .single();

          if (insertedUser) {
            console.log("User data inserted successfully:", insertedUser);
            alert("User data inserted successfully");
          } else {
            console.error("Error inserting user data:", insertError);
            alert("Error inserting user data");
          }
        }

        return { success: true, data: data };
      } else {
        return { success: false, error: error.message };
      }
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
          data: { full_name: name, name: name },
        },
      });

      // console.log(data, error);

      if (!error) {
        const { user } = data;

        // 🔍 Step 1: Check if user already exists
        const { data: existingUser, error: fetchError } = await supabase
          .from("user-data")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        // ⚠️ Handle fetch error (ignore 406 because it means "not found")
        if (fetchError && fetchError.code !== "PGRST116") {
          console.error("Error checking user existence:", fetchError);
          return { success: false, error: fetchError };
        }

        // ✅ If not found, insert new user
        if (!existingUser) {
          const { data: insertedUser, error: insertError } = await supabase
            .from("user-data")
            .insert({
              user_name: user.user_metadata.full_name,
              user_email: user.email,
              user_id: user.id,
            })
            .select()
            .single();

          if (insertedUser) {
            // console.log("User data inserted successfully:", insertedUser);
            alert("User data inserted successfully");
          } else {
            console.error("Error inserting user data:", insertError);
            alert("Error inserting user data");
          }
        }

        return { success: true, data: data };
      } else {
        return { success: false, error: error.message };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  const LoginWithGoogle = async () => {
    try {
      const redirectUrl =
        import.meta.env.VITE_SITE_URL?.replace(/\/$/, "") ||
        window.location.origin;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${redirectUrl}/`,
        },
      });

      if (error) {
        console.error("Google login error:", error.message);
        alert("Failed to sign in with Google. Please try again.");
      }
    } catch (err) {
      console.error("Unexpected error during Google login:", err);
      alert("Something went wrong during Google sign-in.");
    }
  };

  const updateUserMetaPhoto = async (
    userPhoto,
    userChangeName,
    newPassword = null
  ) => {
    const updatePayload = {
      data: {
        avatar_url: userPhoto == undefined ? null : userPhoto,
        picture: userPhoto == undefined ? null : userPhoto,
        full_name: userChangeName,
        name: userChangeName,
      },
    };

    if (newPassword) {
      updatePayload.password = newPassword;
    }

    const { data, error } = await supabase.auth.updateUser(updatePayload);

    if (error) {
      return { success: false, error: error.message };
    } else {
      return { success: true, dataFet: data };
    }
  };

  const LogoutUser = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("Logout failed:", error.message);
    } else {
      alert("User signed out");
      // localStorage.removeItem("profilePhotoUPDExit");
      // optionally redirect
      // window.location.href = '/login';
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);

      if (session?.user) {
        const user = session.user;

        const { data: existingUser, error: fetchError } = await supabase
          .from("user-data")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!existingUser && !fetchError) {
          const { data: insertedUser, error: insertError } = await supabase
            .from("user-data")
            .insert({
              user_name: user.user_metadata.full_name,
              user_email: user.email,
              user_id: user.id,
            })
            .select()
            .single();

          if (insertedUser) {
            localStorage.setItem("profileCreated", "true");
            alert("Welcome! Your profile was created.");
          }
        }
      }
    };

    // Only run if user hasn't already seen welcome
    if (!localStorage.getItem("profileCreated")) {
      checkSession();
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        LogoutUser,
        updateUserMetaPhoto,
        googlePhoto,
        setGooglePhoto,
        photo,
        setPhoto,
        getMedia,
        setSession,
        LoginUser,
        SignUpUser,
        LoginWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
