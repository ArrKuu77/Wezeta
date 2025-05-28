import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "../../../../supabaseClient";
import AuthLableInput from "../../../components/authComponent/AuthLableInput";
import SearchuserImage from "../searchUser/SearchuserImage";
import { IoIosPersonAdd } from "react-icons/io";
import { VscLoading } from "react-icons/vsc";
import PublicUserSearch from "./PublicUserSearch";
import PublicCreateGroupState from "./PublicCreateGroupState";

const PublicCreateGroup = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [groupName, setGroupName] = useState("");
  const [step, setStep] = useState(1);
  const [addUserList, setAddUserList] = useState([]);
  console.log(addUserList);

  const handleGroupNameSubmit = (data) => {
    const name = data.group_name
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
    if (!name) return alert("Group name is required.");
    setGroupName(name);
    setStep(2);
  };
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
        {/* Step 1: Group Name */}
        {step === 1 && (
          <div className="bg-gray-900 p-6 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-bold text-yellow-400 text-center mb-6">
              Create New Group
            </h2>
            <form
              onSubmit={handleSubmit(handleGroupNameSubmit)}
              className="space-y-4"
            >
              <AuthLableInput
                register={register}
                errors={errors}
                lableText="Group Name"
                inputType="text"
                idLink="group_name"
                Name="group_name"
              />
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black font-bold hover:scale-105 hover:shadow-xl transition-all"
              >
                Next Step
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Add Users */}
        {step === 2 && (
          <PublicUserSearch
            groupName={groupName}
            setStep={setStep}
            addUserListFun={addUserListFun}
            addUserList={addUserList}
            setAddUserList={setAddUserList}
          />
        )}
        {/* Step 3: A group Create using Add Users and Group Name */}
        {step === 3 && (
          <PublicCreateGroupState
            groupName={groupName}
            addUserList={addUserList}
            setStep={setStep}
          />
        )}
      </div>
    </div>
  );
};

export default PublicCreateGroup;
