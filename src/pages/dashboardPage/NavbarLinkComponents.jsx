import React from "react";
import { BsPersonWorkspace } from "react-icons/bs";
import { NavLink } from "react-router-dom";

const NavbarLinkComponent = ({ goPage, PageName, icon }) => {
  return (
    <li className="w-full">
      <NavLink
        to={goPage}
        className={({ isActive }) =>
          `w-full flex items-center gap-3 px-1 py-0.5 md:px-4 md:py-2 rounded transition duration-300 font-medium
          ${
            isActive
              ? "bg-yellow-500 text-black"
              : "text-yellow-400 hover:bg-yellow-500 hover:text-black"
          }`
        }
      >
        <span className=" text-sm text-nowrap">{PageName}</span>
      </NavLink>
    </li>
  );
};

export default NavbarLinkComponent;
