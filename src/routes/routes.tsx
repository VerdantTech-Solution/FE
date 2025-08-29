import { Layout } from "@/layouts";
import { Route, Routes as RRDRoutes } from "react-router";
import { allRoutes } from "./all-routes";
import { AdminPage, LoginPage, SignUpPage, SimpleRoleRedirect, EmailVerificationPage, SendVerificationPage } from "@/pages";

export const Routes = () => {
  return (
    <RRDRoutes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/verify-email" element={<EmailVerificationPage />} />
      <Route path="/send-verification" element={<SendVerificationPage />} />
      <Route path="/admin" element={<AdminPage />} />
      
      {/* Route chính - SimpleRoleRedirect không có Layout (không có Navbar) */}
      <Route path="/" element={<SimpleRoleRedirect />} />
      
      {/* Các routes khác sử dụng Layout */}
      <Route element={<Layout />}>
        {allRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.component} />
        ))}
      </Route>
    </RRDRoutes>
  );
};
