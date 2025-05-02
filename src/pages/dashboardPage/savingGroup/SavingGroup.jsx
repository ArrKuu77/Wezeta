import React, { useEffect, useState } from "react";
import { useAuth } from "../../../components/authComponent/context/AuthContext";
import { supabase } from "../../../../supabaseClient";
import { useLocation } from "react-router-dom";

const SavingGroup = () => {
  const { session } = useAuth();
  const location = useLocation();

  const [groupData, setGroupData] = useState(null);
  const [selectedUser, setSelectedUser] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDate, setSelectedDate] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toLocaleString("default", { month: "long" })
  );

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  useEffect(() => {
    const fetchGroupData = async () => {
      const { data, error } = await supabase
        .from("group_detail_create")
        .select("*")
        .eq("group_id", location.state.group_id)
        .eq("group_month", selectedMonth)
        .single();

      if (error) {
        console.error("Error fetching group data:", error);
        setGroupData(null);
      } else {
        setGroupData(data);
      }
    };

    fetchGroupData();

    const channel = supabase
      .channel("group_detail_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_detail_create",
          filter: `group_id=eq.${location.state.group_id}`,
        },
        () => fetchGroupData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [location.state.group_id, selectedMonth]);

  const filteredOutcome =
    groupData?.group_member_outCome_data?.filter((item) => {
      const userMatch =
        selectedUser === "all" || item.UploadUser_id === selectedUser;
      const categoryMatch =
        selectedCategory === "all" || item.category === selectedCategory;
      const dateMatch =
        selectedDate === "all" || item.create_DateOnly === selectedDate;
      return userMatch && categoryMatch && dateMatch;
    }) || [];

  const totalFilteredOutcome = filteredOutcome.reduce(
    (sum, item) => sum + parseInt(item.amount),
    0
  );

  const totalIncome = groupData?.group_member_income_data?.reduce(
    (sum, item) => sum + parseInt(item.member_income),
    0
  );

  const totalOutcome = groupData?.group_member_outCome_data?.reduce(
    (sum, item) => sum + parseInt(item.amount),
    0
  );

  // Map member outcomes
  const memberExpenses = {};
  groupData?.group_member_outCome_data?.forEach((item) => {
    const id = item.UploadUser_id;
    memberExpenses[id] = (memberExpenses[id] || 0) + parseInt(item.amount);
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 text-yellow-300 min-h-screen">
      {/* Month Filter */}
      <div className="form-control w-full max-w-xs">
        <label className="label">
          <span className="label-text text-yellow-300">Filter by Month</span>
        </label>
        <select
          className="select select-bordered bg-black text-yellow-300"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          {months.map((month) => (
            <option key={month}>{month}</option>
          ))}
        </select>
      </div>

      {groupData ? (
        <>
          <h1 className="text-3xl font-bold text-center">
            📅 Group Report - {groupData.group_month}
          </h1>

          {/* Filters */}
          <div className="flex flex-col items-center md:flex-row md:justify-between gap-4 flex-wrap">
            {/* User Filter */}
            <div className="form-control w-full max-w-xs">
              <label className="label">
                <span className="label-text text-yellow-300">
                  Filter by Member
                </span>
              </label>
              <select
                className="select select-bordered bg-black text-yellow-300"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="all">All Members</option>
                {[
                  ...new Set(
                    groupData.group_member_outCome_data.map(
                      (item) => item.UploadUser_id
                    )
                  ),
                ].map((id) => {
                  const name = groupData.group_member_outCome_data.find(
                    (item) => item.UploadUser_id === id
                  )?.UploadUserName;
                  return (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Category Filter */}
            <div className="form-control w-full max-w-xs">
              <label className="label">
                <span className="label-text text-yellow-300">
                  Filter by Category
                </span>
              </label>
              <select
                className="select select-bordered bg-black text-yellow-300"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {[
                  ...new Set(
                    groupData.group_member_outCome_data.map(
                      (item) => item.category
                    )
                  ),
                ].map((cat) => (
                  <option key={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div className="form-control w-full max-w-xs">
              <label className="label">
                <span className="label-text text-yellow-300">
                  Filter by Date
                </span>
              </label>
              <select
                className="select select-bordered bg-black text-yellow-300"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              >
                <option value="all">All Dates</option>
                {[
                  ...new Set(
                    groupData.group_member_outCome_data.map(
                      (item) => item.create_DateOnly
                    )
                  ),
                ].map((date) => (
                  <option key={date}>{date}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Income Card with Expense Per Member */}
          <div className="card bg-neutral text-yellow-300 shadow-md">
            <div className="card-body">
              <h2 className="card-title">💰 Member Balances</h2>
              <ul className="divide-y divide-gray-700">
                {groupData.group_member_income_data.map((member) => {
                  const income = parseInt(member.member_income);
                  const outcome = memberExpenses[member.member_id] || 0;
                  const balance = income - outcome;
                  return (
                    <li
                      key={member.member_id}
                      className="flex justify-between  py-2"
                    >
                      <div>
                        <span className="font-bold">{member.member_name}</span>
                        <div className="text-sm opacity-80">
                          Income: {income.toLocaleString()} MMK | Expenses:{" "}
                          {outcome.toLocaleString()} MMK
                        </div>
                      </div>
                      <span
                        className={`font-bold flex items-center justify-center ${
                          balance < 0 ? "text-red-400" : "text-green-400"
                        }`}
                      >
                        {balance.toLocaleString()} MMK
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Outcome Table */}
          <div className="card bg-neutral text-yellow-300 shadow-md">
            <div className="card-body">
              <h2 className="card-title">🧾 Member Expenses</h2>
              <div className="overflow-x-auto max-h-[500px]">
                <table className="table text-sm">
                  <thead className="sticky top-0 bg-neutral z-10">
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Shop</th>
                      <th>Method</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOutcome.length > 0 ? (
                      filteredOutcome
                        .slice()
                        .reverse()
                        .map((item, i) => (
                          <tr
                            key={i}
                            className={
                              i % 2 === 0 ? "bg-gray-800" : "bg-gray-700"
                            }
                          >
                            <td>{item.UploadUserName}</td>
                            <td>{item.category}</td>
                            <td>{item.shopName}</td>
                            <td>{item.paymentMethod}</td>
                            <td>{item.create_DateOnly}</td>
                            <td>{item.create_TimeOnly}</td>
                            <td>
                              {parseInt(item.amount).toLocaleString()} MMK
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center text-red-400">
                          No matching records.
                        </td>
                      </tr>
                    )}
                    <tr className="bg-black text-yellow-300 font-bold border-t border-yellow-500">
                      <td colSpan="6" className="text-right pr-4 text-lg">
                        Total
                      </td>
                      <td className="text-lg">
                        {totalFilteredOutcome.toLocaleString()} MMK
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="card bg-neutral text-yellow-300 shadow-md">
            <div className="card-body">
              <h2 className="card-title">📊 Summary</h2>
              <ul className="space-y-2">
                <li>
                  Total Income:{" "}
                  <span className="font-semibold">
                    {totalIncome.toLocaleString()} MMK
                  </span>
                </li>
                <li>
                  Total Outcome:{" "}
                  <span className="font-semibold">
                    {totalOutcome.toLocaleString()} MMK
                  </span>
                </li>
                <li>
                  Extra Money:{" "}
                  <span className="font-semibold text-green-400">
                    {groupData.extra_money.toLocaleString()} MMK
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </>
      ) : (
        <p className="text-lg font-bold text-yellow-300">
          Data not found! You can create it.
        </p>
      )}
    </div>
  );
};

export default SavingGroup;
