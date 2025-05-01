import { lazy, Suspense } from "react";

import SigninPage from "../pages/authPage/SigninPage";

import SignupPage from "../pages/authPage/SignupPage";
import AurhPreventRoute from "../components/authComponent/AurhPreventRoute";
const authRoute = [
  {
    path: "/signin",
    element: (
      <AurhPreventRoute>
        <SigninPage />,
      </AurhPreventRoute>
    ),
  },
  {
    path: "/signup",
    element: (
      <AurhPreventRoute>
        <SignupPage />
      </AurhPreventRoute>
    ),
  },
];

export default authRoute;
