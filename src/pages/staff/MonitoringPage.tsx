import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Activity, Server, Database, HardDrive, Wifi, Shield, AlertTriangle } from "lucide-react";

export const MonitoringPage = () => {
  const systemMetrics = [
    { name: 'CPU Usage', value: 65, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { name: 'Memory', value: 78, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { name: 'Storage', value: 45, color: 'text-green-600', bgColor: 'bg-green-50' },
    { name: 'Network', value: 32, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  ];

  const serviceStatus = [
    { name: 'Database', status: 'online', icon: Database, color: 'text-green-600' },
    { name: 'API Server', status: 'online', icon: Server, color: 'text-green-600' },
    { name: 'File Storage', status: 'warning', icon: HardDrive, color: 'text-yellow-600' },
    { name: 'Web Server', status: 'online', icon: Wifi, color: 'text-green-600' },
    { name: 'Security Service', status: 'online', icon: Shield, color: 'text-green-600' },
  ];

  const alerts = [
    { type: 'warning', message: 'File storage đang gần đầy (85%)', time: '2 phút trước' },
    { type: 'info', message: 'Backup database hoàn thành', time: '15 phút trước' },
    { type: 'success', message: 'Cập nhật hệ thống thành công', time: '1 giờ trước' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <Activity className="w-5 h-5 text-blue-600" />;
      case 'success':
        return <Activity className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Giám sát hệ thống</h2>
        <p className="text-gray-600">Theo dõi hiệu suất và trạng thái hệ thống VerdantTech</p>
      </div>

      {/* System Performance */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Hiệu suất hệ thống</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Tài nguyên hệ thống</h3>
              <div className="space-y-3">
                {systemMetrics.map((metric, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{metric.name}</span>
                      <span className="font-medium">{metric.value}%</span>
                    </div>
                    <Progress value={metric.value} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Trạng thái dịch vụ</h3>
              <div className="space-y-3">
                {serviceStatus.map((service, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(service.status)}`}></div>
                    <service.icon className={`w-5 h-5 ${service.color}`} />
                    <span className="text-sm">{service.name}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      service.status === 'online' ? 'bg-green-100 text-green-800' :
                      service.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {service.status === 'online' ? 'Hoạt động' :
                       service.status === 'warning' ? 'Cảnh báo' :
                       'Không hoạt động'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Giám sát thời gian thực</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Thời gian hoạt động</span>
                <span className="font-medium text-green-600">99.8%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Phản hồi trung bình</span>
                <span className="font-medium text-blue-600">45ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Yêu cầu/giây</span>
                <span className="font-medium text-purple-600">1,234</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Lỗi/giờ</span>
                <span className="font-medium text-orange-600">0.2</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Bảo mật hệ thống</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Firewall</span>
                <span className="text-green-600">✓ Hoạt động</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">SSL Certificate</span>
                <span className="text-green-600">✓ Hợp lệ</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Backup</span>
                <span className="text-green-600">✓ Hoàn thành</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Virus Scan</span>
                <span className="text-green-600">✓ Sạch</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Alerts */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Cảnh báo hệ thống</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div key={index} className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}>
                <div className="flex items-center gap-3">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                    <p className="text-xs text-gray-500">{alert.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Network Status */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Trạng thái mạng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Wifi className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-900">Kết nối mạng</h3>
              <p className="text-sm text-gray-600">Ổn định</p>
              <p className="text-lg font-bold text-green-600">100%</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Server className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900">Server</h3>
              <p className="text-sm text-gray-600">Hoạt động</p>
              <p className="text-lg font-bold text-blue-600">99.9%</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Database className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-medium text-gray-900">Database</h3>
              <p className="text-sm text-gray-600">Bình thường</p>
              <p className="text-lg font-bold text-purple-600">98.5%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
