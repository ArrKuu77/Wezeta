import React, { useEffect, useState } from "react";
import { useAuth } from "../../../components/authComponent/context/AuthContext";
import { supabase } from "../../../../supabaseClient";
import { useLocation } from "react-router-dom";
import { LuCalendarCog } from "react-icons/lu";
import { MdDeleteForever } from "react-icons/md";
import { MdAutoDelete } from "react-icons/md";
import { VscLoading } from "react-icons/vsc";

import toast from "react-hot-toast";

const SavingGroup = () => {
  const { session } = useAuth();
  const location = useLocation();
  const startYear = 2025;
  const endYear = new Date().getFullYear();

  const [groupData, setGroupData] = useState(null);
  const [selectedUser, setSelectedUser] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDate, setSelectedDate] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toLocaleString("default", { month: "long" })
  );
  const [modalType, setModalType] = useState(null); // 'add' or 'minus'
  const [incomeAmount, setIncomeAmount] = useState("");

  const [selectedYear, setSelectedYear] = useState(endYear);
  const years = Array(endYear - startYear + 1)
    .fill(0)
    .map((_, i) => startYear + i);

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
        .eq("group_year", selectedYear)
        .single();

      if (error) {
        console.error("Error fetching group data:", error);
        setGroupData(null);
      } else {
        const { data: fullData } = await supabase
          .from("group_detail_create_outCome")
          .select("*")
          .eq("group_detail_create_id", data?.id);
        if (fullData) {
          setGroupData({ ...data, group_member_outCome_data: fullData });
        } else {
          alert("Error");
        }
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
        () => {
          fetchGroupData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_detail_create_outCome",
          // Optional: filter by related group_detail_create_id if needed
        },
        () => {
          fetchGroupData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [location.state.group_id, selectedMonth, selectedYear]);

  const filteredOutcome =
    groupData?.group_member_outCome_data?.filter((item) => {
      const outcome = item.group_detail_create_outCome_list;
      const userMatch =
        selectedUser === "all" || outcome.UploadUser_id === selectedUser;
      const categoryMatch =
        selectedCategory === "all" || outcome.category === selectedCategory;
      const dateMatch =
        selectedDate === "all" || outcome.create_DateOnly === selectedDate;
      return userMatch && categoryMatch && dateMatch;
    }) || [];

  const totalFilteredOutcome = filteredOutcome.reduce((sum, item) => {
    const amount = parseInt(item.group_detail_create_outCome_list.amount);
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  const totalOutcome = groupData?.group_member_outCome_data?.reduce(
    (sum, item) => {
      const amount = parseInt(item.group_detail_create_outCome_list.amount);
      return sum + (isNaN(amount) ? 0 : amount);
    },
    0
  );

  const totalIncome = groupData?.group_member_income_data?.reduce(
    (sum, item) => {
      const income = parseInt(item.member_income);
      return sum + (isNaN(income) ? 0 : income);
    },
    0
  );

  // Build memberExpenses map
  const memberExpenses = {};
  groupData?.group_member_outCome_data?.forEach((item) => {
    const outcome = item.group_detail_create_outCome_list;
    const id = outcome.UploadUser_id;
    const amount = parseInt(outcome.amount);
    memberExpenses[id] =
      (memberExpenses[id] || 0) + (isNaN(amount) ? 0 : amount);
  });

  const [loading, setLoading] = useState(false);

  const handleOpenModal = (type) => {
    setModalType(type); // 'add' or 'minus'
    setIncomeAmount("");
  };
  const handleCloseModal = () => {
    setModalType(null);
    setIncomeAmount("");
    setLoading(false);
  };

  const handleSubmitIncome = async () => {
    setLoading(true);

    if (!incomeAmount || isNaN(incomeAmount)) {
      toast.error("Invalid income amount");
      setLoading(false);
      return;
    }

    const incomeDelta = (modalType === "add" ? 1 : -1) * parseInt(incomeAmount);

    // Step 1: Get group_detail_create record
    const { data: groupRecord, error: groupError } = await supabase
      .from("group_detail_create")
      .select("id, group_member_income_data, extra_money")
      .eq("group_id", location.state.group_id)
      .eq("group_month", selectedMonth)
      .eq("group_year", selectedYear)
      .maybeSingle();

    if (!groupRecord) {
      toast.error("Group not found");
      setLoading(false);
      return;
    }

    const updatedMembers = [...(groupRecord.group_member_income_data || [])];
    const memberIndex = updatedMembers.findIndex(
      (m) => m.member_id === session.user.id
    );

    if (memberIndex === -1) {
      toast.error("Member not found in income data");
      setLoading(false);
      return;
    }

    const currentIncome =
      parseInt(updatedMembers[memberIndex].member_income) || 0;
    const newIncome = Math.max(0, currentIncome + incomeDelta);

    updatedMembers[memberIndex] = {
      ...updatedMembers[memberIndex],
      member_income: newIncome.toString(),
    };

    // Step 2: Fetch all outcomes for this group
    const { data: outcomesData, error: outcomesError } = await supabase
      .from("group_detail_create_outCome")
      .select("group_detail_create_outCome_list")
      .eq("group_detail_create_id", groupRecord.id);

    const totalOutcome = (outcomesData || [])
      .flatMap((entry) => entry.group_detail_create_outCome_list)
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const totalIncome = updatedMembers.reduce(
      (sum, item) => sum + Number(item.member_income || 0),
      0
    );

    const previousSaving = groupRecord.extra_money || 0;
    const newSaving = totalIncome - totalOutcome;

    // Step 3: Update both tables
    const { error: updateError } = await supabase
      .from("group_detail_create")
      .update({
        group_member_income_data: updatedMembers,
        extra_money: newSaving,
      })
      .eq("id", groupRecord.id);

    const { error: savingUpdateError } = await supabase
      .from("saving-money-for-month")
      .update({ group_saving: newSaving })
      .eq("group_id", location.state.group_id)
      .eq("group_month", selectedMonth)
      .eq("group_year", selectedYear);

    if (updateError || savingUpdateError) {
      // console.error("Update failed:", updateError || savingUpdateError);
      toast.error("Failed to update income and saving");
    } else {
      toast.success("Income and group saving updated!");
    }

    handleCloseModal();
    setLoading(false);
  };
  const [loadingDelete, setLoadingDelete] = useState(false);
  const deleteRowData = async (outcome) => {
    setLoadingDelete(true);

    console.log("Delete row data clicked", outcome);
    if (
      outcome.group_detail_create_outCome_list.UploadUser_id !== session.user.id
    ) {
      toast.error("You can only delete your own expenses.");
    } else {
      const { error } = await supabase
        .from("group_detail_create_outCome")
        .delete()
        .eq("id", outcome.id);

      if (error) {
        console.error("Error deleting row:", error);
        toast.error("Failed to delete outcome");
      } else {
        await supabase
          .from("group_detail_create")
          .update({
            extra_money:
              groupData.extra_money +
              parseInt(outcome.group_detail_create_outCome_list.amount),
          })
          .eq("id", outcome.group_detail_create_id);
        await supabase
          .from("saving-money-for-month")
          .update({
            group_saving:
              groupData.extra_money +
              parseInt(outcome.group_detail_create_outCome_list.amount),
          })
          .eq("group_id", location.state.group_id)
          .eq("group_month", selectedMonth)
          .eq("group_year", selectedYear);

        toast.success("Outcome deleted successfully");
      }
    }
    setLoadingDelete(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 text-yellow-300 min-h-screen">
      <div className="flex flex-col md:flex-row items-center md:justify-between gap-4">
        <div className="w-full max-w-xs">
          <label className="block mb-1 text-yellow-300 font-medium">
            Filter by Year
          </label>
          <select
            className="w-full bg-black text-yellow-300 border border-yellow-500 rounded px-3 py-2"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full max-w-xs">
          <label className="block mb-1 text-yellow-300 font-medium">
            Filter by Month
          </label>
          <select
            className="w-full bg-black text-yellow-300 border border-yellow-500 rounded px-3 py-2"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {months.map((month) => (
              <option key={month}>{month}</option>
            ))}
          </select>
        </div>
      </div>

      {groupData ? (
        <>
          <h1 className="text-3xl font-bold text-center flex items-center justify-center gap-3">
            <LuCalendarCog /> Group Report - {groupData.group_month}
          </h1>

          <div className="flex flex-col md:flex-row flex-wrap gap-4 justify-between items-center">
            <div className="w-full max-w-xs">
              <label className="block mb-1 text-yellow-300 font-medium">
                Filter by Member
              </label>
              <select
                className="w-full bg-black text-yellow-300 border border-yellow-500 rounded px-3 py-2"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="all">All Members</option>
                {[
                  ...new Set(
                    groupData.group_member_outCome_data?.map(
                      (item) =>
                        item.group_detail_create_outCome_list.UploadUser_id
                    )
                  ),
                ].map((id) => {
                  const name = groupData.group_member_outCome_data.find(
                    (item) =>
                      item.group_detail_create_outCome_list.UploadUser_id === id
                  )?.group_detail_create_outCome_list.UploadUserName;
                  return (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="w-full max-w-xs">
              <label className="block mb-1 text-yellow-300 font-medium">
                Filter by Category
              </label>
              <select
                className="w-full bg-black text-yellow-300 border border-yellow-500 rounded px-3 py-2"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {[
                  ...new Set(
                    groupData.group_member_outCome_data.map(
                      (item) => item.group_detail_create_outCome_list.category
                    )
                  ),
                ].map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full max-w-xs">
              <label className="block mb-1 text-yellow-300 font-medium">
                Filter by Date
              </label>
              <select
                className="w-full bg-black text-yellow-300 border border-yellow-500 rounded px-3 py-2"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              >
                <option value="all">All Dates</option>
                {[
                  ...new Set(
                    groupData.group_member_outCome_data.map(
                      (item) =>
                        item.group_detail_create_outCome_list.create_DateOnly
                    )
                  ),
                ].map((date) => (
                  <option key={date} value={date}>
                    {date}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-neutral text-yellow-300 p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-3">💰 Member Balances</h2>
            <ul className="divide-y divide-gray-700">
              {groupData.group_member_income_data.map((member) => {
                const income = parseInt(member.member_income);
                const outcome = memberExpenses[member.member_id] || 0;
                const balance = income - outcome;
                return (
                  <li
                    key={member.member_id}
                    className="py-2 flex flex-col md:flex-row justify-between"
                  >
                    <div>
                      <div className="font-bold">{member.member_name}</div>
                      {member.member_id === session.user.id && (
                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={() => handleOpenModal("add")}
                            className="bg-green-700 hover:bg-green-600 text-white rounded px-3 py-1 text-sm"
                          >
                            Add Income
                          </button>
                          <button
                            onClick={() => handleOpenModal("minus")}
                            className="bg-red-700 hover:bg-red-600 text-white rounded px-3 py-1 text-sm"
                          >
                            Minus Income
                          </button>
                        </div>
                      )}
                      <div className="text-sm mt-1 opacity-80">
                        Income: {income.toLocaleString()} MMK | Expenses:{" "}
                        {outcome.toLocaleString()} MMK
                      </div>
                    </div>
                    <div
                      className={`font-bold text-end mt-2 md:mt-0 ${
                        balance < 0 ? "text-red-400" : "text-green-400"
                      }`}
                    >
                      Balance: {balance.toLocaleString()} MMK
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="bg-neutral text-yellow-300 p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-3">🧾 Member Expenses</h2>
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-sm text-yellow-300 border-separate border-spacing-y-1">
                <thead className="sticky top-0 bg-neutral z-10 rounded-md">
                  <tr className="bg-black rounded-md">
                    <th className="text-end px-3 py-2">Delete</th>

                    <th className="text-center px-3 py-2">Name</th>
                    <th className="text-center px-3 py-2">Category</th>
                    <th className="text-center px-3 py-2">Shop</th>
                    <th className="text-center px-3 py-2">Method</th>
                    <th className="text-center px-3 py-2">Date & Time</th>
                    <th className="text-end px-3 py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOutcome.length > 0 ? (
                    filteredOutcome
                      .slice()
                      .reverse()
                      .map((item, i) => {
                        const outcome = item.group_detail_create_outCome_list;
                        return (
                          <tr
                            key={i}
                            className="bg-neutral-800 hover:bg-neutral-700 transition-colors"
                          >
                            {loadingDelete ? (
                              <td className=" relative  font-semibold text-red-400">
                                <VscLoading className=" text-4xl animate-spin mx-auto  text-red-500" />
                                <MdAutoDelete className=" absolute animate-pulse top-[40%] left-[42%] " />
                              </td>
                            ) : (
                              <td className="  font-semibold text-red-400">
                                <MdDeleteForever
                                  onClick={deleteRowData.bind(null, item)}
                                  className="mx-auto text-lg cursor-pointer"
                                />
                              </td>
                            )}

                            <td className="text-center px-3 py-2 font-medium">
                              {outcome.UploadUserName}
                            </td>
                            <td className="text-center px-3 py-2">
                              {outcome.category}
                            </td>
                            <td className="text-center px-3 py-2">
                              {outcome.shopName}
                            </td>
                            <td className="text-center px-3 py-2">
                              {outcome.paymentMethod}
                            </td>
                            <td className="text-center px-3 py-2">
                              {outcome.create_DateOnly}{" "}
                              {outcome.create_TimeOnly}
                            </td>
                            <td className="text-end px-3 py-2 font-semibold text-yellow-400">
                              {parseInt(outcome.amount).toLocaleString()} MMK
                            </td>
                          </tr>
                        );
                      })
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center text-red-400 py-4">
                        No matching records.
                      </td>
                    </tr>
                  )}
                  <tr className="bg-black text-yellow-300 font-bold border-t border-yellow-500">
                    <td colSpan="5" className="text-right pr-4 text-lg"></td>
                    <td className="text-center pr-4 text-lg">Total</td>
                    <td className="text-lg text-end px-3 py-2">
                      {totalFilteredOutcome.toLocaleString()} MMK
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-neutral text-yellow-300 p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-2">📊 Summary</h2>
            <ul className="space-y-1">
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
        </>
      ) : (
        <p className="text-lg font-bold text-yellow-300">
          Data not found! You can create it.
        </p>
      )}

      {modalType && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-neutral p-6 rounded-xl w-full max-w-md text-yellow-300">
            <div className="mb-4">
              <p className="text-lg font-bold">
                You are current income is{" "}
                {parseInt(
                  groupData.group_member_income_data.find(
                    (m) => m.member_id === session.user.id
                  ).member_income
                ).toLocaleString()}{" "}
                MMK
              </p>
              <p className="text-sm text-white font-semibold">
                {modalType === "add" ? (
                  <span className="text-green-400">
                    How much do you want to{" "}
                    <span className="text-yellow-500">plus</span> your income?
                  </span>
                ) : (
                  <span className="text-green-400">
                    How much do you want to{" "}
                    <span className="text-yellow-500">minus</span> your income?
                  </span>
                )}
              </p>
            </div>
            <input
              type="number"
              placeholder="Enter amount"
              className="w-full bg-black text-yellow-300 border border-yellow-500 px-3 py-2 rounded"
              value={incomeAmount}
              onChange={(e) => setIncomeAmount(e.target.value)}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitIncome}
                disabled={loading}
                className="px-4 py-2 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-400"
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavingGroup;
