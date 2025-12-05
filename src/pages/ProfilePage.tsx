import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Phone, Shield, LogOut, Edit, Key, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { getUserProfile, createUserAddress, updateUserAddress, deleteUserAddress, type UserAddress, type CreateAddressRequest } from "@/api/user";
import { EditProfileForm } from "@/components/EditProfileForm";
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import { AvatarUpload } from "@/components/AvatarUpload";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter as AlertFooter,
  AlertDialogCancel,
  AlertDialogAction
} from "@/components/ui/alert-dialog";
import MapUserArea from "@/components/MapUserArea";
import AddressSelector from "@/components/AddressSelector";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

//

function SearchAddress({ value, onChange, onPick }: { value: string; onChange: (v: string) => void; onPick: (lat: number, lng: number, label?: string) => void }) {
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState(value || "");

  const doSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=vn&addressdetails=1` , {
        headers: { 'User-Agent': 'VerdantTech-AddressSearch/1.0' }
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const best = data[0];
        const lat = parseFloat(best.lat);
        const lng = parseFloat(best.lon);
        onPick(lat, lng, best.display_name);
      }
    } catch {}
    finally { setIsSearching(false); }
  };

  return (
    <div className="grid gap-2">
      <Label>Địa chỉ hiện tại (tìm kiếm)</Label>
      <div className="flex gap-2">
        <Input value={query} onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); }} placeholder="Nhập địa chỉ để tìm" onKeyDown={(e) => { if (e.key === 'Enter') doSearch(); }} />
        <Button type="button" className="bg-blue-600 hover:bg-blue-700" disabled={isSearching || !query.trim()} onClick={doSearch}>{isSearching ? 'Đang tìm...' : 'Tìm'}</Button>
      </div>
    </div>
  );
}


export const ProfilePage = () => {
  const { user, logout, updateUser, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  
  console.log('ProfilePage render:', { user: !!user, isAuthenticated, loading });
  const [isEditing, setIsEditing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [userAddresses, setUserAddresses] = useState<UserAddress[]>([]);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
    locationAddress: "",
    city: "",
    district: "",
    ward: "",
    latitude: 0,
    longitude: 0,
    isDeleted: false,
    provinceCode: "",
    districtCode: "",
    communeCode: "",
  });
  const [addressFormErrors, setAddressFormErrors] = useState<{[key: string]: string}>({});
  const [isSubmittingAddress, setIsSubmittingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [deletingAddressId, setDeletingAddressId] = useState<number | null>(null);
  const [deleteAddressDialogOpen, setDeleteAddressDialogOpen] = useState(false);
  const [pendingDeleteAddress, setPendingDeleteAddress] = useState<UserAddress | null>(null);

  // Lấy thông tin user mới nhất từ API khi component mount
  useEffect(() => {
    if (user?.id) {
      fetchLatestUserData();
    }
  }, [user?.id]);

  // Cập nhật avatarUrl khi user thay đổi
  useEffect(() => {
    console.log('ProfilePage useEffect - user.avatarUrl changed to:', user?.avatarUrl);
    if (user?.avatarUrl !== undefined) {
      const newAvatarUrl = user.avatarUrl || "";
      setAvatarUrl(newAvatarUrl);
      console.log('ProfilePage useEffect - avatarUrl state updated to:', newAvatarUrl);
    }
  }, [user?.avatarUrl]);

  // Bỏ giả lập loading

  const fetchLatestUserData = async () => {
    if (!user) return;
    
    try {
      setIsAddressLoading(true);
      const userData = await getUserProfile();
      console.log('Latest user data from API:', userData);
      
      // Cập nhật local state với dữ liệu mới nhất
      if (userData) {
        updateUser({
          fullName: userData.fullName || user.fullName,
          phoneNumber: userData.phoneNumber || user.phoneNumber,
          avatarUrl: userData.avatarUrl || user.avatarUrl,
        });
        
        // Cập nhật avatarUrl state từ database
        if (userData.avatarUrl !== undefined) {
          setAvatarUrl(userData.avatarUrl || "");
        }

        // Lấy danh sách địa chỉ từ profile
        if (Array.isArray((userData as any).userAddresses)) {
          setUserAddresses((userData as any).userAddresses as UserAddress[]);
        }

      }
    } catch (error) {
      console.error('Failed to fetch latest user data:', error);
    } finally {
      setIsAddressLoading(false);
    }
  };

  function ClickToSet({ onPick }: { onPick: (p: { lat: number; lng: number }) => void }) {
    useMapEvents({
      click(e) {
        onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
      },
    });
    return null;
  }

  function InlineMapPick({ lat, lng, onPick }: { lat: number; lng: number; onPick: (lat: number, lng: number) => void }) {
    const hasPoint = !!lat && !!lng;
    const center: [number, number] = hasPoint ? [lat, lng] : [21.0278, 105.8342];
    return (
      <div className="h-[260px] rounded-lg border bg-white shadow-sm overflow-hidden">
        <MapContainer center={center} zoom={hasPoint ? 15 : 12} style={{ height: '100%', width: '100%' }}>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickToSet onPick={(p) => onPick(p.lat, p.lng)} />
          {hasPoint && (
            <Marker 
              position={[lat, lng]}
              icon={L.divIcon({
                className: 'selected-location-marker',
                html: `<div style="background: linear-gradient(45deg, #10b981, #059669); width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.25);"></div>`,
                iconSize: [22, 22],
                iconAnchor: [11, 11]
              })}
            />
          )}
        </MapContainer>
      </div>
    );
  }

  // const handleMapSelect = (lat: number, lng: number) => {
  //   setAddressForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
  // };

  const resetAddressForm = () => {
    setAddressForm({
      locationAddress: "",
      city: "",
      district: "",
      ward: "",
      latitude: 0,
      longitude: 0,
      isDeleted: false,
      provinceCode: "",
      districtCode: "",
      communeCode: "",
    });
    setAddressFormErrors({});
    setEditingAddressId(null);
  };

  const validateAddressForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!addressForm.locationAddress.trim()) {
      errors.locationAddress = "Vui lòng nhập địa chỉ cụ thể";
    }
    
    if (!addressForm.city) {
      errors.city = "Vui lòng chọn tỉnh/thành";
    }
    
    if (!addressForm.district) {
      errors.district = "Vui lòng chọn quận/huyện";
    }
    
    if (!addressForm.ward) {
      errors.ward = "Vui lòng chọn xã/phường";
    }
    
    if (addressForm.latitude === 0 && addressForm.longitude === 0) {
      errors.coordinates = "Vui lòng chọn vị trí trên bản đồ hoặc tìm kiếm địa chỉ";
    }
    
    setAddressFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateAddress = async () => {
    try {
      if (!user) return;
      
      // Validate form before submission
      if (!validateAddressForm()) {
        return;
      }
      
      setIsSubmittingAddress(true);
      setAddressFormErrors({});
      
      if (editingAddressId !== null && editingAddressId !== undefined) {
        // Update existing address
        const apiAddressData = {
          locationAddress: addressForm.locationAddress,
          province: addressForm.city,
          district: addressForm.district,
          commune: addressForm.ward,
          provinceCode: addressForm.provinceCode,
          districtCode: addressForm.districtCode,
          communeCode: addressForm.communeCode,
          latitude: addressForm.latitude,
          longitude: addressForm.longitude,
          isDeleted: addressForm.isDeleted,
        };
        
        const updated = await updateUserAddress(editingAddressId, apiAddressData);
        setUserAddresses((prev) => prev.map(a => (a.id === editingAddressId ? updated : a)));
        window.location.reload();
      } else {
        // Create new address
        const createAddressData: CreateAddressRequest = {
          locationAddress: addressForm.locationAddress,
          province: addressForm.city,
          district: addressForm.district,
          commune: addressForm.ward,
          provinceCode: addressForm.provinceCode,
          districtCode: addressForm.districtCode,
          communeCode: addressForm.communeCode,
          latitude: addressForm.latitude,
          longitude: addressForm.longitude,
        };
        
        const response = await createUserAddress(user.id, createAddressData);
        
        if (response.status) {
          // Success - refresh addresses from server
          const refreshed = await getUserProfile();
          if (Array.isArray((refreshed as any).userAddresses)) {
            setUserAddresses((refreshed as any).userAddresses as UserAddress[]);
          }
          window.location.reload();
        } else {
          console.error('Failed to create address:', response.errors);
          // Handle error - could show toast notification
        }
      }
      
      // Reset form and close dialog on success
      resetAddressForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating/updating address:', error);
      setAddressFormErrors({
        general: 'Có lỗi xảy ra khi lưu địa chỉ. Vui lòng thử lại.'
      });
    } finally {
      setIsSubmittingAddress(false);
    }
  };

  const handleSoftDeleteAddress = async (addr: UserAddress) => {
    if (!addr?.id) return;
    try {
      setDeletingAddressId(addr.id);
      
      console.log('Attempting to delete address ID:', addr.id);
      
      // Try the dedicated delete endpoint first
      try {
        await deleteUserAddress(addr.id);
        console.log('Address deleted successfully using DELETE endpoint');
        setUserAddresses(prev => prev.filter(a => a.id !== addr.id));
        return;
      } catch (deleteError) {
        console.log('DELETE endpoint failed, trying soft delete with PATCH:', deleteError);
        
        // Fallback to soft delete using PATCH
        const payload = {
          locationAddress: addr.locationAddress,
          province: addr.province,
          district: addr.district,
          commune: addr.commune,
          provinceCode: addr.provinceCode ?? "",
          districtCode: addr.districtCode ?? "",
          communeCode: addr.communeCode ?? "",
          latitude: addr.latitude,
          longitude: addr.longitude,
          isDeleted: true,
        };
        
        console.log('Soft deleting address with payload:', payload);
        await updateUserAddress(addr.id, payload);
        console.log('Address soft deleted successfully');
        setUserAddresses(prev => prev.filter(a => a.id !== addr.id));
      }
      
    } catch (e) {
      console.error('Failed to delete address:', e);
      // Show error to user - you could add a toast notification here
      alert(`Không thể xóa địa chỉ: ${e instanceof Error ? e.message : 'Lỗi không xác định'}`);
    } finally {
      setDeletingAddressId(null);
    }
  };

  const confirmDeleteAddress = (addr: UserAddress) => {
    setPendingDeleteAddress(addr);
    setDeleteAddressDialogOpen(true);
  };

  const handleConfirmDeleteAddress = async () => {
    if (!pendingDeleteAddress) return;
    const addr = pendingDeleteAddress;
    setDeleteAddressDialogOpen(false);
    await handleSoftDeleteAddress(addr);
    setPendingDeleteAddress(null);
  };


  const openEditAddress = (addr: UserAddress) => {
    setAddressForm({
      locationAddress: addr.locationAddress || "",
      city: addr.province || "", // Map old province field to new city field
      district: addr.district || "",
      ward: addr.commune || "", // Map old commune field to new ward field
      latitude: addr.latitude || 0,
      longitude: addr.longitude || 0,
      isDeleted: addr.isDeleted ?? false,
      provinceCode: addr.provinceCode || "",
      districtCode: addr.districtCode || "",
      communeCode: addr.communeCode || "",
    });
    setEditingAddressId(addr.id ?? null);
    setAddressFormErrors({});
    setIsDialogOpen(true);
  };

  // const handleUseCurrentLocation = () => {
  //   if (!navigator.geolocation) {
  //     return;
  //   }
  //   navigator.geolocation.getCurrentPosition(
  //     (pos) => {
  //       const lat = pos.coords.latitude;
  //       const lng = pos.coords.longitude;
  //       setAddressForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
  //     },
  //     () => {
  //       // ignore errors silently here
  //     }
  //   );
  // };

  const openAddAddressDialog = () => {
    resetAddressForm();
    setIsDialogOpen(true);
  };

  // Hiển thị loading nếu đang kiểm tra authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="text-center">
        
          {/* Spinner chính */}
          <div className=" flex justify-center mb-6">
            <Spinner 
              variant="circle-filled" 
              size={60} 
              className="text-emerald-600 mx-auto"
            />
          </div>
          
          {/* Tiêu đề */}
          <h2 className="text-xl font-bold text-gray-800 mb-3">Đang kiểm tra quyền truy cập...</h2>
          
          {/* Mô tả */}
          <p className="text-gray-600 mb-6">Xác thực người dùng...</p>
          
          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Nếu không có user hoặc chưa authenticated, redirect về login
  if (!user || !isAuthenticated) {
    console.log('ProfilePage: No user or not authenticated, redirecting to login');
    navigate('/login', { replace: true });
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error('Logout failed:', error);
      // Vẫn chuyển hướng về trang login ngay cả khi logout thất bại
      navigate("/login");
    }
  };

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleSaveProfile = (updatedUser: { fullName: string; phoneNumber: string; avatarUrl?: string }) => {
    // Cập nhật user context trước
    updateUser(updatedUser);
    setIsEditing(false);
    
    // Cập nhật avatar local state nếu có
    if (updatedUser.avatarUrl !== undefined) {
      setAvatarUrl(updatedUser.avatarUrl || "");
    }
    
    // Không cần fetchLatestUserData nữa vì đã cập nhật context trực tiếp
    // fetchLatestUserData();
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleChangePassword = () => {
    navigate("/change-password");
  };

  const handleAvatarChange = (newAvatarUrl: string | null) => {
    console.log('ProfilePage handleAvatarChange called with:', newAvatarUrl);
    
    // Cập nhật local state trước
    setAvatarUrl(newAvatarUrl || "");
    
    // Cập nhật user context với avatar mới ngay lập tức
    updateUser({ avatarUrl: newAvatarUrl || undefined });
    
    console.log('ProfilePage - Avatar state updated to:', newAvatarUrl || "");
    console.log('ProfilePage - User context updated with avatarUrl:', newAvatarUrl || undefined);
    
    // Không cần fetchLatestUserData nữa vì đã cập nhật context trực tiếp
    // Chỉ fetch nếu cần đồng bộ với database (optional)
    // setTimeout(() => {
    //   fetchLatestUserData();
    // }, 500);
  };

  return (
    <>
    <motion.div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4 mt-[100px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <div className="max-w-[80%] mx-auto">
        {/* Header */}
        <motion.div className="text-center mb-8" initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Hồ sơ cá nhân</h1>
          <p className="text-gray-600">Quản lý thông tin tài khoản của bạn</p>
        </motion.div>

        {/* Edit Profile Form */}
        {isEditing && (
          <motion.div className="mb-6" initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}>
            <EditProfileForm
              user={user}
              onSave={handleSaveProfile}
              onCancel={handleCancelEdit}
              isOpen={isEditing}
            />
          </motion.div>
        )}



        {/* Profile Display */}
        {!isEditing && (
          <motion.div className="grid grid-cols-1 lg:grid-cols-12 gap-6" initial="hidden" animate="show" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }}>
            {/* Avatar Section */}
            <motion.div className="lg:col-span-2 flex justify-center" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
              <AvatarUpload
                currentAvatarUrl={avatarUrl}
                onAvatarChange={handleAvatarChange}
                userId={user.id}
              />
            </motion.div>

            {/* Profile Card */}
            <motion.div className="lg:col-span-6" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
              <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">Thông tin cá nhân</CardTitle>
                      <CardDescription>
                        Cập nhật thông tin cá nhân của bạn
                      </CardDescription>
                    </div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button onClick={handleEditProfile} variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Chỉnh sửa
                    </Button>
                    </motion.div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Full Name */}
                  <motion.div className="flex items-center space-x-4" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500">Họ và tên</p>
                      <p className="text-lg font-semibold text-gray-900">{user.fullName}</p>
                    </div>
                  </motion.div>

                  <Separator />

                  {/* Email */}
                  <motion.div className="flex items-center space-x-4" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-lg font-semibold text-gray-900">{user.email}</p>
                    </div>
                  </motion.div>

                  <Separator />

                  {/* Phone */}
                  <motion.div className="flex items-center space-x-4" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Phone className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500">Số điện thoại</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {user.phoneNumber || 'Chưa cập nhật'}
                      </p>
                    </div>
                  </motion.div>
                  {/* Address */}
                  <motion.div className="flex items-center space-x-4" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Phone className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500">Địa chỉ</p>
                      {isAddressLoading ? (
                        <p className="text-sm text-gray-500">Đang tải...</p>
                      ) : (userAddresses && userAddresses.filter(a => !a.isDeleted).length > 0) ? (
                        <div className="space-y-3">
                          {userAddresses.filter(a => !a.isDeleted).map((addr, idx) => (
                            <div key={addr.id ?? idx} className="text-sm text-gray-900 border rounded p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-lg font-semibold">
                                    {addr.locationAddress && addr.locationAddress.trim() !== "" 
                                      ? addr.locationAddress 
                                      : ([addr.commune, addr.district, addr.province].filter(Boolean).join(', ') || ((addr.latitude && addr.longitude) ? `${addr.latitude}, ${addr.longitude}` : 'Chưa cập nhật'))}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {[addr.commune, addr.district, addr.province].filter(Boolean).join(', ') || ((addr.latitude && addr.longitude) ? `${addr.latitude}, ${addr.longitude}` : '')}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button size="sm" variant="outline" onClick={() => openEditAddress(addr)}>Cập nhật</Button>
                                  {addr.id != null && (
                                    <Button size="icon" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => confirmDeleteAddress(addr)} aria-label="Xóa địa chỉ" disabled={deletingAddressId === addr.id}>
                                      {deletingAddressId === addr.id ? <Spinner variant="circle-filled" size={16} /> : <Trash2 className="h-4 w-4" />}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          <Button size="sm" variant="outline" onClick={openAddAddressDialog}>Thêm địa chỉ</Button>
                        </div>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" onClick={openAddAddressDialog}>Thêm địa chỉ</Button>
                        </>
                      )}
                    </div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Sidebar */}
            <motion.div className="lg:col-span-4 space-y-6" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
              {/* Account Actions */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Tài khoản</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                  <Button onClick={handleEditProfile} className="w-full" variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Chỉnh sửa profile
                  </Button>
                  </motion.div>
                  <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                  <Button onClick={handleChangePassword} className="w-full" variant="outline">
                    <Key className="h-4 w-4 mr-2" />
                    Đổi mật khẩu
                  </Button>
                  </motion.div>
                  <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                  <Button onClick={handleLogout} className="w-full" variant="destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Đăng xuất
                  </Button>
                  </motion.div>
                </CardContent>
              </Card>

              {/* Account Info */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Thông tin tài khoản</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Trạng thái:</span>
                    <span className="text-sm font-medium text-green-600">Hoạt động</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Ngày tham gia:</span>
                    <span className="text-sm font-medium text-gray-900">Hôm nay</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.div>

    {/* Global Address Dialog (Add / Update) */}
    <Dialog open={isDialogOpen} onOpenChange={(open: boolean) => { 
      setIsDialogOpen(open); 
      if (!open) { 
        resetAddressForm(); 
      } 
    }}>
      <DialogContent className="sm:max-w-[520px] md:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{editingAddressId ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ'}</DialogTitle>
        </DialogHeader>
        
        {/* General Error Display */}
        {addressFormErrors.general && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{addressFormErrors.general}</p>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="space-y-3">
            <SearchAddress
              value={addressForm.locationAddress}
              onChange={(v) => setAddressForm({ ...addressForm, locationAddress: v })}
              onPick={(lat, lng, label) => {
                setAddressForm((prev) => ({ ...prev, locationAddress: label || prev.locationAddress, latitude: lat, longitude: lng }));
              }}
            />
            <InlineMapPick
              lat={addressForm.latitude}
              lng={addressForm.longitude}
              onPick={(lat, lng) => setAddressForm((prev) => ({ ...prev, latitude: lat, longitude: lng }))}
            />
            {addressFormErrors.coordinates && (
              <p className="text-sm text-red-600">{addressFormErrors.coordinates}</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Vĩ độ</Label>
                <Input 
                  value={addressForm.latitude} 
                  onChange={(e) => setAddressForm({ ...addressForm, latitude: parseFloat(e.target.value) || 0 })} 
                  placeholder="0" 
                />
              </div>
              <div className="grid gap-2">
                <Label>Kinh độ</Label>
                <Input 
                  value={addressForm.longitude} 
                  onChange={(e) => setAddressForm({ ...addressForm, longitude: parseFloat(e.target.value) || 0 })} 
                  placeholder="0" 
                />
              </div>
            </div>
            {/* Removed manual code inputs; codes are handled internally via AddressSelector selections */}
            <div className="grid gap-2">
              <Label>Địa chỉ cụ thể <span className="text-red-500">*</span></Label>
              <Input 
                value={addressForm.locationAddress} 
                onChange={(e) => setAddressForm({ ...addressForm, locationAddress: e.target.value })} 
                placeholder="Số nhà, đường..." 
                className={addressFormErrors.locationAddress ? "border-red-500" : ""}
              />
              {addressFormErrors.locationAddress && (
                <p className="text-sm text-red-600">{addressFormErrors.locationAddress}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label>Chọn Tỉnh/Thành - Quận/Huyện - Xã/Phường <span className="text-red-500">*</span></Label>
              <AddressSelector
                selectedCity={addressForm.city}
                selectedDistrict={addressForm.district}
                selectedWard={addressForm.ward}
                onCityChange={(value, code) => setAddressForm((prev) => ({
                  ...prev,
                  city: value,
                  provinceCode: code || "",
                  // reset when city changes
                  district: '',
                  districtCode: "",
                  ward: '',
                  communeCode: "",
                }))}
                onDistrictChange={(value, code) => setAddressForm((prev) => ({
                  ...prev,
                  district: value,
                  districtCode: code || "",
                  // reset when district changes
                  ward: '',
                  communeCode: "",
                }))}
                onWardChange={(value, code) => setAddressForm((prev) => ({
                  ...prev,
                  ward: value,
                  communeCode: code || "",
                }))}
                initialCity={addressForm.city}
                initialDistrict={addressForm.district}
                initialWard={addressForm.ward}
              />
              {(addressFormErrors.city || addressFormErrors.district || addressFormErrors.ward) && (
                <div className="space-y-1">
                  {addressFormErrors.city && <p className="text-sm text-red-600">{addressFormErrors.city}</p>}
                  {addressFormErrors.district && <p className="text-sm text-red-600">{addressFormErrors.district}</p>}
                  {addressFormErrors.ward && <p className="text-sm text-red-600">{addressFormErrors.ward}</p>}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between pt-1">
              <Button 
                type="button" 
                size="sm" 
                className="bg-emerald-600 hover:bg-emerald-700" 
                onClick={handleCreateAddress}
                disabled={isSubmittingAddress}
              >
                {isSubmittingAddress ? (
                  <>
                    <Spinner variant="circle-filled" size={16} className="mr-2" />
                    {editingAddressId ? 'Đang cập nhật...' : 'Đang lưu...'}
                  </>
                ) : (
                  editingAddressId ? 'Cập nhật' : 'Lưu'
                )}
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter />
      </DialogContent>
    </Dialog>

    {/* Map overlay for picking coordinates */}
    {isMapOpen && (
      <MapUserArea
        onLocationSelect={(lat: number, lng: number) => {
          setAddressForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
        }}
        initialLocation={(addressForm.latitude && addressForm.longitude) ? { lat: addressForm.latitude, lng: addressForm.longitude } : undefined}
        onClose={() => setIsMapOpen(false)}
      />
    )}

    {/* Delete address confirmation dialog */}
    <AlertDialog open={deleteAddressDialogOpen} onOpenChange={setDeleteAddressDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Bạn muốn xóa địa chỉ ?</AlertDialogTitle>
          <AlertDialogDescription>
            Địa chỉ sẽ bị xóa khi bạn bấm đồng ý
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmDeleteAddress}>Đồng ý</AlertDialogAction>
        </AlertFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};
