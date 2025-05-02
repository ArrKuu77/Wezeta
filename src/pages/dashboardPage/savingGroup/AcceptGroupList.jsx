import React, { useEffect, useState } from "react";
import { useAuth } from "../../../components/authComponent/context/AuthContext";
import { supabase } from "../../../../supabaseClient";
import SearchuserImage from "../searchUser/SearchuserImage";
import { RiMoneyDollarCircleFill } from "react-icons/ri";
import { Link } from "react-router-dom";

const AcceptGroupList = () => {
  const { session } = useAuth();
  const [groupData, setGroupData] = useState([]);

  const groupFetchFunction = async () => {
    try {
      const { data: groupData, error: groupError } = await supabase
        .from("create-group")
        .select("*")
        .or(`user_join.eq.${session.user.id},user_accept.eq.${session.user.id}`)
        .eq("exit_accept", true);

      if (groupError) {
        console.error("Error fetching group data:", groupError);
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
    } catch (error) {
      console.error("Unexpected error:", error);
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
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Page Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-t from-yellow-200 via-yellow-500 to-yellow-950 bg-clip-text text-transparent mb-2">
          Saving Groups
        </h1>
        <p className="text-gray-400 text-sm md:text-base">
          View all your saved groups and their members
        </p>
      </div>

      {/* Group List */}
      <div className="flex flex-col gap-6">
        {groupData.map((group) => (
          <div
            key={group.id}
            className="flex items-center justify-around bg-gradient-to-br from-gray-900 to-gray-800 
            rounded-2xl p-4 shadow-lg hover:shadow-2xl transition-all duration-300 group hover:scale-[1.02]"
          >
            {/* User Join */}
            <div className="flex items-center gap-4 w-[35%]">
              <div className="size-24">
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

            {/* User Accept */}
            <div className="flex items-center gap-4 w-[35%]">
              <div className="size-24">
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

            {/* Action */}
            <div className="h-full flex justify-center items-center">
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
    </div>
  );
};

export default AcceptGroupList;
