import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, 
  Bell, 
  Shield, 
  Save,
  RefreshCw
} from "lucide-react";

export const SettingsPage = () => {
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false,
    marketing: true
  });

  const [security, setSecurity] = useState({
    twoFactor: true,
    sessionTimeout: '30',
    passwordExpiry: '90',
    loginAttempts: '5'
  });

  const [system, setSystem] = useState({
    language: 'vi',
    timezone: 'Asia/Ho_Chi_Minh',
    dateFormat: 'DD/MM/YYYY',
    currency: 'VND'
  });

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSecurityChange = (key: string, value: string) => {
    setSecurity(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSystemChange = (key: string, value: string) => {
    setSystem(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Cài đặt hệ thống</h2>
        <p className="text-gray-600">Quản lý cấu hình và tùy chỉnh hệ thống VerdantTech</p>
      </div>

      {/* Notification Settings */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-blue-600" />
            <CardTitle className="text-lg font-semibold">Cài đặt thông báo</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Thông báo qua email</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications" className="text-sm font-medium text-gray-700">
                      Thông báo email
                    </Label>
                    <p className="text-xs text-gray-500">Nhận thông báo qua email</p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={notifications.email}
                    onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="marketing-emails" className="text-sm font-medium text-gray-700">
                      Email marketing
                    </Label>
                    <p className="text-xs text-gray-500">Nhận thông tin về sản phẩm mới</p>
                  </div>
                  <Switch
                    id="marketing-emails"
                    checked={notifications.marketing}
                    onCheckedChange={(checked) => handleNotificationChange('marketing', checked)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Thông báo đẩy</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notifications" className="text-sm font-medium text-gray-700">
                      Thông báo đẩy
                    </Label>
                    <p className="text-xs text-gray-500">Nhận thông báo trên trình duyệt</p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={notifications.push}
                    onCheckedChange={(checked) => handleNotificationChange('push', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sms-notifications" className="text-sm font-medium text-gray-700">
                      Thông báo SMS
                    </Label>
                    <p className="text-xs text-gray-500">Nhận thông báo qua tin nhắn</p>
                  </div>
                  <Switch
                    id="sms-notifications"
                    checked={notifications.sms}
                    onCheckedChange={(checked) => handleNotificationChange('sms', checked)}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-green-600" />
            <CardTitle className="text-lg font-semibold">Cài đặt bảo mật</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Xác thực hai yếu tố</h3>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="two-factor" className="text-sm font-medium text-gray-700">
                    Bật xác thực 2FA
                  </Label>
                  <p className="text-xs text-gray-500">Tăng cường bảo mật tài khoản</p>
                </div>
                <Switch
                  id="two-factor"
                  checked={security.twoFactor}
                  onCheckedChange={(checked) => handleSecurityChange('twoFactor', checked.toString())}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Cài đặt phiên đăng nhập</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="session-timeout" className="text-sm font-medium text-gray-700">
                    Thời gian timeout (phút)
                  </Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    value={security.sessionTimeout}
                    onChange={(e) => handleSecurityChange('sessionTimeout', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="password-expiry" className="text-sm font-medium text-gray-700">
                    Hạn mật khẩu (ngày)
                  </Label>
                  <Input
                    id="password-expiry"
                    type="number"
                    value={security.passwordExpiry}
                    onChange={(e) => handleSecurityChange('passwordExpiry', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Bảo vệ tài khoản</h3>
              <div>
                <Label htmlFor="login-attempts" className="text-sm font-medium text-gray-700">
                  Số lần đăng nhập sai tối đa
                </Label>
                <Input
                  id="login-attempts"
                  type="number"
                  value={security.loginAttempts}
                  onChange={(e) => handleSecurityChange('loginAttempts', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-purple-600" />
            <CardTitle className="text-lg font-semibold">Cài đặt hệ thống</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Ngôn ngữ và khu vực</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="language" className="text-sm font-medium text-gray-700">
                    Ngôn ngữ
                  </Label>
                  <select
                    id="language"
                    value={system.language}
                    onChange={(e) => handleSystemChange('language', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  >
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English</option>
                    <option value="zh">中文</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="timezone" className="text-sm font-medium text-gray-700">
                    Múi giờ
                  </Label>
                  <select
                    id="timezone"
                    value={system.timezone}
                    onChange={(e) => handleSystemChange('timezone', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  >
                    <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (GMT+7)</option>
                    <option value="Asia/Bangkok">Asia/Bangkok (GMT+7)</option>
                    <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
                  </select>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Định dạng</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date-format" className="text-sm font-medium text-gray-700">
                    Định dạng ngày
                  </Label>
                  <select
                    id="date-format"
                    value={system.dateFormat}
                    onChange={(e) => handleSystemChange('dateFormat', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="currency" className="text-sm font-medium text-gray-700">
                    Đơn vị tiền tệ
                  </Label>
                  <select
                    id="currency"
                    value={system.currency}
                    onChange={(e) => handleSystemChange('currency', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  >
                    <option value="VND">VND (₫)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Khôi phục mặc định
        </Button>
        <Button className="bg-green-600 hover:bg-green-700 flex items-center gap-2">
          <Save className="w-4 h-4" />
          Lưu thay đổi
        </Button>
      </div>
    </div>
  );
};
