import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "../../../components/authComponent/context/AuthContext";
import { supabase } from "../../../../supabaseClient";
import { useLocation } from "react-router-dom";
import { LuCalendarCog } from "react-icons/lu";
import { MdDeleteForever, MdAutoDelete } from "react-icons/md";
import { VscLoading } from "react-icons/vsc";
import toast from "react-hot-toast";

const SavingGroup = () => {
  const { session } = useAuth();
  const location = useLocation();
  const groupId = location.state.group_id;

  const startYear = 2025;
  const endYear = new Date().getFullYear();

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

  const [selectedYear, setSelectedYear] = useState(endYear);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toLocaleString("default", { month: "long" })
  );
  const [selectedUser, setSelectedUser] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDate, setSelectedDate] = useState("all");

  const [groupData, setGroupData] = useState(null);
  const [loadingPage, setLoadingPage] = useState(false);

  // Modal state
  const [modalType, setModalType] = useState(null); // 'add' | 'minus' | null
  const [incomeAmount, setIncomeAmount] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  // delete loading
  const [loadingDelete, setLoadingDelete] = useState(false);

  // Fetch group data function
  const fetchGroupData = useCallback(async () => {
    setLoadingPage(true);
    try {
      const { data: groupRow, error: groupError } = await supabase
        .from("group_detail_create")
        .select("*")
        .eq("group_id", groupId)
        .eq("group_month", selectedMonth)
        .eq("group_year", selectedYear)
        .maybeSingle();

      if (groupError) {
        console.error("Error fetching group_detail_create:", groupError);
        setGroupData(null);
        setLoadingPage(false);
        return;
      }

      if (!groupRow) {
        setGroupData(null);
        setLoadingPage(false);
        return;
      }

      // Fetch outcomes for this group_detail_create id
      const { data: outcomesData, error: outcomesError } = await supabase
        .from("group_detail_create_outCome")
        .select("*")
        .eq("group_detail_create_id", groupRow.id);

      if (outcomesError) {
        console.error("Error fetching outcomes:", outcomesError);
        // still set groupRow (without outcomes)
        setGroupData({ ...groupRow, group_member_outCome_data: [] });
        setLoadingPage(false);
        return;
      }

      // Normalize and attach
      setGroupData({
        ...groupRow,
        group_member_outCome_data: outcomesData || [],
      });
    } catch (err) {
      console.error("Unexpected fetchGroupData error:", err);
      setGroupData(null);
    } finally {
      setLoadingPage(false);
    }
  }, [groupId, selectedMonth, selectedYear]);

  // initial fetch + subscribe to realtime updates
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

  // Derived maps and totals
  const memberExpensesMap = useMemo(() => {
    const map = {};
    (groupData?.group_member_outCome_data || []).forEach((row) => {
      // row.group_detail_create_outCome_list may be an array or single object depending on your data
      const list = Array.isArray(row.group_detail_create_outCome_list)
        ? row.group_detail_create_outCome_list
        : [row.group_detail_create_outCome_list];

      list.forEach((item) => {
        if (!item) return;
        const id = item.UploadUser_id;
        const amount = Number(item.amount || 0);
        map[id] = (map[id] || 0) + (isNaN(amount) ? 0 : amount);
      });
    });
    return map;
  }, [groupData]);
  // console.log(memberExpensesMap);

  const totalOutcome = useMemo(() => {
    return (groupData?.group_member_outCome_data || []).reduce((sum, row) => {
      const list = Array.isArray(row.group_detail_create_outCome_list)
        ? row.group_detail_create_outCome_list
        : [row.group_detail_create_outCome_list];
      const rowSum = list.reduce((s, it) => s + Number(it?.amount || 0), 0);
      return sum + rowSum;
    }, 0);
  }, [groupData]);

  const totalIncome = useMemo(() => {
    return (groupData?.group_member_income_data || []).reduce((sum, m) => {
      return sum + Number(m.member_income || 0);
    }, 0);
  }, [groupData]);

  // Build member balances using group_member_balance if available, otherwise compute
  const memberBalances = useMemo(() => {
    const balancesFromDB = groupData?.group_member_balance || [];
    // create map by id for quick lookup
    const dbMap = balancesFromDB.reduce((acc, b) => {
      acc[b.member_id] = {
        member_id: b.member_id,
        member_name: b.member_name,
        income: Number(b.income || 0),
        expense: Number(b.expense || 0),
        previous_balance: Number(b.previous_balance || 0),
        balance: Number(b.balance || 0),
      };
      return acc;
    }, {});

    // If DB has balances, return that canonical list
    if (balancesFromDB.length > 0) {
      return Object.values(dbMap);
    }

    // fallback: compute from income array + memberExpensesMap
    const computed = (groupData?.group_member_income_data || []).map((m) => {
      const income = Number(m.member_income || 0);
      const expense = memberExpensesMap[m.member_id] || 0;
      const previous = 0; // no previous info
      const balance = previous + income - expense;
      return {
        member_id: m.member_id,
        member_name: m.member_name,
        income,
        expense,
        previous_balance: previous,
        balance,
      };
    });
    return computed;
  }, [groupData, memberExpensesMap]);

  // Filtering of outcome lines (for table)
  const filteredOutcome = useMemo(() => {
    const all = groupData?.group_member_outCome_data || [];
    const lines = all.flatMap((row) =>
      Array.isArray(row.group_detail_create_outCome_list)
        ? row.group_detail_create_outCome_list.map((it) => ({
            ...it,
            metaId: row.id,
            group_detail_create_id:
              row.group_detail_create_id || row.group_detail_create_id,
          }))
        : [
            {
              ...row.group_detail_create_outCome_list,
              metaId: row.id,
              group_detail_create_id:
                row.group_detail_create_id || row.group_detail_create_id,
            },
          ]
    );

    return lines.filter((outcome) => {
      const userMatch =
        selectedUser === "all" || outcome.UploadUser_id === selectedUser;
      const categoryMatch =
        selectedCategory === "all" || outcome.category === selectedCategory;
      const dateMatch =
        selectedDate === "all" || outcome.create_DateOnly === selectedDate;
      return userMatch && categoryMatch && dateMatch;
    });
  }, [groupData, selectedUser, selectedCategory, selectedDate]);

  const totalFilteredOutcome = useMemo(() => {
    return filteredOutcome.reduce((s, it) => s + Number(it.amount || 0), 0);
  }, [filteredOutcome]);

  // --- Handlers: modal open/close ---
  const handleOpenModal = (type) => {
    setModalType(type);
    setIncomeAmount("");
  };
  const handleCloseModal = () => {
    setModalType(null);
    setIncomeAmount("");
    setModalLoading(false);
  };

  const getPreviousMonthYear = (month, year) => {
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

    let index = months.indexOf(month);
    if (index === -1) return { prevMonth: month, prevYear: year };

    if (index === 0) {
      return {
        prevMonth: "December",
        prevYear: year - 1,
      };
    }

    return {
      prevMonth: months[index - 1],
      prevYear: year,
    };
  };

  const handleSubmitIncome = async () => {
    if (!incomeAmount || isNaN(incomeAmount)) {
      toast.error("Please enter a valid amount");
      return;
    }

    setModalLoading(true);

    try {
      // =====================================================
      // 1) GET LATEST GROUP ROW
      // =====================================================
      const { data: groupRow, error: groupErr } = await supabase
        .from("group_detail_create")
        .select("id, group_member_income_data")
        .eq("group_id", groupId)
        .eq("group_month", selectedMonth)
        .eq("group_year", selectedYear)
        .maybeSingle();

      if (groupErr || !groupRow) {
        toast.error("Group data not found");
        setModalLoading(false);
        return;
      }

      // Clone members
      const members = Array.isArray(groupRow.group_member_income_data)
        ? [...groupRow.group_member_income_data]
        : [];

      // =====================================================
      // 2) FIND USER & APPLY INCOME CHANGE
      // =====================================================
      const index = members.findIndex((m) => m.member_id === session.user.id);

      if (index === -1) {
        toast.error("You are not a member of this group");
        setModalLoading(false);
        return;
      }

      const changeAmount =
        (modalType === "add" ? 1 : -1) * parseInt(incomeAmount);

      const oldIncome = Number(members[index].member_income || 0);

      members[index].member_income = Math.max(0, oldIncome + changeAmount);
      console.log(changeAmount);

      // =====================================================
      // 3) GET ALL OUTCOMES FOR THIS MONTH
      // =====================================================
      // const { data: outcomesData, error: outcomesError } = await supabase
      //   .from("group_detail_create_outCome")
      //   .select("group_detail_create_outCome_list")
      //   .eq("group_detail_create_id", groupRow.id);

      // const totalOutcome = (outcomesData || [])
      //   .flatMap((entry) => entry.group_detail_create_outCome_list)
      //   .reduce(
      //     (sum, item) =>
      //       item.UploadUser_id == session.user.id &&
      //       sum + parseInt(item.amount),

      //     0
      //   );
      // console.log(memberExpensesMap[session.user.id]);

      // =====================================================
      // 4) GET PREVIOUS MONTH BALANCE (CARRY OVER)
      // =====================================================
      const { prevMonth, prevYear } = getPreviousMonthYear(
        selectedMonth,
        selectedYear
      );

      const { data: prevRow } = await supabase
        .from("group_detail_create")
        .select("group_member_balance")
        .eq("group_id", groupId)
        .eq("group_month", prevMonth)
        .eq("group_year", prevYear)
        .maybeSingle();

      const prevBalanceMap = {};
      (prevRow?.group_member_balance || []).forEach((b) => {
        prevBalanceMap[b.member_id] = Number(b.balance || 0);
      });
      console.log(prevBalanceMap);

      // =====================================================
      // 5) BUILD NEW BALANCE ARRAY
      // =====================================================
      const newBalance = members.map((mem) => {
        console.log(memberBalances);

        if (mem.member_id == session.user.id) {
          const income = Number(mem.member_income || 0);
          const outcome = memberExpensesMap[session.user.id];
          const prev = Number(prevBalanceMap[mem.member_id] || 0);
          console.log(income, outcome, prev);

          return {
            member_id: mem.member_id,
            member_name: mem.member_name,
            previous_balance: prev,
            balance: income - outcome + prev,
          };
        }
        if (memberBalances.member_id !== session.user.id) {
          return {
            member_id: mem.member_id,
            member_name: mem.member_name,
            previous_balance:
              memberBalances.find((b) => b.member_id === mem.member_id)
                ?.previous_balance || 0,
            balance:
              memberBalances.find((b) => b.member_id === mem.member_id)
                ?.balance || 0,
          };
        }
      });
      console.log(newBalance);

      // =====================================================
      // 6) UPDATE DATABASE
      // =====================================================
      const { error: updateErr } = await supabase
        .from("group_detail_create")
        .update({
          group_member_income_data: members,
          group_member_balance: newBalance,
        })
        .eq("id", groupRow.id);

      if (updateErr) {
        console.error(updateErr);
        toast.error("Failed to update income");
        setModalLoading(false);
        return;
      }

      // Update monthly saving table
      await supabase
        .from("saving-money-for-month")
        .update({ group_member_balance: newBalance })
        .eq("group_id", groupId)
        .eq("group_month", selectedMonth)
        .eq("group_year", selectedYear);

      toast.success("Income updated successfully!");
      await fetchGroupData();
      handleCloseModal();
    } catch (err) {
      console.error("Income update error:", err);
      toast.error("Something went wrong");
    } finally {
      setModalLoading(false);
    }
  };

  // --- Handler: delete an outcome row ---
  const deleteOutcome = async (outcome) => {
    // Only deleting own expense
    if (outcome.UploadUser_id !== session.user.id) {
      toast.error("You can only delete your own expenses.");
      return;
    }

    if (!confirm("Delete this expense? This action cannot be undone.")) {
      return;
    }

    setLoadingDelete(true);

    try {
      // ------------------------------------------------------------------
      //                            FETCH GROUP
      // ------------------------------------------------------------------
      const { data: groupRow, error: groupError } = await supabase
        .from("group_detail_create")
        .select("id, group_member_income_data, group_month, group_year")
        .eq("group_id", groupId)
        .eq("group_month", selectedMonth)
        .eq("group_year", selectedYear)
        .maybeSingle();

      if (groupError || !groupRow) {
        toast.error("Group not found");
        setLoadingDelete(false);
        return;
      }

      // ------------------------------------------------------------------
      //                      FETCH OUTCOME ROW (array structure)
      // ------------------------------------------------------------------
      const { data: allOutcomeRows, error: outcomeFetchError } = await supabase
        .from("group_detail_create_outCome")
        .select("id, group_detail_create_outCome_list")
        .eq("group_detail_create_id", groupRow.id);

      if (outcomeFetchError) throw outcomeFetchError;

      // Flatten full list
      const originalList = (allOutcomeRows || []).flatMap(
        (row) => row.group_detail_create_outCome_list || []
      );

      // Remove targeted outcome from array
      const updatedList = originalList.filter((o) => o.id !== outcome.id);

      // Patch the FIRST row only (your DB design keeps all outcomes in one row)
      if (allOutcomeRows?.length > 0) {
        const rowId = allOutcomeRows[0].id;

        const { error: updateOutcomeError } = await supabase
          .from("group_detail_create_outCome")
          .update({ group_detail_create_outCome_list: updatedList })
          .eq("id", rowId);

        if (updateOutcomeError) throw updateOutcomeError;
      }

      // ------------------------------------------------------------------
      //             RECOMPUTE OUTCOME PER MEMBER (NOW WITHOUT DELETED ITEM)
      // ------------------------------------------------------------------
      const memberOutcomeMap = {};
      updatedList.forEach((o) => {
        const id = o.member_id;
        const amt = Number(o.amount || 0);
        memberOutcomeMap[id] = (memberOutcomeMap[id] || 0) + amt;
      });

      // ------------------------------------------------------------------
      //      GET PREVIOUS MONTH BALANCE (carry over into this month)
      // ------------------------------------------------------------------
      const { prevMonth, prevYear } = getPreviousMonthYear(
        selectedMonth,
        selectedYear
      );

      const { data: prevMonthRow } = await supabase
        .from("group_detail_create")
        .select("group_member_balance")
        .eq("group_id", groupId)
        .eq("group_month", prevMonth)
        .eq("group_year", prevYear)
        .maybeSingle();

      const prevBalanceMap = {};
      (prevMonthRow?.group_member_balance || []).forEach((m) => {
        prevBalanceMap[m.member_id] = Number(m.balance || 0);
      });

      // ------------------------------------------------------------------
      //                 REBUILD group_member_balance ARRAY
      // ------------------------------------------------------------------
      const newMemberBalance = groupRow.group_member_income_data.map((m) => {
        const income = Number(m.member_income || 0);
        const outcomeTotal = Number(memberOutcomeMap[m.member_id] || 0);
        const previousBalance = prevBalanceMap[m.member_id] || 0;

        return {
          member_id: m.member_id,
          member_name: m.member_name,
          previous_balance: previousBalance,
          balance: income - outcomeTotal + previousBalance,
        };
      });

      // ------------------------------------------------------------------
      //                    UPDATE group_detail_create
      // ------------------------------------------------------------------
      const { error: groupUpdateError } = await supabase
        .from("group_detail_create")
        .update({
          group_member_balance: newMemberBalance,
        })
        .eq("id", groupRow.id);
      await supabase
        .from("saving-money-for-month")
        .update({
          group_member_balance: newMemberBalance,
        })
        .eq("group_id", location.state.group_id)
        .eq("group_month", selectedMonth)
        .eq("group_year", selectedYear);

      if (groupUpdateError) throw groupUpdateError;

      toast.success("Outcome deleted & balance updated.");
      await fetchGroupData();
    } catch (err) {
      console.error("deleteOutcome error:", err);
      toast.error("Failed to delete outcome");
    } finally {
      setLoadingDelete(false);
    }
  };

  // prepare select options for members, categories, dates
  const memberOptions = useMemo(() => {
    // Use group_member_income_data to list members (preferred)
    if (!groupData?.group_member_income_data) return [];
    return groupData.group_member_income_data.map((m) => ({
      id: m.member_id,
      name: m.member_name,
    }));
  }, [groupData]);

  const categoryOptions = useMemo(() => {
    const setCats = new Set();
    (groupData?.group_member_outCome_data || []).forEach((row) => {
      const list = Array.isArray(row.group_detail_create_outCome_list)
        ? row.group_detail_create_outCome_list
        : [row.group_detail_create_outCome_list];
      list.forEach((it) => {
        if (it?.category) setCats.add(it.category);
      });
    });
    return Array.from(setCats);
  }, [groupData]);

  const dateOptions = useMemo(() => {
    const setDates = new Set();
    (groupData?.group_member_outCome_data || []).forEach((row) => {
      const list = Array.isArray(row.group_detail_create_outCome_list)
        ? row.group_detail_create_outCome_list
        : [row.group_detail_create_outCome_list];
      list.forEach((it) => {
        if (it?.create_DateOnly) setDates.add(it.create_DateOnly);
      });
    });
    return Array.from(setDates);
  }, [groupData]);

  // ---------- Render ----------
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 text-yellow-300 min-h-screen">
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
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
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
            {months.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {loadingPage ? (
        <div className="text-center py-8">
          <VscLoading className="mx-auto text-4xl animate-spin text-yellow-400" />
          <p className="mt-2">Loading group data...</p>
        </div>
      ) : groupData ? (
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
                {memberOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
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
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
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
                {dateOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Member Balances */}
          <div className="bg-neutral text-yellow-300 p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-3">💰 Member Balances</h2>
            <div className="divide-y divide-gray-700">
              <div className="divide-y divide-gray-700">
                {groupData.group_member_income_data.map((member) => {
                  const income = parseInt(member.member_income);
                  const outcome = memberExpensesMap[member.member_id] || 0;

                  return (
                    <div key={member.member_id} className="py-2 ">
                      <div className="   ">
                        <div className="">
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
                          <div className={`text-sm mt-1 opacity-80 `}>
                            <div
                              className={`${
                                memberBalances.find(
                                  (b) => b.member_id === member.member_id
                                )?.previous_balance < 0
                                  ? "text-red-400"
                                  : "text-green-400"
                              }`}
                            >
                              Previous Balance:{" "}
                              {(
                                memberBalances.find(
                                  (b) => b.member_id === member.member_id
                                )?.previous_balance || 0
                              ).toLocaleString()}{" "}
                              MMK
                            </div>
                            <div>Income: {income.toLocaleString()} MMK</div>
                            <div>
                              Expenses: {outcome.toLocaleString()} MMK
                            </div>{" "}
                          </div>
                        </div>
                        <div
                          className={`${
                            (memberBalances.find(
                              (b) => b.member_id === member.member_id
                            )?.balance || 0) < 0
                              ? "text-red-400"
                              : "text-green-400"
                          } font-bold `}
                        >
                          Balance:{" "}
                          <span>
                            {(
                              memberBalances.find(
                                (b) => b.member_id === member.member_id
                              )?.balance || 0
                            ).toLocaleString()}{" "}
                            MMK
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* <div className=" flex flex-col h">
                {memberBalances.map((member) => {
                  return (
                    <div key={member.member_id} className="py-2   ">
                      <div
                        className={`font-bold text-end mt-2 md:mt-0 ${
                          member.balance < 0 ? "text-red-400" : "text-green-400"
                        }`}
                      >
                        Balance: {member.balance.toLocaleString()} MMK
                      </div>
                    </div>
                  );
                })}
              </div> */}
            </div>
          </div>

          {/* Expenses Table */}
          <div className="bg-neutral text-yellow-300 p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-3">🧾 Member Expenses</h2>
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-sm text-yellow-300 border-separate border-spacing-y-1">
                <thead className="sticky top-0 bg-neutral z-10 rounded-md">
                  <tr className="bg-black rounded-md">
                    <th className="text-end px-3 py-2">Delete</th>
                    <th className="text-center px-3 py-2">Name</th>
                    <th className="text-center px-3 py-2">Method</th>
                    <th className="text-center px-3 py-2">Date & Time</th>
                    <th className="text-center px-3 py-2">Description</th>
                    <th className="text-center px-3 py-2">Category</th>
                    <th className="text-end px-3 py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOutcome.length > 0 ? (
                    filteredOutcome
                      .slice()
                      .reverse()
                      .map((outcome, idx) => {
                        return (
                          <tr
                            key={`${outcome.id || idx}-${idx}`}
                            className={`${
                              session.user.id === outcome.UploadUser_id
                                ? "bg-slate-800 hover:bg-slate-700"
                                : ""
                            } bg-neutral-800 hover:bg-neutral-700 transition-colors`}
                          >
                            <td className="font-semibold text-red-400 text-center py-2">
                              {loadingDelete ? (
                                <div className="relative">
                                  <VscLoading className="text-3xl animate-spin mx-auto" />
                                  <MdAutoDelete className="absolute animate-pulse top-[40%] left-[42%]" />
                                </div>
                              ) : (
                                <MdDeleteForever
                                  onClick={() => deleteOutcome(outcome)}
                                  className="mx-auto text-lg cursor-pointer"
                                />
                              )}
                            </td>
                            <td className="text-center text-nowrap px-3 py-2 font-medium">
                              {outcome.UploadUserName}
                            </td>
                            <td className="text-center px-3 py-2">
                              {outcome.paymentMethod}
                            </td>
                            <td className="text-center px-3 py-2">
                              {outcome.create_DateOnly}{" "}
                              {outcome.create_TimeOnly}
                            </td>
                            <td className="text-center px-3 py-2">
                              {outcome.shopName}
                            </td>
                            <td className="text-center px-3 py-2">
                              {outcome.category}
                            </td>
                            <td className="text-end px-3 py-2 font-semibold text-yellow-400">
                              {Number(outcome.amount || 0).toLocaleString()} MMK
                            </td>
                          </tr>
                        );
                      })
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center text-red-400 py-4">
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

          {/* Summary */}
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
                Extra Money (DB):{" "}
                <span className="font-semibold text-green-400">
                  {Number(
                    memberBalances.reduce((sum, n) => sum + n.balance, 0) || 0
                  ).toLocaleString()}{" "}
                  MMK
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

      {/* Modal for Add/Minus income */}
      {modalType && groupData && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-neutral p-6 rounded-xl w-full max-w-md text-yellow-300">
            <div className="mb-4">
              <p className="text-lg font-bold">
                Your current income is{" "}
                {Number(
                  groupData.group_member_income_data?.find(
                    (m) => m.member_id === session.user.id
                  )?.member_income || 0
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
                disabled={modalLoading}
                className="px-4 py-2 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-400"
              >
                {modalLoading ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavingGroup;
