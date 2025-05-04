import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { PiNotepadFill } from "react-icons/pi";
import { FaNotesMedical } from "react-icons/fa6";

const SavingGroupDetail = () => {
  const location = useLocation();
  const group = location.state;
  // console.log("group", group);

  return (
    <div className="   bg-gray-950  pt-4">
      <div className=" ">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold  bg-gradient-to-t from-yellow-200 via-yellow-500 to-yellow-950 bg-clip-text text-transparent ">
            Saving Group Detail
          </h1>
        </div>
        <div className="flex items-center justify-between flex-col md:flex-row gap-3 md:gap-0  p-6 max-w-5xl mx-auto space-y-6 text-yellow-300 ">
          <div>
            <div>
              <h2 className="text-2xl font-bold  bg-gradient-to-t from-yellow-200 via-yellow-500 to-yellow-950 bg-clip-text text-transparent">
                Group member
              </h2>
            </div>
            {group?.group_member_income_data?.map((member, index) => (
              <div key={index} className="flex items-center gap-3 mt-2">
                <span className="text-lg font-semibold text-yellow-500">
                  Member{index + 1}:
                </span>
                <span className="text-lg font-semibold text-yellow-300">
                  {member.member_name}
                </span>
              </div>
            ))}
            <div>
              <h2 className=" bg-gradient-to-t from-yellow-200 via-yellow-500 to-yellow-950 bg-clip-text text-transparent">
                {group?.user_accept_data?.user_name}
              </h2>
              <h2 className=" bg-gradient-to-t from-yellow-200 via-yellow-500 to-yellow-950 bg-clip-text text-transparent">
                {group?.user_join_data?.user_name}
              </h2>
            </div>
          </div>
          <div>
            <Link to={"createDetail"} state={group}>
              <div className="">
                <button className="gap-2 cursor-pointer flex justify-center items-center px-4 py-2 rounded-2xl bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black font-bold text-lg hover:scale-105 hover:shadow-xl transition-all">
                  <span>CreateNote</span>
                  <FaNotesMedical />
                </button>
              </div>
            </Link>
          </div>
        </div>
      </div>
      <Outlet />
    </div>
  );
};

export default SavingGroupDetail;
