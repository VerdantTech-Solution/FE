import React, { useCallback, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Polygon, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type LatLng = { lat: number; lng: number };

// Fallback default marker icon for Leaflet in bundlers
const DefaultIcon = L.icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Earth radius (meters)
const EARTH_RADIUS_M = 6378137;

// ===== Validation helpers for placing points =====
function arePointsNearlyEqual(a: LatLng, b: LatLng, eps = 1e-6): boolean {
  return Math.abs(a.lat - b.lat) < eps && Math.abs(a.lng - b.lng) < eps;
}

function triangleDoubleArea(a: LatLng, b: LatLng, c: LatLng): number {
  // Shoelace component for three points; double-signed area in degrees space (good for collinearity check)
  return (
    (b.lng - a.lng) * (c.lat - a.lat) -
    (b.lat - a.lat) * (c.lng - a.lng)
  );
}

function isCollinear(a: LatLng, b: LatLng, c: LatLng, eps = 1e-10): boolean {
  return Math.abs(triangleDoubleArea(a, b, c)) < eps;
}

// Line segment intersection check for geographic coords treated as planar for small spans
type Point2D = { x: number; y: number };
function toPoint2D(p: LatLng): Point2D { return { x: p.lng, y: p.lat }; }

function orientation(p: Point2D, q: Point2D, r: Point2D): number {
  const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  if (Math.abs(val) < 1e-12) return 0; // collinear
  return val > 0 ? 1 : 2; // 1: clockwise, 2: counterclockwise
}

function onSegment(p: Point2D, q: Point2D, r: Point2D): boolean {
  return (
    Math.min(p.x, r.x) - 1e-12 <= q.x && q.x <= Math.max(p.x, r.x) + 1e-12 &&
    Math.min(p.y, r.y) - 1e-12 <= q.y && q.y <= Math.max(p.y, r.y) + 1e-12
  );
}

function segmentsIntersect(p1: LatLng, q1: LatLng, p2: LatLng, q2: LatLng): boolean {
  const P1 = toPoint2D(p1), Q1 = toPoint2D(q1), P2 = toPoint2D(p2), Q2 = toPoint2D(q2);
  const o1 = orientation(P1, Q1, P2);
  const o2 = orientation(P1, Q1, Q2);
  const o3 = orientation(P2, Q2, P1);
  const o4 = orientation(P2, Q2, Q1);

  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && onSegment(P1, P2, Q1)) return true;
  if (o2 === 0 && onSegment(P1, Q2, Q1)) return true;
  if (o3 === 0 && onSegment(P2, P1, Q2)) return true;
  if (o4 === 0 && onSegment(P2, Q1, Q2)) return true;
  return false;
}

function isValidNextPoint(existing: LatLng[], candidate: LatLng): { ok: boolean; message?: string } {
  // Disallow duplicates or extremely close points
  if (existing.some((p) => arePointsNearlyEqual(p, candidate))) {
    return { ok: false, message: "Điểm mới trùng với điểm đã có. Vui lòng chọn lại." };
  }

  if (existing.length === 2) {
    // Third point must not be collinear with the first two
    if (isCollinear(existing[0], existing[1], candidate)) {
      return { ok: false, message: "Điểm thứ 3 không hợp lệ (thẳng hàng với 2 điểm đầu). Vui lòng chọn lại." };
    }
  }

  if (existing.length === 3) {
    // Validate quadrilateral is simple (no self-intersection) and not degenerate
    const [p1, p2, p3] = existing;
    const p4 = candidate;

    // No three consecutive points should be collinear
    if (isCollinear(p1, p2, p3) || isCollinear(p2, p3, p4) || isCollinear(p3, p4, p1) || isCollinear(p4, p1, p2)) {
      return { ok: false, message: "Hình tứ giác bị suy biến (3 điểm thẳng hàng). Vui lòng chọn lại." };
    }

    // Check non-adjacent edge intersections: (p1-p2) with (p3-p4) and (p2-p3) with (p4-p1)
    if (segmentsIntersect(p1, p2, p3, p4) || segmentsIntersect(p2, p3, p4, p1)) {
      return { ok: false, message: "Vui lòng đặt lại hoặc làm lại từ đầu vì điểm cuối cùng của bạn nhập không hợp lệ" };
    }
  }

  return { ok: true };
}

