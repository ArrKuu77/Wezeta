import { supabase } from "@supabase/auth-ui-shared";
import { useState } from "react";
import { useForm } from "react-hook-form";
// import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
// import useCookie from "react-use-cookie";
// import { login } from "../../../services/auth";
const useSignup = () => {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("msg");

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm();

  //   const [token, setToken] = useCookie("my_token");
  //   const [userCookie, setUserCookie] = useCookie("user");

  const handleLogin = async (data, SignUpUser) => {
    const result = await SignUpUser(data.email, data.password, data.name);

    if (result.success) {
      setMsg(result.success);
    } else {
      setMsg(result.success);
    }
  };

  return {
    handleLogin,
    handleSubmit,
    register,
    isSubmitting,
    errors,
    msg,
  };
};

export default useSignup;
