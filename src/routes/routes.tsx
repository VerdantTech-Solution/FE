import { Layout } from "@/layouts";
import { Route, Routes as RRDRoutes } from "react-router";
import { allRoutes } from "./all-routes";
import { AdminPage, LoginPage, SignUpPage, SimpleRoleRedirect } from "@/pages";

export const Routes = () => {
  return (
    <RRDRoutes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/admin" element={<AdminPage />} />
      
      
      <Route element={<Layout />}>
       <Route path="/" element={<SimpleRoleRedirect />} />
        {allRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.component} />
        ))}
      </Route>
    </RRDRoutes>
  );
};