// Tính diện tích polygon chính xác hơn sử dụng công thức Haversine
function computePolygonAreaSquareMeters(points: LatLng[]): number {
  if (points.length < 3) return 0;
  
  // Sử dụng công thức Shoelace với điều chỉnh cho độ cong Trái Đất
  const toRadians = (deg: number) => (deg * Math.PI) / 180;
  
  // Tính diện tích sử dụng công thức Shoelace với điều chỉnh latitude
  let area = 0;
  const n = points.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const lat1 = toRadians(points[i].lat);
    const lng1 = toRadians(points[i].lng);
    const lat2 = toRadians(points[j].lat);
    const lng2 = toRadians(points[j].lng);
    
    area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  
  area = Math.abs(area) * EARTH_RADIUS_M * EARTH_RADIUS_M / 2;
  return area;
}

const ClickHandler: React.FC<{ onAdd: (p: LatLng) => void }> = ({ onAdd }) => {
  useMapEvents({
    click(e) {
      onAdd({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
};

// Component để tự động di chuyển bản đồ
const MapController: React.FC<{ center: LatLng; zoom: number }> = ({ center, zoom }) => {
  const map = useMapEvents({});
  
  React.useEffect(() => {
    if (center && map) {
      map.setView([center.lat, center.lng], zoom);
    }
  }, [center, zoom, map]);
  
  return null;
};

export const MapAreaPage = () => {
  const [points, setPoints] = useState<LatLng[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [mapCenter, setMapCenter] = useState<LatLng>({ lat: 21.0278, lng: 105.8342 });
  const [mapZoom, setMapZoom] = useState(12);

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState<string>("Thong báo");
  const [alertMessage, setAlertMessage] = useState<string>("");

  const showAlert = useCallback((title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertOpen(true);
  }, []);

  const addPoint = useCallback((p: LatLng) => {
    setPoints((prev) => {
      if (prev.length >= 4) {
        showAlert("Giới hạn điểm", "Đã đạt tối đa 4 điểm. Vui lòng xóa bớt điểm để thêm mới.");
        return prev;
      }

      const check = isValidNextPoint(prev, p);
      if (!check.ok) {
        if (check.message) showAlert("Điểm không hợp lệ", check.message);
        return prev;
      }

      return [...prev, p];
    });
  }, [showAlert]);

  const clearPoints = () => {
    setPoints([]);
    console.log('Đã xóa tất cả điểm');
  };

  // Xóa điểm cuối cùng
  const removeLastPoint = () => {
    setPoints((prev) => prev.slice(0, -1));
    console.log('Đã xóa điểm cuối cùng');
  };


  // Lấy vị trí hiện tại
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      showAlert("Không hỗ trợ định vị", "Trình duyệt không hỗ trợ định vị địa lý.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCurrentLocation(location);
        setMapCenter(location);
        setMapZoom(15); // Zoom gần hơn khi lấy vị trí hiện tại
        console.log('Đã lấy vị trí hiện tại:', location);
      },
      (error) => {
        console.error("Lỗi khi lấy vị trí:", error);
        showAlert("Không thể lấy vị trí", "Vui lòng kiểm tra quyền truy cập vị trí và thử lại.");
      }
    );
  }, [showAlert]);

  // Tìm kiếm địa điểm bằng tên với độ chính xác cao hơn
  const searchLocation = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // Sử dụng Nominatim API với tham số tối ưu cho Việt Nam
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=vn&addressdetails=1&extratags=1&namedetails=1`,
        {
          headers: {
            'User-Agent': 'VerdantTech-AreaCalculator/1.0'
          }
        }
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        // Chọn kết quả có độ chính xác cao nhất
        const bestResult = data.find((item: { importance: number; display_name: string }) => 
          item.importance > 0.5 || 
          item.display_name.includes('Việt Nam') ||
          item.display_name.includes('Vietnam')
        ) || data[0];
        
        const location = {
          lat: parseFloat(bestResult.lat),
          lng: parseFloat(bestResult.lon)
        };
        setMapCenter(location);
        setCurrentLocation(location);
        setMapZoom(15); // Zoom gần hơn khi tìm kiếm
        
        // Hiển thị thông tin chi tiết
        console.log('Tìm thấy:', bestResult.display_name);
      } else {
        showAlert("Không tìm thấy", "Không tìm thấy địa điểm. Vui lòng thử lại với từ khóa khác.");
      }
    } catch (error) {
      console.error("Lỗi khi tìm kiếm:", error);
      showAlert("Lỗi tìm kiếm", "Có lỗi xảy ra khi tìm kiếm địa điểm. Vui lòng thử lại.");
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, showAlert]);

  const areaSqm = useMemo(() => computePolygonAreaSquareMeters(points), [points]);
  const areaHectare = areaSqm / 10000;

  const polygon = points.length >= 3 ? points.map((p) => [p.lat, p.lng]) as [number, number][] : undefined;

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pt-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {alertMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertOpen(false)}>Đã hiểu</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          className="mb-8 text-center"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <motion.h1 
            className="text-4xl font-bold text-gray-900 mb-2"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            🗺️ Đo diện tích khu đất
          </motion.h1>
          <motion.p 
            className="text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            Chấm điểm trên bản đồ để đo diện tích chính xác
          </motion.p>
        </motion.div>

        {/* Control Panel */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="mb-6 shadow-lg">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Search Section */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">🔍 Tìm kiếm địa điểm</label>
                  <div className="flex gap-2">
                    <motion.div 
                      className="flex-1"
                      whileFocus={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Input
                        placeholder="Nhập tên đường, phường, xã, thành phố..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
                        className="w-full"
                      />
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        onClick={searchLocation} 
                        disabled={isSearching || !searchQuery.trim()}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isSearching ? "⏳ Đang tìm..." : "🔍 Tìm kiếm"}
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Location Controls */}
                <motion.div 
                  className="space-y-3"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <div className="flex flex-wrap gap-3">
                    <motion.div
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Button 
                        onClick={getCurrentLocation} 
                        variant="outline"
                        className="border-green-500 text-green-700 hover:bg-green-50"
                      >
                        📍 Lấy vị trí hiện tại
                      </Button>
                    </motion.div>
                    
                    <motion.div
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                    </motion.div>
                  </div>
                  
                  {/* Delete Controls */}
                  <motion.div 
                    className="flex flex-wrap gap-2"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 1.0 }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Button 
                        onClick={removeLastPoint} 
                        disabled={points.length === 0}
                        variant="outline"
                        className="border-orange-500 text-orange-700 hover:bg-orange-50"
                      >
                        ⬅️ Xóa điểm cuối
                      </Button>
                    </motion.div>
                    
                    <motion.div
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Button 
                        onClick={clearPoints} 
                        disabled={points.length === 0}
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700"
                      >
                        🗑️ Xóa tất cả điểm
                      </Button>
                    </motion.div>
                  </motion.div>
                </motion.div>

                {/* Current Location Info */}
                <AnimatePresence>
                  {currentLocation && (
                    <motion.div 
                      className="bg-blue-50 border border-blue-200 rounded-lg p-3"
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="text-sm text-blue-800">
                        <strong>📍 Vị trí hiện tại:</strong> {currentLocation.lat.toFixed(5)}, {currentLocation.lng.toFixed(5)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          {/* Map Section */}
          <motion.div
            className="lg:col-span-2"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.4 }}
          >
            <Card className="overflow-hidden shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                   Bản đồ đo diện tích
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 relative">
                <div className="w-full h-[520px] relative">
                  <MapContainer 
                    center={[mapCenter.lat, mapCenter.lng]} 
                    zoom={mapZoom} 
                    style={{ height: "100%", width: "100%", position: "relative" }}
                    className="z-0"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapController center={mapCenter} zoom={mapZoom} />
                    <ClickHandler onAdd={addPoint} />
                    {currentLocation && (
                      <Marker 
                        position={[currentLocation.lat, currentLocation.lng]} 
                        icon={L.divIcon({
                          className: 'current-location-marker',
                          html: `
                            <div style="
                              background: linear-gradient(45deg, #3b82f6, #1d4ed8);
                              width: 24px; 
                              height: 24px; 
                              border-radius: 50%; 
                              border: 4px solid white; 
                              box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                              display: flex;
                              align-items: center;
                              justify-content: center;
                              font-size: 12px;
                              color: white;
                              font-weight: bold;
                            ">📍</div>
                          `,
                          iconSize: [24, 24],
                          iconAnchor: [12, 12]
                        })}
                      />
                    )}
                    {points.map((p, idx) => (
                      <Marker 
                        key={idx} 
                        position={[p.lat, p.lng]} 
                        icon={L.divIcon({
                          className: 'measurement-marker',
                          html: `
                            <div style="
                              background: linear-gradient(45deg, #ef4444, #dc2626);
                              width: 20px; 
                              height: 20px; 
                              border-radius: 50%; 
                              border: 3px solid white; 
                              box-shadow: 0 2px 6px rgba(0,0,0,0.4);
                              display: flex;
                              align-items: center;
                              justify-content: center;
                              font-size: 10px;
                              color: white;
                              font-weight: bold;
                            ">${idx + 1}</div>
                          `,
                          iconSize: [20, 20],
                          iconAnchor: [10, 10]
                        })}
                      />
                    ))}
                    {polygon && <Polygon positions={polygon} pathOptions={{ color: "#10b981", fillColor: "#10b981", fillOpacity: 0.3 }} />}
                  </MapContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.6 }}
          >
            <Card className="shadow-lg">
              <CardHeader >
                <CardTitle className="flex items-center gap-2">
                   Kết quả đo diện tích
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-2">💡 Nhấp vào bản đồ để chọn tối đa 4 điểm</div>
                  <div className="text-sm mb-4">
                    Số điểm: <span className="font-bold text-emerald-600">{points.length}</span> / 4
                  </div>
                  {points.length > 0 && (
                    <div className="text-xs text-gray-500 mb-2">
                      💡 Sử dụng nút "Xóa điểm cuối" để xóa từng điểm
                    </div>
                  )}
                </div>

                <motion.div 
                  className="text-center p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  key={areaSqm} // Re-animate when area changes
                >
                  <div className="text-sm text-gray-600 mb-1">Diện tích ước tính:</div>
                  <motion.div 
                    className="text-3xl font-bold text-emerald-600 mb-1"
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    key={areaSqm}
                  >
                    {areaSqm > 0 ? areaSqm.toFixed(0) : 0} m²
                  </motion.div>
                  <motion.div 
                    className="text-lg text-gray-600"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                  >
                    ≈ {areaHectare > 0 ? areaHectare.toFixed(4) : 0} ha
                  </motion.div>
                </motion.div>

                <AnimatePresence>
                  {points.length > 0 && (
                    <motion.div 
                      className="space-y-2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="text-sm font-medium text-gray-700">📍 Tọa độ các điểm:</div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {points.map((p, i) => (
                          <motion.div 
                            key={i} 
                            className="text-xs bg-gray-50 p-2 rounded border"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2, delay: i * 0.1 }}
                          >
                            <strong>P{i + 1}:</strong> {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="text-xs text-gray-500 bg-yellow-50 p-3 rounded border border-yellow-200">
                  <strong>ℹ️ Lưu ý:</strong> Sử dụng công thức Shoelace với điều chỉnh độ cong Trái Đất cho độ chính xác cao hơn.
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default MapAreaPage;