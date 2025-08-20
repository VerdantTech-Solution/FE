import { Layout } from "@/layouts";
import { Route, Routes as RRDRoutes } from "react-router";
import { allRoutes } from "./all-routes";

export const Routes = () => {
  return (
    <RRDRoutes>
      <Route element={<Layout />}>
        {allRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.component} />
        ))}
      </Route>
    </RRDRoutes>
  );
};
