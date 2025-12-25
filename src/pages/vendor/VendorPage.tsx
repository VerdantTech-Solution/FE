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

import { Route, Routes as RRDRoutes, Navigate } from "react-router";

const VendorPage = () => {
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
