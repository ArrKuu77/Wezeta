import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { Link } from "react-router-dom";
import { ImMenu } from "react-icons/im";
import LogoSmall from "../../assets/logoSmall.png";
import { useAuth } from "../../components/authComponent/context/AuthContext";
import { GiRamProfile } from "react-icons/gi";
const Navbar = () => {
  const {
    session,
    photo,
    googlePhoto,
    updateUserMetaPhoto,
    setGooglePhoto,
    getMedia,
  } = useAuth();
  // console.log(session);

  useEffect(() => {
    const profilePhotoUPD = JSON.parse(
      localStorage.getItem(`${session.user.user_metadata.sub}`)
    );
    const profilePhotoUPDExit = profilePhotoUPD?.userId == session.user.id;
    if (profilePhotoUPDExit) {
      setGooglePhoto(null);
      // console.log("profilePhotoUPDExit");
      updateUserMetaPhoto(
        profilePhotoUPDExit ? null : session.user.user_metadata.avatar_url,
        profilePhotoUPD?.userName
      );
    } else {
      // console.log("NoprofilePhotoUPDExit");

      if (session) {
        const user = session.user;
        const avatarUrl =
          user?.user_metadata?.avatar_url == {}
            ? null
            : user?.user_metadata?.avatar_url;
        setGooglePhoto(avatarUrl);
      }
    }
    if (!googlePhoto) {
      // console.log("getMedia");

      getMedia(session.user.id);
      return;
    }
  }, []);

  const [emailShow, setemailShow] = useState(false);

  return (
    <div className=" mx-auto w-11/12 flex justify-between items-center ">
      <Link to={"/"}>
        <img src={LogoSmall} className=" size-12" alt="" />
        {/* <div className=" bg-gradient-to-br from-gray-600 via-gray-900 to-black  text-2xl gap-1 items-center flex ">
          <span className=" bg-gradient-to-t from-yellow-200 via-yellow-500 to-yellow-950 bg-clip-text text-transparent">
            We
          </span>
          <span className=" bg-gradient-to-t from-yellow-950 via-yellow-500 to-yellow-200 bg-clip-text text-transparent p-1 rounded-lg ">
            Zeta
          </span>
        </div> */}
      </Link>
      {/* hanbager icon*/}
      <div className="drawer w-auto flex items-center justify-between gap-3">
        <div className="avatar relative ">
          <div
            onMouseOver={() => setTimeout(() => setemailShow(true), 1000)}
            onMouseLeave={() => setTimeout(() => setemailShow(false), 1000)}
            className={` ring-yellow-600  !flex justify-center items-center  ring-offset-base-100 w-10  rounded-full ring ring-offset-2`}
          >
            {googlePhoto ? (
              <img
                src={googlePhoto}
                referrerPolicy="no-referrer"
                alt="Profile"
              />
            ) : photo?.length > 0 ? (
              <img
                src={`https://vjhmhyikyllvpirsjpen.supabase.co/storage/v1/object/public/user-photo/${session.user.id}/${photo[0]?.name}`}
                alt="Profile"
              />
            ) : (
              <GiRamProfile className=" w-7 h-7 text-yellow-500 " />
            )}
          </div>
          {emailShow && (
            <h1 className="text-shadow-lg/80 animate-pulse text-shadow-gray-700 absolute text-yellow-500 bottom-[-70%] left-[-150%]">
              {session.user.email}
            </h1>
          )}
        </div>
        <input id="my-drawer" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content">
          {/* Page content here */}
          <label
            htmlFor="my-drawer"
            className=" hover:bg-black hover:text-white text-black btn bg-yellow-600 border-none drawer-button"
          >
            <ImMenu className=" text-xl" />
          </label>
        </div>
        <Sidebar />
      </div>
    </div>
  );
};

export default Navbar;
