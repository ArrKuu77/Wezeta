import React, { useState } from "react";
import { useForm } from "react-hook-form";
import AuthLableInput from "../../../components/authComponent/AuthLableInput";
import { supabase } from "../../../../supabaseClient";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const PublicCreateCategories = () => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm();
  const group = useLocation().state;
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const handleUplodeFunction = async (data) => {
    console.log(data);
    setLoading(true);
    const { data: Categories, error } = await supabase
      .from("public_group_categories")
      .insert([
        { categories_name: data.CategoryName, group_id: group.group_id },
      ]);
    if (error) {
      setLoading(false);
      toast.error("error:" + error);
    } else {
      setLoading(false);
      nav(-1);
      toast.success("Category save successful");
    }
  };
  return (
    <div className="bg-gray-900 p-6 rounded-2xl shadow-lg m-4">
      <form onSubmit={handleSubmit(handleUplodeFunction)} className="space-y-4">
        <AuthLableInput
          register={register}
          errors={errors}
          lableText="Category Name"
          inputType="text"
          idLink="CategoryName"
          Name="CategoryName"
        />

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
            Save Categories
          </button>
        )}
      </form>
    </div>
  );
};

export default PublicCreateCategories;
