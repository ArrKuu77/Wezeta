import React, { use, useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import { useAuth } from "../../components/authComponent/context/AuthContext";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { Link } from "react-router-dom";
import PageLoadingComponent from "../../components/lottiesComponent/PageLoading.component";

const COLORS = ["#facc15", "#f87171", "#4ade80"]; // yellow, red, green

const Home = () => {
  const { session } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toLocaleString("default", { month: "long" })
  );
  const endYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(endYear);

  const [groupDetails, setGroupDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [useGroups, setUseGroups] = useState([]);

  const fetchGroupDetails = async () => {
    setLoading(true);
    try {
      const { data: userGroups, error: groupError } = await supabase
        .from("create-group")
        .select("*")
        .or(`user_join.eq.${session.user.id},user_accept.eq.${session.user.id}`)
        .eq("exit_accept", true);

      if (groupError) throw groupError;

      if (!userGroups || userGroups.length === 0) {
        setGroupDetails([]);
        setUseGroups([]);
        return;
      }

      const { data: detailData, error: detailError } = await supabase
        .from("group_detail_create")
        .select("*")
        .in(
          "group_id",
          userGroups.map((group) => group.group_id)
        )
        .eq("group_month", selectedMonth)
        .eq("group_year", selectedYear);

      if (detailError) throw detailError;
      setUseGroups(userGroups);
      setGroupDetails(detailData);
    } catch (err) {
      console.error("Error fetching group details:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchGroupDetails();
    }
  }, [selectedMonth, session?.user?.id, selectedYear]);
  console.log(groupDetails);

  return (
    <div className="p-6 bg-gray-950 text-yellow-300">
      <h1 className="text-2xl font-bold mb-4">📊 Group Overview</h1>

      {/* Month Selector */}
      <div className="form-control max-w-xs mb-6">
        <label className="label flex items-center gap-3">
          <span className="label-text text-sm text-yellow-300">
            Current Month:
          </span>
          <h1 className="text-lg text-white">{selectedMonth}</h1>
        </label>
      </div>

      {loading ? (
        <div className=" absolute top-0 right-0 w-full h-full bg-black/90 flex justify-center items-center   ">
          <div className="  w-1/2   rounded-xl">
            <PageLoadingComponent
              loadingWeight={"w-full"}
              loadingHeight={"h-full"}
              area={true}
            />
          </div>
        </div>
      ) : groupDetails.length > 0 ? (
        <div className="space-y-10 ">
          {groupDetails.map((detail) => {
            const totalIncome = detail.group_member_income_data?.reduce(
              (sum, member) => sum + parseInt(member.member_income || 0),
              0
            );

            //

            const totalExtra = detail.group_member_balance.reduce(
              (sum, n) => sum + n.balance,
              0
            );
            const isExtraPositive = totalExtra >= totalIncome;
            const pieData = [
              { name: "Income", value: totalIncome },
              // { name: "Outcome", value: totalOutcome },
              {
                name: "Extra",
                value: detail.group_member_balance.reduce(
                  (sum, n) => sum + n.balance,
                  0
                ),
              },
            ];

            return (
              <div key={detail.id} className="card bg-gray-700  p-6 shadow-md ">
                <h2 className="text-lg font-semibold  text-center">
                  📘 Month: {detail.group_month}
                </h2>

                <div className="grid md:grid-cols-3 gap-3 items-center ">
                  <div className=" h-full flex flex-col gap-3 justify-center  ">
                    <h3 className="text-lg font-semibold  h-[10%]">
                      💸 Financial Summary
                    </h3>
                    <ul className="space-y-1 h-[50%] flex flex-col justify-around">
                      <li>
                        {detail.group_member_income_data.map(
                          (member, index) => (
                            <div
                              key={index}
                              className=" flex items-center gap-3"
                            >
                              {" "}
                              <span> 👥 Members{index + 1}:</span>
                              <span>{member.member_name}</span>
                            </div>
                          )
                        )}
                      </li>
                      <li>
                        💰 Total Income: {totalIncome.toLocaleString()} MMK
                      </li>
                      {/* <li>
                        🧾 Total Outcome: {totalOutcome.toLocaleString()} MMK
                      </li> */}
                      <li>
                        📦 Balance Money:{" "}
                        {parseInt(
                          detail.group_member_balance.reduce(
                            (sum, n) => sum + n.balance,
                            0
                          )
                        )}{" "}
                        MMK
                      </li>
                    </ul>
                    <div>
                      {useGroups
                        .filter((use) => use.group_id === detail.group_id)
                        .map((use, idx) => (
                          <Link
                            key={idx}
                            to={`/saving-group/saving-detail`}
                            state={detail}
                          >
                            <button className="cursor-pointer font-bold w-[90%] p-3 bg-yellow-500 text-black rounded-2xl border-2">
                              Go detail
                            </button>
                          </Link>
                        ))}
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.name === "Extra"
                                ? isExtraPositive
                                  ? "green" // Extra ≥ Income → GREEN
                                  : "red" // Extra < Income → RED
                                : "yellow" // default color for income
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className=" hidden md:block">
                    <h3 className="text-lg font-semibold mb-2">
                      📊 Bar Chart View
                    </h3>
                    <ResponsiveContainer
                      className=" mx-auto "
                      width={"100%"}
                      height={300}
                    >
                      <BarChart data={pieData}>
                        <XAxis dataKey="name" stroke="#facc15" />
                        <YAxis stroke="#facc15" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#facc15" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className=" w-full px-4 py-6 sm:px-6 md:px-10 lg:px-16  text-yellow-400">
          {useGroups.length > 0 ? (
            <div className="flex flex-col gap-6">
              {useGroups.map((use, idx) => (
                <div
                  className="bg-zinc-900 border border-yellow-600 rounded-2xl p-4 shadow-md w-full"
                  key={idx}
                >
                  {use.user_join === session.user.id &&
                  use.user_accept === session.user.id ? (
                    <Link to="/accept-group-list">
                      <button className="w-full py-3 text-sm sm:text-base font-semibold rounded-xl bg-yellow-500 text-black hover:bg-yellow-400 transition-all duration-300">
                        ✅ Accept Group Lists
                      </button>
                    </Link>
                  ) : use.user_join === session.user.id ||
                    use.user_accept === session.user.id ? (
                    <Link to="/public-group-list">
                      <button className="w-full py-3 text-sm sm:text-base font-semibold rounded-xl bg-yellow-500 text-black hover:bg-yellow-400 transition-all duration-300">
                        💼 Company Expense Group Lists
                      </button>
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center mt-10">
              <p className="text-red-400 text-lg">🚫 No group data found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
