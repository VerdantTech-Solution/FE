import VendorDashboard from './VendorDashboard';
import RegistrationManagementPage from './RegistrationManagementPage';
import WalletPage from './WalletPage';
import VendorInfoPage from './VendorInfoPage';
import { Route, Routes as RRDRoutes, Navigate } from 'react-router';

const VendorPage = () => {
  return (
    <RRDRoutes>
      <Route path="" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<VendorDashboard />} />
      <Route path="registrations" element={<RegistrationManagementPage />} />
      <Route path="wallet" element={<WalletPage />} />
      <Route path="info" element={<VendorInfoPage />} />
    </RRDRoutes>
  );
};

export default VendorPage;


