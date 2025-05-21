import React, { useEffect, useState } from "react";
import { useAuth } from "../../../components/authComponent/context/AuthContext";
import { supabase } from "../../../../supabaseClient";
import SearchuserImage from "../searchUser/SearchuserImage";
import { RiMoneyDollarCircleFill } from "react-icons/ri";
import { Link, useNavigate } from "react-router-dom";
import UseOnlyAlartBox from "./useOnlyAlartBox";

const AcceptGroupList = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const navigate = useNavigate();

  const [groupData, setGroupData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchGroups = async () => {
    try {
      setLoading(true);

      const { data: rawGroups, error: groupError } = await supabase
        .from("create-group")
        .select("*")
        .or(`user_join.eq.${userId},user_accept.eq.${userId}`)
        .eq("exit_accept", true);

      if (groupError) throw groupError;

      if (!rawGroups.length) {
        setGroupData([]);
        setLoading(false);
        return;
      }

      const userIds = [
        ...new Set(rawGroups.flatMap((g) => [g.user_join, g.user_accept])),
      ];

      const { data: users, error: userError } = await supabase
        .from("user-data")
        .select("*")
        .in("user_id", userIds);

      if (userError) throw userError;

      const userMap = Object.fromEntries(
        users.map((user) => [user.user_id, user])
      );

      const enrichedGroups = rawGroups.map((group) => ({
        ...group,
        user_join_data: userMap[group.user_join],
        user_accept_data: userMap[group.user_accept],
      }));

      setGroupData(enrichedGroups);
    } catch (error) {
      console.error("Error loading group data:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();

    const channel = supabase
      .channel("realtime-accept-groups")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "create-group" },
        (payload) => {
          const row = payload.new || payload.old;
          if (row?.user_join === userId || row?.user_accept === userId) {
            fetchGroups();
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId]);

  const hasPrivateGroup = groupData.some((g) => g.group_id === userId);

  const handleCreateClick = () => setShowConfirm(true);
  const handleCancel = () => setShowConfirm(false);

  const handleConfirm = async () => {
    setShowConfirm(false);
    const { error } = await supabase.from("create-group").insert({
      user_join: userId,
      user_accept: userId,
      exit_join: true,
      exit_accept: true,
      group_id: userId,
    });

    if (error) alert(error.message);
  };

  const renderUserCard = (label, user) => (
    <div className="flex flex-col-reverse md:flex-row items-center gap-4 w-full sm:w-[35%]">
      <div className="size-20 sm:size-24">
        <SearchuserImage
          userId={user?.user_id}
          addDesign="w-full h-full object-cover rounded-full"
        />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-gray-400">
          {label}
        </p>
        <p className="text-sm font-semibold text-yellow-400 group-hover:text-yellow-300 transition">
          {user?.user_name || "Unknown"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 w-full">
        {/* Create Private Group Section */}
        {!loading && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-900 border border-yellow-600 rounded-xl p-6 shadow-lg mb-8">
            <p className="text-yellow-300 text-lg font-medium">
              {hasPrivateGroup
                ? "You have a private chart"
                : "🔒 Saving private chart"}
            </p>
            {!hasPrivateGroup && (
              <button
                onClick={handleCreateClick}
                className=" cursor-pointer bg-gradient-to-r from-yellow-400 via-yellow-600 to-yellow-800 text-black font-semibold px-6 py-2 rounded-xl shadow hover:brightness-110 transition duration-200"
              >
                ➕ Create
              </button>
            )}
          </div>
        )}

        {/* Title Section */}
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-t from-yellow-200 via-yellow-500 to-yellow-950 bg-clip-text text-transparent mb-2">
            Saving Groups
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            View all your saved groups and their members
          </p>
        </div>

        {/* Confirm Modal */}
        {showConfirm && (
          <UseOnlyAlartBox
            handleCancel={handleCancel}
            handleConfirm={handleConfirm}
          />
        )}

        {/* Loading Placeholder */}
        {loading ? (
          <div className="flex flex-col gap-4">
            {[...Array(3)].map((_, idx) => (
              <div
                key={idx}
                className="mx-auto w-full max-w-3xl bg-gray-800 rounded-md border border-yellow-500 p-4 animate-pulse"
              >
                <div className="flex space-x-4">
                  <div className="size-10 sm:size-16 rounded-full bg-gray-700" />
                  <div className="flex-1 space-y-3 py-1">
                    <div className="h-2 bg-gray-700 rounded w-1/2" />
                    <div className="h-2 bg-gray-700 rounded w-3/4" />
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
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-4 shadow-lg hover:shadow-2xl group hover:scale-[1.02] transition-all duration-300"
              >
                <div className="flex sm:w-[70%] sm:justify-evenly">
                  {group.user_join === group.user_accept ? (
                    renderUserCard("Your private chart", group.user_accept_data)
                  ) : (
                    <>
                      {renderUserCard("Joined by", group.user_join_data)}
                      {renderUserCard("Accepted by", group.user_accept_data)}
                    </>
                  )}
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
