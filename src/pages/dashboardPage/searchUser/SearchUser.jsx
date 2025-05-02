import { useEffect, useRef, useState } from "react";
import { supabase } from "../../../../supabaseClient";
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
    const term = searchTermRef.current.value.trim();
    if (!term) return alert("Please fill email or user name!");
    if (term.charAt(0) === "@") return alert("Please check your email");

    setLoading(true);
    setBtnLoading(true);
    const searchValue = `%${term}%`;

    const { data: users, error } = await supabase
      .from("user-data")
      .select("*")
      .or(`user_name.ilike.${searchValue},user_email.ilike.${searchValue}`);

    if (error) {
      console.error(error.message);
      setLoading(false);
      setBtnLoading(false);
      return;
    }

    const { data: groups, error: groupError } = await supabase
      .from("create-group")
      .select("*")
      .or(`user_join.eq.${session.user.id},user_accept.eq.${session.user.id}`);

    if (groupError) {
      console.error("Group fetch error:", groupError.message);
      setLoading(false);
      setBtnLoading(false);
      return;
    }

    const filteredUsers = users.filter((u) => u.user_id !== session.user.id);
    const merged = filteredUsers.map((user) => {
      const match = groups.find(
        (g) => g.user_accept === user.user_id || g.user_join === user.user_id
      );
      return {
        ...user,
        ...match,
        exit_join: match?.exit_join ?? null,
        exit_accept: match?.exit_accept ?? null,
        group_id: match?.group_id ?? null,
        user_accept: match?.user_accept ?? null,
      };
    });

    setResults(merged);
    setLoading(false);
    setBtnLoading(false);
  };

  const handleJoinFunction = async (accept_userId) => {
    setBtnLoading(true);
    const { data, error } = await supabase
      .from("create-group")
      .select("*")
      .eq("user_join", session.user.id)
      .eq("user_accept", accept_userId);

    if (error) {
      alert("Error fetching group data:", error.message);
    } else if (data.length > 0) {
      await handleRemoveJoinFunction(accept_userId, true);
    } else {
      const { error: insertError } = await supabase
        .from("create-group")
        .insert({
          user_join: session.user.id,
          exit_join: true,
          user_accept: accept_userId,
        });

      if (insertError) {
        alert("Insert error: " + insertError.message);
      }
    }
    setBtnLoading(false);
  };

  const handleRemoveJoinFunction = async (
    accept_userId,
    updateUserJoin = false
  ) => {
    setBtnLoading(true);
    const { error } = await supabase
      .from("create-group")
      .update({ exit_join: updateUserJoin })
      .eq("user_accept", accept_userId)
      .eq("user_join", session.user.id);

    if (error) {
      alert("Remove error: " + error.message);
    }
    setBtnLoading(false);
  };

  // 🟡 Supabase Realtime Subscription
  useEffect(() => {
    const channel = supabase
      .channel("realtime-group-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "create-group" },
        (payload) => {
          console.log("Realtime update received:", payload);
          handleSearch(); // Refresh search results
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="p-4 max-w-xl mx-auto text-white">
      {/* ...Search bar and button... */}
      <div className="flex gap-2 justify-between items-end mb-4">
        <div>
          <label htmlFor="search" className="text-lg font-semibold">
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
          className="btn my-2 border-black border-2 text-black !bg-gradient-to-b from-yellow-400 via-yellow-600 to-yellow-800"
        >
          {loading ? (
            <span className="flex gap-3 items-center animate-pulse font-semibold text-white">
              Searching... <VscLoading className="size-6 animate-spin" />
            </span>
          ) : (
            <span className="flex gap-3 items-center font-semibold text-white">
              Search
            </span>
          )}
        </button>
      </div>

      {/* Results */}
      <div>
        {results.length > 0 ? (
          results.map((user) => (
            <div
              key={user.id}
              className="flex justify-between items-center mb-2 p-3 border rounded bg-gray-900/50 text-yellow-500 hover:bg-gradient-to-br hover:from-gray-800 hover:via-gray-900 hover:to-black hover:scale-100 scale-90"
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
                  {user.exit_join ? (
                    user.exit_accept ? (
                      <Link to="/accept-group-list">
                        <button
                          disabled={Btnloading}
                          className={`${
                            Btnloading ? "opacity-20" : "opacity-100"
                          } btn border-black border-2 text-white bg-gradient-to-b from-green-400 via-green-600 to-green-800`}
                        >
                          Inviter
                        </button>
                      </Link>
                    ) : (
                      <button
                        disabled={Btnloading}
                        onClick={() => handleRemoveJoinFunction(user.user_id)}
                        className={`${
                          Btnloading ? "opacity-20" : "opacity-100"
                        } btn border-black border-2 text-white bg-gradient-to-b from-red-400 via-red-600 to-red-800`}
                      >
                        Remove
                      </button>
                    )
                  ) : (
                    <button
                      disabled={Btnloading}
                      onClick={() => handleJoinFunction(user.user_id)}
                      className={`${
                        Btnloading ? "opacity-20" : "opacity-100"
                      } btn border-black border-2 text-black bg-gradient-to-b from-yellow-400 via-yellow-600 to-yellow-800`}
                    >
                      Join
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
