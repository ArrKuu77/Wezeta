import React from "react";
import ButtonSpinner from "./ButtonSpinner";

const SubmitButtom = ({ btnText, isSubmitting }) => {
  return (
    <button
      disabled={isSubmitting}
      type="submit"
      className="
      text-yellow-500
      border border-gray-400 hover:border-gray-800 shadow-md shadow-blue-500/80 bg-gradient-to-br from-gray-600 via-gray-950 to-black cursor-pointer select-none w-full  flex disabled:pointer-events-none disabled:opacity-80 justify-center items-center gap-3  hover:bg-gradient-to-br hover:from-black hover:via-gray-950 hover:to-gray-600  focus:ring-4 focus:outline-none focus:ring-neutral-300 font-medium rounded text-sm px-5 py-2.5 text-center dark:bg-neutral-600  dark:focus:ring-neutral-800"
    >
      {isSubmitting ? (
        <span className="  text-lg text-blue-600 font-semibold ">
          <ButtonSpinner />
        </span>
      ) : (
        <span className=" text-lg text-shadow-white font-semibold ">
          {btnText}
        </span>
      )}
    </button>
  );
};

export default SubmitButtom;
