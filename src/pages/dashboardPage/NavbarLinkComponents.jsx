import React from "react";
import { BsPersonWorkspace } from "react-icons/bs";
import { NavLink } from "react-router-dom";

const NavbarLinkComponent = ({ goPage, PageName }) => {
  return (
    <li className=" my-1 w-full">
      <NavLink className="w-full flex justify-between items-center" to={goPage}>
        <span>{PageName}</span>
      </NavLink>
    </li>
  );
};

export default NavbarLinkComponent;
