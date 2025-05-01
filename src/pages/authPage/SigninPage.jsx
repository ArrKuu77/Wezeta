import React, { useState } from "react";
import AuthLayout from "../../components/authComponent/AuthLayout";
import SignInForm from "../../components/authComponent/SignInForm";
import SignInwithGoogle from "../../components/authComponent/SignInwithGoogle";

const SigninPage = () => {
  return (
    <AuthLayout>
      <SignInForm />
      <div className="h-[1px] bg-cyan-500  w-full my-3" />
      <SignInwithGoogle />
    </AuthLayout>
  );
};

export default SigninPage;
