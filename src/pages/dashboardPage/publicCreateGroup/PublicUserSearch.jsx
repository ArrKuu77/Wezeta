import React, { useRef, useState } from "react";
import { supabase } from "../../../../supabaseClient";
import SearchuserImage from "../searchUser/SearchuserImage";
import { IoIosPersonAdd } from "react-icons/io";
import { VscLoading } from "react-icons/vsc";
import { IoPersonRemove } from "react-icons/io5";
import { RiUserSearchFill } from "react-icons/ri";
import { useAuth } from "../../../components/authComponent/context/AuthContext";

const PublicUserSearch = ({
  addUserListFun,
  groupName,
  addUserList,
  setAddUserList,
  setStep,
}) => {
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const searchRef = useRef();
  const { session } = useAuth();

  const handleUserSearch = async (e) => {
    e.preventDefault();
    const term = searchRef.current.value.trim();
    if (!term) return alert("Please fill email or user name!");
    if (term.charAt(0) === "@") return alert("Please check your email");

    setSearching(true);
    const searchValue = `%${term}%`;

    const { data: users, error } = await supabase
      .from("user_data")
      .select("*")
      .or(`user_name.ilike.${searchValue},user_email.ilike.${searchValue}`);

    if (error) {
      console.error(error.message);
      setSearching(false);
      return;
    }

    setSearchResults(users);
    setSearching(false);
  };

  const isUserAdded = (userId) => addUserList.some((u) => u.id === userId);

  return (
    <div className="bg-gray-900 p-6 rounded-2xl shadow-lg">
      <div className=" mb-5  flex  items-center">
        <button
          onClick={() => {
            setStep(1);
            setAddUserList([]);
          }}
          className="  px-4 py-2  rounded-xl bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black font-bold hover:scale-105 hover:shadow-xl transition-all"
        >
          Back Step
        </button>
      </div>
      <h2 className="text-xl font-semibold text-yellow-300 mb-4 flex md:flex-row flex-col gap-3">
        <span>Add Members to</span>{" "}
        <span className="text-white">{groupName}</span>
      </h2>

      <form onSubmit={handleUserSearch} className="flex gap-2 mb-4">
        <input
          ref={searchRef}
          type="text"
          placeholder="Search by username or email"
          className="flex-1 px-4 py-2 rounded-xl bg-gray-800 text-white border border-gray-700 focus:ring-2 focus:ring-yellow-400"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-yellow-500 text-black font-semibold hover:scale-105 hover:shadow-lg transition"
        >
          {searching ? (
            <VscLoading className="animate-spin" />
          ) : (
            <div>
              <span className="text-sm text-nowrap md:block hidden">
                user search
              </span>
              <span className="text-sm md:hidden block">
                <RiUserSearchFill />
              </span>
            </div>
          )}
        </button>
      </form>

      {searchResults.length > 0 ? (
        <div className="space-y-2">
          {searchResults.map(
            (user) =>
              user.user_id !== session.user.id && (
                <div
                  key={user.id}
                  className="group flex-col md:flex-row flex justify-between items-center mb-2 p-3 border rounded bg-gray-900/50 text-yellow-500 hover:bg-gradient-to-br hover:from-gray-800 hover:via-gray-900 hover:to-black hover:scale-100 scale-90 transition-all duration-300"
                >
                  <div className="md:w-[15%] w-[40%]">
                    <SearchuserImage userId={user.user_id} />
                  </div>

                  <div className="flex md:flex-row flex-col justify-between items-end w-[75%]">
                    <div>
                      <p>
                        <strong>Name:</strong> {user.user_name}
                      </p>
                      <p>
                        <strong>Email</strong> {user.user_email}
                      </p>
                    </div>

                    <div className=" bg-gray-600 p-1 rounded-md">
                      {isUserAdded(user.id) ? (
                        <div onClick={() => addUserListFun(user, "minusList")}>
                          <p className="cursor-pointer">
                            <IoPersonRemove size={24} />
                          </p>
                        </div>
                      ) : (
                        <div
                          onClick={() => addUserListFun(user, "addList")}
                          className="cursor-pointer"
                        >
                          <p>
                            <IoIosPersonAdd size={24} />
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
          )}
        </div>
      ) : (
        <p className="text-gray-400 text-sm">
          No users found or search for a member.
        </p>
      )}
      {addUserList.length > 0 && (
        <div className=" mt-5  flex justify-end items-center">
          <button
            onClick={() => setStep(3)}
            className=" cursor-pointer px-4 py-2  rounded-xl bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black font-bold hover:scale-105 hover:shadow-xl transition-all"
          >
            Next Step
          </button>
        </div>
      )}
    </div>
  );
};

export default PublicUserSearch;
