import PublicCreateCategories from "../pages/dashboardPage/publicGroupNoteDetail/PublicCreateCategories";
import PublicSavingGroup from "../pages/dashboardPage/publicGroupNoteDetail/PublicSavingGroup";
import PublicSavingGroupCreate from "../pages/dashboardPage/publicGroupNoteDetail/PublicSavingGroupCreate";

const publicSavingGroupDetailRoute = [
  {
    index: true,
    element: <PublicSavingGroup />,
  },
  {
    path: "createDetail",
    element: <PublicSavingGroupCreate />,
  },

  {
    path: "createDetail/createCategories",
    element: <PublicCreateCategories />,
  },
];

export default publicSavingGroupDetailRoute;
