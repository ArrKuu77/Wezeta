import React from "react";
import Lottie from "lottie-react";
import LoadingLottie from "../lotties/loading.json";
const LoadingImageComponent = ({ loadingHeight, loadingWeight, area }) => {
  return (
    <div
      className={`     ${
        area ? `${loadingHeight} ${loadingWeight} ` : `h-[550px]`
      }    flex justify-center items-center flex-col py-10 `}
    >
      <Lottie
        className=" w-[70%] bg-stone-900 rounded-xl"
        animationData={LoadingLottie}
        loop
      />
      <p className=" animate-bounce bg-clip-text text-transparent  bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-700  text-3xl font-bold">
        Saving...
      </p>
    </div>
  );
};

export default LoadingImageComponent;
