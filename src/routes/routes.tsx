import { Layout } from "@/layouts";
import { Route, Routes as RRDRoutes } from "react-router";
import { allRoutes } from "./all-routes";
import { LoginPage, SignUpPage } from "@/pages";


export const Routes = () => {
  return (
    <RRDRoutes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route element={<Layout />}>
        {allRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.component} />
        ))}
      </Route>
    </RRDRoutes>
  );
};
