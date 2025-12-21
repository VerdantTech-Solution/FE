import { Layout } from "@/layouts";
import { Route, Routes as RRDRoutes } from "react-router";
import { allRoutes } from "./all-routes";
import { LoginPage, SignUpPage, SimpleRoleRedirect, EmailVerificationPage, SendVerificationPage, ForgotPasswordPage, ResetPasswordPage, ChangePasswordPage, CartPage, StaffPage } from "@/pages";
import { AdminProtectedRoute, StaffProtectedRoute, VendorProtectedRoute } from "@/components";
import VendorPage from "@/pages/vendor/VendorPage";
import { AdminRouterPage } from "@/pages/admin";

export const Routes = () => {
  return (
    <RRDRoutes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/verify-email" element={<EmailVerificationPage />} />
      <Route path="/send-verification" element={<SendVerificationPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/admin/*" element={
        <AdminProtectedRoute>
          <AdminRouterPage />
        </AdminProtectedRoute>
      } />
       <Route path="/staff" element={
        <StaffProtectedRoute>
          <StaffPage />
        </StaffProtectedRoute>
      } />
    <Route path="/vendor/*" element={
        <VendorProtectedRoute>
          <VendorPage />
        </VendorProtectedRoute>
      } />
     
      
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
