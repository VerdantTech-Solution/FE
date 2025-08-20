import { PATH_NAMES } from "@/constants";
import { HomePage, OrderPage } from "@/pages";

export const allRoutes = [
  { path: PATH_NAMES.HOME, component: <HomePage /> },
  { path: PATH_NAMES.ORDER, component: <OrderPage /> },
];
