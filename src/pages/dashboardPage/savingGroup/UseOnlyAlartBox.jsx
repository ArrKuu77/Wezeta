import React from "react";

const UseOnlyAlartBox = ({ handleConfirm, handleCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-gray-900 border border-yellow-600 rounded-2xl p-6 max-w-sm w-full shadow-lg text-center space-y-4">
        <p className="text-yellow-300 text-lg font-semibold">
          Are you sure you want to create it for personal storage only?
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-black font-bold transition"
          >
            Yes
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-bold transition"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
};

export default UseOnlyAlartBox;
