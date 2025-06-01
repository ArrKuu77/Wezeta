import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../../components/authComponent/context/AuthContext";
import { LuCalendarCog } from "react-icons/lu";
import { supabase } from "../../../../supabaseClient";
import { v4 as uuidv4 } from "uuid";
import { MdDeleteForever } from "react-icons/md";
import { MdAutoDelete } from "react-icons/md";
import { VscLoading } from "react-icons/vsc";
const PublicSavingGroup = () => {
  const { session } = useAuth();
  const location = useLocation();
  const startYear = 2025;
  const endYear = new Date().getFullYear();
  const nav = useNavigate();
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
        .from("public_group_detail_create")
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
          .from("public_group_detail_create_outCome")
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

    const groupId = location.state.group_id;

    const channel = supabase
      .channel("public_group_detail_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "public_group_detail_create",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          // console.log("🟢 public_group_detail_create change:", payload);
          fetchGroupData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "public_group_detail_create_outCome",
        },
        (payload) => {
          // console.log("🟢 public_group_detail_create_outCome change:", payload);
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
      .from("public_group_detail_create")
      .select("id, group_member_income_data")
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

    // Step 3: Update both tables
    const { error: updateError } = await supabase
      .from("public_group_detail_create")
      .update({
        group_member_income_data: updatedMembers,
      })
      .eq("id", groupRecord.id);
    if (updateError) {
      // console.error("Update failed:", updateError || savingUpdateError);
      toast.error("Failed to update income and saving");
    } else {
      toast.success("Income and group saving updated!");
    }
    handleCloseModal();
    setLoading(false);
  };
  const gotoPDFFunction = () => {
    if (selectedUser !== session.user.id) {
      toast.error("Please select a member to export PDF.");
      return;
    } else {
      nav(`/public-saving-group/export-userPDF`, {
        state: {
          incomeData: groupData?.group_member_income_data?.find(
            (item) => item.member_id == selectedUser
          ),
          outcomeData: filteredOutcome,
          months: selectedMonth,
          groupName: location.state.group_name,
        },
      });
    }
  };

  const [loadingDelete, setLoadingDelete] = useState(false);
  const deleteRowData = async (outcome) => {
    setLoadingDelete(true);
    console.log("Delete row data clicked", outcome);
    if (
      outcome.group_detail_create_outCome_list.UploadUser_id !== session.user.id
    ) {
      toast.error("You can only delete your own outcomes.");
    } else {
      const { error } = await supabase
        .from("public_group_detail_create_outCome")
        .delete()
        .eq("id", outcome.id);

      if (error) {
        console.error("Error deleting row:", error);
        toast.error("Failed to delete outcome");
      } else {
        toast.success("Outcome deleted successfully");
      }
    }
    setLoadingDelete(false);
  };
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 text-yellow-300 min-h-screen">
      <div className="flex flex-col md:flex-row items-center md:justify-between gap-4">
        <div className="w-full max-w-xs">
          <label className="block text-sm font-medium mb-1">
            Filter by Year
          </label>
          <select
            className="w-full bg-black text-yellow-300 border border-gray-700 rounded px-3 py-2"
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
          <label className="block text-sm font-medium mb-1">
            Filter by Month
          </label>
          <select
            className="w-full bg-black text-yellow-300 border border-gray-700 rounded px-3 py-2"
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
          <h1 className="text-3xl font-bold text-center flex items-center justify-center gap-2">
            <LuCalendarCog /> Group Report - {groupData.group_month}
          </h1>

          <div className="flex flex-wrap gap-4 justify-between">
            <div className="w-full max-w-xs">
              <label className="block text-sm font-medium mb-1">
                Filter by Member
              </label>
              <select
                className="w-full bg-black text-yellow-300 border border-gray-700 rounded px-3 py-2"
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
              <label className="block text-sm font-medium mb-1">
                Filter by Category
              </label>
              <select
                className="w-full bg-black text-yellow-300 border border-gray-700 rounded px-3 py-2"
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
              <label className="block text-sm font-medium mb-1">
                Filter by Date
              </label>
              <select
                className="w-full bg-black text-yellow-300 border border-gray-700 rounded px-3 py-2"
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

          {selectedUser !== "all" && (
            <button
              onClick={gotoPDFFunction}
              className="mt-4 bg-yellow-600 hover:bg-yellow-500 text-black px-4 py-2 rounded font-semibold"
            >
              {
                groupData?.group_member_income_data?.find(
                  (item) => item.member_id === selectedUser
                )?.member_name
              }{" "}
              PDF
            </button>
          )}

          <div className="bg-gray-800 rounded-lg p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">💰 Member Balances</h2>
            <ul className="divide-y divide-gray-600">
              {groupData.group_member_income_data.map((member) => {
                const income = parseInt(member.member_income);
                const outcome = memberExpenses[member.member_id] || 0;
                const balance = income - outcome;
                return (
                  <li
                    key={member.member_id}
                    className="py-2 flex justify-between flex-col md:flex-row gap-2"
                  >
                    <div>
                      <span className="font-bold">{member.member_name}</span>
                      {member.member_id === session.user.id && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleOpenModal("add")}
                            className="bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded"
                          >
                            Add Income
                          </button>
                          <button
                            onClick={() => handleOpenModal("minus")}
                            className="bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded"
                          >
                            Minus Income
                          </button>
                        </div>
                      )}
                      <div className="text-sm mt-1">
                        <span>Income: {income.toLocaleString()} MMK</span> |{" "}
                        <span>Expenses: {outcome.toLocaleString()} MMK</span>
                      </div>
                    </div>
                    <div
                      className={`font-bold mt-1 md:mt-0 ${
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

          {/* Outcome Table */}
          <div className="bg-gray-800 rounded-lg p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">🧾 Member Expenses</h2>
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-sm border-separate border-spacing-0">
                <thead className="sticky top-0 bg-gray-800 text-yellow-300 shadow-sm z-10">
                  <tr>
                    <th className=" text-start px-4 py-2 border-b border-yellow-500">
                      Delete
                    </th>
                    <th className=" text-start px-4 py-2 border-b border-yellow-500">
                      Name
                    </th>
                    <th className="text-center px-4 py-2 border-b border-yellow-500">
                      Category
                    </th>
                    <th className=" text-start px-4 py-2 border-b border-yellow-500">
                      Customer
                    </th>
                    <th className="text-center px-4 py-2 border-b border-yellow-500">
                      Method
                    </th>
                    <th className="text-center px-4 py-2 border-b border-yellow-500">
                      Date & Time
                    </th>
                    <th className="text-right px-4 py-2 border-b border-yellow-500">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredOutcome.length > 0 ? (
                    filteredOutcome
                      .slice()
                      .reverse()
                      .map((item, i) => {
                        const o = item.group_detail_create_outCome_list;
                        return (
                          <tr
                            key={i}
                            className="hover:bg-gray-700 transition-colors duration-150"
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
                            <td className=" text-start whitespace-nowrap px-4 py-2">
                              {o.UploadUserName}
                            </td>
                            <td className="text-center px-4 py-2">
                              {o.category}
                            </td>
                            <td className=" text-start whitespace-nowrap px-4 py-2">
                              {o.customerName}
                            </td>
                            <td className="text-center px-4 py-2">
                              {o.paymentMethod}
                            </td>
                            <td className="text-center px-4 py-2">
                              {o.create_DateOnly} {o.create_TimeOnly}
                            </td>
                            <td className="text-right px-4 py-2">
                              {parseInt(o.amount).toLocaleString()} MMK
                            </td>
                          </tr>
                        );
                      })
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="text-center py-4 text-red-400 bg-gray-800"
                      >
                        No matching records.
                      </td>
                    </tr>
                  )}
                  <tr className="bg-gray-900 text-yellow-300 font-semibold border-t border-yellow-500">
                    <td colSpan="5"></td>
                    <td className="text-center px-4 py-2">Total</td>
                    <td className="text-right px-4 py-2">
                      {totalFilteredOutcome.toLocaleString()} MMK
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-800 rounded-lg p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">📊 Summary</h2>
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
                  {(totalIncome - totalOutcome).toLocaleString()} MMK
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

      {/* Income Modal */}
      {modalType && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md text-yellow-300 shadow-lg">
            <h2 className="text-lg font-bold mb-2">
              You currently have{" "}
              {parseInt(
                groupData.group_member_income_data.find(
                  (member) => member.member_id === session.user.id
                ).member_income
              ).toLocaleString()}{" "}
              MMK
            </h2>
            <p className="mb-4 text-sm text-gray-300">
              {modalType === "add"
                ? "How much do you want to add?"
                : "How much do you want to subtract?"}
            </p>
            <input
              type="number"
              placeholder="Enter amount"
              className="w-full bg-black text-yellow-300 border border-gray-600 rounded px-3 py-2"
              value={incomeAmount}
              onChange={(e) => setIncomeAmount(e.target.value)}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                disabled={loading}
                onClick={handleSubmitIncome}
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

export default PublicSavingGroup;
