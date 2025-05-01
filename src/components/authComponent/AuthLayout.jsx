import { Link } from "react-router-dom";
import logoAuth from "../../assets/logoAuth.png";
import logoSmall from "../../assets/logoSmall.png";

const AuthLayout = ({ children }) => {
  return (
    <div className="w-full h-screen bg-black relative">
      {/* Background Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-600 via-gray-900 to-black backdrop-blur-sm opacity-70" />

      {/* Content Layer */}
      <section
        data-theme="dark"
        className="absolute z-10 inset-0 flex flex-col items-center justify-center gap-3 px-4 "
      >
        <div className=" text-white  w-full max-w-4xl ">
          <div>
            <h1 className="   text-4xl font-bold  bg-gradient-to-t from-yellow-200 via-yellow-500 to-yellow-950 bg-clip-text text-transparent">
              WeZeta
            </h1>{" "}
            {/* <img src={logoSmall} className=" size-10 " alt="" /> */}
          </div>
          <span className=" text-lg  bg-clip-text text-transparent  bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-700 font-semibold">
            Because We Save Together
          </span>{" "}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 w-full max-w-4xl rounded-2xl overflow-hidden shadow-blue-400/50 shadow-lg">
          {/* Left Image Panel */}
          <div className="hidden md:flex items-center justify-center bg-black">
            <img
              src={logoAuth}
              alt="auth"
              className="w-full h-full object-cover rounded-l-2xl"
            />
          </div>

          {/* Right Content Panel */}
          <div className="p-6 sm:p-8 flex items-center justify-center bg-gradient-to-br from-black via-gray-950 to-gray-600 ">
            <div className="w-full">{children}</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AuthLayout;
