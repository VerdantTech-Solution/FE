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

//

const CO2Info: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string>('');
  const [records, setRecords] = useState<CO2Record[]>([]);

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
  

  const oneYearAfterStartStr = useMemo(() => {
    const base = measurementStartDate || yesterdayStr;
    const d = new Date(`${base}T00:00:00`);
    d.setFullYear(d.getFullYear() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, [measurementStartDate, yesterdayStr]);

  const endMaxStr = useMemo(() => {
    // Giới hạn ngày kết thúc: không vượt quá 1 năm kể từ ngày bắt đầu (cho phép ngày tương lai)
    return oneYearAfterStartStr;
  }, [oneYearAfterStartStr]);

  // Khởi tạo mặc định khi mở dialog lần đầu
  React.useEffect(() => {
    if (open) {
      setMeasurementStartDate(prev => prev || yesterdayStr);
      setMeasurementEndDate(prev => prev || todayStr);
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

  const latestRecord = useMemo(() => {
    if (!records || records.length === 0) return undefined;
    // Sắp xếp theo updatedAt tạo cảm giác mới nhất
    const sorted = [...records].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return sorted[0];
  }, [records]);

  

  const handleCreateFootprint = async () => {
    if (Number.isNaN(farmIdNum)) {
      setSubmitMessage('Không xác định được trang trại. Vui lòng mở từ trang chi tiết trang trại.');
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
      setSubmitMessage('Ngày bắt đầu phải nhỏ hơn ngày kết thúc');
      return;
    }
    
    // Khoảng tối đa 1 năm kể từ ngày bắt đầu
    if (endDate > maxByOneYear) {
      setSubmitMessage('Khoảng thời gian tối đa là 1 năm kể từ ngày bắt đầu');
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
      if (res?.status) {
        const adjustedMsg = endDate > toDateOnly(todayStr) ? ' (đã tự động điều chỉnh ngày kết thúc về hôm nay) ' : '';
        setSubmitMessage(`Tạo CO2 footprint thành công${adjustedMsg}`);
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
      } else {
        setSubmitMessage(res?.errors?.join(', ') || 'Không thể tạo CO2 footprint');
      }
    } catch (error: unknown) {
      setSubmitMessage('Lỗi khi tạo CO2 footprint');
    } finally {
      setSubmitting(false);
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
      {/* Nút mở form CO2 Footprint: chỉ hiện khi chưa có dữ liệu */}
      {!loading && !loadError && (!records || records.length === 0) && (
        <div className="flex items-center gap-3">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="default">Thêm CO2 Footprint</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Thêm CO2 Footprint cho trang trại</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label className="mb-1 block">Ghi chú</Label>
                <Input
                  type="text"
                  placeholder="Ghi chú cho lần đo"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div>
                <Label className="mb-1 block">Ngày bắt đầu</Label>
                <Input
                  type="date"
                  value={measurementStartDate || yesterdayStr}
                  min="1900-01-01"
                  onChange={(e) => setMeasurementStartDate(e.target.value)}
                />
                <span className="text-[12px] text-gray-500">Có thể chọn ngày ở các tháng/năm khác.</span>
              </div>
              <div>
                <Label className="mb-1 block">Ngày kết thúc</Label>
                <Input
                  type="date"
                  value={measurementEndDate || todayStr}
                  min={measurementStartDate || yesterdayStr}
                  max={endMaxStr}
                  onChange={(e) => setMeasurementEndDate(e.target.value)}
                />
                <span className="text-[12px] text-gray-500">Có thể chọn ngày ở các tháng/năm khác. Không vượt quá 1 năm kể từ ngày bắt đầu.</span>
              </div>

              

              <div>
                <Label className="mb-1 block">Điện (kWh)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={electricityKwh}
                  onChange={(e) => setElectricityKwh(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
              <div>
                <Label className="mb-1 block">Xăng (lít)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={gasolineLiters}
                  onChange={(e) => setGasolineLiters(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
              <div>
                <Label className="mb-1 block">Dầu diesel (lít)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={dieselLiters}
                  onChange={(e) => setDieselLiters(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>

              <div>
                <Label className="mb-1 block">Phân hữu cơ</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={organicFertilizer}
                  onChange={(e) => setOrganicFertilizer(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
              <div>
                <Label className="mb-1 block">Phân NPK</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={npkFertilizer}
                  onChange={(e) => setNpkFertilizer(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
              <div>
                <Label className="mb-1 block">Phân urê</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={ureaFertilizer}
                  onChange={(e) => setUreaFertilizer(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
              <div>
                <Label className="mb-1 block">Phân lân</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={phosphateFertilizer}
                  onChange={(e) => setPhosphateFertilizer(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
            </div>
            <DialogFooter>
              <div className="flex items-center gap-3 w-full justify-between">
                {submitMessage && (
                  <span className="text-sm text-gray-600">{submitMessage}</span>
                )}
                <Button onClick={handleCreateFootprint} disabled={submitting}>
                  {submitting ? 'Đang tạo...' : 'Lưu CO2 Footprint'}
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
          <Button
            variant="destructive"
            className="ml-auto"
            onClick={async () => {
              if (!latestRecord) return;
              const ok = window.confirm('Xóa dữ liệu CO2 này? Hành động này không thể hoàn tác.');
              if (!ok) return;
              try {
                const res = await deleteCO2RecordById(latestRecord.id);
                if (res?.status) {
                  // reload list
                  setRecords(prev => prev.filter(r => r.id !== latestRecord.id));
                } else {
                  alert(res?.errors?.join(', ') || 'Xóa thất bại');
                }
              } catch (e: any) {
                alert(e?.errors?.join(', ') || 'Xóa thất bại');
              }
            }}
          >
            Xóa bản ghi
          </Button>
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
            <p className="text-xs text-gray-500">tấn CO2 (ước tính)</p>
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

      {/* Ẩn phần hấp thụ nếu chưa có dữ liệu */}
      

     

   
    </div>
  );
};

export default CO2Info;
