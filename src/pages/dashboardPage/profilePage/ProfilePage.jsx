import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../../../components/authComponent/context/AuthContext";
import { GiRamProfile } from "react-icons/gi";
import { BiEdit } from "react-icons/bi";
import { HiCamera } from "react-icons/hi";
import { data, Link } from "react-router-dom";
import { TbXboxXFilled } from "react-icons/tb";
import { v4 as uuid4 } from "uuid";
import { supabase } from "../../../../supabaseClient";
import avatar from "daisyui/components/avatar";
import ChangeUserDataAlartbox from "./ChangeUserDataAlartbox";
import ChangeUserInputDetail from "./ChangeUserInputDetail";
import LoadingProfileImageComponent from "../../../components/lottiesComponent/LoadingProfileImageComponent";
const ProfilePage = () => {
  const {
    session,
    photo,
    googlePhoto,
    setGooglePhoto,
    getMedia,
    updateUserMetaPhoto,
    LogoutUser,
  } = useAuth();
  const [showChangeName, setshowChangeName] = useState(false);
  const [showChangePassword, setshowChangePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const refNameChange = useRef(null);
  const refPasswordChange = useRef(null);
  const refConfirmPasswordChange = useRef(null);

  const refImgInput = useRef(null);
  const handleClickImageInput = () => {
    refImgInput.current.click();
  };
  const userDataUpdateFunction = async (name, password) => {
    const profilePhotoUPD = JSON.parse(
      localStorage.getItem(`${session.user.user_metadata.sub}`)
    );
    const profilePhotoUPDExit = profilePhotoUPD?.usreID == session.user.id;

    const { success, error, dataFet } = await updateUserMetaPhoto(
      profilePhotoUPDExit ? null : session.user.user_metadata.avatar_url,
      name,
      password
    );
    return { success, error, dataFet };
  };
  const handleUpdateImage = async (event) => {
    setLoadingImage(true);
    let file = event.target.files[0];

    const { success, error, dataFet } = await updateUserMetaPhoto(
      null,
      session.user.user_metadata.full_name
    );
    if (success) {
      const { data, error } = await supabase.storage
        .from("user-photo")
        .upload(session.user.id + "/" + uuid4(), file);
      if (data) {
        setGooglePhoto(null);
        setLoadingImage(false);
        getMedia(session.user.id);
        localStorage.setItem(
          `${session.user.user_metadata.sub}`,
          JSON.stringify({
            userId: session.user.id,
            userName: session.user.user_metadata.full_name,
          })
        );
      } else {
        setLoadingImage(false);
        alert("Error upload false" + error);
      }
    } else {
      setLoadingImage(false);
      alert("Error updating false" + error);
    }
  };

  const handleChangeName = async () => {
    setLoading(true);
    if (refNameChange.current.value.length < 3) {
      alert("Your name needs to be at least 3 characters.");
      setLoading(false);
    } else {
      const { success, error } = await userDataUpdateFunction(
        refNameChange.current.value,
        null
      );
      if (success) {
        localStorage.setItem(
          `${session.user.user_metadata.sub}`,
          JSON.stringify({
            userId: session.user.id,
            userName: refNameChange.current.value,
          })
        );
        // console.log(session.user.email);
        // console.log(refNameChange.current.value);

        const { data: upData, error } = await supabase
          .from("user-data")
          .update({
            user_name: refNameChange.current.value,
          })
          .eq("user_email", session.user.email.trim())
          .select();

        if (!error) {
          // console.log(upData);
          setshowChangeName(false);
          setLoading(false);
        } else {
          console.log(error);
        }
      } else {
        alert("Error updating false" + error);
        setshowChangeName(false);
        setLoading(false);
      }
    }
  };
  const handleChangePassword = async () => {
    setLoading(true);
    if (
      refPasswordChange.current.value != refConfirmPasswordChange.current.value
    ) {
      alert(" Password and confirm password do not match");
      setLoading(false);
    } else if (
      refPasswordChange.current.value.length < 6 ||
      refConfirmPasswordChange.current.value.length < 6
    ) {
      alert("Your password needs to be at least 6 characters.");
      setLoading(false);
    } else {
      const { success, error } = await userDataUpdateFunction(
        session.user.user_metadata.full_name,
        refPasswordChange.current.value
      );
      if (success) {
        LogoutUser();
        setshowChangePassword(false);
        setLoading(false);
      } else {
        alert("Error Change password fall");
        setshowChangePassword(false);
        setLoading(false);
      }
    }
  };
  return (
    <div className="text-white py-5 px-4 md:px-10 grid gap-6 grid-cols-1 lg:grid-cols-5">
      {/* Left Column - Profile Image */}
      <div className="lg:col-span-2 flex flex-col justify-center items-center gap-4 relative">
        <h1 className="text-3xl font-bold text-yellow-500 mb-4">My Profile</h1>

        <div className="relative rounded-b-2xl  shadow-lg shadow-yellow-800 ">
          {loadingImage && (
            <div className="absolute inset-0 overflow-hidden flex items-center justify-center  bg-black/50 rounded-2xl">
              <LoadingProfileImageComponent
                loadingHeight={
                  "h-full w-full !bg-gradient-to-br from-yellow-500 via-yellow-700 to-yellow-900  "
                }
                area={true}
              />
            </div>
          )}

          {googlePhoto ? (
            <img
              src={googlePhoto}
              referrerPolicy="no-referrer"
              alt="Profile"
              className="object-cover w-60 h-60 border-2 border-yellow-500 rounded-2xl shadow-lg"
            />
          ) : photo?.length > 0 ? (
            <img
              src={`https://vjhmhyikyllvpirsjpen.supabase.co/storage/v1/object/public/user-photo/${session.user.id}/${photo[0]?.name}`}
              alt="Profile"
              className="object-cover w-60 h-60 border-2 border-yellow-500 rounded-2xl shadow-lg"
            />
          ) : (
            <GiRamProfile className="w-60 h-60 border-2 border-yellow-500 rounded-2xl p-4 text-yellow-500 bg-black" />
          )}

          <input
            onChange={handleUpdateImage}
            ref={refImgInput}
            type="file"
            className="hidden"
          />

          <button
            onClick={handleClickImageInput}
            className="absolute bottom-0 w-full flex items-center justify-center gap-2 bg-black/80 text-yellow-400 py-2 rounded-b-2xl text-lg cursor-pointer  font-semibold"
          >
            <HiCamera /> <span>Update Image</span>
          </button>
        </div>

        <p className="text-sm text-gray-400">Your profile image</p>
      </div>

      {/* Right Column - Details */}
      <div className="lg:col-span-3 flex flex-col justify-center gap-4">
        <div className="flex justify-between items-center border border-white/20 rounded-xl p-4 bg-black/40 shadow-md">
          <div className="flex gap-3 items-center">
            <label className="font-semibold text-yellow-400">Name:</label>
            <h1 className="text-lg">{session.user.user_metadata.full_name}</h1>
          </div>
          <BiEdit
            onClick={() => setshowChangeName(!showChangeName)}
            className="text-yellow-400 text-2xl cursor-pointer hover:text-yellow-500"
          />
        </div>

        <div className="flex justify-between items-center border border-white/20 rounded-xl p-4 bg-black/40 shadow-md">
          <div className="flex gap-3 items-center">
            <label className="font-semibold text-yellow-400">Email:</label>
            <h1 className="text-lg">{session?.user?.email}</h1>
          </div>
        </div>

        {session?.user?.app_metadata?.provider === "google" ? (
          <div className="flex justify-center border border-white/20 rounded-xl p-4 bg-black/40 shadow-md">
            <h1 className="text-yellow-400 font-semibold">
              You are logged in with Google
            </h1>
          </div>
        ) : (
          <div className="flex justify-center border border-white/20 rounded-xl p-4 bg-black/40 shadow-md">
            <button
              onClick={() => setshowChangePassword(!showChangePassword)}
              className="text-yellow-400 font-semibold  cursor-pointer w-full h-full"
            >
              Change Password
            </button>
          </div>
        )}
      </div>

      {/* Change Name Modal */}
      {showChangeName && (
        <ChangeUserDataAlartbox
          loading={loading}
          setshowChangeName={setshowChangeName}
          TextName="Name"
          handleChangeName={handleChangeName}
        >
          <ChangeUserInputDetail
            loading={loading}
            refNameChange={refNameChange}
            TextForm={"NewName"}
            TextLable={"New Name"}
            placeholder={"Fill your new name ..."}
            type="text"
          />
        </ChangeUserDataAlartbox>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <ChangeUserDataAlartbox
          loading={loading}
          setshowChangeName={setshowChangePassword}
          TextName="Password"
          handleChangeName={handleChangePassword}
        >
          <ChangeUserInputDetail
            loading={loading}
            refNameChange={refPasswordChange}
            TextForm={"NewPassword"}
            TextLable={"New Password"}
            placeholder={"Fill your new password ..."}
            type="password"
          />
          <ChangeUserInputDetail
            loading={loading}
            refNameChange={refConfirmPasswordChange}
            TextForm={"ConfirmNewPassword"}
            TextLable={"Confirm New Password"}
            placeholder={"Fill your confirm new password ..."}
            type="password"
          />
        </ChangeUserDataAlartbox>
      )}
    </div>
  );
};

export default ProfilePage;

// useEffect(() => {
//   const profilePhotoUPD = JSON.parse(
//     localStorage.getItem(`${session.user.user_metadata.sub}`)
//   );
//   const profilePhotoUPDExit = profilePhotoUPD?.userId == session.user.id;
//   if (profilePhotoUPDExit) {
//     setGooglePhoto(null);
//     updateUserMetaPhoto(
//       profilePhotoUPDExit ? null : session.user.user_metadata.avatar_url,
//       profilePhotoUPD?.userName
//     );
//   } else {
//     if (session) {
//       const user = session.user;
//       const avatarUrl =
//         user?.user_metadata?.avatar_url == {}
//           ? null
//           : user?.user_metadata?.avatar_url;
//       setGooglePhoto(avatarUrl);
//     }
//   }
//   if (!googlePhoto) {
//     getMedia(session.user.id);
//     return;
//   }
// }, []);
