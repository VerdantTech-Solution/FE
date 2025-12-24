import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Factory, CloudRain, Droplets, Sun, Zap, Flame, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { createCO2FootprintForFarm, getCO2DataByFarmId, deleteCO2RecordById, type CO2Record } from '@/api/co2';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

//

const CO2Info: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string>('');
  const [records, setRecords] = useState<CO2Record[]>([]);
  
  // AlertDialog states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteSuccessOpen, setDeleteSuccessOpen] = useState(false);
  const [deleteErrorOpen, setDeleteErrorOpen] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string>('');
  const [createSuccessOpen, setCreateSuccessOpen] = useState(false);
  const [createErrorOpen, setCreateErrorOpen] = useState(false);
  const [createErrorMessage, setCreateErrorMessage] = useState<string>('');
  const [createSuccessMessage, setCreateSuccessMessage] = useState<string>('');
  const [recordToDelete, setRecordToDelete] = useState<CO2Record | null>(null);

  const { id: routeFarmId } = useParams<{ id: string }>();
  const farmIdNum = routeFarmId ? Number(routeFarmId) : NaN;

  const todayStr = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const [measurementStartDate, setMeasurementStartDate] = useState<string>('');
  const [measurementEndDate, setMeasurementEndDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [electricityKwh, setElectricityKwh] = useState<number | ''>('');
  const [gasolineLiters, setGasolineLiters] = useState<number | ''>('');
  const [dieselLiters, setDieselLiters] = useState<number | ''>('');
  const [organicFertilizer, setOrganicFertilizer] = useState<number | ''>('');
  const [npkFertilizer, setNpkFertilizer] = useState<number | ''>('');
  const [ureaFertilizer, setUreaFertilizer] = useState<number | ''>('');
  const [phosphateFertilizer, setPhosphateFertilizer] = useState<number | ''>('');
  
  // Date validation errors
  const [startDateError, setStartDateError] = useState<string>('');
  const [endDateError, setEndDateError] = useState<string>('');
  

  const oneYearAfterStartStr = useMemo(() => {
    const base = measurementStartDate || yesterdayStr;
    const d = new Date(`${base}T00:00:00`);
    d.setFullYear(d.getFullYear() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, [measurementStartDate, yesterdayStr]);

  // Validate start date
  const handleStartDateChange = (value: string) => {
    setMeasurementStartDate(value);
    const selectedDate = new Date(`${value}T00:00:00`);
    const today = new Date(`${todayStr}T00:00:00`);
    
    if (selectedDate > today) {
      setStartDateError('Không được chọn ngày trong tương lai');
    } else {
      setStartDateError('');
    }
    
    // Validate end date if already set
    if (measurementEndDate) {
      const endDate = new Date(`${measurementEndDate}T00:00:00`);
      const oneYearLater = new Date(selectedDate);
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
      
      if (endDate > oneYearLater) {
        setEndDateError('Không được vượt quá 1 năm kể từ ngày bắt đầu');
      } else if (endDate <= selectedDate) {
        setEndDateError('Ngày kết thúc phải sau ngày bắt đầu');
      } else {
        setEndDateError('');
      }
    }
  };
  
  // Validate end date
  const handleEndDateChange = (value: string) => {
    setMeasurementEndDate(value);
    const selectedDate = new Date(`${value}T00:00:00`);
    const today = new Date(`${todayStr}T00:00:00`);
    const startDate = new Date(`${measurementStartDate || yesterdayStr}T00:00:00`);
    const oneYearLater = new Date(startDate);
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    
    if (selectedDate > today) {
      setEndDateError('Không được chọn ngày trong tương lai');
    } else if (selectedDate > oneYearLater) {
      setEndDateError('Không được vượt quá 1 năm kể từ ngày bắt đầu');
    } else if (selectedDate <= startDate) {
      setEndDateError('Ngày kết thúc phải sau ngày bắt đầu');
    } else {
      setEndDateError('');
    }
  };

  // Khởi tạo mặc định khi mở dialog lần đầu
  React.useEffect(() => {
    if (open) {
      setMeasurementStartDate(prev => prev || yesterdayStr);
      setMeasurementEndDate(prev => prev || todayStr);
      setStartDateError('');
      setEndDateError('');
    }
  }, [open, yesterdayStr, todayStr]);

  // Tải dữ liệu CO2 theo farmId
  React.useEffect(() => {
    const fetchData = async () => {
      if (Number.isNaN(farmIdNum)) return;
      setLoading(true);
      setLoadError('');
      try {
        const res = await getCO2DataByFarmId(farmIdNum);
        if (res?.status) {
          setRecords(res.data || []);
        } else {
          setLoadError(res?.errors?.join(', ') || 'Không thể tải dữ liệu CO2');
        }
      } catch (e: any) {
        setLoadError(e?.errors?.join(', ') || 'Không thể tải dữ liệu CO2');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [farmIdNum]);

  const sortedRecords = useMemo(() => {
    if (!records || records.length === 0) return [];
    return [...records].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [records]);

  const latestRecord = sortedRecords[0];

  

  const handleCreateFootprint = async () => {
    if (Number.isNaN(farmIdNum)) {
      setCreateErrorMessage('Không xác định được trang trại. Vui lòng mở từ trang chi tiết trang trại.');
      setCreateErrorOpen(true);
      return;
    }

    const start = measurementStartDate || yesterdayStr;
    const end = measurementEndDate || todayStr;
    // Chuẩn hóa so sánh theo ngày (không lấy giờ)
    const toDateOnly = (s: string) => new Date(`${s}T00:00:00`);
    const startDate = toDateOnly(start);
    const endDate = toDateOnly(end);
    const maxByOneYear = toDateOnly(oneYearAfterStartStr);

    if (startDate >= endDate) {
      setCreateErrorMessage('Ngày bắt đầu phải nhỏ hơn ngày kết thúc');
      setCreateErrorOpen(true);
      return;
    }
    
    // Khoảng tối đa 1 năm kể từ ngày bắt đầu
    if (endDate > maxByOneYear) {
      setCreateErrorMessage('Khoảng thời gian tối đa là 1 năm kể từ ngày bắt đầu');
      setCreateErrorOpen(true);
      return;
    }

    setSubmitting(true);
    setSubmitMessage('');
    try {
      // Backend không chấp nhận ngày kết thúc trong tương lai, nên clamp về hôm nay khi gửi
      const endForPayload = endDate > toDateOnly(todayStr) ? todayStr : end;
      const payload = {
        measurementStartDate: start,
        measurementEndDate: endForPayload,
        notes: notes || undefined,
        electricityKwh: electricityKwh === '' ? undefined : Number(electricityKwh),
        gasolineLiters: gasolineLiters === '' ? undefined : Number(gasolineLiters),
        dieselLiters: dieselLiters === '' ? undefined : Number(dieselLiters),
        organicFertilizer: organicFertilizer === '' ? undefined : Number(organicFertilizer),
        npkFertilizer: npkFertilizer === '' ? undefined : Number(npkFertilizer),
        ureaFertilizer: ureaFertilizer === '' ? undefined : Number(ureaFertilizer),
        phosphateFertilizer: phosphateFertilizer === '' ? undefined : Number(phosphateFertilizer),
      };
      const res = await createCO2FootprintForFarm(farmIdNum, payload);
      // Kiểm tra cả status và statusCode để đảm bảo tương thích
      const isSuccess = res?.status === true || (res?.statusCode >= 200 && res?.statusCode < 300);
      
      if (isSuccess) {
        const adjustedMsg = endDate > toDateOnly(todayStr) ? ' (đã tự động điều chỉnh ngày kết thúc về hôm nay)' : '';
        setCreateSuccessMessage(`Tạo CO2 footprint thành công${adjustedMsg}`);
        setOpen(false);
        // reset nhẹ các trường số
        setMeasurementStartDate(yesterdayStr);
        setMeasurementEndDate(todayStr);
        setNotes('');
        setElectricityKwh('');
        setGasolineLiters('');
        setDieselLiters('');
        setOrganicFertilizer('');
        setNpkFertilizer('');
        setUreaFertilizer('');
        setPhosphateFertilizer('');
        
        // Reload data trong background, không ảnh hưởng đến success dialog
        const fetchData = async () => {
          try {
            const res = await getCO2DataByFarmId(farmIdNum);
            if (res?.status || (res?.statusCode >= 200 && res?.statusCode < 300)) {
              setRecords(res.data || []);
            }
          } catch (e) {
            // Silent fail - không ảnh hưởng đến success message
            console.error('Failed to reload CO2 data:', e);
          }
        };
        fetchData();
        
        // Hiển thị success dialog sau khi đã reset form
        setCreateSuccessOpen(true);
      } else {
        setCreateErrorMessage(res?.errors?.join(', ') || 'Không thể tạo CO2 footprint');
        setCreateErrorOpen(true);
      }
    } catch (error: any) {
      // Xử lý error từ interceptor (có thể là ApiResponseWrapper)
      if (error && typeof error === 'object' && 'errors' in error) {
        setCreateErrorMessage(Array.isArray(error.errors) ? error.errors.join(', ') : 'Không thể tạo CO2 footprint');
      } else if (error?.response?.data?.errors) {
        setCreateErrorMessage(Array.isArray(error.response.data.errors) ? error.response.data.errors.join(', ') : 'Không thể tạo CO2 footprint');
      } else {
        setCreateErrorMessage(error?.message || 'Lỗi khi tạo CO2 footprint');
      }
      setCreateErrorOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (record: CO2Record) => {
    setRecordToDelete(record);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;
    setDeleteConfirmOpen(false);
    try {
      const res = await deleteCO2RecordById(recordToDelete.id);
      // Kiểm tra cả status và statusCode để đảm bảo tương thích
      const isSuccess = res?.status === true || (res?.statusCode >= 200 && res?.statusCode < 300);
      
      if (isSuccess) {
        setRecords(prev => prev.filter(r => r.id !== recordToDelete.id));
        setDeleteSuccessOpen(true);
        setRecordToDelete(null);
      } else {
        setDeleteErrorMessage(res?.errors?.join(', ') || 'Xóa thất bại');
        setDeleteErrorOpen(true);
        setRecordToDelete(null);
      }
    } catch (e: any) {
      // Xử lý error từ interceptor (có thể là ApiResponseWrapper)
      if (e && typeof e === 'object' && 'errors' in e) {
        setDeleteErrorMessage(Array.isArray(e.errors) ? e.errors.join(', ') : 'Xóa thất bại');
      } else if (e?.response?.data?.errors) {
        setDeleteErrorMessage(Array.isArray(e.response.data.errors) ? e.response.data.errors.join(', ') : 'Xóa thất bại');
      } else {
        setDeleteErrorMessage(e?.message || 'Xóa thất bại');
      }
      setDeleteErrorOpen(true);
      setRecordToDelete(null);
    }
  };

  // Dữ liệu cho UI tổng quan: ưu tiên lấy từ latestRecord nếu có, fallback giá trị hiển thị "—"
  const totalEmission = latestRecord?.co2Footprint ?? undefined;
  //

  // Tính tỉ lệ nguồn phát thải dựa trên năng lượng tiêu thụ (điện/xăng/diesel)
  const energyElectric = latestRecord?.energyUsage?.electricityKwh ?? 0;
  const energyGasoline = latestRecord?.energyUsage?.gasolineLiters ?? 0;
  const energyDiesel = latestRecord?.energyUsage?.dieselLiters ?? 0;
  const energySum = energyElectric + energyGasoline + energyDiesel;
  const emissionByEnergy = energySum > 0 ? [
    { key: 'electricity', label: 'Điện', value: Math.round((energyElectric / energySum) * 100) },
    { key: 'gasoline', label: 'Xăng', value: Math.round((energyGasoline / energySum) * 100) },
    { key: 'diesel', label: 'Dầu diesel', value: Math.round((energyDiesel / energySum) * 100) },
  ] : [];

  const getEmissionColor = (value: number) => {
    if (value >= 30) return 'text-red-600';
    if (value >= 20) return 'text-orange-600';
    return 'text-green-600';
  };

  //

  return (
    <div className="space-y-6">
      {/* Nút mở form CO2 Footprint: luôn hiển thị để thêm bản ghi mới */}
      {!loading && !loadError && (
        <div className="flex items-center gap-3">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="default">
                {records && records.length > 0 ? 'Tạo bản ghi' : 'Tạo bản ghi'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl">{records && records.length > 0 ? 'Thêm bản ghi CO2 mới' : 'Bản ghi CO2 Footprint cho trang trại'}</DialogTitle>
              <p className="text-sm text-gray-500">Nhập đầy đủ thông tin để tính toán lượng phát thải CO₂ của trang trại</p>
            </DialogHeader>
            <div className="space-y-6 pt-2">
              {/* Ghi chú */}
              <div className="md:col-span-2 space-y-2">
                <Label className="text-sm font-medium">Ghi chú</Label>
                <Input
                  type="text"
                  placeholder="Ghi chú cho lần đo"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Thời gian đo */}
              <div className="md:col-span-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">📅 Khoảng thời gian đo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Ngày bắt đầu</Label>
                    <Input
                      type="date"
                      value={measurementStartDate || yesterdayStr}
                      min="1900-01-01"
                      max={todayStr}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className={startDateError ? 'border-red-500' : ''}
                    />
                    {startDateError && (
                      <span className="text-xs text-red-600">{startDateError}</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Ngày kết thúc</Label>
                    <Input
                      type="date"
                      value={measurementEndDate || todayStr}
                      min="1900-01-01"
                      max={todayStr}
                      onChange={(e) => handleEndDateChange(e.target.value)}
                      className={endDateError ? 'border-red-500' : ''}
                    />
                    {endDateError && (
                      <span className="text-xs text-red-600">{endDateError}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Năng lượng */}
              <div className="md:col-span-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">⚡ Năng lượng tiêu thụ</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Điện (kWh)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={electricityKwh}
                      onChange={(e) => setElectricityKwh(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Xăng (lít)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={gasolineLiters}
                      onChange={(e) => setGasolineLiters(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Dầu diesel (lít)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={dieselLiters}
                      onChange={(e) => setDieselLiters(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              {/* Phân bón */}
              <div className="md:col-span-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">🌱 Phân bón sử dụng</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium min-h-[20px]">Hữu cơ (kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={organicFertilizer}
                      onChange={(e) => setOrganicFertilizer(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium min-h-[20px]">NPK (kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={npkFertilizer}
                      onChange={(e) => setNpkFertilizer(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium min-h-[20px]">Urê (kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={ureaFertilizer}
                      onChange={(e) => setUreaFertilizer(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium min-h-[20px]">Lân (kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={phosphateFertilizer}
                      onChange={(e) => setPhosphateFertilizer(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6 pt-4 border-t">
              <div className="flex items-center gap-3 w-full justify-end">
                {submitMessage && (
                  <span className="text-sm text-gray-600 mr-auto">{submitMessage}</span>
                )}
                <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                  Hủy
                </Button>
                <Button onClick={handleCreateFootprint} disabled={submitting}>
                  {submitting ? 'Đang tạo...' : 'Lưu bản ghi'}
                </Button>
              </div>
            </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Dữ liệu từ API - tóm tắt đầu trang */}
      {!loading && !loadError && latestRecord && (
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">Bắt đầu: {latestRecord.measurementStartDate}</Badge>
          <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-200">Kết thúc: {latestRecord.measurementEndDate}</Badge>
          {latestRecord.notes && <Badge variant="outline" className="border-amber-200 text-amber-700">Ghi chú: {latestRecord.notes}</Badge>}
        </div>
      )}
      {loading && <div className="text-sm text-gray-600">Đang tải dữ liệu...</div>}
      {!loading && loadError && (
        <div className="text-sm text-red-600">{loadError}</div>
      )}

      {/* Tổng quan CO2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 bg-gradient-to-br from-red-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Factory className="h-4 w-4 text-red-500" />
              Phát thải CO2
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-red-600 tracking-tight animate-[pulse_2s_ease-in-out_infinite]">{totalEmission ?? '—'}</div>
            <p className="text-xs text-gray-500">Kí CO2 (kg CO2e) (ước tính)</p>
            {latestRecord && (
              <p className="text-[11px] text-gray-500 mt-1">Khoảng đo: {latestRecord.measurementStartDate} → {latestRecord.measurementEndDate}</p>
            )}
          </CardContent>
        </Card>
        {/* Đất */}
        <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Leaf className="h-4 w-4 text-emerald-600" />
              Đất
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2"><span className="text-gray-500">Cát/Sét/Limon (%):</span> <span className="font-medium">{latestRecord ? `${latestRecord.sandPct ?? '—'} / ${latestRecord.clayPct ?? '—'} / ${latestRecord.siltPct ?? '—'}` : '—'}</span></div>
              <div className="flex items-center gap-2"><Droplets className="h-3.5 w-3.5 text-sky-600" /><span className="text-gray-500">pH H2O:</span> <span className="font-medium">{latestRecord?.phh2o ?? '—'}</span></div>
            </div>
          </CardContent>
        </Card>

        {/* Thời tiết */}
        <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CloudRain className="h-4 w-4 text-sky-600" />
              Thời tiết
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2"><CloudRain className="h-3.5 w-3.5 text-sky-600" /><span className="text-gray-500">Mưa (tổng):</span> <span className="font-medium">{latestRecord?.precipitationSum ?? '—'}</span></div>
              <div className="flex items-center gap-2"><Sun className="h-3.5 w-3.5 text-amber-500" /><span className="text-gray-500">ET0 FAO:</span> <span className="font-medium">{latestRecord?.et0FaoEvapotranspiration ?? '—'}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nguồn phát thải (tạm tính theo năng lượng tiêu thụ) */}
      {emissionByEnergy.length > 0 && (
        <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
          <CardHeader>
            <CardTitle className="text-lg">Nguồn phát thải CO2 (ước tính theo năng lượng)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {emissionByEnergy.map((item) => (
              <div key={item.key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium flex items-center gap-2">
                    {item.key === 'electricity' && <Zap className="h-3.5 w-3.5 text-yellow-500" />}
                    {item.key === 'gasoline' && <Flame className="h-3.5 w-3.5 text-orange-500" />}
                    {item.key === 'diesel' && <Flame className="h-3.5 w-3.5 text-red-500" />}
                    {item.label}
                  </span>
                  <span className={`text-sm font-bold ${getEmissionColor(item.value)}`}>{item.value}%</span>
                </div>
                <Progress value={item.value} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Năng lượng & Phân bón chi tiết */}
      {!loading && !loadError && latestRecord && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Zap className="h-4 w-4 text-yellow-500" /> Năng lượng</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-yellow-500" />Điện (kWh)</span>
                <span className="font-semibold">{latestRecord.energyUsage?.electricityKwh ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 flex items-center gap-2"><Flame className="h-3.5 w-3.5 text-orange-500" />Xăng (lít)</span>
                <span className="font-semibold">{latestRecord.energyUsage?.gasolineLiters ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 flex items-center gap-2"><Flame className="h-3.5 w-3.5 text-red-500" />Diesel (lít)</span>
                <span className="font-semibold">{latestRecord.energyUsage?.dieselLiters ?? '—'}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Leaf className="h-4 w-4 text-emerald-600" /> Phân bón</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Hữu cơ</span>
                <span className="font-semibold">{latestRecord.fertilizer?.organicFertilizer ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">NPK</span>
                <span className="font-semibold">{latestRecord.fertilizer?.npkFertilizer ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Urê</span>
                <span className="font-semibold">{latestRecord.fertilizer?.ureaFertilizer ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Lân</span>
                <span className="font-semibold">{latestRecord.fertilizer?.phosphateFertilizer ?? '—'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lịch sử đo CO2 */}
      {!loading && !loadError && sortedRecords.length > 0 && (
        <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Lịch sử đo CO₂</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Danh sách các lần đo CO₂ gần nhất. Xóa sẽ xóa vĩnh viễn bản ghi – hãy cân nhắc trước khi thao tác.
            </p>
          </CardHeader>
            <CardContent className="space-y-3">
            {sortedRecords.map((record) => (
              <div
                key={record.id}
                className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1 text-sm">
                    <div className="font-semibold text-gray-900">
                      {record.measurementStartDate} → {record.measurementEndDate}
                    </div>
                    {record.notes && (
                      <div className="text-gray-600">Ghi chú: {record.notes}</div>
                    )}
                    <div className="text-gray-600 text-xs">
                      Cập nhật: {new Date(record.updatedAt).toLocaleString('vi-VN')}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 md:mt-0">
                    <Badge variant="outline" className="border-slate-200 text-slate-600">
                      ID #{record.id}
                    </Badge>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(record)}
                      className="shrink-0"
                    >
                      Xóa bản ghi
                    </Button>
                  </div>
                </div>

                {/* Chi tiết CO2 cho từng lần đo */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-gray-700">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-gray-900">
                      <Factory className="h-3.5 w-3.5 text-red-500" />
                      <span>Phát thải CO₂</span>
                    </div>
                    <div>
                      Tổng: <span className="font-semibold">{record.co2Footprint ?? '—'}</span> tấn CO₂
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-gray-900">
                      <Zap className="h-3.5 w-3.5 text-yellow-500" />
                      <span>Năng lượng</span>
                    </div>
                    <div>Điện: <span className="font-semibold">{record.energyUsage?.electricityKwh ?? '—'}</span> kWh</div>
                    <div>Xăng: <span className="font-semibold">{record.energyUsage?.gasolineLiters ?? '—'}</span> lít</div>
                    <div>Diesel: <span className="font-semibold">{record.energyUsage?.dieselLiters ?? '—'}</span> lít</div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-gray-900">
                      <Leaf className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Phân bón</span>
                    </div>
                    <div>Hữu cơ: <span className="font-semibold">{record.fertilizer?.organicFertilizer ?? '—'}</span> kg</div>
                    <div>NPK: <span className="font-semibold">{record.fertilizer?.npkFertilizer ?? '—'}</span> kg</div>
                    <div>Urê: <span className="font-semibold">{record.fertilizer?.ureaFertilizer ?? '—'}</span> kg</div>
                    <div>Lân: <span className="font-semibold">{record.fertilizer?.phosphateFertilizer ?? '—'}</span> kg</div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-gray-900">
                      <Droplets className="h-3.5 w-3.5 text-sky-600" />
                      <span>Đất & Lượng mưa</span>
                    </div>
                    <div>
                      Cát/Sét/Limon:{" "}
                      <span className="font-semibold">
                        {record.sandPct ?? '—'} / {record.clayPct ?? '—'} / {record.siltPct ?? '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Droplets className="h-3 w-3 text-sky-600" />
                      <span>pH H₂O: <span className="font-semibold">{record.phh2o ?? '—'}</span></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CloudRain className="h-3 w-3 text-sky-600" />
                      <span>Mưa: <span className="font-semibold">{record.precipitationSum ?? '—'}</span></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Sun className="h-3 w-3 text-amber-500" />
                      <span>ET0 FAO: <span className="font-semibold">{record.et0FaoEvapotranspiration ?? '—'}</span></span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* AlertDialog cho xác nhận xóa */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa dữ liệu CO2 này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog cho thành công khi xóa */}
      <AlertDialog open={deleteSuccessOpen} onOpenChange={setDeleteSuccessOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-green-600">Thành công</AlertDialogTitle>
            <AlertDialogDescription>
              Đã xóa bản ghi CO2 thành công.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setDeleteSuccessOpen(false)}>Đóng</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog cho lỗi khi xóa */}
      <AlertDialog open={deleteErrorOpen} onOpenChange={setDeleteErrorOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Lỗi</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteErrorMessage || 'Xóa thất bại'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setDeleteErrorOpen(false)}>Đóng</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog cho thành công khi tạo */}
      <AlertDialog open={createSuccessOpen} onOpenChange={setCreateSuccessOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-green-600">Thành công</AlertDialogTitle>
            <AlertDialogDescription>
              {createSuccessMessage || 'Tạo CO2 footprint thành công'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setCreateSuccessOpen(false)}>Đóng</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog cho lỗi khi tạo */}
      <AlertDialog open={createErrorOpen} onOpenChange={setCreateErrorOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Lỗi</AlertDialogTitle>
            <AlertDialogDescription>
              {createErrorMessage || 'Không thể tạo CO2 footprint'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setCreateErrorOpen(false)}>Đóng</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
   
    </div>
  );
};

export default CO2Info;
