import React from "react";

const ChangeUserInputDetail = ({
  refNameChange,
  TextLable,
  placeholder,
  TextForm,
  InputType,
  loading,
}) => {
  return (
    <div className=" flex flex-col gap-2 justify-center mb-3 ">
      <label className=" text-sm font-bold" htmlFor={`${TextForm}`}>
        {TextLable}
      </label>
      <input
        disabled={loading}
        ref={refNameChange}
        type={`${InputType}`}
        id={`${TextForm}`}
        placeholder={`${placeholder}`}
        className="w-full p-2  rounded-lg border bg-white text-black"
      />
    </div>
  );
};

export default ChangeUserInputDetail;
