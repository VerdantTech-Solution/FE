import React, { useCallback, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
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
import { MapPin, Search, Navigation } from "lucide-react";

type LatLng = { lat: number; lng: number };

// Fallback default marker icon for Leaflet in bundlers
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const ClickHandler = ({ onLocationSelect }: { onLocationSelect: (p: LatLng) => void }) => {
  useMapEvents({
    click(e) {
      onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
};

// Component để tự động di chuyển bản đồ
const MapController = ({ center, zoom }: { center: LatLng; zoom: number }) => {
  const map = useMapEvents({});
  
  React.useEffect(() => {
    if (center && map) {
      map.setView([center.lat, center.lng], zoom);
    }
  }, [center, zoom, map]);
  
  return null;
};

interface MapUserAreaProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLocation?: LatLng;
  onClose: () => void;
}

export const MapUserArea = ({
  onLocationSelect,
  initialLocation,
  onClose
}: MapUserAreaProps) => {
  const [selectedLocation, setSelectedLocation] = useState<LatLng | null>(initialLocation || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [mapCenter, setMapCenter] = useState<LatLng>(
    initialLocation || { lat: 21.0278, lng: 105.8342 }
  );
  const [mapZoom, setMapZoom] = useState(initialLocation ? 15 : 12);

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState<string>("Thông báo");
  const [alertMessage, setAlertMessage] = useState<string>("");

  const showAlert = useCallback((title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertOpen(true);
  }, []);

  const handleLocationSelect = useCallback((location: LatLng) => {
    setSelectedLocation(location);
    console.log('Đã chọn vị trí:', location);
  }, []);

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation.lat, selectedLocation.lng);
      onClose();
    } else {
      showAlert("Chưa chọn vị trí", "Vui lòng chọn vị trí trên bản đồ trước khi xác nhận.");
    }
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
        setMapZoom(15);
        setSelectedLocation(location);
        console.log('Đã lấy vị trí hiện tại:', location);
      },
      (error) => {
        console.error("Lỗi khi lấy vị trí:", error);
        showAlert("Không thể lấy vị trí", "Vui lòng kiểm tra quyền truy cập vị trí và thử lại.");
      }
    );
  }, [showAlert]);

  // Tìm kiếm địa điểm
  const searchLocation = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=vn&addressdetails=1&extratags=1&namedetails=1`,
        {
          headers: {
            'User-Agent': 'VerdantTech-LocationSelector/1.0'
          }
        }
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
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
        setSelectedLocation(location);
        setMapZoom(15);
        
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

  return (
    <motion.div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
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

        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="h-6 w-6 text-green-600" />
                Chọn vị trí địa chỉ
              </h2>
              <p className="text-gray-600 mt-1">Nhấp vào bản đồ để chọn vị trí nhà/công ty của bạn</p>
            </div>
            <Button onClick={onClose} variant="outline">
              ✕ Đóng
            </Button>
          </div>
        </div>

        {/* Search Section */}
        <div className="p-6 border-b bg-gray-50">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔍 Tìm kiếm địa điểm
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Nhập tên đường, phường, xã, thành phố..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
                  className="flex-1"
                />
                <Button 
                  onClick={searchLocation} 
                  disabled={isSearching || !searchQuery.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {isSearching ? "Đang tìm..." : "Tìm kiếm"}
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={getCurrentLocation}
                variant="outline"
                className="border-green-500 text-green-700 hover:bg-green-50"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Lấy vị trí hiện tại
              </Button>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Map */}
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardContent className="p-0 h-full">
                  <div className="w-full h-full relative">
                    <MapContainer 
                      center={[mapCenter.lat, mapCenter.lng]} 
                      zoom={mapZoom} 
                      style={{ height: "100%", width: "100%" }}
                      className="z-0"
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <MapController center={mapCenter} zoom={mapZoom} />
                      <ClickHandler onLocationSelect={handleLocationSelect} />
                      
                      {/* Current location marker */}
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
                      
                      {/* Selected location marker */}
                      {selectedLocation && (
                        <Marker 
                          position={[selectedLocation.lat, selectedLocation.lng]} 
                          icon={L.divIcon({
                            className: 'selected-location-marker',
                            html: `
                              <div style="
                                background: linear-gradient(45deg, #ef4444, #dc2626);
                                width: 28px; 
                                height: 28px; 
                                border-radius: 50%; 
                                border: 4px solid white; 
                                box-shadow: 0 4px 8px rgba(0,0,0,0.4);
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 14px;
                                color: white;
                                font-weight: bold;
                              ">🏠</div>
                            `,
                            iconSize: [28, 28],
                            iconAnchor: [14, 14]
                          })}
                        />
                      )}
                    </MapContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Location Info */}
            <div className="lg:col-span-1">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg">Thông tin vị trí</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedLocation ? (
                    <motion.div 
                      className="space-y-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="text-sm text-green-800 mb-2">
                          <strong>📍 Vị trí đã chọn:</strong>
                        </div>
                        <div className="text-sm text-gray-700">
                          <div><strong>Vĩ độ:</strong> {selectedLocation.lat.toFixed(6)}</div>
                          <div><strong>Kinh độ:</strong> {selectedLocation.lng.toFixed(6)}</div>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 bg-yellow-50 p-3 rounded border border-yellow-200">
                        <strong>💡 Hướng dẫn:</strong> Nhấp vào bản đồ để chọn vị trí chính xác của nhà/công ty bạn.
                      </div>

                      <div className="space-y-2">
                        <Button 
                          onClick={handleConfirmLocation}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          Xác nhận vị trí này
                        </Button>
                        <Button 
                          onClick={() => setSelectedLocation(null)}
                          variant="outline"
                          className="w-full"
                        >
                          Chọn lại vị trí
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Chưa chọn vị trí</p>
                      <p className="text-sm">Nhấp vào bản đồ để chọn vị trí</p>
                    </div>
                  )}

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
                          <strong>📍 Vị trí hiện tại:</strong><br />
                          {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MapUserArea;
