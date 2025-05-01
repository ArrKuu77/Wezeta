import React, { useState } from "react";
import { Link } from "react-router-dom";
import AuthLableInput from "./AuthLableInput";
import SubmitButtom from "./SubmitButtom";
import AuthInOrUp from "./AuthInOrUp";
import useSignup from "./authHook/useSignup";
import { useAuth } from "./context/AuthContext";

const SignUpFrom = () => {
  // const [authformData, setAuthformData] = useState({
  //   email: "",
  //   password: "",
  //   name: "",
  // });
  // console.log(authformData);

  // const HandleChange = (e) => {
  //   setAuthformData((pre) => ({ ...pre, [e.target.name]: e.target.value }));
  // };
  const { handleLogin, handleSubmit, register, isSubmitting, errors, msg } =
    useSignup();
  const { session, SignUpUser } = useAuth();
  // console.log(session, isSubmitting, errors);
  const LableInputAss = [
    {
      lableText: "Create Your Name",
      inputType: "text",
      idLink: "CreateName",
      Name: "name",
    },
    {
      lableText: "Email Address",
      inputType: "email",
      idLink: "email",
      Name: "email",
    },
    {
      lableText: "Password",
      inputType: "password",
      idLink: "password",
      Name: "password",
    },
  ];
  return (
    <form
      onSubmit={handleSubmit((data) => handleLogin(data, SignUpUser))}
      className="space-y-4 md:space-y-6"
    >
      <div className="  ">
        <h1 className="text-2xl font-semibold  bg-clip-text text-transparent  bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-700 ">
          SignUP
        </h1>
      </div>
      {LableInputAss.map((item, index) => (
        <AuthLableInput
          register={register}
          key={index}
          isSubmitting={isSubmitting}
          errors={errors}
          lableText={item.lableText}
          inputType={item.inputType}
          idLink={item.idLink}
          Name={item.Name}
        />
      ))}

      <SubmitButtom btnText={"Sign Up"} isSubmitting={isSubmitting} />
      <h1
        className={`text-lg mb-2 animate-bounce transition ease-in-out  ${
          msg == "msg"
            ? " hidden"
            : msg
            ? "text-green-500 inline-block"
            : "text-red-500 inline-block"
        }`}
      >
        {msg ? "Login Successful !" : "Login failed !"}
      </h1>
      <AuthInOrUp
        text={"Do you have an account yet?"}
        LinkDirection={"/signin"}
        btnText={"Sign In"}
      />
    </form>
  );
};

export default SignUpFrom;
