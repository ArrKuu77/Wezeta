import React, { lazy } from "react";
import Home from "../pages/dashboardPage/Home";
import ProfilePage from "../pages/dashboardPage/profilePage/ProfilePage";
import SearchUser from "../pages/dashboardPage/searchUser/SearchUser";
import UserInviters from "../pages/dashboardPage/userInviters/UserInviters";
import SavingGroup from "../pages/dashboardPage/savingGroup/SavingGroup";
import SavingGroupDetailLayout from "../pages/dashboardPage/savingGroup/SavingGroupDetailLayout";
import saveingGroupDetailRoutes from "./saveingGroupDetailRoute";
import AcceptGroupList from "../pages/dashboardPage/savingGroup/AcceptGroupList";
const publicRoute = [
  {
    index: "/",
    element: <Home />,
  },
  {
    path: "/user-profile",
    element: <ProfilePage />,
  },
  {
    path: "/search-user",
    element: <SearchUser />,
  },
  {
    path: "/user-inviters",
    element: <UserInviters />,
  },
  {
    path: "/accept-group-list",
    element: <AcceptGroupList />,
  },
  {
    path: "/saving-group/saving-detail",
    element: <SavingGroupDetailLayout />,
    children: [...saveingGroupDetailRoutes],
  },
];

export default publicRoute;
