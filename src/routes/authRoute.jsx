import SigninPage from "../pages/authPage/SigninPage";
import SignupPage from "../pages/authPage/SignupPage";
import AuthCallback from "../pages/authPage/AuthCallback"; // <-- import here

import AurhPreventRoute from "../components/authComponent/AurhPreventRoute";

const authRoute = [
  {
    path: "/signin",
    element: (
      <AurhPreventRoute>
        <SigninPage />
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
  {
    path: "/auth/callback", // <-- add route for Google OAuth callback
    element: <AuthCallback />,
  },
];

export default authRoute;
