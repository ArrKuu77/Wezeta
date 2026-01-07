import React from "react";
import LoadingVideo from "../../assets/PixVerse_V5.5_Image_Text_360P_this_image_objec (1).mp4";

// 🔁 change path to your actual mp4 file

const LoadingImageComponent = ({ loadingHeight, loadingWeight, area }) => {
  return (
    <div
      className={`
        ${area ? `${loadingHeight} ${loadingWeight}` : "h-[550px]"}
        flex flex-col items-center justify-center py-10
      `}
    >
      {/* Loading video */}
      <video
        src={LoadingVideo}
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full rounded-xl bg-stone-900"
      />

      <p className="animate-bounce bg-clip-text text-transparent bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-700 text-3xl font-bold mt-4">
        Saving...
      </p>
    </div>
  );
};

export default LoadingImageComponent;
