import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { getVendorByUserId, type VendorProfileResponse } from "@/api/vendor";

interface VendorContextType {
  vendorInfo: VendorProfileResponse | null;
  loading: boolean;
  subscriptionActive: boolean;
  refreshVendorInfo: () => Promise<void>;
}

const VendorContext = createContext<VendorContextType | undefined>(undefined);

export const VendorProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const [vendorInfo, setVendorInfo] = useState<VendorProfileResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const fetchVendorInfo = useCallback(async () => {
    if (!user?.id || user?.role !== "Vendor") {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getVendorByUserId(parseInt(user.id));
      setVendorInfo(data);
    } catch (error) {
      console.error("Error fetching vendor info:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "Vendor") {
      fetchVendorInfo();
    } else {
      setVendorInfo(null);
      setLoading(false);
    }
  }, [fetchVendorInfo, isAuthenticated, user?.role]);

  const refreshVendorInfo = async () => {
    await fetchVendorInfo();
  };

  const subscriptionActive = vendorInfo?.subscriptionActive ?? false;

  return (
    <VendorContext.Provider
      value={{
        vendorInfo,
        loading,
        subscriptionActive,
        refreshVendorInfo,
      }}
    >
      {children}
    </VendorContext.Provider>
  );
};

export const useVendor = (): VendorContextType => {
  const context = useContext(VendorContext);
  if (!context) {
    throw new Error("useVendor must be used within a VendorProvider");
  }
  return context;
};

export default VendorContext;
