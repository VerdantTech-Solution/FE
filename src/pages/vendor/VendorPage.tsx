import VendorDashboardPage from "./VendorDashboardPage";

import RegistrationManagementPage from "./RegistrationManagementPage";

import WalletPage from "./WalletPage";

import VendorInfoPage from "./VendorInfoPage";

import RegisterProductPage from "./RegisterProductPage";

import RegisterProductByExcelPage from "./RegisterProductByExcelPage";

import CashoutRequestManagementPage from "./CashoutRequestManagementPage";

import CashoutHistoryPage from "./CashoutHistoryPage";

import ProductManagementPage from "./ProductManagementPage";

import VendorProductDetailPage from "./VendorProductDetailPage";

import VendorProductUpdatePage from "./VendorProductUpdatePage";

import OrderManagementPage from "./OrderManagementPage";

import VendorSubscriptionPage from "./VendorSubscriptionPage";

import {
  Route,
  Routes as RRDRoutes,
  Navigate,
  useLocation,
} from "react-router";

import { useVendor } from "@/contexts/VendorContext";

const VendorPage = () => {
  const { subscriptionActive, loading } = useVendor();
  const location = useLocation();

  // Show loading state while checking subscription
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin mx-auto mb-4 rounded-full border-2 border-green-600 border-t-transparent" />
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // If subscription is not active and not on subscription page, redirect to subscription
  const isSubscriptionPage = location.pathname === "/vendor/subscription";
  if (!subscriptionActive && !isSubscriptionPage) {
    return <Navigate to="/vendor/subscription" replace />;
  }

  // If subscription is active and on root vendor path, stay on dashboard (default behavior)
  return (
    <RRDRoutes>
      <Route path="" element={<VendorDashboardPage />} />

      <Route path="registrations" element={<RegistrationManagementPage />} />

      <Route path="registrations/new" element={<RegisterProductPage />} />

      <Route path="products" element={<ProductManagementPage />} />

      <Route path="products/:id" element={<VendorProductDetailPage />} />

      <Route path="products/:id/update" element={<VendorProductUpdatePage />} />

      <Route
        path="registrations/new-excel"
        element={<RegisterProductByExcelPage />}
      />

      <Route path="orders" element={<OrderManagementPage />} />

      <Route path="wallet" element={<WalletPage />} />

      <Route
        path="cashout-requests"
        element={<CashoutRequestManagementPage />}
      />

      <Route path="cashout-history" element={<CashoutHistoryPage />} />

      <Route path="info" element={<VendorInfoPage />} />

      <Route path="subscription" element={<VendorSubscriptionPage />} />

      <Route path="*" element={<Navigate to="" replace />} />
    </RRDRoutes>
  );
};

export default VendorPage;
