import { PATH_NAMES } from "@/constants";
import { HomePage, LoginPage, MarketplacePage, ProductDetailPage, SignUpPage, AboutPage, AdminPage, ProfilePage, CartPage, FarmList, MapAreaPage, StaffPage, CreateFarmPage, FarmDetailPage, PreviewOrderPage } from "@/pages";
import UpdateFarmPage from "@/pages/UpdateFarmPage";

export const allRoutes = [
  { path: PATH_NAMES.HOME, component: <HomePage /> },
  { path: PATH_NAMES.LOGIN, component: <LoginPage /> },
  { path: PATH_NAMES.SIGNUP, component: <SignUpPage /> },
  { path: PATH_NAMES.MARKETPLACE, component: <MarketplacePage /> },
  { path: `${PATH_NAMES.PRODUCT_DETAIL}/:id`, component: <ProductDetailPage /> },
  { path: PATH_NAMES.ABOUT, component: <AboutPage /> },
  { path: PATH_NAMES.ADMIN, component: <AdminPage /> },
  { path: PATH_NAMES.PROFILE, component: <ProfilePage /> },
  { path: PATH_NAMES.CART, component: <CartPage /> },
  { path: PATH_NAMES.ORDER_PREVIEW, component: <PreviewOrderPage /> },
  { path: PATH_NAMES.FARMLIST, component: <FarmList /> },
  { path: PATH_NAMES.MAP_AREA, component: <MapAreaPage /> },
  { path: PATH_NAMES.STAFF, component: <StaffPage /> },
  { path: PATH_NAMES.CREATE_FARM, component: <CreateFarmPage /> },
  { path: `${PATH_NAMES.UPDATE_FARM}/:id`, component: <UpdateFarmPage /> },
  { path: `${PATH_NAMES.FARM_DETAIL}/:id`, component: <FarmDetailPage /> },
];
