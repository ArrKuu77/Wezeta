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
import { TbCategoryPlus } from "react-icons/tb";
import Loading from "daisyui/components/loading";
import LoadingImageComponent from "../../../components/lottiesComponent/LoadingImage.component";

const PublicSavingGroupCreate = () => {
  const [categories, setCategories] = useState([]);

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
        .from("public_group_detail_create")
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
    const checkCategoris = async () => {
      const { data: groupCategories } = await supabase
        .from("public_group_categories")
        .select("categories_name")
        .eq("group_id", group.group_id);
      // console.log(groupCategories, group.group_id);

      if (groupCategories) {
        setCategories(groupCategories);
      }
      // console.log("alreadySubmitted", alreadySubmitted);
    };
    checkCategoris();
    checkIncomeSubmitted();
    const channel = supabase
      .channel("public_group_categories_realtime")
      .on(
        "postgres_changes",
        {
          event: "*", // "INSERT", "UPDATE", "DELETE"
          schema: "public",
          table: "public_group_categories",
          filter: `group_id=eq.${group.group_id}`,
        },
        (payload) => {
          // console.log("Realtime category change:", payload);
          checkCategoris(); // Refresh on change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel); // Clean up on unmount
    };
  }, [group.group_id, session.user.id]);

  const handleCategorySelect = (label) => {
    setValue("category", label);
    setStep(2);
    setSelect_category(label);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };
  // ✅ Utility to get previous month name
  // const getPreviousMonthName = () => {
  //   const now = new Date();
  //   const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  //   return prevDate.toLocaleString("default", { month: "long" });
  // };

  // ✅ Utility to get previous saving money
  // const getPreviousSaving = async (group_id) => {
  //   // const prevMonthName = getPreviousMonthName();

  //   const { data, error } = await supabase
  //     .from("saving-money-for-month")
  //     .select("group_saving")
  //     .eq("group_id", group_id)
  //     .eq("group_month", prevMonthName)
  //     .eq("group_year", endYear)

  //     .single();

  //   if (error) {
  //     console.warn("Previous saving fetch error:", error.message);
  //     return 0;
  //   }

  //   return data?.group_saving || 0;
  // };

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
      const ampm = hours >= 12 ? "PM" : "AM";
      const formattedHours = hours % 12 || 12;
      const timeOnly = `${formattedHours}:${minutes
        .toString()
        .padStart(2, "0")} ${ampm}`;

      const newUploadData = {
        amount: data.Amount,
        customerName: data.customerName,
        paymentMethod: data.paymentMethod,
        category: data.category,
        create_DateOnly: dateOnly,
        create_TimeOnly: timeOnly,
        UploadUserName: session.user.user_metadata.full_name,
        UploadUser_id: session.user.id,
      };

      const memberIncomeItem = {
        member_id: session.user.id,
        member_name: session.user.user_metadata.full_name,
        member_income: data.income,
      };

      const { data: existingGroup } = await supabase
        .from("public_group_detail_create")
        .select("*")
        .eq("group_id", group.group_id)
        .eq("group_month", monthName)
        .eq("group_year", endYear)
        .single();

      // const previousSaving = await getPreviousSaving(group.group_id);
      // console.log(existingGroup);
      // console.log(newUploadData);

      if (existingGroup) {
        await supabase.from("public_group_detail_create_outCome").insert([
          {
            group_detail_create_id: existingGroup.id,
            group_detail_create_outCome_list: newUploadData,
          },
        ]);

        // ✅ Income update logic
        let updatedIncome = existingGroup.group_member_income_data || [];
        if (!hasSubmittedIncome) {
          updatedIncome = [...updatedIncome, memberIncomeItem];
        }

        // ✅ Update group_detail_create and savings
        await supabase
          .from("public_group_detail_create")
          .update({
            group_member_income_data: updatedIncome,
          })
          .eq("group_id", group.group_id)
          .eq("group_month", monthName);
      } else {
        // First-time creation for the month

        const { data: insertGroup } = await supabase
          .from("public_group_detail_create")
          .insert([
            {
              group_id: group.group_id,
              group_month: monthName,
              group_year: endYear,
              group_member_income_data: hasSubmittedIncome
                ? []
                : [memberIncomeItem],
            },
          ])
          .select()
          .single();
        // console.log(insertGroup);
        if (insertGroup) {
          await supabase.from("public_group_detail_create_outCome").insert([
            {
              group_detail_create_id: insertGroup.id,
              group_detail_create_outCome_list: newUploadData,
            },
          ]);
        }
      }

      setSuccessMsg("✅ Transaction saved successfully!");
      nav(-1);
    } catch (error) {
      // console.error(error);
      setErrorMsg("❌ Failed to save transaction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4  flex items-center justify-center bg-gray-950">
      <div className="w-full  max-w-xl">
        {step > 1 ? (
          <button
            onClick={handleBack}
            className="mb-4 text-yellow-400 hover:underline"
          >
            ← Back
          </button>
        ) : (
          <Link
            to="/public-saving-group/public-saving-detail"
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {categories.map((cat, idx) => (
                <div
                  key={idx}
                  onClick={() => handleCategorySelect(cat.categories_name)}
                  className="flex flex-col items-center justify-center text-center p-2 bg-gray-800 hover:bg-yellow-500 hover:text-black text-yellow-100 rounded-2xl shadow-md hover:shadow-yellow-500/50 transition-all duration-300 cursor-pointer group"
                >
                  {/* Optional icon or graphic placeholder */}
                  <div className="w-10 h-10 flex items-center justify-center bg-yellow-400 text-black rounded-full text-xl font-bold mb-2 group-hover:scale-110 transition-transform duration-200">
                    {cat.categories_name.charAt(0).toUpperCase()}
                  </div>
                  <p className="font-semibold text-sm truncate w-full">
                    {cat.categories_name}
                  </p>
                </div>
              ))}

              {/* Create New Category Button */}
              <Link to="createCategories" state={group ? group : {}}>
                <div className="flex flex-col items-center justify-center text-center p-2 bg-yellow-400  hover:bg-yellow-500 hover:text-black text-yellow-100 rounded-2xl shadow-md hover:shadow-yellow-500/50 transition-all duration-300 cursor-pointer group">
                  {/* Optional icon or graphic placeholder */}
                  <div className="w-10 h-10 flex items-center justify-center bg-gray-800  rounded-full text-xl font-bold mb-2 group-hover:scale-110 transition-transform duration-200">
                    <TbCategoryPlus className="text-xl " />
                  </div>
                  <p className="font-semibold text-sm truncate w-full ">
                    <p className="font-bold text-sm">Add Category</p>
                  </p>
                </div>
              </Link>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-gray-900 p-6  rounded-2xl shadow-lg">
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
                lableText="Customer Name"
                inputType="text"
                idLink="customerName"
                Name="customerName"
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

export default PublicSavingGroupCreate;
