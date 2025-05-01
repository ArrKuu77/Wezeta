import React from "react";
import Lottie from "lottie-react";
import ErrorImage from "../../lotties/Animation - ErrorImage.json";
const ErrorImageComponent = ({ loadingHeight, loadingWeight, area }) => {
  return (
    <div
      className={`  bg-[#151515] ${
        area ? `${loadingHeight} ${loadingWeight} ` : `h-[550px]`
      }  !opacity-100  flex justify-center items-center flex-col  `}
    >
      <Lottie className=" w-1/2 " animationData={ErrorImage} loop />
      <p className=" text-white text-xl font-bold">Error Image try again...</p>
    </div>
  );
};

export default ErrorImageComponent;
