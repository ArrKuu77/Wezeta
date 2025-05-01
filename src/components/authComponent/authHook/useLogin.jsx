import { useState } from "react";
import { useForm } from "react-hook-form";
// import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
// import useCookie from "react-use-cookie";
// import { login } from "../../../services/auth";
const useLogin = () => {
  const [msg, setMsg] = useState("msg");
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm();

  //   const [token, setToken] = useCookie("my_token");
  //   const [userCookie, setUserCookie] = useCookie("user");

  const handleLogin = async (data, LoginUser) => {
    const result = await LoginUser(data.email, data.password);

    if (result.success) {
      setMsg(result.success);
      // console.log(result.data);
    } else {
      setMsg(result.success);
    }
  };

  return {
    msg,
    handleLogin,
    handleSubmit,
    register,
    isSubmitting,
    errors,
  };
};

export default useLogin;
