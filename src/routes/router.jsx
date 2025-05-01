import { createBrowserRouter } from "react-router-dom";

import DashboardLayout from "../pages/dashboardPage/DashboardLayout";
import authRoute from "./authRoute";
import NotFound from "../components/NotFound";
import PreventRoute from "../components/PreventRoute";
import dashboardRoute from "./dashboardRoutes";
const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <PreventRoute>
        <DashboardLayout />
      </PreventRoute>
    ),
    children: [...dashboardRoute],
    errorElement: <NotFound />,
  },
  ...authRoute,
]);

export default router;
