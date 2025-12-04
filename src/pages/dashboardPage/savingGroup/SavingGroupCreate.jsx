import React, { useState, useEffect } from "react";
import { IoFastFood, IoShirt, IoHome } from "react-icons/io5";
import { FaBusAlt } from "react-icons/fa";
import { GiPoloShirt } from "react-icons/gi";
import { PiPants, PiPantsFill, PiPhoneCallFill } from "react-icons/pi";
import { MdShoppingCart } from "react-icons/md";
import { TiWiFi } from "react-icons/ti";
import { useForm } from "react-hook-form";
import AuthLableInput from "../../../components/authComponent/AuthLableInput";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../components/authComponent/context/AuthContext";
import { supabase } from "../../../../supabaseClient";
import { FaBowlFood } from "react-icons/fa6";
import { GiHealthNormal } from "react-icons/gi";
import { MdDirectionsCar } from "react-icons/md";
import { IoIosBeer } from "react-icons/io";
import { FcDonate } from "react-icons/fc";
import LoadingImageComponent from "../../../components/lottiesComponent/LoadingImage.component";

const SavingGroupCreate = () => {
  const categories = [
    { icon: <FaBowlFood size={32} />, label: "Food" },
    { icon: <FaBusAlt size={32} />, label: "YBS Bus" },
    { icon: <IoFastFood size={32} />, label: " Snacks" },
    { icon: <GiHealthNormal size={32} />, label: " Medical" },
    { icon: <MdDirectionsCar size={32} />, label: " Car" },
    { icon: <MdShoppingCart size={32} />, label: "Shopping" },
    { icon: <IoHome size={32} />, label: "HomePayment" },
    { icon: <IoShirt size={32} />, label: "Shirt for Men" },
    { icon: <GiPoloShirt size={32} />, label: "Shirt for Women" },
    { icon: <PiPants size={32} />, label: "Pants for Men" },
    { icon: <PiPantsFill size={32} />, label: "Pants for Women" },
    { icon: <TiWiFi size={32} />, label: "WifiPayment" },
    { icon: <IoIosBeer size={32} />, label: "Bar" },
    { icon: <PiPhoneCallFill size={32} />, label: "PhonePayment" },
    { icon: <FcDonate size={32} />, label: "Donate" },
  ];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm();

  const [step, setStep] = useState(1);
  const [hasSubmittedIncome, setHasSubmittedIncome] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const nav = useNavigate();
  const location = useLocation();
  const group = location.state;
  const { session } = useAuth();
  const [select_category, setSelect_category] = useState("");
  const now = new Date();
  const monthName = now.toLocaleString("default", { month: "long" });
  const endYear = new Date().getFullYear();

  useEffect(() => {
    const checkIncomeSubmitted = async () => {
      const { data: existingGroup } = await supabase
        .from("group_detail_create")
        .select("group_member_income_data")
        .eq("group_id", group.group_id)
        .eq("group_month", monthName)
        .eq("group_year", endYear)
        .single();

      const alreadySubmitted = existingGroup?.group_member_income_data?.some(
        (item) => item.member_id === session.user.id
      );
      // console.log("alreadySubmitted", alreadySubmitted);
      setHasSubmittedIncome(alreadySubmitted);
    };

    checkIncomeSubmitted();
  }, [group.group_id, session.user.id]);
  console.log(hasSubmittedIncome);

  const handleCategorySelect = (label) => {
    setValue("category", label);
    setStep(2);
    setSelect_category(label);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };
  // ✅ Utility to get previous month name
  const getPreviousMonthName = () => {
    const now = new Date();
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return prevDate.toLocaleString("default", { month: "long" });
  };

  // ✅ Utility to get previous saving money
  const getPreviousSaving = async (group_id) => {
    const prevMonthName = getPreviousMonthName();

    const { data, error } = await supabase
      .from("saving-money-for-month")
      .select("group_member_balance")
      .eq("group_id", group_id)
      .eq("group_month", prevMonthName)
      .eq("group_year", endYear)

      .single();

    if (error) {
      console.warn("Previous saving fetch error:", error.message);
      return null;
    }

    return data || null;
  };

  const handleUplodeFunction = async (data) => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const now = new Date();
      const dateOnly = `${now.getDate()}.${
        now.getMonth() + 1
      }.${now.getFullYear()}`;
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const formattedHours = hours % 12 || 12;
      const ampm = hours >= 12 ? "PM" : "AM";
      const timeOnly = `${formattedHours}:${String(minutes).padStart(
        2,
        "0"
      )} ${ampm}`;

      // Upload record object
      const newOutcomeRecord = {
        amount: data.Amount,
        shopName: data.ShopName,
        paymentMethod: data.paymentMethod,
        category: data.category,
        create_DateOnly: dateOnly,
        create_TimeOnly: timeOnly,
        UploadUserName: session.user.user_metadata.full_name,
        UploadUser_id: session.user.id,
      };

      // Income object
      const memberIncome = {
        member_id: session.user.id,
        member_name: session.user.user_metadata.full_name,
        member_income: data.income,
      };

      const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

      // Load group for this month
      const { data: existingGroup } = await supabase
        .from("group_detail_create")
        .select("*")
        .eq("group_id", group.group_id)
        .eq("group_month", monthName)
        .eq("group_year", endYear)
        .single();

      // Previous month data
      const previousSaving = await getPreviousSaving(group.group_id);
      const previousSavingValue = toNum(previousSaving?.group_saving);

      // CASE A: Existing month
      if (existingGroup) {
        // Insert outcome
        await supabase.from("group_detail_create_outCome").insert({
          group_detail_create_id: existingGroup.id,
          group_detail_create_outCome_list: newOutcomeRecord,
        });

        // Update income array
        let updatedIncome = existingGroup.group_member_income_data || [];
        if (!hasSubmittedIncome) {
          const exists = updatedIncome.some(
            (m) => m.member_id === memberIncome.member_id
          );
          if (!exists) updatedIncome.push(memberIncome);
        }

        // Calculate total income
        const totalIncome = updatedIncome.reduce(
          (sum, row) => sum + toNum(row.member_income),
          0
        );

        // Fetch all outcomes of this month
        const { data: allOutcomes } = await supabase
          .from("group_detail_create_outCome")
          .select("group_detail_create_outCome_list")
          .eq("group_detail_create_id", existingGroup.id);

        // Per-member outcome calculation
        const perMemberOutcome = {};
        const totalOutcome = (allOutcomes || []).reduce((sum, r) => {
          const o = r.group_detail_create_outCome_list || {};
          const amt = toNum(o.amount);
          const uid = o.UploadUser_id;
          if (uid) perMemberOutcome[uid] = (perMemberOutcome[uid] || 0) + amt;
          return sum + amt;
        }, 0);

        // Combine all members
        const existingBalances = existingGroup.group_member_balance || [];
        const prevBalanceMap = {};
        (previousSaving?.group_member_balance || []).forEach((m) => {
          prevBalanceMap[m.member_id] = toNum(m.balance);
        });

        const members = new Map();
        updatedIncome.forEach((m) => members.set(m.member_id, m));
        existingBalances.forEach((m) => {
          if (!members.has(m.member_id)) {
            members.set(m.member_id, {
              member_id: m.member_id,
              member_name: m.member_name,
              member_income: 0,
            });
          }
        });

        // Final member balance structure
        const Memberbalance = Array.from(members.values()).map((m) => {
          const income = toNum(m.member_income);
          const outcome = toNum(perMemberOutcome[m.member_id]);
          const previous = toNum(prevBalanceMap[m.member_id]);
          const prebalance = income - outcome;
          const balance = prebalance + previous;

          return {
            member_id: m.member_id,
            member_name: m.member_name,

            previous_balance: previous,
            balance,
          };
        });
        console.log(Memberbalance);

        // const extraMoney = totalIncome - totalOutcome + previousSavingValue;

        // Update main group table
        await supabase
          .from("group_detail_create")
          .update({
            group_member_income_data: updatedIncome,
            // extra_money: extraMoney,
            group_member_balance: Memberbalance,
          })
          .eq("group_id", group.group_id)
          .eq("group_month", monthName)
          .eq("group_year", endYear);

        // Update saving-money-for-month
        await supabase
          .from("saving-money-for-month")
          .update({
            // group_saving: extraMoney,
            group_member_balance: Memberbalance,
          })
          .eq("group_id", group.group_id)
          .eq("group_month", monthName)
          .eq("group_year", endYear);
      }

      // CASE B: New month (first time)
      else {
        const incomesArray = hasSubmittedIncome ? [] : [memberIncome];

        const totalIncome = incomesArray.reduce(
          (s, it) => s + toNum(it.member_income),
          0
        );

        const amount = toNum(newOutcomeRecord.amount);

        const prevBalanceForUser = toNum(
          previousSaving?.group_member_balance?.find(
            (m) => m.member_id === session.user.id
          )?.balance
        );

        // const extraMoney = totalIncome - amount + previousSavingValue;

        const Memberbalance = [];

        if (!hasSubmittedIncome) {
          const bal = totalIncome - amount - prevBalanceForUser;
          Memberbalance.push({
            member_id: memberIncome.member_id,
            member_name: memberIncome.member_name,
            // income: toNum(memberIncome.member_income),
            // expense: amount,
            previous_balance: prevBalanceForUser,
            balance: bal,
          });
        }

        (previousSaving?.group_member_balance || []).forEach((m) => {
          if (m.member_id !== session.user.id || hasSubmittedIncome) {
            Memberbalance.push({
              member_id: m.member_id,
              member_name: m.member_name,
              // income: 0,
              // expense: 0,
              previous_balance: toNum(m.balance),
              balance: -toNum(m.balance),
            });
          }
        });

        const { data: newGroup } = await supabase
          .from("group_detail_create")
          .insert([
            {
              group_id: group.group_id,
              group_month: monthName,
              group_year: endYear,
              group_member_income_data: incomesArray,
              // extra_money: extraMoney,
              group_member_balance: Memberbalance,
            },
          ])
          .select()
          .single();

        if (newGroup) {
          await supabase.from("group_detail_create_outCome").insert({
            group_detail_create_id: newGroup.id,
            group_detail_create_outCome_list: newOutcomeRecord,
          });

          await supabase.from("saving-money-for-month").insert({
            group_id: group.group_id,
            group_year: endYear,
            group_month: monthName,
            // group_saving: extraMoney,
            group_member_balance: Memberbalance,
          });
        }
      }

      setSuccessMsg("✅ Transaction saved successfully!");
      nav(-1);
    } catch (err) {
      console.error(err);
      setErrorMsg("❌ Failed to save transaction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4  flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-xl">
        {step > 1 ? (
          <button
            onClick={handleBack}
            className="mb-4 text-yellow-400 hover:underline"
          >
            ← Back
          </button>
        ) : (
          <Link
            to="/saving-group/saving-detail"
            state={group}
            className="mb-4 block text-yellow-400 hover:underline"
          >
            ← Back
          </Link>
        )}

        {step === 1 && (
          <div>
            <h1 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-t from-yellow-600 via-yellow-400 to-yellow-200">
              Select Categories
            </h1>
            <p className="text-sm font-bold text-white mb-4">
              Please Select Choice Categories
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {categories.map((cat, idx) => (
                <div
                  key={idx}
                  onClick={() => handleCategorySelect(cat.label)}
                  className="flex flex-col items-center p-4 bg-gray-800 rounded-2xl cursor-pointer hover:bg-yellow-500 hover:scale-105 transition-all"
                >
                  <div className="text-yellow-300 text-3xl">{cat.icon}</div>
                  <p className="text-white text-nowrap font-semibold mt-2">
                    {cat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-gray-900 p-6 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-bold text-yellow-400 text-center mb-6">
              Add Transaction
            </h2>
            <div className=" text-md font-bold  my-2 flex items-center gap-2">
              <span>Select Category</span>
              <span>{<h2>{select_category}</h2>}</span>
            </div>
            {loading && (
              <p className="text-yellow-300 mb-4 text-center">
                <span className="animate-spin size-5 "> ⏳ </span>
                <span> Saving transaction...</span>
              </p>
            )}
            {successMsg && (
              <p className="text-green-400 mb-4 text-center">{successMsg}</p>
            )}
            {errorMsg && (
              <p className="text-red-500 mb-4 text-center">{errorMsg}</p>
            )}

            <form
              onSubmit={handleSubmit(handleUplodeFunction)}
              className="space-y-4"
            >
              <AuthLableInput
                register={register}
                errors={errors}
                lableText="Amount"
                inputType="number"
                idLink="amount"
                Name="Amount"
              />
              <AuthLableInput
                register={register}
                errors={errors}
                lableText="Description"
                inputType="text"
                idLink="ShopName"
                Name="ShopName"
              />
              <div className="flex flex-col">
                <label className="text-gray-300 mb-1 font-medium">
                  Payment Method
                </label>
                <select
                  {...register("paymentMethod", { required: true })}
                  className="px-4 py-2 rounded-xl bg-gray-800 text-white border border-gray-700 focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="" disabled>
                    Select Method
                  </option>
                  <option value="cash">Cash</option>
                  <option value="K_pay">K Pay</option>
                </select>
              </div>
              {!hasSubmittedIncome ? (
                <AuthLableInput
                  register={register}
                  errors={errors}
                  lableText="Monthly Income"
                  inputType="number"
                  idLink="income"
                  Name="income"
                />
              ) : (
                <p className="text-green-400">
                  ✅ Income for this month already submitted.
                </p>
              )}
              {loading ? (
                <button
                  disabled={loading}
                  type="button"
                  className={` ${
                    loading ? " opacity-30" : "opacity-100"
                  } w-full py-3 rounded-xl bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black font-bold hover:scale-105 hover:shadow-xl transition-all`}
                >
                  Saving...
                </button>
              ) : (
                <button
                  type="submit"
                  className=" w-full py-3 rounded-xl bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black font-bold hover:scale-105 hover:shadow-xl transition-all"
                >
                  Save Transaction
                </button>
              )}
            </form>
          </div>
        )}
      </div>
      {loading && (
        <div className=" absolute top-0 right-0 w-full h-full bg-black/80 flex justify-center items-center   ">
          <div className="  w-1/2   rounded-xl">
            <LoadingImageComponent
              loadingWeight={"w-full"}
              loadingHeight={"h-full"}
              area={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SavingGroupCreate;
