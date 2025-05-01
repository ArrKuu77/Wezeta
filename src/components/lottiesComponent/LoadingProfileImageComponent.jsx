import React from "react";
import Lottie from "lottie-react";
import LoadingLottie from "../lotties/Animation - 1745258714689";
const LoadingProfileImageComponent = ({
  loadingHeight,
  loadingWeight,
  area,
}) => {
  return (
    <div
      className={`  bg-[#151515]   ${
        area ? `${loadingHeight} ${loadingWeight} ` : `h-[550px]`
      }   !opacity-100  flex justify-center items-center flex-col  `}
    >
      <Lottie className=" w-2/5 " animationData={LoadingLottie} loop />
      <p className=" text-white animate-pulse text-xl font-bold">Loading...</p>
    </div>
  );
};

export default LoadingProfileImageComponent;
