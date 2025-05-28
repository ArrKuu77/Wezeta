// import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
// import { PiNotepadFill } from "react-icons/pi";
import { FaNotesMedical } from "react-icons/fa6";
import { RiArrowGoBackFill } from "react-icons/ri";

const PublicGroupNoteLayout = () => {
  const location = useLocation();
  const group = location.state;
  // console.log(group);

  return (
    <div className="   bg-gray-950  pt-4">
      <div className=" ">
        <div className="text-center">
          <Link to={"/public-group-list"}>
            <div className=" ms-2">
              <button className="gap-2 cursor-pointer flex justify-center items-center px-4 py-2 rounded-2xl bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black font-bold text-lg hover:scale-105 hover:shadow-xl transition-all">
                <RiArrowGoBackFill />
              </button>
            </div>
          </Link>
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
            <h2 className=" bg-gradient-to-t from-yellow-200 via-yellow-500 to-yellow-950 bg-clip-text text-transparent">
              <span className="text-lg font-semibold text-yellow-300">
                {group?.creator?.user_name}
              </span>
              <span className="text-sm font-semibold text-yellow-500">
                ( creator)
              </span>
            </h2>
            {group?.members?.map((member, index) => (
              <div key={index} className="flex items-center gap-2 mt-2">
                <span className="text-sm font-semibold text-yellow-500">
                  {index + 1}:
                </span>
                <span className="">{member.user_name}</span>
                <span className="text-sm font-semibold text-yellow-500">
                  ( member)
                </span>
              </div>
            ))}
            <div>
              <h2 className=" bg-gradient-to-t from-yellow-200 via-yellow-500 to-yellow-950 bg-clip-text text-transparent">
                {group?.user_accept_data?.user_name !==
                  group?.user_join_data?.user_name &&
                  group?.user_accept_data?.user_name}
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

export default PublicGroupNoteLayout;
