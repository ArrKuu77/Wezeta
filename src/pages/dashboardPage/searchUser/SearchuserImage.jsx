import React, { useEffect, useState } from "react";
import { supabase } from "../../../../supabaseClient";
import { GiRamProfile } from "react-icons/gi";

const SearchuserImage = ({ userId, addDesign = null }) => {
  const [photo, setPhoto] = useState(null);

  const photoFun = async () => {
    const { data, error } = await supabase.storage
      .from("user-photo")
      .list(userId + "/", {
        limit: 1,
        offset: 0,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (data) {
      setPhoto(data);
    }
  };

  useEffect(() => {
    if (userId) {
      photoFun();
    }
  }, [userId]);

  return (
    <div className="h-full w-full flex justify-center items-center">
      {photo?.length > 0 ? (
        <img
          src={`https://vjhmhyikyllvpirsjpen.supabase.co/storage/v1/object/public/user-photo/${userId}/${photo[0]?.name}`}
          alt="Profile"
          className={`  overflow-hidden object-cover p-1   border border-yellow-500 ${
            addDesign ? addDesign : "w-full h-[85px] rounded-full"
          }`}
        />
      ) : (
        <GiRamProfile className="w-full h-full overflow-hidden object-cover p-1 rounded-full border border-yellow-500" />
      )}
    </div>
  );
};

export default SearchuserImage;
