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
      .from("user_data")
      .select("*")
      .or(`user_name.ilike.${searchValue},user_email.ilike.${searchValue}`);

    if (error) {
      console.error(error.message);
      setLoading(false);
      setBtnLoading(false);
      return;
    }
    console.log("Search users:", users);

    const { data: groups, error: groupError } = await supabase
      .from("create_group")
      .select("*")
      .or(`user_join.eq.${session.user.id},user_accept.eq.${session.user.id}`);

    if (groupError) {
      console.error("Group fetch error:", groupError.message);
      setLoading(false);
      setBtnLoading(false);
      return;
    }

    const filteredUsers = users.filter((u) => u.user_id !== session.user.id);
    console.log("Filtered users:", filteredUsers);
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
    console.log(merged);

    setResults(merged);
    setLoading(false);
    setBtnLoading(false);
  };

  const handleJoinFunction = async (accept_userId) => {
    setBtnLoading(true);
    const { data, error } = await supabase
      .from("create_group")
      .select("*")
      .eq("user_join", session.user.id)
      .eq("user_accept", accept_userId);

    if (error) {
      alert("Error fetching group data:", error.message);
    } else if (data.length > 0) {
      await handleRemoveJoinFunction(accept_userId, true);
    } else {
      const { error: insertError } = await supabase
        .from("create_group")
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
      .from("create_group")
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
        { event: "*", schema: "public", table: "create_group" },
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
      {/* Search bar and button */}
      <div className="flex gap-2 justify-between items-end mb-4">
        <div className="w-full">
          <label htmlFor="search" className="text-lg font-semibold block">
            Search (user-email or user-name)
          </label>
          <input
            id="search"
            type="text"
            placeholder="Search user by name..."
            className="w-full px-4 py-2 mt-2 border border-white bg-transparent text-white rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
            ref={searchTermRef}
          />
        </div>
        <button
          onClick={handleSearch}
          className="min-w-[120px] px-4 py-2 font-semibold rounded border-2 border-black bg-gradient-to-b from-yellow-400 via-yellow-600 to-yellow-800 text-white hover:brightness-110"
        >
          {loading ? (
            <span className="flex gap-2 items-center animate-pulse">
              Searching... <VscLoading className="w-5 h-5 animate-spin" />
            </span>
          ) : (
            <span className="flex gap-2 items-center">Search</span>
          )}
        </button>
      </div>

      {/* Results */}
      <div>
        {results.length > 0 ? (
          results.map((user) => (
            <div
              key={user.id}
              className="flex justify-between items-center mb-3 p-3 border rounded bg-gray-900/50 text-yellow-500 hover:bg-gradient-to-br hover:from-gray-800 hover:via-gray-900 hover:to-black transform hover:scale-100 scale-95 transition-all duration-200"
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
                          className={`px-4 py-2 rounded font-medium border-2 border-black bg-gradient-to-b from-green-400 via-green-600 to-green-800 text-white transition-opacity ${
                            Btnloading ? "opacity-30" : "opacity-100"
                          }`}
                        >
                          Inviter
                        </button>
                      </Link>
                    ) : (
                      <button
                        disabled={Btnloading}
                        onClick={() => handleRemoveJoinFunction(user.user_id)}
                        className={`px-4 py-2 rounded font-medium border-2 border-black bg-gradient-to-b from-red-400 via-red-600 to-red-800 text-white transition-opacity ${
                          Btnloading ? "opacity-30" : "opacity-100"
                        }`}
                      >
                        Remove
                      </button>
                    )
                  ) : (
                    <button
                      disabled={Btnloading}
                      onClick={() => handleJoinFunction(user.user_id)}
                      className={`px-4 py-2 rounded font-medium border-2 border-black bg-gradient-to-b from-yellow-400 via-yellow-600 to-yellow-800 text-black transition-opacity ${
                        Btnloading ? "opacity-30" : "opacity-100"
                      }`}
                    >
                      Join
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-400">No users found.</p>
        )}
      </div>
    </div>
  );
};

export default SearchUsers;
