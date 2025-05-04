import React, { useEffect, useState } from "react";
import { useAuth } from "../../../components/authComponent/context/AuthContext";
import { supabase } from "../../../../supabaseClient";
import SearchuserImage from "../searchUser/SearchuserImage";
import { RiMoneyDollarCircleFill } from "react-icons/ri";
import { Link } from "react-router-dom";

const AcceptGroupList = () => {
  const { session } = useAuth();
  const [groupData, setGroupData] = useState([]);
  const [loading, setLoading] = useState(true); // 👈 Add loading state

  const groupFetchFunction = async () => {
    try {
      setLoading(true); // 👈 Start loading

      const { data: groupData, error: groupError } = await supabase
        .from("create-group")
        .select("*")
        .or(`user_join.eq.${session.user.id},user_accept.eq.${session.user.id}`)
        .eq("exit_accept", true);

      if (groupError) {
        console.error("Error fetching group data:", groupError);
        setLoading(false);
        return;
      }

      if (groupData.length > 0) {
        const userIds = [
          ...new Set(
            groupData.flatMap((item) => [item.user_join, item.user_accept])
          ),
        ];

        const { data: userData, error: userError } = await supabase
          .from("user-data")
          .select("*")
          .in("user_id", userIds);

        if (userError) {
          console.error("Error fetching user data:", userError);
          setLoading(false);
          return;
        }

        const userMap = {};
        userData.forEach((user) => {
          userMap[user.user_id] = user;
        });

        const enrichedGroupData = groupData.map((group) => ({
          ...group,
          user_join_data: userMap[group.user_join] || null,
          user_accept_data: userMap[group.user_accept] || null,
        }));

        setGroupData(enrichedGroupData);
      } else {
        setGroupData([]);
      }

      setLoading(false); // 👈 End loading
    } catch (error) {
      console.error("Unexpected error:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    groupFetchFunction();

    const channel = supabase
      .channel("realtime-accept-groups")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "create-group",
        },
        (payload) => {
          const row = payload.new || payload.old;
          if (
            row?.user_join === session.user.id ||
            row?.user_accept === session.user.id
          ) {
            console.log("Realtime update triggered:", payload);
            groupFetchFunction();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session.user.id]);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 w-full">
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-t from-yellow-200 via-yellow-500 to-yellow-950 bg-clip-text text-transparent mb-2">
            Saving Groups
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            View all your saved groups and their members
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col gap-4">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="mx-auto w-full max-w-3xl bg-gradient-to-br from-gray-900 to-gray-800  rounded-md border border-yellow-500 p-4"
              >
                <div className="flex animate-pulse space-x-4">
                  <div className="size-10 sm:size-16 rounded-full bg-gray-700"></div>
                  <div className="flex-1 space-y-6 py-1">
                    <div className="h-2 rounded bg-gray-700 w-1/2"></div>
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 h-2 rounded bg-gray-700"></div>
                        <div className="col-span-1 h-2 rounded bg-gray-700"></div>
                      </div>
                      <div className="h-2 rounded bg-gray-700"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : groupData.length === 0 ? (
          <div className="text-center text-gray-400">No groups found.</div>
        ) : (
          <div className="flex flex-col gap-6">
            {groupData.map((group) => (
              <div
                key={group.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-gradient-to-br from-gray-900 to-gray-800 
                rounded-2xl p-4 shadow-lg hover:shadow-2xl transition-all duration-300 group hover:scale-[1.02]"
              >
                <div className="flex sm:w-[70%] sm:justify-evenly">
                  <div className="flex flex-col-reverse md:flex-row items-center gap-4 w-full sm:w-[35%]">
                    <div className="size-20 sm:size-24">
                      <SearchuserImage
                        userId={group.user_join_data?.user_id}
                        addDesign="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-400">
                        Joined by
                      </p>
                      <p className="text-sm font-semibold text-yellow-400 group-hover:text-yellow-300 transition">
                        {group.user_join_data?.user_name || "Unknown"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse md:flex-row items-center gap-4 w-full sm:w-[35%]">
                    <div className="size-20 sm:size-24">
                      <SearchuserImage
                        userId={group.user_accept_data?.user_id}
                        addDesign="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-400">
                        Accepted by
                      </p>
                      <p className="text-sm font-semibold text-yellow-400 group-hover:text-yellow-300 transition">
                        {group.user_accept_data?.user_name || "Unknown"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="w-full sm:w-auto flex justify-center items-center sm:justify-end">
                  <Link to={`/saving-group/saving-detail`} state={group}>
                    <button className="font-bold flex items-center justify-center gap-2 bg-gradient-to-b px-4 py-2 rounded-xl border-black border-2 cursor-pointer h-10 from-yellow-300 via-yellow-600 to-yellow-800">
                      <RiMoneyDollarCircleFill className="text-white text-2xl" />
                      <span>Daily Note</span>
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AcceptGroupList;
