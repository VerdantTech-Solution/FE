import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Trash2, Plus, Download, Upload, Edit2, Ban } from "lucide-react";

type Role = "staff" | "admin" | "user" | "all";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: Exclude<Role, "all">;
  status: "active" | "banned";
}

const seedUsers: UserRow[] = [
  { id: "1", name: "Nguyễn Văn A", email: "a@example.com", role: "staff", status: "active" },
  { id: "2", name: "Trần Thị B", email: "b@example.com", role: "user", status: "active" },
  { id: "3", name: "Lê Văn C", email: "c@example.com", role: "admin", status: "active" },
  { id: "4", name: "Phạm Thị D", email: "d@example.com", role: "user", status: "banned" },
];

export const UserManagementPanel: React.FC = () => {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<Role>("all");
  const [rows, setRows] = useState<UserRow[]>(seedUsers);

  const data = useMemo(() => {
    return rows.filter((u) => {
      if (role !== "all" && u.role !== role) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [rows, role, query]);

  const promote = (id: string) => {
    setRows((prev) => prev.map((u) => (u.id === id ? { ...u, role: "staff" } : u)));
  };

  const banToggle = (id: string) => {
    setRows((prev) => prev.map((u) => (u.id === id ? { ...u, status: u.status === "active" ? "banned" : "active" } : u)));
  };

  const remove = (id: string) => {
    setRows((prev) => prev.filter((u) => u.id !== id));
  };

  const viewUser = (id: string) => {
    // Navigate to user detail page
    console.log(`Navigate to user detail: ${id}`);
    // You can replace this with actual navigation logic
    // For example: navigate(`/staff/users/${id}`) or window.location.href = `/staff/users/${id}`
  };

  return (
    <div>
      {/* Header actions */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Quản lý người dùng</h2>
          <p className="text-sm text-gray-500">Quản lý tài khoản và quyền truy cập của người dùng</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2"><Upload className="w-4 h-4" />Nhập</Button>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" />Xuất</Button>
          <Button className="bg-green-600 hover:bg-green-700 gap-2"><Plus className="w-4 h-4" />Thêm mới</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tổng người dùng</p>
              <p className="text-2xl font-semibold">{rows.length}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 grid place-items-center">{rows.length}</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Admin</p>
              <p className="text-2xl font-semibold">{rows.filter(r => r.role === "admin").length}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 grid place-items-center">A</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Customer</p>
              <p className="text-2xl font-semibold">{rows.filter(r => r.role === "user").length}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-violet-100 text-violet-600 grid place-items-center">C</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Hoạt động</p>
              <p className="text-2xl font-semibold">{rows.filter(r => r.status === "active").length}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-orange-100 text-orange-600 grid place-items-center">●</div>
          </div>
        </Card>
      </div>

      {/* Filter block */}
      <Card className="mb-6">
        <div className="p-4 border-b text-sm font-medium text-gray-700">Bộ lọc và tìm kiếm</div>
        <div className="p-4 grid gap-3 md:grid-cols-3">
          <div className="relative">
            <Input placeholder="Tìm theo tên, email" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger><SelectValue placeholder="Tất cả vai trò" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả vai trò</SelectItem>
              <SelectItem value="user">Customer</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2 md:justify-end">
            <Button variant="outline">Xóa bộ lọc</Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
        <div className="grid grid-cols-12 bg-gray-50 px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
          <div className="col-span-4">Người dùng</div>
          <div className="col-span-3">Thông tin liên hệ</div>
          <div className="col-span-2">Vai trò</div>
          <div className="col-span-1">Trạng thái</div>
          <div className="col-span-2 text-right">Hành động</div>
        </div>
        {data.map((u) => (
          <div key={u.id} className="grid grid-cols-12 items-center px-5 py-3 border-t text-sm">
            <div className="col-span-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gray-200 text-gray-600 grid place-items-center font-semibold">
                {u.name.split(" ").slice(-1)[0].slice(0,1)}
              </div>
              <div className="cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors" onClick={() => viewUser(u.id)}>
                <div className="font-medium text-gray-900 hover:text-blue-600">{u.name}</div>
                <div className="text-xs text-gray-500">ID: USR{String(u.id).padStart(3,'0')}</div>
              </div>
            </div>
            <div className="col-span-3 text-gray-600">
              <div>{u.email}</div>
              <div className="text-xs text-gray-500">0987654321</div>
            </div>
            <div className="col-span-2">
              <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${u.role === "admin" ? "bg-purple-100 text-purple-700" : u.role === "staff" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>{u.role}</span>
            </div>
            <div className="col-span-1">
              <span className={`inline-flex items-center gap-1 text-xs ${u.status === "active" ? "text-green-600" : "text-red-600"}`}>
                <span className={`h-2 w-2 rounded-full ${u.status === "active" ? "bg-green-500" : "bg-red-500"}`} />
                {u.status === "active" ? "Hoạt động" : "Bị chặn"}
              </span>
            </div>
            <div className="col-span-2 text-right">
              <div className="inline-flex items-center gap-2">
                <Button size="icon" variant="ghost" className="h-8 w-8" title="Chỉnh sửa" onClick={() => promote(u.id)}><Edit2 className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" title={u.status === "active" ? "Chặn" : "Bỏ chặn"} onClick={() => banToggle(u.id)}><Ban className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" title="Xóa" onClick={() => remove(u.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          </div>
        ))}
        {data.length === 0 && (
          <Card className="m-4 p-6 text-center text-gray-500">Không có người dùng phù hợp</Card>
        )}
      </div>
    </div>
  );
};

export default UserManagementPanel;


