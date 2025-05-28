rimport { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../../components/authComponent/context/AuthContext";
import { LuCalendarCog } from "react-icons/lu";
import { supabase } from "../../../../supabaseClient";
import { v4 as uuidv4 } from "uuid";

const PublicSavingGroupOld = () => {
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
  // console.log(location.state);

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
  const [copyId, setCopyId] = useState(null);
  const [copyIdBtnLoading, setCopyIdBtnLoading] = useState(false);

  const forPdfDownloadFun = async () => {
    setCopyIdBtnLoading(true);
    if (selectedUser == session.user.id) {
      const matchedEntryIncome = groupData.group_member_income_data?.find(
        (item) => item.member_id === selectedUser
      );
      const PdfList = {
        Outcome: filteredOutcome,
        Income: matchedEntryIncome,
        group_month: groupData.group_month,
      };
      const copy_id = uuidv4();
      console.log(PdfList);
      const { data: existingData, error: existingError } = await supabase
        .from("public_pdf_table")
        .select("*")
        .eq("group_id", location.state.group_id)
        .eq("user_id", session.user.id)
        .single();
      if (existingData) {
        const { data, error } = await supabase
          .from("public_pdf_table")
          .update({
            table_data: PdfList,
            copy_id,
          })
          .eq("group_id", location.state.group_id)
          .eq("user_id", session.user.id);
        if (error) {
          console.error("Error inserting PDF data:", error);
          toast.error("Failed to prepare PDF data");
        } else {
          toast.success("PDF Update data prepared successfully!");
          setCopyId(copy_id);
        }
      } else {
        const { data, error } = await supabase.from("public_pdf_table").insert([
          {
            group_id: location.state.group_id,
            table_data: PdfList,
            user_id: session.user.id,
            copy_id,
          },
        ]);
        if (error) {
          console.error("Error inserting PDF data:", error);
          toast.error("Failed to prepare PDF data");
        } else {
          toast.success("PDF data prepared successfully!");
          setCopyId(copy_id);
        }
      }
      setCopyIdBtnLoading(false);
    } else {
      toast.error("You can only download your own Expenses PDF File.");
      setCopyIdBtnLoading(false);
      return;
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 text-yellow-300 min-h-screen">
      <div className=" md:flex-row flex-col flex items-center md:justify-between ">
        {/* Year Dropdown */}
        <div className="form-control w-full max-w-xs">
          <label className="label">
            <span className="label-text text-yellow-300">Filter by Year</span>
          </label>
          <select
            className="select select-bordered bg-black text-yellow-300"
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
        {/* Month Dropdown */}
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
      </div>

      {groupData ? (
        <>
          <h1 className="text-3xl flex justify-center gap-3 items-center font-bold text-center">
            <LuCalendarCog /> Group Report - {groupData.group_month}
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

          <div>
            {selectedUser !== "all" &&
              (() => {
                const matchedEntry = groupData.group_member_outCome_data?.find(
                  (item) =>
                    item.group_detail_create_outCome_list?.UploadUser_id ===
                    selectedUser
                );

                const UploadUserName =
                  matchedEntry?.group_detail_create_outCome_list
                    ?.UploadUserName;

                return UploadUserName ? (
                  <button
                    disabled={copyIdBtnLoading}
                    onClick={forPdfDownloadFun}
                    className={`${
                      copyIdBtnLoading ? "opacity-50 " : "opacity-100"
                    }flex gap-2 items-center text-black font-semibold bg-yellow-600 px-2 py-1 rounded-lg`}
                  >
                    {copyIdBtnLoading ? (
                      <span className="loading loading-spinner loading-sm">
                        loading...
                      </span>
                    ) : (
                      <>
                        <span>{UploadUserName}</span>
                        <span>PDF</span>
                      </>
                    )}
                  </button>
                ) : null;
              })()}
          </div>

          {copyId && (
            <div className="bg-black  text-yellow-400 p-6 rounded-lg shadow-md space-y-4">
              <h1 className=" font-semibold ">
                <span className="mr-2 mb-2 block text-xl">
                  To PDF File For PDF_ID
                </span>
                <span className="text-white bg-yellow-600 px-2 py-1 rounded">
                  {copyId}
                </span>
              </h1>

              <Link
                onClick={() => {
                  navigator.clipboard.writeText(copyId);
                  toast.success("PDF_ID copied to clipboard!");
                }}
                to={`http://localhost:5174`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <button className="px-4 py-2 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-400 transition">
                  PDF_ID Copy and go to export PDF File
                </button>
              </Link>
            </div>
          )}

          {/* Income + Balances */}
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
                      className="flex justify-between md:flex-row flex-col py-2"
                    >
                      <div>
                        <div>
                          <span className="font-bold">
                            {member.member_name}
                          </span>
                          {member.member_id === session.user.id && (
                            <div className="flex gap-2 mt-1">
                              <button
                                onClick={() => handleOpenModal("add")}
                                className="px-1 py-0.5 md:px-3 md:py-1 bg-green-700 hover:bg-green-600 rounded text-white text-sm"
                              >
                                Add Income
                              </button>
                              <button
                                onClick={() => handleOpenModal("minus")}
                                className="px-1 py-0.5 md:px-3 md:py-1 bg-red-700 hover:bg-red-600 rounded text-white text-sm"
                              >
                                Minus Income
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="text-sm opacity-80 flex md:flex-row flex-col gap-0.5 mt-1">
                          <span> Income: {income.toLocaleString()} MMK | </span>
                          <span>Expenses: {outcome.toLocaleString()} MMK</span>
                        </div>
                      </div>
                      <span
                        className={`font-bold md:flex md:items-end inline gap-0.5 md:gap-1 ${
                          balance < 0 ? "text-red-400" : "text-green-400"
                        }`}
                      >
                        <span>Balance :</span>
                        <span>{balance.toLocaleString()} MMK</span>
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
              <div className="overflow-x-auto max-h-[400px]">
                <table className="table text-sm">
                  <thead className="sticky top-0 bg-neutral z-10">
                    <tr>
                      <th className=" text-center text-nowrap">Name</th>
                      <th className=" text-center text-nowrap">Category</th>
                      <th className=" text-center text-nowrap">Customer</th>
                      <th className=" text-center">Method</th>
                      <th className=" text-center">Date & Time</th>
                      <th className=" text-end">Amount</th>
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
                            <tr className="hover:bg-neutral-900" key={i}>
                              <td className="text-center text-nowrap">
                                {outcome.UploadUserName}
                              </td>
                              <td className="text-center text-nowrap">
                                {outcome.category}
                              </td>
                              <td className="text-center text-nowrap">
                                {outcome.customerName}
                              </td>
                              <td className="text-center">
                                {outcome.paymentMethod}
                              </td>
                              <td className="text-center">
                                {outcome.create_DateOnly}{" "}
                                {outcome.create_TimeOnly}
                              </td>
                              <td className="text-end">
                                {parseInt(outcome.amount).toLocaleString()} MMK
                              </td>
                            </tr>
                          );
                        })
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center text-red-400">
                          No matching records.
                        </td>
                      </tr>
                    )}
                    <tr className="bg-black text-yellow-300 font-bold border-t border-yellow-500">
                      <td colSpan="4" className="text-right pr-4 text-lg"></td>
                      <td className="text-center pr-4 text-lg">Total</td>
                      <td className="text-lg text-end">
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
                    {(totalIncome - totalOutcome).toLocaleString()} MMK
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

      {/* Income Modal */}
      {modalType && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-neutral p-6 rounded-xl w-full max-w-md text-yellow-300">
            <div className=" mb-2 flex flex-col gap-3">
              <span className=" text-lg font-bold ">
                You are current income is{" "}
                {parseInt(
                  groupData.group_member_income_data.find(
                    (member) => member.member_id == session.user.id
                  ).member_income
                ).toLocaleString()}{" "}
                MMK
              </span>
              <h2 className=" text-sm text-white font-semibold">
                {modalType === "add" ? (
                  <span className="text-green-400 flex  gap-1">
                    How much do you want to{" "}
                    <p className="  text-yellow-500">plus</p> your income?
                  </span>
                ) : (
                  <span className="text-green-400  flex  gap-1">
                    How much do you want to{" "}
                    <p className="  text-yellow-500">minus</p> your income?
                  </span>
                )}
              </h2>
            </div>
            <input
              type="number"
              placeholder="Enter amount"
              className="input input-bordered w-full bg-black text-yellow-300"
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
                {loading ? "Submiting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicSavingGroupOld;
