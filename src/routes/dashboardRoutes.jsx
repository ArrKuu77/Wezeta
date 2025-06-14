import React, { lazy } from "react";
import Home from "../pages/dashboardPage/Home";
import ProfilePage from "../pages/dashboardPage/profilePage/ProfilePage";
import SearchUser from "../pages/dashboardPage/searchUser/SearchUser";
import UserInviters from "../pages/dashboardPage/userInviters/UserInviters";
import SavingGroupDetailLayout from "../pages/dashboardPage/savingGroup/SavingGroupDetailLayout";
import saveingGroupDetailRoutes from "./saveingGroupDetailRoute";
import AcceptGroupList from "../pages/dashboardPage/savingGroup/AcceptGroupList";
import PublicGroupList from "../pages/dashboardPage/publicGroupList/PublicGroupList";
import PublicGroupNoteLayout from "../pages/dashboardPage/publicGroupNoteDetail/PublicGroupNoteLayout";
import publicSavingGroupDetailRoute from "./publicSavingGroupDetailRoute";
import PublicGroupEdit from "../pages/dashboardPage/publicGroupNoteDetail/PublicGroupEdit";
import Testpdf from "../pages/dashboardPage/publicGroupNoteDetail/Testpdf";
import PublicCreateGroup from "../pages/dashboardPage/publicCreateGroup/PublicCreateGroup";
import SummeryPdf from "../pages/dashboardPage/publicGroupNoteDetail/SummeryPdf";
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
    path: "/public-create-group",
    element: <PublicCreateGroup />,
  },
  {
    path: "/public-group-list",
    element: <PublicGroupList />,
  },

  {
    path: "/public-group-list/edit-user",
    element: <PublicGroupEdit />,
  },
  {
    path: "/public-saving-group/export-userPDF",
    element: <Testpdf />,
  },
  {
    path: "/public-saving-group/export-summeryPDF",
    element: <SummeryPdf />,
  },
  {
    path: "/public-saving-group/public-saving-detail",
    element: <PublicGroupNoteLayout />,
    children: [...publicSavingGroupDetailRoute],
  },
  {
    path: "/saving-group/saving-detail",
    element: <SavingGroupDetailLayout />,
    children: [...saveingGroupDetailRoutes],
  },
];

export default publicRoute;
