import React, { useState } from "react";
import AuthLableInput from "./AuthLableInput";
import SubmitButtom from "./SubmitButtom";
import AuthInOrUp from "./AuthInOrUp";
import useLogin from "./authHook/useLogin";
import { useAuth } from "./context/AuthContext";

const SignInFrom = () => {
  // const [authformData, setAuthformData] = useState({
  //   email: "",
  //   password: "",
  // });
  // console.log(authformData);
  const { handleLogin, handleSubmit, register, isSubmitting, errors, msg } =
    useLogin();

  const LableInputAss = [
    {
      lableText: "Your email",
      inputType: "email",
      idLink: "email",
      // valueName: authformData.email,
      Name: "email",
    },
    {
      lableText: "Password",
      inputType: "password",
      idLink: "password",
      // valueName: authformData.password,
      Name: "password",
    },
  ];
  const { session, LoginUser } = useAuth();
  // console.log(msg, isSubmitting);

  return (
    <form
      onSubmit={handleSubmit((data) => handleLogin(data, LoginUser))}
      className="space-y-4 md:space-y-6"
    >
      <div className="  ">
        <h1 className="text-2xl font-semibold  bg-clip-text text-transparent  bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-700 ">
          SignIn
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
          // valueName={item.valueName}
          // HandleChange={HandleChange}
          Name={item.Name}
        />
      ))}
      <div className="flex items-center justify-between">
        <a
          href="#"
          className="text-sm font-medium text-neutral-500 hover:underline dark:text-neutral-500"
        >
          Forgot password?
        </a>
      </div>
      <SubmitButtom btnText={"Sign In"} isSubmitting={isSubmitting} />
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
        text={"Don’t have an account yet?"}
        LinkDirection={"/signup"}
        btnText={"Sign Up"}
      />
    </form>
  );
};

export default SignInFrom;
