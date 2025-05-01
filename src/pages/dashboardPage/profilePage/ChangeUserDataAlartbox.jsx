import React from "react";
import { TbXboxXFilled } from "react-icons/tb";
import { VscLoading } from "react-icons/vsc";

const ChangeUserDataAlartbox = ({
  children,
  setshowChangeName,
  TextName,
  handleChangeName,
  loading,
}) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50">
      <div className="bg-neutral-900 p-6 rounded-xl border-2 border-yellow-500 w-11/12 md:w-1/2 lg:w-1/3 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl text-white font-bold">
            Change Your {TextName}
          </h1>
          <TbXboxXFilled
            onClick={() => setshowChangeName(false)}
            className="text-red-500 text-2xl cursor-pointer hover:text-red-600"
          />
        </div>
        {children}
        <button
          disabled={loading}
          onClick={handleChangeName}
          className="bg-yellow-500 cursor-pointer hover:bg-yellow-600 text-black font-semibold py-2 px-4 rounded-lg w-full"
        >
          {loading ? (
            <span className=" flex justify-center items-center gap-3 animate-pulse  font-semibold text-white anima ">
              <p>Loading ... </p>{" "}
              <VscLoading className=" size-6 animate-spin" />
            </span>
          ) : (
            `Update ${TextName}`
          )}
        </button>
      </div>
    </div>
  );
};

export default ChangeUserDataAlartbox;
