import React from "react";

const AuthLableInput = ({
  lableText,
  inputType,
  idLink,
  // valueName,
  // HandleChange,
  Name,
  register,
  isSubmitting,
  errors,
}) => {
  // console.log(errors?.[Name]);

  return (
    <div>
      <label
        htmlFor={idLink}
        className="block mb-2 text-sm font-medium  bg-clip-text text-transparent  bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-700"
      >
        {lableText}
      </label>
      <input
        {...register(Name, {
          required: true,
          minLength: Name == "password" ? 6 : Name == "name" ? 3 : 0,
          // pattern: {
          //   value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          // },
        })}
        disabled={isSubmitting}
        type={inputType}
        id={idLink}
        name={Name}
        // value={valueName}
        // onChange={HandleChange}
        className={`${
          errors?.[Name]
            ? "focus:border-red-500 focus:ring-red-500 border-red-500 "
            : "focus:ring-green-300 focus:border-green-300 border-slate-300  "
        } disabled:opacity-75  border  text-white text-sm rounded-lg  block w-full p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400  dark:focus:ring-blue-500 dark:focus:border-blue-500`}
        placeholder={lableText.charAt(0).toLowerCase() + lableText.slice(1)}
      />
      {errors?.[Name]?.type === "required" && (
        <p className="text-red-500 mt-2 text-sm shadow shadow-red-600 inline-block animate-bounce ">
          {Name} is required !
        </p>
      )}
      {Name == "email" && errors?.[Name]?.type === "pattern" && (
        <p className="text-red-500 mt-2 text-sm  shadow shadow-red-600 inline-block animate-bounce">
          Invalid email address !
        </p>
      )}
      {Name == "password" && errors.password?.type === "minLength" && (
        <p className="text-red-500 mt-2 text-sm  shadow shadow-red-600 inline-block animate-bounce">
          Password must be at least 6 letters !
        </p>
      )}
      {Name == "name" && errors.password?.type === "minLength" && (
        <p className="text-red-500 mt-2 text-sm  shadow shadow-red-600 inline-block animate-bounce">
          Name must be at least 3 letters !
        </p>
      )}
    </div>
  );
};

export default AuthLableInput;
