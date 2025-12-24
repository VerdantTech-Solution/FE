import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useConversation } from "@/contexts/useConversation";

interface ProductVendorChatProps {
  vendor: {
    id: number;
    name: string;
    shopName: string;
    isOnline: boolean;
  };
  productName: string;
  productId: number;
  productImage?: string;
  productPrice?: number;
}

export const ProductVendorChat = ({
  vendor,
  productName,
  productId,
  productImage,
  productPrice,
}: ProductVendorChatProps) => {
  const { requestOpenConversation } = useConversation();

  const handleChatWithVendor = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click

    // Check if user is logged in
    const token = localStorage.getItem("authToken");
    if (!token) {
      toast.error("Vui lòng đăng nhập để chat với nhà cung cấp", {
        duration: 3000,
      });
      return;
    }

    // Request to open conversation with this vendor
    requestOpenConversation(vendor.id, {
      productId,
      productName,
      productImage,
      productPrice,
    });

    toast.success(`Đang mở chat với ${vendor.shopName}...`, {
      duration: 2000,
    });
  };

  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Button
        variant="outline"
        className="px-4 border-green-600 text-green-600 hover:bg-green-50"
        onClick={handleChatWithVendor}
        title={`Chat với ${vendor.shopName}`}
      >
        <MessageCircle className="w-4 h-4" />
      </Button>
    </motion.div>
  );
};
