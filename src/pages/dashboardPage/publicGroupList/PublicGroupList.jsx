import React, { useEffect, useState } from "react";
import { useAuth } from "../../../components/authComponent/context/AuthContext";
import { supabase } from "../../../../supabaseClient";
import SearchuserImage from "../searchUser/SearchuserImage";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { MdFolderDelete } from "react-icons/md";
import { FaUserEdit } from "react-icons/fa";
import { LuNotebookText } from "react-icons/lu";
import { FaSignOutAlt } from "react-icons/fa";

const GroupList = () => {
  const { session } = useAuth();
  const [groupList, setGroupList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all"); // all, creator, member
  const userId = session.user.id;

  const fetchGroups = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("public-saving-group-list-member")
      .select("*")
      .or(
        `group_creater.eq.${userId},group_members.cs.[${JSON.stringify(
          userId
        )}]`
      );

    if (error) {
      console.error("Error fetching group list:", error);
      setLoading(false);
      return;
    }

    // Get groups where the user is creator or member
    // const userGroups = data.filter(
    //   (group) =>
    //     group.group_creater === userId || group.group_members.includes(userId)
    // );

    // Apply filter
    let filteredGroups = data;
    if (filterType === "creator") {
      filteredGroups = data.filter((group) => group.group_creater === userId);
    } else if (filterType === "member") {
      filteredGroups = data.filter(
        (group) =>
          group.group_creater !== userId && group.group_members.includes(userId)
      );
    }

    // Extract unique user IDs
    const allMemberIds = [
      ...new Set(
        filteredGroups.flatMap((group) => [
          group.group_creater,
          ...group.group_members,
        ])
      ),
    ];

    const { data: userData, error: userError } = await supabase
      .from("user_data")
      .select("*")
      .in("user_id", allMemberIds);

    if (userError) {
      console.error("Error fetching user data:", userError);
      setLoading(false);
      return;
    }

    const enrichedGroups = filteredGroups.map((group) => {
      const creator = userData.find((u) => u.user_id === group.group_creater);
      const members = group.group_members.map((id) =>
        userData.find((u) => u.user_id === id)
      );
      return { ...group, creator, members };
    });

    setGroupList(enrichedGroups);
    setLoading(false);
  };

  useEffect(() => {
    fetchGroups();

    const subscription = supabase
      .channel("public-saving-group-list-member-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // can also be 'INSERT', 'UPDATE', 'DELETE'
          schema: "public",
          table: "public-saving-group-list-member",
        },
        (payload) => {
          // console.log("Realtime update:", payload);
          fetchGroups(); // Refetch data on any change
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [filterType]);
  const [btnLoading, setBtnLoading] = useState(false);
  const handleDestoryGroup = async (group) => {
    setBtnLoading(true);
    // console.log("delete", group);
    const { data, error } = await supabase
      .from("public-saving-group-list-member")
      .delete()
      .eq("id", group.id)
      .eq("group_id", group.group_id)
      .eq("group_name", group.group_name)
      .single();
    if (error) {
      console.log("Delete error:", error);
      toast.error("Failed to delete group");
    } else {
      // console.log("Delete success:", data);
      toast.success("Group deleted successfully");
    }
    setBtnLoading(false);
  };
  const handleLeaveGroup = async (group, userIdToLeave) => {
    // console.log("Group before leave:", group);
    // console.log("Group before leave:", userIdToLeave);

    const filteredMembers = group.group_members.filter(
      (member) => member !== userIdToLeave
    );
    // console.log(filteredMembers);

    // Update the group_members in the database for the specific group
    const { data, error } = await supabase
      .from("public-saving-group-list-member")
      .update({ group_members: filteredMembers })
      .eq("id", group.id)
      .eq("group_id", group.group_id)
      .eq("group_name", group.group_name)
      .single();

    if (error) {
      console.error("Failed to leave group:", error);
      // handle error UI, toast, etc.
      toast.error("Failed to leave group");
    } else {
      // console.log("Successfully left  group:", data);
      // handle success UI, toast, reload data, etc.
      toast.success(group.group_name + "Group leave successfully");
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto text-white">
      <h1 className="text-2xl font-bold mb-4 bg-gradient-to-t from-yellow-200 via-yellow-500 to-yellow-950 bg-clip-text text-transparent">
        Your Saving Groups
      </h1>

      {/* Filter Buttons */}
      <div className="flex  mb-6">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 rounded-lg bg-gray-800 text-yellow-300 border border-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
        >
          <option value="all">All Groups</option>
          <option value="creator">Created By You</option>
          <option value="member">Member Only</option>
        </select>
      </div>

      {/* Loading Spinner */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-yellow-500 text-lg font-semibold">
            Loading groups...
          </span>
        </div>
      ) : groupList.length > 0 ? (
        groupList.reverse().map((group) => (
          <div
            key={group.id}
            className="mb-8 p-6 rounded-xl bg-gray-900 text-yellow-300 shadow-lg border border-yellow-600"
          >
            <h2 className="text-2xl font-extrabold mb-4 border-b border-yellow-600 pb-2">
              {group.group_name} Group
            </h2>

            {/* Group Creator Info */}
            <div className="text-base mb-4">
              <p className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">Creator</span>
                {group.creator?.user_id === session.user.id ? (
                  <span className="bg-yellow-800/40 text-white px-3 py-1 rounded-full text-sm font-medium">
                    : You
                  </span>
                ) : (
                  <span className="text-yellow-200 font-medium ">
                    {group.creator?.user_name} ({group.creator?.user_email})
                  </span>
                )}
              </p>
            </div>

            {/* Member List */}
            <div className="overflow-x-auto rounded-lg border border-yellow-700 bg-gray-800">
              <table className="min-w-full text-sm sm:text-base text-left text-yellow-200">
                <thead className="bg-yellow-700 text-white">
                  <tr>
                    <th className="px-4 py-3">Avatar</th>
                    <th className="px-4 py-3">Name/Email</th>
                  </tr>
                </thead>
                <tbody>
                  {group.members.map((member, index) =>
                    member ? (
                      <tr
                        key={index}
                        className="border-t border-yellow-600 hover:bg-yellow-900/20 transition-colors"
                      >
                        <td className="px-1 py-2">
                          <div className="rounded-full">
                            <SearchuserImage
                              addDesign="md:w-[30%] md:h-[30%] !w-[80px] !h-[80px] rounded-full"
                              userId={member.user_id}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium">
                          <p>{member.user_name}</p>
                          <p>{member.user_email}</p>
                        </td>
                      </tr>
                    ) : null
                  )}
                </tbody>
              </table>
            </div>

            {/* Detail Button */}
            {btnLoading ? (
              <div className="flex justify-between items-center  ">
                {[1, 2, 3].map((_, index) => (
                  <div
                    key={index}
                    className="px-2 py-1 w-[30%] h-[36px] bg-gray-700 animate-pulse rounded-lg my-2"
                  ></div>
                ))}
              </div>
            ) : (
              <div className="flex justify-between items-center">
                {group?.creator?.user_id == session.user.id ? (
                  <button
                    onClick={() => handleDestoryGroup(group)}
                    className=" flex gap-1 items-center md:px-2 px-1 py-1 md:text-md text-sm bg-red-500 cursor-pointer border border-gray-600 text-white rounded-lg my-2"
                  >
                    Delete <MdFolderDelete />
                  </button>
                ) : (
                  <button
                    onClick={() => handleLeaveGroup(group, session.user.id)}
                    className=" flex gap-1 items-center md:px-2 px-1 py-1 md:text-md text-sm bg-red-500 cursor-pointer border border-gray-600 text-white rounded-lg my-2"
                  >
                    Leave <FaSignOutAlt />
                  </button>
                )}

                {group?.creator?.user_id == session.user.id && (
                  <Link to={`/public-group-list/edit-user`} state={group}>
                    <button className=" flex gap-1 items-center md:px-2 px-1 py-1 md:text-md text-sm bg-amber-700 cursor-pointer border border-gray-600 text-white rounded-lg my-2">
                      Edit
                      <FaUserEdit className=" text-xl" />
                    </button>
                  </Link>
                )}

                <Link
                  to={`/public-saving-group/public-saving-detail`}
                  state={group}
                >
                  <button className=" flex gap-1 items-center md:px-2 px-1 py-1 md:text-md text-sm bg-amber-700 cursor-pointer border border-gray-600 text-white rounded-lg my-2">
                    Detail Note
                    <LuNotebookText />
                  </button>
                </Link>
              </div>
            )}
          </div>
        ))
      ) : (
        <p className="text-yellow-500">You are not in any groups.</p>
      )}
    </div>
  );
};

export default GroupList;
