import React from "react";
import NavbarLinkComponent from "./NavbarLinkComponents";
import { MdManageAccounts } from "react-icons/md";
import { useAuth } from "../../components/authComponent/context/AuthContext";

const Sidebar = () => {
  const { LogoutUser } = useAuth();
  return (
    <div className="drawer-side">
      <label
        htmlFor="my-drawer"
        aria-label="close sidebar"
        className="drawer-overlay"
      ></label>
      <ul className="menu bg-base-300 text-base-content min-h-full w-1/2 md:w-[30%] lg:w-[22%] p-4 gap-5">
        {/* Sidebar content here */}
        <details className="dropdown text-white w-full ">
          <summary className="btn hover:bg-black text-white  bg-neutral-700 flex items-center gap-3 justify-center  text-lg m-1">
            <p>Trending</p>
            {/* <TbTrendingUp /> */}
          </summary>
          <ul className=" w-full shadow-lg shadow-neutral-800 rounded-box bg-neutral-900 p-2 ">
            <NavbarLinkComponent
              goPage={"search-user"}
              PageName={"SearchUser"}
            />
            <NavbarLinkComponent
              goPage={"user-inviters"}
              PageName={"UserInviters"}
            />
            <NavbarLinkComponent
              goPage={"accept-group-list"}
              PageName={"AcceptGroupList"}
            />
          </ul>
        </details>
        <details className="dropdown text-white w-full ">
          <summary className="btn hover:bg-black text-white  bg-neutral-700 flex items-center justify-center gap-3  text-lg m-1">
            <p>AccountSetting</p>
            <MdManageAccounts />
          </summary>
          <ul className=" w-full shadow-lg shadow-neutral-800 rounded-box bg-neutral-900 p-2 ">
            <NavbarLinkComponent goPage={"user-profile"} PageName={"Profile"} />
            <button
              onClick={LogoutUser}
              className=" flex justify-between hover:text-white items-center my-3 text-md hover:bg-red-500 rounded-lg py-2 px-4 bg-neutral-900 w-full text-start text-red-600 font-bold"
            >
              <p>LogOut</p>
              {/* <RiLogoutBoxRFill /> */}
            </button>
          </ul>
        </details>
      </ul>
    </div>
  );
};

export default Sidebar;
