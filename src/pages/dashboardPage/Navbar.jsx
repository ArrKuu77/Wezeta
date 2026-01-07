import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { Link } from "react-router-dom";
import { ImMenu } from "react-icons/im";
import LogoSmall from "../../assets/logoSmall.png";
import { useAuth } from "../../components/authComponent/context/AuthContext";
import logo from "../../assets/logoAuth.png";

const Navbar = () => {
  const {
    session,
    photo,
    googlePhoto,
    updateUserMetaPhoto,
    setGooglePhoto,
    getMedia,
  } = useAuth();

  const [emailShow, setEmailShow] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!session) return;

    const localPhoto = JSON.parse(
      localStorage.getItem(`${session.user.user_metadata.sub}`)
    );
    const isLocal = localPhoto?.userId === session.user.id;

    if (isLocal) {
      setGooglePhoto(null);
      updateUserMetaPhoto(null, localPhoto?.userName);
    } else {
      const avatar = session.user?.user_metadata?.avatar_url;
      setGooglePhoto(avatar || null);
    }

    if (!googlePhoto) {
      getMedia(session.user.id);
    }
  }, [session]);

  return (
    <>
      {/* Top Navbar */}
      <div className="w-full bg-black text-yellow-400 shadow-md">
        <div className="w-11/12 mx-auto flex justify-between items-center py-3">
          {/* Logo */}
          <Link to="/">
            <img src={LogoSmall} alt="Logo" className="h-12" />
          </Link>

          {/* Right: Avatar and Menu */}
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div
              className="relative cursor-pointer"
              onMouseOver={() => setEmailShow(true)}
              onMouseLeave={() => setEmailShow(false)}
            >
              <div className="w-10 h-10 rounded-full ring ring-yellow-600 ring-offset-2 overflow-hidden flex items-center justify-center">
                {googlePhoto ? (
                  <img
                    src={googlePhoto}
                    alt="Google Profile"
                    referrerPolicy="no-referrer"
                  />
                ) : photo?.length > 0 ? (
                  <img
                    src={`https://bgvxqjymtdtvmbsqxtxk.supabase.co/storage/v1/object/public/user-photo/${session.user.id}/${photo[0]?.name}`}
                    alt="Stored Profile"
                  />
                ) : (
                  <img src={logo} alt="Default Profile" />
                )}
              </div>
              {emailShow && (
                <span className="absolute left-[-150%] bottom-[-70%] bg-yellow-600 text-black text-xs p-2 rounded shadow-lg">
                  {session.user.email}
                </span>
              )}
            </div>

            {/* Hamburger Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 cursor-pointer bg-yellow-500 text-black rounded hover:bg-yellow-400"
            >
              <ImMenu className="text-xl" />
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed top-0 left-0 h-full  z-50 bg-gray-900 transform transition-transform duration-300 `}
      >
        <div className=" mt-3  h-screen p-3 bg-gray-900 text-yellow-400  ">
          <div className="flex justify-end w-full md:w-64 lg:w-72">
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-yellow-400 cursor-pointer hover:text-red-500 text-lg font-bold"
            >
              ✕
            </button>
          </div>
          <Sidebar />
        </div>
      </div>
    </>
  );
};

export default Navbar;
