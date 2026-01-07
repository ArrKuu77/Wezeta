import React from "react";
// ⬆️ replace with your actual video path
import loadingVideo from "../../assets/PixVerse_V5.5_Image_Text_360P_this_image_objec.mp4";

const PageLoadingComponent = ({ loadingHeight, loadingWeight, area }) => {
  return (
    <div
      className={`
        ${area ? `${loadingHeight} ${loadingWeight}` : "h-[550px] w-full"}
        flex flex-col items-center justify-center p-1
      `}
    >
      <div className="relative w-48 h-48 mb-4 overflow-hidden flex items-center justify-center">
        {/* Loading video */}
        <video
          src={loadingVideo}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-contain"
        />

        {/* Optional shadow */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-3 bg-black/20 blur-md rounded-full animate-pulse-soft" />
      </div>

      <p className="animate-pulse bg-clip-text text-transparent bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-700 text-xl font-bold">
        Page Loading...
      </p>
    </div>
  );
};

export default PageLoadingComponent;
