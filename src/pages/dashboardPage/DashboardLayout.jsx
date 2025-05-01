import React from "react";
import NavbarLinkComponent from "./NavbarLinkComponents";
import { Link, Outlet } from "react-router-dom";
import { MdManageAccounts } from "react-icons/md";
import { ImMenu } from "react-icons/im";
import Navbar from "./Navbar";

const DashboardLayout = () => {
  return (
    <>
      <nav className=" sticky top-0 z-50  bg-gradient-to-br bg-black/60 backdrop-blur-sm  shadow-lg shadow-neutral-800">
        <div className="  w-full py-3">
          <Navbar />
        </div>
      </nav>
      <div className=" h-screen   bg-gray-950 ">
        <Outlet />
      </div>
    </>
  );
};

export default DashboardLayout;
