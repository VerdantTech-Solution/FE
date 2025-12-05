import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, Trash2, RefreshCw, Edit2, Users, User, Shield, Activity, Mail, Phone, MoreHorizontal, Building2, UserPlus} from "lucide-react";
import { getAllUsers, updateUser, deleteUser, createStaff, type UserResponse } from "@/api/user";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AdminVendorManagementPanel } from "./AdminVendorManagementPanel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

type Role = "staff" | "admin" | "user" | "all";

export const AdminUserManagementPanel: React.FC = () => {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<Role>("all");
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);

  // Edit user dialog states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive' | 'suspended' | 'deleted'>('active');

  // Delete user dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteUserName, setDeleteUserName] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  // Create user dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [createResultDialogOpen, setCreateResultDialogOpen] = useState(false);
  const [createResult, setCreateResult] = useState<{ type: 'success' | 'error'; message: string }>({ type: 'success', message: '' });

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

  const openDeleteDialog = (user: UserResponse) => {
    setDeleteUserId(user.id);
    setDeleteUserName(user.fullName || user.email);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;
    try {
      setDeleteLoading(true);
      await deleteUser(deleteUserId);
      setDeleteDialogOpen(false);
      await fetchUsers();
      window.alert('Xóa người dùng thành công');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Xóa người dùng thất bại';
      window.alert(message);
    } finally {
      setDeleteLoading(false);
      setDeleteUserId(null);
      setDeleteUserName('');
    }
  };
  const handleCreateUser = async () => {
    try {
      setCreateError(null);
      setCreateLoading(true);
      await createStaff({
        email: newEmail,
        fullName: newFullName,
        phoneNumber: newPhone,
      });
      setIsCreateOpen(false);
      setNewEmail('');
      setNewFullName('');
      setNewPhone('');
      await fetchUsers();
      setCreateResult({
        type: 'success',
        message: `Đã tạo nhân viên ${newFullName || newEmail} thành công.`,
      });
      setCreateResultDialogOpen(true);
    } catch (err: any) {
      const message = err?.message || 'Tạo nhân viên thất bại';
      setCreateError(message);
      setCreateResult({
        type: 'error',
        message,
      });
      setCreateResultDialogOpen(true);
    } finally {
      setCreateLoading(false);
    }
  };

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.fullName.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase()) ||
        (user.phoneNumber && user.phoneNumber.includes(query));
      const matchesRole = role === 'all' || user.role.toLowerCase() === role.toLowerCase();
      const matchesStatus = selectedStatus === 'all' || (user.status && user.status.toLowerCase() === selectedStatus);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, query, role, selectedStatus]);

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'customer':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'farmer':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'staff':
        return 'bg-green-100 text-green-800 border-green-200';
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
            onClick={() => fetchUsers()}
            className="bg-green-600 hover:bg-green-700"
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
          <h2 className="text-2xl font-semibold text-gray-900">Quản lý người dùng & Nhà cung cấp</h2>
          <p className="text-sm text-gray-500">Quản lý tài khoản, quyền truy cập và thông tin nhà cung cấp</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Quản lý người dùng
          </TabsTrigger>
          <TabsTrigger value="vendors" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Quản lý Nhà cung cấp
          </TabsTrigger>
        </TabsList>

        {/* Users Tab Content */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Button
              onClick={() => {
                setCurrentPage(1);
                fetchUsers();
              }}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Làm mới
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Tạo nhân viên
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Thêm nhân viên mới</DialogTitle>
                  <p className="text-sm text-gray-500">Nhập thông tin nhân viên để tạo tài khoản staff.</p>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Họ và tên</label>
                    <Input value={newFullName} onChange={(e) => setNewFullName(e.target.value)} placeholder="Nguyễn Văn A" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Email</label>
                    <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="staff@example.com" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Số điện thoại</label>
                    <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+84123456789" />
                  </div>
                </div>    
                {createError && <p className="text-sm text-red-600">{createError}</p>}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={createLoading}>
                    Hủy
                  </Button>
                  <Button onClick={handleCreateUser} disabled={createLoading || !newEmail || !newFullName}>
                    {createLoading ? 'Đang tạo...' : 'Tạo nhân viên'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Tổng người dùng</p>
                <p className="text-2xl font-bold text-blue-900">{users.length}</p>
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
                <p className="text-2xl font-bold text-green-900">
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
                <p className="text-2xl font-bold text-purple-900">
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
                <p className="text-2xl font-bold text-orange-900">
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
              <Search className="w-5 h-5 mr-2 text-gray-600" />
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
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Vai trò</label>
                <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả vai trò" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả vai trò</SelectItem>
                    <SelectItem value="Customer">Customer</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
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
                    <SelectItem value="suspended">Tạm khóa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery('');
                    setRole('all');
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
              <div className="grid grid-cols-12 bg-gray-50 px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide border-b">
                <div className="col-span-3">Người dùng</div>
                <div className="col-span-3">Thông tin liên hệ</div>
                <div className="col-span-2">Vai trò</div>
                <div className="col-span-2">Trạng thái</div>
                <div className="col-span-2 text-right">Hành động</div>
              </div>
              {currentUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="grid grid-cols-12 items-center px-5 py-4 border-b hover:bg-gray-50 transition-colors"
                >
                  <div className="col-span-3 flex items-center gap-3">
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
                    <div>
                      <div className="font-medium text-gray-900">{user.fullName}</div>
                      <div className="text-xs text-gray-500">ID: {user.id}</div>
                    </div>
                  </div>
                  <div className="col-span-3">
                    <div className="flex items-center text-sm mb-1">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-gray-700">{user.email}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-gray-700">{user.phoneNumber || 'Chưa có'}</span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </div>
                                     <div className="col-span-2">
                     <div className="flex items-center space-x-2">
                       <span className="text-lg">{getStatusIcon(user.status || '')}</span>
                       <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.status || '')}`}>
                         {user.status || 'Chưa xác định'}
                       </span>
                     </div>
                   </div>
                   <div className="col-span-2 text-right">
                     <div className="inline-flex items-center gap-2">
                       <Button 
                         size="sm" 
                         variant="outline" 
                         className="h-8 w-8 border-green-600 text-green-600 hover:bg-green-50 hover:border-green-700" 
                         title="Chỉnh sửa" 
                         onClick={() => openEditDialog(user)}
                       >
                         <Edit2 className="w-4 h-4" />
                       </Button>
                       <Button 
                         size="sm" 
                         variant="outline" 
                         className="h-8 w-8 border-red-600 text-red-600 hover:bg-red-50 hover:border-red-700" 
                         title="Xóa" 
                         onClick={() => openDeleteDialog(user)}
                       >
                         <Trash2 className="w-4 h-4" />
                       </Button>
                       <Button size="sm" variant="ghost" className="h-8 w-8" title="Xem thêm">
                         <MoreHorizontal className="w-4 h-4" />
                       </Button>
                     </div>
                   </div>
                </motion.div>
              ))}
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
                    setQuery('');
                    setRole('all');
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
                  <SelectItem value="inactive">Inactive</SelectItem>
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

      {/* Delete User Alert Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa người dùng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa người dùng <strong>{deleteUserName}</strong>? 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLoading ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Create user result dialog */}
      <AlertDialog open={createResultDialogOpen} onOpenChange={setCreateResultDialogOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader className="text-center space-y-3">
            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${createResult.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
              {createResult.type === 'success' ? (
                <Shield className="h-8 w-8 text-green-600" />
              ) : (
                <Trash2 className="h-8 w-8 text-red-600" />
              )}
            </div>
            <AlertDialogTitle className="text-xl font-semibold">
              {createResult.type === 'success' ? 'Tạo nhân viên thành công' : 'Tạo nhân viên thất bại'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-gray-600">
              {createResult.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction onClick={() => setCreateResultDialogOpen(false)} className="w-full sm:w-auto">
              Đóng
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        </TabsContent>

        {/* Vendors Tab Content */}
        <TabsContent value="vendors" className="space-y-6">
          <AdminVendorManagementPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminUserManagementPanel;


