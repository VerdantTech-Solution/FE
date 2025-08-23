import { PATH_NAMES } from "@/constants";
import { HomePage, LoginPage, MarketplacePage, SignUpPage, AboutPage } from "@/pages";



export const allRoutes = [
  { path: PATH_NAMES.HOME, component: <HomePage /> },
  { path: PATH_NAMES.LOGIN, component: <LoginPage /> },
  { path: PATH_NAMES.SIGNUP, component: <SignUpPage /> },
  { path: PATH_NAMES.MARKETPLACE, component: <MarketplacePage /> },
  { path: PATH_NAMES.ABOUT, component: <AboutPage /> },
];
