import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import { getUserProfile, type UserAddress } from '@/api/user';
import { getFarmProfilesByUserId, type FarmProfile } from '@/api/farm';
import { getCart, type CartItem } from '@/api/cart';
import { createOrderPreview, type CreateOrderPreviewRequest } from '@/api/order';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const currency = (v: number) => v.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

export default function PreviewOrderPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState<string>('');
  const [userAddresses, setUserAddresses] = useState<UserAddress[]>([]);
  const [farmProfiles, setFarmProfiles] = useState<FarmProfile[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [addressType, setAddressType] = useState<'home' | 'farm'>('home');
  const [orderPaymentMethod, setOrderPaymentMethod] = useState<'Banking' | 'COD' | 'Wallet'>('Banking');
  const [notes, setNotes] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [profileRes, cartRes] = await Promise.all([
          getUserProfile(),
          getCart(),
        ]);

        const profile: any = (profileRes as any)?.data ?? profileRes;
        setUserName(profile?.fullName || user?.fullName || '');
        setUserEmail(profile?.email || user?.email || '');
        setUserPhone(profile?.phoneNumber || (user as any)?.phoneNumber || '');
        if (Array.isArray(profile?.addresses)) {
          const activeAddresses = (profile.addresses as UserAddress[]).filter((addr) => !addr.isDeleted);
          setUserAddresses(activeAddresses);
        }
        // Fetch farms by current user id to avoid 405 on GET /api/FarmProfile
        const uid = Number(profile?.id);
        let farmsFetched: FarmProfile[] = [];
        if (!Number.isNaN(uid)) {
          try {
            const farmsRes = await getFarmProfilesByUserId(uid);
            if (Array.isArray(farmsRes)) {
              const activeFarms = farmsRes.filter((f) => f.status !== 'Deleted' && !!f.address?.id);
              farmsFetched = activeFarms;
              setFarmProfiles(activeFarms);
            }
          } catch (fe) {
            // ignore farm fetch errors, still allow preview with user addresses
          }
        }

        let items: CartItem[] = [];
        if ((cartRes as any)?.data?.cartItems) items = (cartRes as any).data.cartItems;
        else if ((cartRes as any)?.cartItems) items = (cartRes as any).cartItems;
        else if (Array.isArray(cartRes)) items = cartRes as CartItem[];
        setCartItems(items);

        // default select first user address if exists
        const firstAddress = Array.isArray(profile?.addresses)
          ? (profile.addresses as UserAddress[]).find((a) => !a.isDeleted)
          : undefined;
        if (firstAddress?.id) {
          setAddressType('home');
          setSelectedAddressId(firstAddress.id);
        } else if (Array.isArray(farmsFetched) && farmsFetched.length > 0 && farmsFetched[0].address?.id) {
          // fallback if only farm addresses exist
          setAddressType('farm');
          setSelectedAddressId(farmsFetched[0].address!.id);
        }
      } catch (e: any) {
        setError(e?.message || 'Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const subtotal = useMemo(() => cartItems.reduce((s, it) => s + it.unitPrice * it.quantity, 0), [cartItems]);
  const shipping = subtotal > 500000 ? 0 : 30000;
  const vat = Math.round(subtotal * 0.08);
  const total = Math.max(0, subtotal) + shipping + vat;

  const formatAddress = (addr?: { locationAddress?: string; commune?: string; district?: string; province?: string; latitude?: number; longitude?: number }) => {
    if (!addr) return '';
    const hasLocation = addr.locationAddress && addr.locationAddress.trim() !== '';
    const admin = [addr.commune, addr.district, addr.province].filter(Boolean).join(', ');
    if (hasLocation && admin) return `${addr.locationAddress}, ${admin}`;
    if (hasLocation) return String(addr.locationAddress);
    if (admin) return admin;
    if (addr.latitude && addr.longitude) return `${addr.latitude}, ${addr.longitude}`;
    return '';
  };

  const handleSubmitPreview = async () => {
    if (!selectedAddressId) {
      setError('Vui lòng chọn địa chỉ giao hàng');
      return;
    }
    const payload: CreateOrderPreviewRequest = {
      taxAmount: vat,
      discountAmount: 0,
      addressId: selectedAddressId,
      orderPaymentMethod,
      notes,
      orderDetails: cartItems.map((it) => ({ productId: it.productId, quantity: it.quantity, discountAmount: 0 })),
    };
    try {
      setSubmitting(true);
      setError(null);
      const res = await createOrderPreview(payload);
      if (!res.status) {
        setError(res.errors?.[0] || 'Tạo bản xem trước thất bại');
        return;
      }
      // Navigate to confirm page with previewId returned from API
      const extractPreviewId = (r: any): string => {
        const d = (r && typeof r === 'object' && 'data' in r) ? (r as any).data : r;
        if (typeof d === 'string') return d;
        if (d && typeof d === 'object') {
          if (typeof d.orderPreviewId === 'string') return d.orderPreviewId;
          if (typeof d.previewId === 'string') return d.previewId;
          if (typeof d.id === 'string') return d.id;
        }
        return '';
      };
      const previewId = extractPreviewId(res);
      if (previewId) {
        navigate(`/order/confirm?previewId=${encodeURIComponent(previewId)}`);
      } else {
        setError('Không lấy được mã bản xem trước đơn hàng. Vui lòng thử lại.');
      }
    } catch (e: any) {
      setError(e?.message || 'Không thể tạo bản xem trước');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 mt-[20px] flex items-center justify-center">
        <div className="text-center">
          <Spinner variant="circle-filled" size={60} className="text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Đang tải...</h3>
          <p className="text-gray-500">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 mt-[100px]  ">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Xem trước đơn hàng</h1>
        </motion.div>

        {error && (
          <div className="mb-4 text-red-600 text-sm">{error}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin người nhận</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Họ và tên</div>
                    <div className="font-semibold">{userName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Email</div>
                    <div className="font-semibold">{userEmail}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Số điện thoại</div>
                    <div className="font-semibold">{userPhone || 'Chưa cập nhật'}</div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="text-sm text-gray-500">Chọn địa chỉ giao hàng</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Loại địa chỉ</div>
                      <Select value={addressType} onValueChange={(v) => {
                        const t = v as 'home' | 'farm';
                        setAddressType(t);
                        // auto-select first address of this type
                        if (t === 'home') {
                          const first = userAddresses[0];
                          setSelectedAddressId(first?.id ?? null);
                        } else {
                          const firstFarm = farmProfiles.find(f => f.address?.id);
                          setSelectedAddressId(firstFarm?.address?.id ?? null);
                        }
                      }}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn loại địa chỉ" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="home">Địa chỉ nhà</SelectItem>
                          <SelectItem value="farm">Địa chỉ trang trại</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 mb-1">Địa chỉ cụ thể</div>
                      <Select value={selectedAddressId ? String(selectedAddressId) : undefined} onValueChange={(v) => setSelectedAddressId(Number(v))}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={addressType === 'home' ? 'Chọn địa chỉ nhà' : 'Chọn địa chỉ trang trại'} />
                        </SelectTrigger>
                        <SelectContent>
                          {addressType === 'home' && userAddresses.map((addr) => (
                            <SelectItem key={addr.id} value={String(addr.id)}>
                              {formatAddress(addr) || 'Địa chỉ không tên'}
                            </SelectItem>
                          ))}
                          {addressType === 'farm' && farmProfiles.filter(f => f.status !== 'Deleted' && f.address?.id).map((farm) => (
                            <SelectItem key={`farm-${farm.id}`} value={String(farm.address!.id)}>
                              {farm.farmName} — {formatAddress(farm.address!)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="text-sm text-gray-500">Ghi chú cho đơn hàng</div>
                  <textarea className="w-full border rounded-md p-2" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="VD: Giao trong giờ hành chính" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sản phẩm trong đơn</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.length === 0 ? (
                  <div className="text-sm text-gray-600">Không có sản phẩm nào.</div>
                ) : (
                  cartItems.map((it) => (
                    <div key={it.productId} className="flex items-center justify-between">
                      <div className="text-gray-800">{it.productName} x {it.quantity}</div>
                      <div className="font-semibold">{currency(it.unitPrice * it.quantity)}</div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Thanh toán</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="pm" checked={orderPaymentMethod==='Banking'} onChange={() => setOrderPaymentMethod('Banking')} />
                    <span>Chuyển khoản (Banking)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="pm" checked={orderPaymentMethod==='COD'} onChange={() => setOrderPaymentMethod('COD')} />
                    <span>Thanh toán khi nhận hàng (COD)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="pm" checked={orderPaymentMethod==='Wallet'} onChange={() => setOrderPaymentMethod('Wallet')} />
                    <span>Ví nội bộ</span>
                  </label>
                </div>

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tạm tính</span>
                    <span className="font-semibold">{currency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phí vận chuyển</span>
                    <span className="font-semibold">{shipping === 0 ? 'Miễn phí' : currency(shipping)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">VAT (8%)</span>
                    <span className="font-semibold">{currency(vat)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base">
                    <span className="font-bold">Tổng cộng</span>
                    <span className="font-bold text-green-700">{currency(total)}</span>
                  </div>
                </div>

                <Button className="w-full bg-green-600 hover:bg-green-700" disabled={submitting || !selectedAddressId} onClick={handleSubmitPreview}>
                  {submitting ? <Spinner variant="circle-filled" size={16} /> : 'Tạo bản xem trước'}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => navigate('/cart')}>Quay lại giỏ hàng</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}


