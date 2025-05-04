import React, { useEffect, useState } from "react";
import { useAuth } from "../../../components/authComponent/context/AuthContext";
import { supabase } from "../../../../supabaseClient";
import SearchuserImage from "../searchUser/SearchuserImage";
import { v5 as uuidv5 } from "uuid";
import { Link } from "react-router-dom";

const UserInviters = () => {
  const { session } = useAuth();
  const [inviteUser, setInviteUser] = useState([]);
  const [loading, setLoading] = useState(false);
  const [acceptLoadingUserId, setAcceptLoadingUserId] = useState(null);

  const acceptUserFetch = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("create-group")
      .select("*")
      .eq("user_accept", session.user.id)
      .eq("exit_join", true);

    if (error) {
      console.error("Error fetching user data:", error.message);
      setLoading(false);
      return;
    }

    const { data: Inviter, error: InviterError } = await supabase
      .from("user-data")
      .select("*")
      .in(
        "user_id",
        data.map((item) => item.user_join)
      );

    if (InviterError) {
      console.error("Error fetching inviter data:", InviterError.message);
    } else {
      const mergedArray = Inviter.map((user) => {
        const match = data.find((item) => item.user_join === user.user_id);
        return match ? { ...user, ...match } : user;
      });
      setInviteUser(mergedArray);
    }

    setLoading(false);
  };

  const handleAcceptFunction = async (userJoinId) => {
    setAcceptLoadingUserId(userJoinId);
    const combinedString = session.user.id + userJoinId;
    const MY_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
    const group_id = uuidv5(combinedString, MY_NAMESPACE);

    const { error, data } = await supabase
      .from("create-group")
      .update({ exit_accept: true, group_id })
      .eq("user_accept", session.user.id)
      .eq("user_join", userJoinId)
      .eq("exit_join", true)
      .select()
      .single();

    if (error) {
      console.error("Error accepting user:", error.message);
    } else {
      console.log("User accepted successfully =>", data);
    }
    setAcceptLoadingUserId(null);
  };

  useEffect(() => {
    acceptUserFetch();

    const channel = supabase
      .channel("realtime-user-inviters")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "create-group",
          filter: `user_accept=eq.${session.user.id}`,
        },
        (payload) => {
          console.log("Realtime change:", payload);
          acceptUserFetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session.user.id]);

  return (
    <div className="p-4 max-w-xl mx-auto text-white">
      <h1 className="text-2xl font-bold mb-4 bg-gradient-to-t from-yellow-200 via-yellow-500 to-yellow-950 bg-clip-text text-transparent">
        User Inviter
      </h1>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-yellow-500 text-lg font-semibold">
            Loading, please wait...
          </span>
        </div>
      ) : inviteUser.length > 0 ? (
        inviteUser.map((user) => (
          <div
            key={user.id}
            className="flex justify-between items-center mb-2 p-3 border rounded bg-gray-900/50 text-yellow-500
            transition-all duration-500 ease-in-out hover:bg-gradient-to-br hover:from-gray-800 hover:via-gray-900 hover:to-black hover:scale-100 scale-90"
          >
            <div className="w-[15%]">
              <SearchuserImage userId={user.user_id} />
            </div>

            <div className="flex justify-between items-center w-[75%]">
              <div>
                <p>
                  <strong>Name:</strong> {user.user_name}
                </p>
                <p>
                  <strong>Email:</strong> {user.user_email}
                </p>
              </div>
              <div>
                {user.exit_accept ? (
                  <Link to={"/accept-group-list"}>
                    <button className="btn my-2 border-black border-2 text-black bg-gradient-to-b from-green-400 via-green-600 to-green-800">
                      <span className="flex justify-center items-center gap-3 font-semibold text-white">
                        <p>Saving Group</p>
                      </span>
                    </button>
                  </Link>
                ) : (
                  <button
                    onClick={() => handleAcceptFunction(user.user_id)}
                    disabled={acceptLoadingUserId === user.user_id}
                    className="btn my-2 border-black border-2 text-black bg-gradient-to-b from-yellow-400 via-yellow-600 to-yellow-800"
                  >
                    <span className="flex justify-center items-center gap-3 font-semibold text-white">
                      {acceptLoadingUserId === user.user_id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <p>Accepting...</p>
                        </>
                      ) : (
                        <p>Accept</p>
                      )}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="text-yellow-500">No users found.</p>
      )}
    </div>
  );
};

export default UserInviters;
