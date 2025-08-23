import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Recharts imports
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

export const AnalyticsPage = () => {
  // Mock data for charts
  const revenueData = [
    { month: 'T1', revenue: 12500000, growth: 12, orders: 45, customers: 23 },
    { month: 'T2', revenue: 15800000, growth: 8, orders: 52, customers: 31 },
    { month: 'T3', revenue: 14200000, growth: -5, orders: 38, customers: 19 },
    { month: 'T4', revenue: 18900000, growth: 15, orders: 67, customers: 42 },
    { month: 'T5', revenue: 17500000, growth: 7, orders: 58, customers: 35 },
    { month: 'T6', revenue: 21000000, growth: 20, orders: 78, customers: 51 },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Phân tích doanh thu chi tiết</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RechartsLineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                formatter={(value) => [`${Number(value).toLocaleString()}đ`, 'Doanh thu']}
                labelFormatter={(label) => `Tháng ${label}`}
              />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} />
              <Line type="monotone" dataKey="orders" stroke="#3B82F6" strokeWidth={3} />
            </RechartsLineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Phân tích khách hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Area type="monotone" dataKey="customers" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Tỷ lệ tăng trưởng</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsBarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip formatter={(value) => [`${value}%`, 'Tăng trưởng']} />
                <Bar dataKey="growth" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Tổng quan thị trường</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Thị phần hiện tại</span>
                <span className="text-lg font-bold text-green-600">23.5%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tốc độ tăng trưởng</span>
                <span className="text-lg font-bold text-blue-600">+18.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Đối thủ chính</span>
                <span className="text-lg font-bold text-orange-600">5</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Phân tích sản phẩm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Sản phẩm bán chạy</span>
                <span className="text-lg font-bold text-green-600">Drone T30</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tỷ lệ tồn kho</span>
                <span className="text-lg font-bold text-blue-600">12.3%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Đánh giá TB</span>
                <span className="text-lg font-bold text-orange-600">4.7/5</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Dự báo tương lai</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Doanh thu Q4</span>
                <span className="text-lg font-bold text-green-600">95.2M</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tăng trưởng dự kiến</span>
                <span className="text-lg font-bold text-blue-600">+22.5%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Khách hàng mới</span>
                <span className="text-lg font-bold text-orange-600">+45%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
