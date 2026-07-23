import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { ChevronLeft, Users, Clock, Compass, Activity, MapPin, Bus, AlertTriangle, Eye, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { renderToStaticMarkup } from 'react-dom/server';

// Create custom leaflet icons
const createPointIcon = (color, text) => {
  const html = renderToStaticMarkup(
    <div style={{
      background: color,
      border: '2px solid white',
      borderRadius: '50%',
      width: '18px',
      height: '18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
      color: 'white',
      fontSize: '8px',
      fontWeight: 'bold'
    }}>
      {text}
    </div>
  );
  return L.divIcon({ html, className: '', iconSize: [18, 18], iconAnchor: [9, 9] });
};

export default function AdminActiveShifts() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Map Modal State
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [selectedDriverName, setSelectedDriverName] = useState('');
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [loadingMap, setLoadingMap] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch all drivers
      const { data: driverData, error: driverErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'driver')
        .order('full_name', { ascending: true });

      if (driverErr) throw driverErr;

      // 2. Fetch shifts from today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: shiftData, error: shiftErr } = await supabase
        .from('shift_logs')
        .select('*, vehicles(plate_number, model)')
        .gte('start_time', todayStart.toISOString())
        .order('start_time', { ascending: false });

      if (shiftErr) throw shiftErr;

      setDrivers(driverData || []);
      setShifts(shiftData || []);
    } catch (err) {
      setError('Veriler yüklenirken hata oluştu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRoute = async (driverId, driverName, vehicleId, startTime, endTime) => {
    setMapModalOpen(true);
    setSelectedDriverName(driverName);
    setRouteCoordinates([]);
    setLoadingMap(true);

    try {
      // Fetch coordinates from vehicle_location_logs during the shift time range
      let query = supabase
        .from('vehicle_location_logs')
        .select('latitude, longitude, created_at')
        .eq('vehicle_id', vehicleId)
        .gte('created_at', startTime);

      if (endTime) {
        query = query.lte('created_at', endTime);
      }

      const { data, error: logErr } = await query.order('created_at', { ascending: true });

      if (logErr) throw logErr;

      if (data && data.length > 0) {
        setRouteCoordinates(data.map(item => [item.latitude, item.longitude]));
      } else {
        setError('Bu وردية / dönem için konum kaydı bulunamadı.');
      }
    } catch (err) {
      console.error(err);
      setError('Güzergah yüklenirken hata oluştu.');
    } finally {
      setLoadingMap(false);
    }
  };

  // Helper to structure driver states
  const mappedDrivers = drivers.map(driver => {
    const activeShift = shifts.find(s => s.driver_id === driver.id && s.status === 'active');
    const completedShifts = shifts.filter(s => s.driver_id === driver.id && s.status === 'completed');

    return {
      ...driver,
      activeShift,
      completedShifts,
      isWorking: !!activeShift
    };
  });

  const activeCount = mappedDrivers.filter(d => d.isWorking).length;
  const offlineCount = mappedDrivers.length - activeCount;

  return (
    <div className="flex flex-col bg-[#f8fafc] min-h-screen font-sans pb-32">
      {/* HEADER */}
      <header className="bg-white px-6 pt-12 pb-6 sticky top-0 z-50 shadow-sm flex items-center justify-between border-b border-slate-100">
        <div>
          <p className="text-[9px] text-indigo-600 font-black uppercase tracking-widest leading-none mb-1">ADMİN / TAKİP</p>
          <h1 className="text-xl font-black text-slate-800 leading-tight">Çalışma Durumları</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl active:scale-95 border border-indigo-100/50">
            <RefreshCw size={18} />
          </button>
          <button onClick={() => navigate(-1)} className="p-2.5 bg-slate-50 rounded-xl text-slate-600 active:scale-95 border border-slate-100">
            <ChevronLeft size={20} />
          </button>
        </div>
      </header>

      {/* ERRORS */}
      {error && (
        <div className="mx-5 mt-4 bg-rose-50 p-4 rounded-2xl border border-rose-100 flex items-start gap-3">
          <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={20} />
          <p className="text-xs font-bold text-rose-700 leading-relaxed">{error}</p>
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-2 gap-3 px-5 mt-5">
        <div className="p-4 bg-white border border-slate-100 rounded-3xl shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <Activity size={20} className="animate-pulse" />
          </div>
          <div>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Görevde</p>
            <p className="text-base font-black text-slate-800 leading-none">{activeCount} Kaptan</p>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-100 rounded-3xl shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Mesaide Olmayan</p>
            <p className="text-base font-black text-slate-800 leading-none">{offlineCount} Kaptan</p>
          </div>
        </div>
      </div>

      {/* DRIVERS STATUS LIST */}
      <div className="px-5 mt-5 space-y-4">
        {loading ? (
          <div className="text-center py-10 font-bold text-slate-400">Kaptan durumları yükleniyor...</div>
        ) : mappedDrivers.length === 0 ? (
          <div className="text-center py-10 font-bold text-slate-400 bg-white border border-slate-100 rounded-3xl">Kayıtlı sürücü bulunmuyor.</div>
        ) : (
          mappedDrivers.map(driver => (
            <div key={driver.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4">
              
              {/* Profile card top */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-sm uppercase shadow-sm ${
                    driver.isWorking ? 'bg-emerald-600' : 'bg-slate-400'
                  }`}>
                    {driver.full_name[0]}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 leading-tight">{driver.full_name}</h3>
                    <p className="text-[9px] font-bold text-slate-400 mt-0.5">{driver.phone || 'Telefon Kaydı Yok'}</p>
                  </div>
                </div>

                <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  driver.isWorking ? 'bg-emerald-50 text-emerald-700 animate-pulse' : 'bg-slate-50 text-slate-500'
                }`}>
                  {driver.isWorking ? 'GÖREVDE' : 'MESAİ DIŞI'}
                </span>
              </div>

              {/* Active shift detail if working */}
              {driver.isWorking && (
                <div className="bg-emerald-50/50 border border-emerald-100/50 p-3.5 rounded-2xl flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-emerald-800 flex items-center gap-1">
                      <Bus size={12} /> {driver.activeShift.vehicles?.plate_number || 'Araç Plakası Belirsiz'}
                    </span>
                    <span className="text-[9px] font-black text-emerald-600 uppercase">
                      Başlangıç: {new Date(driver.activeShift.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-emerald-100/30 text-[9px] font-bold text-emerald-700">
                    <p>Başlangıç Km: {driver.activeShift.start_odometer} KM</p>
                    <p>Başlangıç Yakıt: %{driver.activeShift.start_fuel}</p>
                  </div>
                  <button
                    onClick={() => handleViewRoute(
                      driver.id, 
                      driver.full_name, 
                      driver.activeShift.vehicle_id, 
                      driver.activeShift.start_time, 
                      null
                    )}
                    className="w-full bg-emerald-600 text-white py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm mt-1 flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                  >
                    <Eye size={12} /> Canlı Güzergahı Gör
                  </button>
                </div>
              )}

              {/* Completed shifts today */}
              {driver.completedShifts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">BUGÜNKÜ TAMAMLANAN VARDİYALAR</h4>
                  <div className="space-y-1.5">
                    {driver.completedShifts.map((shift, idx) => (
                      <div key={shift.id} className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center justify-between gap-4 text-xs font-bold text-slate-600">
                        <div>
                          <p className="text-[9px] font-black text-slate-800">
                            {shift.vehicles?.plate_number} ({shift.end_odometer - shift.start_odometer} KM Sürüş)
                          </p>
                          <p className="text-[7px] text-slate-400 mt-0.5">
                            {new Date(shift.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(shift.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <button
                          onClick={() => handleViewRoute(
                            driver.id, 
                            driver.full_name, 
                            shift.vehicle_id, 
                            shift.start_time, 
                            shift.end_time
                          )}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors active:scale-95"
                        >
                          GÜZERGAH
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* ROUTE HISTORY MAP MODAL */}
      <AnimatePresence>
        {mapModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[9999] flex flex-col justify-end md:justify-center p-4"
          >
            <motion.div
              initial={{ y: 200, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 200, scale: 0.95 }}
              className="bg-white w-full max-w-lg mx-auto rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-[75vh]"
            >
              {/* Modal Header */}
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
                <div>
                  <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">KAPTAN HAREKET TARİHÇESİ</span>
                  <h3 className="text-sm font-black truncate">{selectedDriverName}</h3>
                </div>
                <button 
                  onClick={() => setMapModalOpen(false)}
                  className="bg-white/10 px-4 py-2 text-xs font-black rounded-full hover:bg-white/20 active:scale-95 transition-all"
                >
                  Kapat
                </button>
              </div>

              {/* Map View */}
              <div className="flex-1 relative bg-slate-100">
                {loadingMap ? (
                  <div className="absolute inset-0 z-50 bg-slate-900/10 backdrop-blur-sm flex flex-col items-center justify-center font-bold text-slate-600 text-xs">
                    <span className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mb-3"></span>
                    Güzergah verisi yükleniyor...
                  </div>
                ) : routeCoordinates.length === 0 ? (
                  <div className="absolute inset-0 z-50 flex flex-col items-center justify-center font-bold text-slate-400 text-xs p-6 text-center">
                    <MapPin size={32} className="text-slate-300 mb-2" />
                    Bu vardiyada kaydedilmiş GPS koordinatı bulunmamaktadır.
                  </div>
                ) : (
                  <MapContainer
                    center={routeCoordinates[0]}
                    zoom={14}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    
                    {/* Draw Dotted Polyline of Shift History */}
                    <Polyline 
                      positions={routeCoordinates} 
                      color="#4f46e5" 
                      weight={6} 
                      opacity={0.8}
                      dashArray="10, 10"
                    />

                    {/* Start Marker */}
                    <Marker 
                      position={routeCoordinates[0]} 
                      icon={createPointIcon('#059669', 'A')}
                    >
                      <Popup>
                        <div className="text-[10px] font-sans font-bold">Vardiya Başlangıç Noktası</div>
                      </Popup>
                    </Marker>

                    {/* End Marker */}
                    <Marker 
                      position={routeCoordinates[routeCoordinates.length - 1]} 
                      icon={createPointIcon('#dc2626', 'B')}
                    >
                      <Popup>
                        <div className="text-[10px] font-sans font-bold">Vardiya Bitiş / Son Konum</div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
