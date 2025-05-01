import SavingGroup from "../pages/dashboardPage/savingGroup/SavingGroup";
import SavingGroupCreate from "../pages/dashboardPage/savingGroup/SavingGroupCreate";

const saveingGroupDetailRoute = [
  {
    index: true,
    element: <SavingGroup />,
  },
  {
    path: "createDetail",
    element: <SavingGroupCreate />,
  },
];

export default saveingGroupDetailRoute;
