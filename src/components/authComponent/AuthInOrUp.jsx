import React from "react";
import { Link } from "react-router-dom";

const AuthInOrUp = ({ text, LinkDirection, btnText }) => {
  return (
    <p className="  select-none text-sm font-light text-neutral-500 dark:text-neutral-400">
      {text}{" "}
      <Link to={LinkDirection}>
        <button className=" cursor-pointer font-medium text-blue-600 hover:underline dark:text-blue-500">
          {btnText}
        </button>
      </Link>
    </p>
  );
};

export default AuthInOrUp;
