import React from "react";
import Lottie from "lottie-react";
import LoadingLottie from "../lotties/Animation - 1723978064500.json";
const PageLoadingComponent = ({ loadingHeight, loadingWeight, area }) => {
  return (
    <div
      className={`     ${
        area ? `${loadingHeight} ${loadingWeight} ` : `h-[550px]`
      }    flex justify-center items-center flex-col p-1 `}
    >
      <Lottie
        className=" w-[100%] bg-stone-900 rounded-xl"
        animationData={LoadingLottie}
        loop
      />
      <p className=" animate-bounce bg-clip-text text-transparent  bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-700  text-3xl font-bold">
        Loading...
      </p>
    </div>
  );
};

export default PageLoadingComponent;
