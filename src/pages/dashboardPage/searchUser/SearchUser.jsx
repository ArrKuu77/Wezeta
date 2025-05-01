import { useRef, useState } from "react";
import { supabase } from "../../../../supabaseClient"; // Adjust path as needed
import { VscLoading } from "react-icons/vsc";
import SearchuserImage from "./SearchuserImage";
import { useAuth } from "../../../components/authComponent/context/AuthContext";
import { Link } from "react-router-dom";

const SearchUsers = () => {
  const { session } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [Btnloading, setBtnLoading] = useState(false);
  const searchTermRef = useRef("");

  const handleSearch = async () => {
    setLoading(true);
    setBtnLoading(true);

    if (searchTermRef.current.value == "") {
      alert("Please fill email or user name!");
      setResults([]);
      setLoading(false);
      setBtnLoading(false);
    } else if (searchTermRef.current.value.charAt(0) == "@") {
      alert("Please check your email");
      setResults([]);
      setLoading(false);
      setBtnLoading(false);
    } else {
      const searchValue = `%${searchTermRef.current.value}%`;

      const { data, error } = await supabase
        .from("user-data")
        .select("*")
        .or(`user_name.ilike.${searchValue},user_email.ilike.${searchValue}`);
      // .ilike("user_name", `%${searchTermRef.current.value}%`); // case-insensitive search
      // .like("user_name", `%${searchTermRef.current.value}%`);
      if (error) {
        console.error(error.message);
      } else {
        setResults(data);
        const { data: GroupData, error: userError } = await supabase
          .from("create-group")
          .select("*")
          .or(
            `user_join.eq.${session.user.id},user_accept.eq.${session.user.id}`
          );
        if (userError) {
          console.error("Error fetching group data:", userError.message);
        } else {
          const filterResults = data.filter(
            (user) => user.user_id !== session.user.id
          );
          // console.log("Group data fetched successfully:", GroupData);

          const mergedArray = filterResults.map((user) => {
            const match = GroupData.find(
              (item) => item.user_accept == user.user_id
            );
            const match2 = GroupData.find(
              (item) => item.user_join == user.user_id
            );
            // console.log(match, match2);

            if (match2) {
              return {
                ...user,
                exit_join: match2?.exit_join || null,
                user_join: match2?.user_join || null,
                exit_accept: match2?.exit_accept || null,
                group_id: match2?.group_id || null,
                user_accept: match2?.user_accept || null,
              };
            }
            if (match) {
              return {
                ...user,
                exit_join: match?.exit_join || null,
                user_join: match?.user_join || null,
                exit_accept: match?.exit_accept || null,
                group_id: match?.group_id || null,
                user_accept: match?.user_accept || null,
              };
            }
            return {
              ...user,
              exit_join: null,
              user_join: null,
              exit_accept: null,
              group_id: null,
              user_accept: null,
            };
          });
          console.log(mergedArray);

          setResults(mergedArray);
        }
      }

      setLoading(false);
      setBtnLoading(false);
    }
  };
  const handleRemoveJoinFunction = async (
    accept_userId,
    updateUserJoin = false
  ) => {
    console.log(accept_userId);
    setBtnLoading(true);
    const { data: insertedUserData, error: insertUserError } = await supabase
      .from("create-group")
      .update({ exit_join: updateUserJoin })
      .eq("user_accept", accept_userId)
      .eq("user_join", session.user.id)
      .select()
      .single();
    if (insertUserError) {
      console.log("Error inserting user data:", insertUserError.message);
      alert("Error inserting user data:", insertUserError.message);
    } else {
      setBtnLoading(false);
      console.log("User data inserted successfully:", insertedUserData);
    }
  };

  const handleJoinFunction = async (accept_userId) => {
    setBtnLoading(true);
    console.log(accept_userId);
    const { data: GroupData, error: userError } = await supabase
      .from("create-group")
      .select("*")
      .eq("user_join", session.user.id)
      .eq("user_accept", accept_userId);

    console.log(GroupData);
    if (userError) {
      alert("Error fetching group data:", userError.message);
    }
    if (GroupData.length > 0) {
      console.log(GroupData);
      handleRemoveJoinFunction(accept_userId, true);
      setBtnLoading(false);
    } else {
      const { data: insertedUserData, error: insertUserError } = await supabase
        .from("create-group")
        .insert([
          {
            user_join: session.user.id,
            exit_join: true,
            user_accept: accept_userId,
          },
        ])
        .select()
        .single();
      if (insertUserError) {
        console.log("Error inserting user data:", insertUserError.message);
        alert("Error inserting user data:", insertUserError.message);
        setBtnLoading(false);
      } else {
        console.log("User data inserted successfully:", insertedUserData);
      }
    }
    setBtnLoading(false);
  };

  return (
    <div className="p-4 max-w-xl mx-auto text-white">
      <div className="flex gap-2 justify-between items-end mb-4">
        <div className="">
          <label htmlFor="search" className=" text-lg font-semibold">
            Search (user-email or user-name)
          </label>
          <input
            id="search"
            type="text"
            placeholder="Search user by name..."
            className="input my-2 input-bordered w-full text-white border-white"
            ref={searchTermRef}
          />
        </div>
        <button
          onClick={handleSearch}
          className="btn my-2 border-black border-2 text-black  !bg-gradient-to-b from-yellow-400 via-yellow-600 to-yellow-800 "
        >
          {loading ? (
            <span className=" flex justify-center items-center gap-3 animate-pulse  font-semibold text-white anima ">
              <p>Searching ... </p>{" "}
              <VscLoading className=" size-6 animate-spin" />
            </span>
          ) : (
            <span className=" flex justify-center items-center gap-3  font-semibold text-white  ">
              <p>Search </p>
            </span>
          )}
        </button>
      </div>

      <div>
        {results.length > 0 ? (
          results.map((user) => (
            <div
              key={user.id}
              className="flex justify-between items-center mb-2 p-3 border rounded bg-gray-900/50 text-yellow-500
              transition-all duration-500 ease-in-out
              hover:bg-gradient-to-br hover:from-gray-800 hover:via-gray-900 hover:to-black hover:scale-100 scale-90"
            >
              <div className=" w-[15%] ">
                <SearchuserImage userId={user.user_id} />
              </div>

              <div className=" flex justify-between items-center w-[75%]">
                <div>
                  <p>
                    <strong>Name:</strong> {user.user_name}
                  </p>
                  <p>
                    <strong>Email:</strong> {user.user_email}
                  </p>
                </div>
                <div>
                  {user.exit_join ? (
                    <div>
                      {user.exit_accept ? (
                        <Link to={"/accept-group-list"}>
                          <button
                            disabled={Btnloading}
                            className={`${
                              Btnloading ? "opacity-20" : "opacity-100"
                            } btn my-2 border-black border-2 text-white  !bg-gradient-to-b from-green-400 via-green-600 to-green-800`}
                          >
                            {Btnloading ? (
                              <span className=" flex justify-center items-center gap-3 animate-pulse  font-semibold text-white anima ">
                                <p>Loading ... </p>{" "}
                                <VscLoading className=" size-6 animate-spin" />
                              </span>
                            ) : (
                              <span className=" flex justify-center items-center gap-3  font-semibold text-white  ">
                                <p>Inviter </p>
                              </span>
                            )}
                          </button>
                        </Link>
                      ) : (
                        <button
                          disabled={Btnloading}
                          onClick={() => handleRemoveJoinFunction(user.user_id)}
                          className={`${
                            Btnloading ? "opacity-20" : "opacity-100"
                          } btn my-2 border-black border-2 text-white  !bg-gradient-to-b from-red-400 via-red-600 to-red-800`}
                        >
                          {Btnloading ? (
                            <span className=" flex justify-center items-center gap-3 animate-pulse  font-semibold text-white anima ">
                              <p>Loading ... </p>{" "}
                              <VscLoading className=" size-6 animate-spin" />
                            </span>
                          ) : (
                            <span className=" flex justify-center items-center gap-3  font-semibold text-white  ">
                              <p>Remove </p>
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      disabled={Btnloading}
                      onClick={() => handleJoinFunction(user.user_id)}
                      className={`${
                        Btnloading ? "opacity-20" : "opacity-100"
                      } btn my-2 border-black border-2 text-black  !bg-gradient-to-b from-yellow-400 via-yellow-600 to-yellow-800`}
                    >
                      {Btnloading ? (
                        <span className=" flex justify-center items-center gap-3 animate-pulse  font-semibold text-white anima ">
                          <p>Loading ... </p>{" "}
                          <VscLoading className=" size-6 animate-spin" />
                        </span>
                      ) : (
                        <span className=" flex justify-center items-center gap-3  font-semibold text-white  ">
                          <p>join </p>
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No users found.</p>
        )}
      </div>
    </div>
  );
};

export default SearchUsers;
