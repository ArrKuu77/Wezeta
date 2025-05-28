import React, { useState } from "react";
import NavbarLinkComponent from "./NavbarLinkComponents";
import { MdManageAccounts } from "react-icons/md";
import { useAuth } from "../../components/authComponent/context/AuthContext";

const Sidebar = () => {
  const { LogoutUser } = useAuth();

  const [openPrivacy, setOpenPrivacy] = useState(false);
  const [openPublic, setOpenPublic] = useState(false);
  const [openAccount, setOpenAccount] = useState(false);

  return (
    <aside className="bg-gray-900 text-yellow-400 h-full md:h-screen md:sticky md:top-0 w-full md:w-64 lg:w-72 shadow-lg transition-all">
      <div className="p-4 space-y-4">
        {/* Privacy Saving */}
        <div className="border border-yellow-700 rounded-lg shadow-md">
          <button
            onClick={() => setOpenPrivacy(!openPrivacy)}
            className="w-full flex justify-between items-center px-3 py-2 bg-gray-800 hover:bg-yellow-500 hover:text-black font-semibold rounded-t-lg transition"
          >
            <span className="text-sm md:text-base text-nowrap">
              🔒 Privacy Saving
            </span>
            <span>{openPrivacy ? "▲" : "▼"}</span>
          </button>
          {openPrivacy && (
            <ul className="bg-gray-800 px-4 py-2 space-y-2 rounded-b-lg">
              <NavbarLinkComponent
                goPage="search-user"
                PageName="Search User"
              />
              <NavbarLinkComponent
                goPage="user-inviters"
                PageName="User Inviters"
              />
              <NavbarLinkComponent
                goPage="accept-group-list"
                PageName="Accept Group List"
              />
            </ul>
          )}
        </div>

        {/* Public Saving */}
        <div className="border border-yellow-700 rounded-lg shadow-md">
          <button
            onClick={() => setOpenPublic(!openPublic)}
            className="w-full flex justify-between items-center px-3 py-2 bg-gray-800 hover:bg-yellow-500 hover:text-black font-semibold rounded-t-lg transition"
          >
            <span className="text-sm md:text-base text-nowrap">
              🌐 Company Expense
            </span>
            <span>{openPublic ? "▲" : "▼"}</span>
          </button>
          {openPublic && (
            <ul className="bg-gray-800 px-4 py-2 space-y-2 rounded-b-lg">
              <NavbarLinkComponent
                goPage="public-create-group"
                PageName="Create Group"
              />
              <NavbarLinkComponent
                goPage="public-group-list"
                PageName="Group List"
              />
            </ul>
          )}
        </div>

        {/* Account Setting */}
        <div className="border border-yellow-700 rounded-lg shadow-md">
          <button
            onClick={() => setOpenAccount(!openAccount)}
            className="w-full flex justify-between items-center px-3 py-2 bg-gray-800 hover:bg-yellow-500 hover:text-black font-semibold rounded-t-lg transition"
          >
            <span className="text-sm md:text-base text-nowrap">
              ⚙️ Account Setting
            </span>
            <MdManageAccounts className="text-lg" />
          </button>
          {openAccount && (
            <ul className="bg-gray-800 px-4 py-2 space-y-2 rounded-b-lg">
              <NavbarLinkComponent goPage="user-profile" PageName="Profile" />
              <button
                onClick={LogoutUser}
                className="w-full text-left px-4 py-2 text-red-500 bg-gray-800 hover:bg-red-600 hover:text-white rounded font-semibold transition"
              >
                🚪 Log Out
              </button>
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
