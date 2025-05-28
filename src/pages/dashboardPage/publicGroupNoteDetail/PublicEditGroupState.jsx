import React, { useState } from "react";
import SearchuserImage from "../searchUser/SearchuserImage";
import { supabase } from "../../../../supabaseClient";
import { useAuth } from "../../../components/authComponent/context/AuthContext";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const PublicEditGroupState = ({ group, setStep, addUserList }) => {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const addUserGroup = async () => {
    setLoading(true);

    const group_members = addUserList.map((user) => user.user_id);
    // console.log(group_members, group);

    const { data, error } = await supabase
      .from("public-saving-group-list-member")
      .update({ group_members })
      .eq("id", group.id)
      .eq("group_id", group.group_id)
      .eq("group_name", group.group_name)
      .single();

    if (error) {
      console.error("Failed to leave group:", error);
      // handle error UI, toast, etc.
      toast.error("Failed to leave group");
    } else {
      console.log("Successfully add user  group:", data);
      // handle success UI, toast, reload data, etc.
      toast.success(group.group_name + "Add user successfully");
      nav("/public-group-list");
    }
    setLoading(false);
  };

  return (
    <div className="bg-gray-900 p-6 rounded-2xl shadow-lg">
      <div className=" mb-5  flex  items-center">
        <button
          onClick={() => {
            setStep(2);
          }}
          className="  px-4 py-2  rounded-xl bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black font-bold hover:scale-105 hover:shadow-xl transition-all"
        >
          Back Step
        </button>
      </div>
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-xl font-semibold text-yellow-300">Group Name:</h1>
        <h2 className="text-2xl text-white font-bold">{group.group_name}</h2>
      </div>
      <div>
        <h1 className=" text-md  ">Group Member List</h1>
      </div>

      <div className="overflow-x-auto rounded-xl">
        <table className="min-w-full table-auto text-sm text-left text-gray-300">
          <thead className="bg-gray-800 text-yellow-400 uppercase">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3 text-center">Profile</th>
              <th className="px-4 py-3">Name/Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {addUserList.map((user, index) => (
              <tr
                key={user.id}
                className="hover:bg-gray-800 transition duration-200 bg-gray-700"
              >
                <td className="px-4 py-3">{index + 1}</td>
                <td className="px-4 py-3">
                  <div className=" flex   ">
                    <SearchuserImage
                      addDesign={
                        " md:w-[30%] md:h-[30%] sm:w-[80%] sm-[80%] rounded-full"
                      }
                      userId={user.user_id}
                    />
                  </div>
                </td>
                <td className="px-4 py-3   text-nowrap font-medium text-white">
                  <p className=" block">{user.user_name}</p>
                  <p>{user.user_email}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {addUserList.length > 0 && (
        <div className=" mt-5  flex justify-end items-center">
          <button
            disabled={loading}
            onClick={() => addUserGroup()}
            className=" scale-90 cursor-pointer px-4 py-2  rounded-xl bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black font-bold hover:scale-100 hover:shadow-xl transition-all"
          >
            {loading ? <span>Adding ...</span> : <span>Adduser Group</span>}
          </button>
        </div>
      )}
    </div>
  );
};

export default PublicEditGroupState;
