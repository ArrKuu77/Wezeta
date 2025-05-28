import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "../../../../supabaseClient";
import AuthLableInput from "../../../components/authComponent/AuthLableInput";
import SearchuserImage from "../searchUser/SearchuserImage";
import { IoIosPersonAdd } from "react-icons/io";
import { VscLoading } from "react-icons/vsc";
import { useLocation } from "react-router-dom";
import PublicUserSearch from "../publicCreateGroup/PublicUserSearch";
import PublicEditGroupState from "./PublicEditGroupState";
import PublicEditUserSearch from "./PublicEditUserSearch";

const PublicGroupEdit = () => {
  const group = useLocation().state;
  // console.log(group);

  const [step, setStep] = useState(2);
  const [addUserList, setAddUserList] = useState([]);
  // console.log(addUserList);
  useEffect(() => {
    if (group && group.members) {
      setAddUserList(group.members);
    }
  }, [group]);
  const addUserListFun = (user, method) => {
    if (method == "addList") {
      const oldUserList = addUserList.find((list) => {
        return list.id == user.id;
      });
      if (oldUserList) {
        setAddUserList([...addUserList]);
      } else {
        setAddUserList([...addUserList, user]);
      }
    } else {
      const UserListFilter = addUserList.filter((list) => {
        return list.id !== user.id;
      });
      setAddUserList(UserListFilter);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 p-4 flex items-center justify-center">
      <div className="w-full max-w-xl">
        {/* Step 2: Add Users */}
        {step === 2 && (
          <PublicEditUserSearch
            groupName={group.group_name}
            setStep={setStep}
            addUserListFun={addUserListFun}
            addUserList={addUserList}
            setAddUserList={setAddUserList}
          />
        )}
        {/* Step 3: A group Create using Add Users and Group Name */}
        {step === 3 && (
          <PublicEditGroupState
            group={group}
            addUserList={addUserList}
            setStep={setStep}
          />
        )}
      </div>
    </div>
  );
};

export default PublicGroupEdit;
