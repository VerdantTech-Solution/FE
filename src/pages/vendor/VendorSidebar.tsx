import { useNavigate, useLocation } from 'react-router';
import { 
  BarChart3, 
  Square, 
  CreditCard, 
  User,
  FileText,
  History
} from 'lucide-react';

const VendorSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { 
      id: "statistics", 
      label: "Thống kê", 
      icon: BarChart3, 
      path: "/vendor/dashboard" 
    },
    { 
      id: "registrations", 
      label: "Quản lý đơn đăng ký", 
      icon: Square, 
      path: "/vendor/registrations" 
    },
    { 
      id: "wallet", 
      label: "Ví", 
      icon: CreditCard, 
      path: "/vendor/wallet" 
    },
    { 
      id: "cashout-requests", 
      label: "Yêu cầu rút tiền", 
      icon: FileText, 
      path: "/vendor/cashout-requests" 
    },
    { 
      id: "cashout-history", 
      label: "Lịch sử rút tiền", 
      icon: History, 
      path: "/vendor/cashout-history" 
    },
    { 
      id: "vendor-info", 
      label: "Thông tin vendor", 
      icon: User, 
      path: "/vendor/info" 
    }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">VerdantTech</h1>
            <p className="text-xs text-gray-500">Nông nghiệp xanh</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    active 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default VendorSidebar;
