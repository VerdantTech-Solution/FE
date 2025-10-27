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
  
  // Shipping options state
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [selectedShippingId, setSelectedShippingId] = useState<string | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [orderPreviewId, setOrderPreviewId] = useState<string | null>(null);

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
        
      
        
        // Lấy địa chỉ từ profile
        let addresses: UserAddress[] = [];
        
        if (Array.isArray(profile?.addresses)) {
          addresses = (profile.addresses as UserAddress[]).filter((addr) => !addr.isDeleted);
        } else if (Array.isArray(profile?.address)) {
          addresses = (profile.address as UserAddress[]).filter((addr) => !addr.isDeleted);
        } else if (profile?.data && Array.isArray(profile.data.addresses)) {
          addresses = (profile.data.addresses as UserAddress[]).filter((addr) => !addr.isDeleted);
        } else if (profile?.data && Array.isArray(profile.data.address)) {
          addresses = (profile.data.address as UserAddress[]).filter((addr) => !addr.isDeleted);
        }
        
        setUserAddresses(addresses);
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
        const firstAddress = addresses.length > 0 ? addresses[0] : undefined;
        
        if (firstAddress?.id) {
          setAddressType('home');
          setSelectedAddressId(firstAddress.id);
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
  
  // Get selected shipping price from shipping options
  const selectedShippingPrice = useMemo(() => {
    if (!selectedShippingId || shippingOptions.length === 0) {
      return 0;
    }
    const selectedOption = shippingOptions.find(option => {
      const optionId = option.id || option.priceTableId || option.shippingDetailId;
      return String(optionId) === selectedShippingId;
    });
    return selectedOption?.totalAmount || 0;
  }, [selectedShippingId, shippingOptions]);
  
  const total = Math.max(0, subtotal) + selectedShippingPrice;

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

  const handleCreateOrderFromPreview = async (shippingDetailId: string) => {
    if (!orderPreviewId) {
      setError('Không tìm thấy mã bản xem trước đơn hàng');
      return;
    }
    
    try {
      setShippingLoading(true);
      setError(null);
      
      console.log('Creating order with:', {
        orderPreviewId,
        priceTableId: shippingDetailId
      });
      
      const { createOrderFromPreview } = await import('@/api/order');
      
      // Convert shippingDetailId to number - handle both string and number
      const priceTableIdValue = typeof shippingDetailId === 'string' 
        ? Number(shippingDetailId) || parseInt(shippingDetailId, 10) 
        : shippingDetailId;
      
      console.log('Converting shipping ID to priceTableId:', {
        shippingDetailId,
        priceTableIdValue
      });
      
      const response = await createOrderFromPreview(orderPreviewId, {
        priceTableId: priceTableIdValue
      });
      
      console.log('Order creation response:', response);
      
      if (response.status) {
        console.log('Order created successfully, navigating to success page');
        
        // Xóa giỏ hàng sau khi đặt hàng thành công
        try {
          const { clearCart } = await import('@/api/cart');
          await clearCart();
          console.log('Giỏ hàng đã được xóa sau khi đặt hàng thành công');
        } catch (clearError) {
          console.error('Lỗi khi xóa giỏ hàng:', clearError);
          // Không throw error để không làm gián đoạn flow đặt hàng
        }
        
        // Truyền dữ liệu đơn hàng qua navigation state
        navigate('/order/success', { 
          state: { 
            order: response.data,
            usr: { order: response.data }
          } 
        });
      } else {
        const errorMessage = response.errors?.[0] || 'Tạo đơn hàng thất bại';
        console.error('Order creation failed:', errorMessage);
        setError(errorMessage);
      }
    } catch (e: any) {
      console.error('Error creating order:', e);
      setError(e?.message || 'Không thể tạo đơn hàng');
    } finally {
      setShippingLoading(false);
    }
  };

  const handleSubmitPreview = async () => {
    if (!selectedAddressId) {
      setError('Vui lòng chọn địa chỉ giao hàng');
      return;
    }
    
    if (cartItems.length === 0) {
      setError('Giỏ hàng trống, vui lòng thêm sản phẩm');
      return;
    }
    
    const payload: CreateOrderPreviewRequest = {
      taxAmount: 0,
      discountAmount: 0,
      addressId: selectedAddressId,
      orderPaymentMethod,
      notes: notes.trim() || undefined,
      orderDetails: cartItems.map((it) => ({ 
        productId: it.productId, 
        quantity: it.quantity, 
        discountAmount: 0 
      })),
    };
    
    // Validate payload
    if (!payload.addressId || payload.addressId <= 0) {
      setError('Địa chỉ không hợp lệ');
      return;
    }
    
    // Kiểm tra địa chỉ có tồn tại trong userAddresses không
    const addressExists = userAddresses.some(addr => addr.id === payload.addressId);
    if (!addressExists) {
      setError(`Địa chỉ với ID ${payload.addressId} không tồn tại trong danh sách địa chỉ của bạn`);
      return;
    }
    
    if (!payload.orderDetails || payload.orderDetails.length === 0) {
      setError('Không có sản phẩm nào trong đơn hàng');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      console.log('Submitting order preview with payload:', payload);
      const res = await createOrderPreview(payload);
      console.log('Order preview response:', res);
      
      if (!res.status) {
        const errorMessage = res.errors?.[0] || 'Tạo bản xem trước thất bại';
        setError(errorMessage);
        return;
      }
      
      // Extract preview ID and shipping options
      let previewId: any = res.data;
      let shippingDetails: any[] = [];
      
      if (res.data && typeof res.data === 'object') {
        previewId = (res.data as any).orderPreviewId || (res.data as any).previewId || (res.data as any).id;
        shippingDetails = (res.data as any).shippingDetails || [];
      }
      
      console.log('Full response data:', JSON.stringify(res.data, null, 2));
      console.log('Shipping details extracted:', shippingDetails);
      
      if (previewId && typeof previewId === 'string' && previewId.trim() !== '') {
        console.log('Setting order preview ID:', previewId);
        setOrderPreviewId(previewId);
        
        if (shippingDetails && shippingDetails.length > 0) {
          console.log('Setting shipping options:', shippingDetails);
          setShippingOptions(shippingDetails);
          // Try multiple possible ID fields
          const firstShippingId = shippingDetails[0]?.id || shippingDetails[0]?.priceTableId || shippingDetails[0]?.shippingDetailId;
          console.log('First shipping option ID:', firstShippingId);
          if (firstShippingId) {
            setSelectedShippingId(String(firstShippingId));
          }
        } else {
          console.log('No shipping options, navigating to confirm page');
          navigate(`/order/confirm?previewId=${encodeURIComponent(previewId)}`);
        }
      } else {
        console.error('Invalid preview ID:', previewId);
        setError(`Không lấy được mã bản xem trước đơn hàng. Preview ID: ${previewId}`);
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

        {/* Debug info - remove in production */}
        <div className="mb-4 text-xs bg-gray-100 p-2 rounded hidden">
          <div>Shipping Options Count: {shippingOptions.length}</div>
          <div>Selected Shipping ID: {selectedShippingId || 'None'}</div>
          <div>Order Preview ID: {orderPreviewId || 'None'}</div>
          <div>Address Selected: {selectedAddressId || 'None'}</div>
        </div>

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
                          if (firstFarm?.address?.id) {
                            setSelectedAddressId(firstFarm.address.id);
                          }
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
                          {addressType === 'home' && (
                            <>
                              {userAddresses.length === 0 ? (
                                <SelectItem value="no-address" disabled>
                                  Không có địa chỉ nhà nào
                                </SelectItem>
                              ) : (
                                userAddresses.map((addr) => (
                                  <SelectItem key={addr.id} value={String(addr.id)}>
                                    {formatAddress(addr) || 'Địa chỉ không tên'}
                                  </SelectItem>
                                ))
                              )}
                            </>
                          )}
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
                    <input type="radio" name="pm" checked={orderPaymentMethod==='Banking'} onChange={() => {
                      setOrderPaymentMethod('Banking');
                      setOrderPreviewId(null);
                      setShippingOptions([]);
                      setSelectedShippingId(null);
                    }} />
                    <span>Chuyển khoản (Banking)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="pm" checked={orderPaymentMethod==='COD'} onChange={() => {
                      setOrderPaymentMethod('COD');
                      setOrderPreviewId(null);
                      setShippingOptions([]);
                      setSelectedShippingId(null);
                    }} />
                    <span>Thanh toán khi nhận hàng (COD)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="pm" checked={orderPaymentMethod==='Wallet'} onChange={() => {
                      setOrderPaymentMethod('Wallet');
                      setOrderPreviewId(null);
                      setShippingOptions([]);
                      setSelectedShippingId(null);
                    }} />
                    <span>Ví nội bộ</span>
                  </label>
                </div>

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tạm tính</span>
                    <span className="font-semibold">{currency(subtotal)}</span>
                  </div>
             
                  
                  {/* Show shipping only when shipping options are available and selected */}
                  {selectedShippingPrice > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phí vận chuyển</span>
                      <span className="font-semibold">{currency(selectedShippingPrice)}</span>
                    </div>
                  )}
                 
                  <Separator />
                  <div className="flex justify-between text-base">
                    <span className="font-bold">Tổng cộng</span>
                    <span className="font-bold text-green-700">{currency(total)}</span>
                  </div>
                </div>

                <Button 
                  className="w-full bg-green-600 hover:bg-green-700" 
                  disabled={submitting || !selectedAddressId || cartItems.length === 0} 
                  onClick={handleSubmitPreview}
                >
                  {submitting ? <Spinner variant="circle-filled" size={16} /> : 'Tạo bản xem trước'}
                </Button>
                
                {/* Shipping Options */}
                {shippingOptions.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-3">Chọn phương thức giao hàng</h3>
                    
                    {/* Show updated total when shipping is selected */}
                    {selectedShippingPrice > 0 && (
                      <div className="mb-4 p-3 bg-white rounded-lg border border-green-300">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Tổng tiền thanh toán:</span>
                          <span className="text-xl font-bold text-green-700">{currency(total)}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      {shippingOptions.map((option, index) => {
                        // Get the ID field - try multiple possible field names
                        const optionId = option.id || option.priceTableId || option.shippingDetailId || index;
                        const optionIdString = String(optionId);
                        
                        return (
                        <div 
                          key={optionIdString || `shipping-option-${index}`}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedShippingId === optionIdString
                              ? 'border-green-500 bg-green-50' 
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                          onClick={() => setSelectedShippingId(optionIdString)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <input 
                                type="radio" 
                                checked={selectedShippingId === optionIdString}
                                onChange={() => setSelectedShippingId(optionIdString)}
                                className="text-green-600"
                              />
                              <div className="flex items-center space-x-2">
                                {option.carrierLogo && (
                                  <img 
                                    src={option.carrierLogo} 
                                    alt={option.carrierName}
                                    className="w-8 h-8 object-contain"
                                  />
                                )}
                                <div>
                                  <div className="font-medium text-gray-900">{option.carrierName}</div>
                                  <div className="text-sm text-gray-600">{option.service}</div>
                                  <div className="text-xs text-gray-500">{option.expected}</div>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-green-600">
                                {currency(option.totalAmount)}
                              </div>
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                    
                    <div className="mt-4 flex space-x-2">
                      <Button 
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        disabled={!selectedShippingId || shippingLoading}
                        onClick={() => {
                          if (selectedShippingId) {
                            // Tạo order từ preview với shipping option đã chọn
                            handleCreateOrderFromPreview(selectedShippingId);
                          }
                        }}
                      >
                        {shippingLoading ? (
                          <>
                            <Spinner variant="circle-filled" size={16} className="mr-2" />
                            Đang tạo đơn hàng...
                          </>
                        ) : (
                          'Xác nhận đơn hàng'
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShippingOptions([]);
                          setSelectedShippingId(null);
                        }}
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                )}
                
                <Button variant="outline" className="w-full" onClick={() => navigate('/cart')}>Quay lại giỏ hàng</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}


