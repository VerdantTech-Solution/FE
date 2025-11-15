import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users,
  Search,
  Filter,
  Edit,
  Trash2,
  User,
  Mail,
  Phone,
  Shield,
  Activity,
  MoreHorizontal,
  RefreshCw,
  UserPlus,
  CheckCircle2
} from "lucide-react";
import { getAllUsers, createStaff } from "@/api/user";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { UserResponse } from "@/api/user";
import { Spinner } from '@/components/ui/shadcn-io/spinner';

export const UserManamentPage = () => {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(3);

  // Create user dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  // Success dialog state
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [createdUserName, setCreatedUserName] = useState('');
  // Luôn tạo staff, không cần state cho role

  // Edit user dialog states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive' | 'suspended' | 'deleted'>('active');

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const usersData = await getAllUsers();
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định';
      setError(`Không thể tải danh sách người dùng: ${errorMessage}.`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async () => {
    try {
      setCreateError(null);
      setCreateLoading(true);
      
      // Luôn tạo staff với API mới (không cần password)
      await createStaff({
        email: newEmail,
        fullName: newFullName,
        phoneNumber: newPhone
      });
      
      // Hiển thị success dialog
      setCreatedUserName(newFullName || newEmail);
      setIsCreateOpen(false);
      setNewEmail('');
      setNewFullName('');
      setNewPhone('');
      await fetchUsers();
      setSuccessDialogOpen(true);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Tạo nhân viên thất bại';
      setCreateError(message);
    } finally {
      setCreateLoading(false);
    }
  };

  const openEditDialog = (user: UserResponse) => {
    setEditError(null);
    setEditUserId(user.id);
    setEditFullName(user.fullName || '');
    setEditPhone(user.phoneNumber || '');
    setEditAvatarUrl((user.avatarUrl as string) || '');
    setEditStatus((user.status?.toLowerCase() as 'active' | 'inactive' | 'suspended' | 'deleted') || 'active');
    setIsEditOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editUserId) return;
    try {
      setEditError(null);
      setEditLoading(true);
      const { updateUser } = await import('@/api/user');
      await updateUser(editUserId, {
        fullName: editFullName,
        phoneNumber: editPhone,
        avatarUrl: editAvatarUrl || null,
        status: editStatus
      });
      setIsEditOpen(false);
      await fetchUsers();
      window.alert('Cập nhật người dùng thành công');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Cập nhật người dùng thất bại';
      setEditError(message);
    } finally {
      setEditLoading(false);
    }
  };

  // Lọc users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phoneNumber && user.phoneNumber.includes(searchTerm));
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || (user.status && user.status === selectedStatus);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'Admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Customer':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Farmer':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    if (!status) return 'bg-gray-100 text-gray-800 border-gray-200';

    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'deleted':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    if (!status) return '⚪';

    switch (status.toLowerCase()) {
      case 'active':
        return '🟢';
      case 'inactive':
        return '🟠';
      case 'suspended':
        return '🟡';
      case 'deleted':
        return '🔴';
      default:
        return '⚪';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
      <div className="flex justify-center mb-6">
          <Spinner variant="circle-filled" size={60} className="text-green-600" />
        </div>
        <p className="text-gray-600">Đang tải danh sách người dùng...</p>
      </div>
    </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Đã xảy ra lỗi</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý người dùng</h1>
          <p className="text-gray-600 mt-1">Quản lý tài khoản và quyền truy cập của người dùng</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Thêm nhân viên
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm nhân viên mới</DialogTitle>
                <p className="text-sm text-blue-600 mt-2">
                  💡 Mật khẩu sẽ được tự động tạo và gửi qua email
                </p>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Họ và tên</label>
                  <Input value={newFullName} onChange={(e) => setNewFullName(e.target.value)} placeholder="Nguyễn Văn A" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Email</label>
                  <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="user@example.com" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Số điện thoại</label>
                  <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+84540170197" />
                </div>
              </div>
              {createError && (
                <p className="text-sm text-red-600">{createError}</p>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={createLoading}>Hủy</Button>
                <Button onClick={handleCreateUser} disabled={createLoading || !newEmail || !newFullName}>
                  {createLoading ? 'Đang tạo...' : 'Tạo nhân viên'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            onClick={() => {
              setCurrentPage(1);
              window.location.reload();
            }}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Tổng người dùng</p>
                <p className="text-3xl font-bold text-blue-900">{users.length}</p>
              </div>
              <div className="p-3 bg-blue-200 rounded-full">
                <Users className="w-8 h-8 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Admin</p>
                <p className="text-3xl font-bold text-green-900">
                  {users.filter(u => u.role === 'Admin').length}
                </p>
              </div>
              <div className="p-3 bg-green-200 rounded-full">
                <Shield className="w-8 h-8 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Customer</p>
                <p className="text-3xl font-bold text-purple-900">
                  {users.filter(u => u.role === 'Customer').length}
                </p>
              </div>
              <div className="p-3 bg-purple-200 rounded-full">
                <User className="w-8 h-8 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Hoạt động</p>
                <p className="text-3xl font-bold text-orange-900">
                  {users.filter(u => u.status === 'Active').length}
                </p>
              </div>
              <div className="p-3 bg-orange-200 rounded-full">
                <Activity className="w-8 h-8 text-orange-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Filter className="w-5 h-5 mr-2 text-gray-600" />
              Bộ lọc và tìm kiếm
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Tìm kiếm</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Tìm theo tên, email, số điện thoại..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Vai trò</label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn vai trò" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả vai trò</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Customer">Customer</SelectItem>
                    <SelectItem value="Farmer">Farmer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Trạng thái</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="inactive">Không hoạt động</SelectItem>

                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedRole('all');
                    setSelectedStatus('all');
                  }}
                  className="w-full"
                >
                  Xóa bộ lọc
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Danh sách người dùng</CardTitle>
                <CardDescription>
                  Hiển thị {filteredUsers.length} người dùng trong tổng số {users.length}
                </CardDescription>
              </div>
              <div className="text-sm text-gray-500">
                Trang {currentPage} / {totalPages}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Người dùng</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Thông tin liên hệ</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Vai trò</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Trạng thái</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Ngày tạo</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={`Avatar của ${user.fullName}`}
                              className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {user.fullName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="ml-4">
                            <p className="font-semibold text-gray-900">{user.fullName}</p>
                            <p className="text-sm text-gray-500">ID: {user.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="text-gray-700">{user.email}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="text-gray-700">{user.phoneNumber || 'Chưa có'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getStatusIcon(user.status || '')}</span>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.status || '')}`}>
                            {user.status || 'Chưa xác định'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-500">
                        {user.createdAt && typeof user.createdAt === 'string' ? formatDate(user.createdAt) : 'Chưa có'}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700" onClick={() => openEditDialog(user)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {filteredUsers.length === 0 && (
              <div className="text-center py-16">
                <Users className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">Không tìm thấy người dùng</h3>
                <p className="text-gray-500 mb-6">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedRole('all');
                    setSelectedStatus('all');
                  }}
                >
                  Xóa bộ lọc
                </Button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Hiển thị {indexOfFirstUser + 1} - {Math.min(indexOfLastUser, filteredUsers.length)} trong tổng số {filteredUsers.length} người dùng
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Trước
                  </Button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className="w-10 h-10 p-0"
                    >
                      {page}
                    </Button>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit User Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật người dùng</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Họ và tên</label>
              <Input value={editFullName} onChange={(e) => setEditFullName(e.target.value)} placeholder="Nguyễn Văn A" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Số điện thoại</label>
              <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="0123456789" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Avatar URL</label>
              <Input value={editAvatarUrl} onChange={(e) => setEditAvatarUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Trạng thái</label>
              <Select value={editStatus} onValueChange={(v) => setEditStatus(v as 'active' | 'inactive' | 'suspended' | 'deleted')}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>

                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {editError && (
            <p className="text-sm text-red-600">{editError}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={editLoading}>Hủy</Button>
            <Button onClick={handleUpdateUser} disabled={editLoading || !editUserId || !editFullName}>
              {editLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Alert Dialog */}
      <AlertDialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-xl font-semibold">
              Tạo nhân viên thành công!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-2">
              <p>
                Tài khoản nhân viên <strong>{createdUserName}</strong> đã được tạo thành công.
              </p>
              <p className="text-sm text-blue-600 mt-2">
                💡 Mật khẩu đã được tự động gửi qua email.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction
              onClick={() => setSuccessDialogOpen(false)}
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
            >
              Đóng
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};