import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { Bus, AlertCircle, Compass, ChevronLeft, MapPin, Clock, Navigation, RotateCw, Search, Menu, X, ChevronRight } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { supabase } from '../../lib/supabase';
import { AnimatePresence, motion } from 'framer-motion';

// Helper component to programmatically pan/zoom Leaflet map
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom]);
  return null;
}

// Helper to calculate distance in km between two lat/lon coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
};

// Create custom leaflet icon for vehicles with direction rotation support
const createBusIcon = (plaka, heading = 0, trafficStatus = 'clear', isEmergency = false) => {
  const isCongested = trafficStatus === 'congested';
  const color = isEmergency ? '#e11d48' : (isCongested ? '#ef4444' : '#6366f1');
  const html = renderToStaticMarkup(
    <div 
      className={isEmergency ? "pulsing-red-marker" : ""}
      style={{
        background: 'white',
        border: `4px solid ${color}`,
        borderRadius: '12px',
        width: '44px',
        height: '44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isEmergency ? '0 0 20px rgba(225,29,72,0.8), 0 8px 15px rgba(0,0,0,0.3)' : (isCongested ? '0 0 20px rgba(239,68,68,0.7), 0 8px 15px rgba(0,0,0,0.3)' : '0 8px 15px rgba(0,0,0,0.3)'),
        color: color,
        position: 'relative'
      }}
    >
      {/* Direction Arrow indicator */}
      <div style={{
        position: 'absolute',
        top: '-6px',
        transform: `rotate(${heading}deg)`,
        transition: 'transform 0.5s ease',
        color: isEmergency ? '#e11d48' : '#4f46e5'
      }}>
        <Navigation size={12} fill={isEmergency ? '#e11d48' : '#4f46e5'} className="rotate-45" />
      </div>
      <Bus size={22} strokeWidth={3} />
      <div style={{
        position: 'absolute',
        bottom: '-20px',
        background: isEmergency ? '#e11d48' : '#1e1b4b',
        color: 'white',
        fontSize: '8px',
        fontWeight: '900',
        padding: '1px 6px',
        borderRadius: '6px',
        whiteSpace: 'nowrap',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
      }}>{plaka}</div>
    </div>
  );
  return L.divIcon({ html, className: '', iconSize: [44, 44], iconAnchor: [22, 22] });
};

// Create custom leaflet icon for route stops
const createStopIcon = (sequence) => {
  const html = renderToStaticMarkup(
    <div style={{
      background: '#4f46e5',
      border: '3px solid white',
      borderRadius: '50%',
      width: '24px',
      height: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      color: 'white',
      fontSize: '9px',
      fontWeight: '900'
    }}>
      {sequence}
    </div>
  );
  return L.divIcon({ html, className: '', iconSize: [24, 24], iconAnchor: [12, 12] });
};

export default function AdminMap() {
  const navigate = useNavigate();
  const [buses, setBuses] = useState([]);
  const [stops, setStops] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [selectedBusHistory, setSelectedBusHistory] = useState([]);
  const [debugMsg, setDebugMsg] = useState('Duraklar yükleniyor...');
  
  // Navigation & Sidebar States
  const [mapCenter, setMapCenter] = useState([36.9167, 34.8833]);
  const [mapZoom, setMapZoom] = useState(14);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInitialData();

    // Subscribe to Postgres changes for live tracking
    const channel = supabase.channel('admin-live-map')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicle_locations' }, () => {
        updateLocations();
      })
      .subscribe();

    return () => channel.unsubscribe();
  }, [stops]);

  // Fetch selected bus history path when selectedBus changes
  useEffect(() => {
    if (selectedBus) {
      fetchBusHistory(selectedBus.vehicleId);
      const historyInterval = setInterval(() => {
        fetchBusHistory(selectedBus.vehicleId);
      }, 5000);
      return () => clearInterval(historyInterval);
    } else {
      setSelectedBusHistory([]);
    }
  }, [selectedBus]);

  const fetchInitialData = async () => {
    // 1. Fetch route stops
    const { data: stopData } = await supabase
      .from('stops')
      .select('*')
      .order('sequence_order', { ascending: true });
    
    if (stopData) {
      setStops(stopData);
      updateLocations(stopData);
    }
  };

  const fetchBusHistory = async (vehicleId) => {
    if (!vehicleId) return;
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);

    const { data } = await supabase
      .from('vehicle_location_logs')
      .select('latitude, longitude')
      .eq('vehicle_id', vehicleId)
      .gte('created_at', todayStart.toISOString())
      .order('created_at', { ascending: true });

    if (data) {
      setSelectedBusHistory(data.map(item => [item.latitude, item.longitude]));
    }
  };
  const updateLocations = async (currentStops = stops) => {
    try {
      // 1. Fetch current vehicle locations
      const { data: locData } = await supabase
        .from('vehicle_locations')
        .select('*, profiles(full_name, id), vehicles(plate_number)');

      // 2. Fetch active shift logs to read actual laps completed
      const { data: activeShifts } = await supabase
        .from('shift_logs')
        .select('vehicle_id, laps_completed')
        .eq('status', 'active');

      // 3. Fetch active SOS alerts
      const { data: activeSosAlerts } = await supabase
        .from('sos_alerts')
        .select('driver_id')
        .eq('status', 'active');

      if (locData && currentStops.length > 0) {
        setDebugMsg(`${locData.length} Araç Aktif`);
        
        const formatted = locData.map(v => {
          // Find closest stop to the bus
          let nearestStopIdx = 0;
          let minDist = Infinity;
          
          currentStops.forEach((stop, idx) => {
            const dist = calculateDistance(v.latitude, v.longitude, stop.latitude, stop.longitude);
            if (dist < minDist) {
              minDist = dist;
              nearestStopIdx = idx;
            }
          });

          // Smart ETA calculation:
          // Next stop is the one following the nearest stop in sequence order.
          // If the bus is at the last stop, next stop is the first stop (looping).
          const nextStopIdx = (nearestStopIdx + 1) % currentStops.length;
          const nextStop = currentStops[nextStopIdx];
          const distToNextStop = calculateDistance(v.latitude, v.longitude, nextStop.latitude, nextStop.longitude);
          
          // Speed is in km/h. If speed is very low or 0, assume average city bus speed (20 km/h) for ETA
          const speed = v.speed || 0;
          const calculationSpeed = speed > 5 ? speed : 20; 
          const etaHours = distToNextStop / calculationSpeed;
          const etaMinutes = Math.max(1, Math.round(etaHours * 60)); // minimum 1 min

          // Calculate ETA timeline to all upcoming stops
          let cumulativeDist = distToNextStop;
          const upcomingStops = [];
          for (let i = 0; i < currentStops.length; i++) {
            const stopIdx = (nextStopIdx + i) % currentStops.length;
            const stop = currentStops[stopIdx];
            if (i > 0) {
              const prevStop = currentStops[(nextStopIdx + i - 1) % currentStops.length];
              cumulativeDist += calculateDistance(prevStop.latitude, prevStop.longitude, stop.latitude, stop.longitude);
            }
            const etaH = cumulativeDist / calculationSpeed;
            const etaM = Math.max(1, Math.round(etaH * 60));
            upcomingStops.push({
              name: stop.name,
              dist: `${cumulativeDist.toFixed(1)} km`,
              eta: `${etaM} dk`
            });
          }

          // Calculate laps completed from active shift
          const activeShift = activeShifts?.find(s => s.vehicle_id === v.vehicle_id);
          const lapsCount = activeShift ? activeShift.laps_completed : 0;
          const isEmergency = activeSosAlerts?.some(s => s.driver_id === v.driver_id) || false;

          return {
            id: v.id,
            vehicleId: v.vehicle_id,
            driverId: v.driver_id,
            driverName: v.profiles?.full_name || 'Bilinmiyor',
            plaka: v.vehicles?.plate_number || 'YOK',
            lat: v.latitude,
            lon: v.longitude,
            speed: Math.round(speed),
            heading: v.heading || 0,
            trafficStatus: v.traffic_status || 'clear',
            isEmergency,
            updatedAt: v.updated_at,
            nextStopName: nextStop.name,
            eta: `${etaMinutes} dk`,
            distToNext: `${distToNextStop.toFixed(2)} km`,
            laps: lapsCount,
            upcomingStops
          };
        });

        setBuses(formatted);

        // Update selected bus if it exists
        if (selectedBus) {
          const updatedSelected = formatted.find(b => b.id === selectedBus.id);
          if (updatedSelected) setSelectedBus(updatedSelected);
        }
      }
    } catch (err) {
      console.error('Error fetching live map locations:', err);
    }
  };

  return (
    <div className="h-full w-full relative bg-slate-100 flex flex-col font-sans">
      
      {/* Mini Header Overlay */}
      <div className="absolute top-20 left-6 right-6 z-[100] bg-slate-900/90 backdrop-blur-md text-white p-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-between shadow-lg">
         <div className="flex items-center gap-2">
            <AlertCircle size={14} className="text-indigo-400" />
            <span>{debugMsg} • Canlı İzleme Paneli</span>
         </div>
         <button onClick={() => navigate(-1)} className="p-1 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
            <ChevronLeft size={14} />
         </button>
      </div>

      {/* Interactive Sidebar Panel */}
      <div className={`absolute top-36 left-6 bottom-6 z-[1000] transition-all duration-300 flex ${isSidebarOpen ? 'w-80' : 'w-0'}`}>
        {/* Toggle Button */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-10 top-1/2 -translate-y-1/2 bg-white text-slate-800 p-2.5 rounded-r-2xl border border-l-0 border-slate-100 shadow-md flex items-center justify-center active:scale-95 transition-transform"
        >
          {isSidebarOpen ? <ChevronRight size={18} className="rotate-180" /> : <Menu size={18} />}
        </button>

        {/* Sidebar Content */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              className="bg-white/95 backdrop-blur-xl border border-slate-100 rounded-[2rem] shadow-2xl flex-1 flex flex-col overflow-hidden"
            >
              {/* Sidebar Header */}
              <div className="p-5 pb-3 border-b border-slate-50 flex justify-between items-center shrink-0">
                <div>
                  <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest block mb-0.5">FİLO VE MESAFELER</span>
                  <h3 className="text-sm font-black text-slate-800">Aktif Seferler</h3>
                </div>
                <span className="bg-emerald-500/10 text-emerald-600 text-[9px] font-black px-2 py-0.5 rounded-full shrink-0">
                  {buses.length} Araç
                </span>
              </div>

              {/* Search Bar */}
              <div className="px-5 py-3 shrink-0">
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Plaka veya sürücü ara..."
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-9 pr-4 py-2.5 outline-none font-bold focus:border-indigo-500 focus:bg-white transition-all text-xs"
                  />
                </div>
              </div>

              {/* Fleet List */}
              <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-2.5">
                {buses.filter(bus => 
                  bus.plaka.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  bus.driverName.toLowerCase().includes(searchQuery.toLowerCase())
                ).map(bus => (
                  <button
                    key={bus.id}
                    onClick={() => {
                      setSelectedBus(bus);
                      setMapCenter([bus.lat, bus.lon]);
                      setMapZoom(16);
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex flex-col gap-2 ${
                      selectedBus?.id === bus.id
                        ? 'bg-indigo-50/50 border-indigo-200 ring-2 ring-indigo-500/5'
                        : 'bg-white border-slate-100 hover:border-indigo-100'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-800">{bus.plaka}</span>
                          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${bus.trafficStatus === 'congested' ? 'bg-rose-500 shadow-[0_0_6px_#f43f5e]' : 'bg-emerald-500'}`}></span>
                          {bus.trafficStatus === 'congested' && (
                            <span className="text-[7px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-1 py-0.2 rounded uppercase tracking-widest animate-pulse">TRAFİK</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">{bus.driverName}</p>
                      </div>
                      <span className="text-[10px] font-black text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg">
                        {bus.speed} km/h
                      </span>
                    </div>

                    {/* Next Stop Info */}
                    <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-2.5 flex justify-between items-center text-[10px]">
                      <div>
                        <span className="text-[7px] font-black text-indigo-500 uppercase tracking-widest block mb-0.5">Sonraki Durak</span>
                        <span className="font-black text-slate-700 uppercase truncate block max-w-[110px]">{bus.nextStopName}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[7px] font-black text-indigo-500 uppercase tracking-widest block mb-0.5">Mesafe / Süre</span>
                        <span className="font-black text-indigo-900">{bus.distToNext} / {bus.eta}</span>
                      </div>
                    </div>
                  </button>
                ))}

                {buses.filter(bus => 
                  bus.plaka.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  bus.driverName.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 && (
                  <div className="text-center py-10">
                    <p className="text-xs font-bold text-slate-400">Aktif araç bulunamadı</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Map Container */}
      <MapContainer 
        center={mapCenter}
        zoom={mapZoom} 
        style={{ height: '100%', width: '100%' }} 
        zoomControl={false}
      >
        <ChangeView center={mapCenter} zoom={mapZoom} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {/* Draw Route Polyline (Closed Loop) */}
        {stops.length > 1 && (
          <Polyline 
            positions={[...stops.map(s => [s.latitude, s.longitude]), ...(stops.length > 2 ? [[stops[0].latitude, stops[0].longitude]] : [])]} 
            color="#10b981" 
            weight={6} 
            opacity={0.6} 
          />
        )}

        {/* Draw Route Stops */}
        {stops.map((stop, idx) => (
          <Marker
            key={`stop-${stop.id}`}
            position={[stop.latitude, stop.longitude]}
            icon={createStopIcon(stop.sequence_order || idx + 1)}
          >
            <Popup>
              <div className="p-1 font-sans">
                <p className="text-[8px] font-black text-indigo-600 uppercase tracking-wider mb-0.5">DURAK {stop.sequence_order || idx + 1}</p>
                <h4 className="text-xs font-black text-slate-800">{stop.name}</h4>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Draw Dotted Vehicle Historical Path */}
        {selectedBusHistory.length > 1 && (
          <Polyline 
            positions={selectedBusHistory} 
            color="#6366f1" 
            weight={6} 
            opacity={0.8} 
            dashArray="10, 12" 
          />
        )}

        {/* Draw Active Vehicles */}
        {buses.map(bus => (
          <Marker 
            key={`bus-${bus.id}`} 
            position={[bus.lat, bus.lon]} 
            icon={createBusIcon(bus.plaka, bus.heading, bus.trafficStatus, bus.isEmergency)}
            eventHandlers={{ 
              click: () => {
                setSelectedBus(bus);
                setMapCenter([bus.lat, bus.lon]);
                setMapZoom(16);
              }
            }}
          />
        ))}
      </MapContainer>

      {/* Bus Detail Modal Overlay */}
      <AnimatePresence>
        {selectedBus && (
          <motion.div
            initial={{ y: 150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 150, opacity: 0 }}
            className="absolute bottom-28 left-6 right-6 z-[100]"
          >
            <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 flex flex-col gap-4">
              {/* Card Header */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 bg-indigo-600 rounded-3xl flex flex-col items-center justify-center text-white shadow-xl">
                    <Bus size={24} />
                    <span className="text-[9px] font-black mt-0.5 tracking-wider uppercase">{selectedBus.plaka}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">SÜRÜCÜ</span>
                    <h3 className="text-base font-black text-slate-800 mt-1">{selectedBus.driverName}</h3>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedBus(null)}
                  className="bg-slate-100 p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors active:scale-95"
                >
                  Kapat
                </button>
              </div>

              {/* ETA Indicator */}
              <div className={`p-4 rounded-3xl flex justify-between items-center border ${
                selectedBus.trafficStatus === 'congested'
                  ? 'bg-rose-50 border-rose-100 text-rose-900'
                  : 'bg-indigo-50 border-indigo-100/50 text-indigo-900'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    selectedBus.trafficStatus === 'congested' ? 'bg-rose-600/10 text-rose-600' : 'bg-indigo-600/10 text-indigo-600'
                  }`}>
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className={`text-[7px] font-black uppercase tracking-widest mb-0.5 ${
                      selectedBus.trafficStatus === 'congested' ? 'text-rose-600' : 'text-indigo-600'
                    }`}>SIRADAKİ DURAK</p>
                    <p className="text-xs font-black uppercase truncate max-w-[140px]">{selectedBus.nextStopName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-[7px] font-black uppercase tracking-widest mb-0.5 ${
                    selectedBus.trafficStatus === 'congested' ? 'text-rose-600' : 'text-indigo-600'
                  }`}>ZAMAN / MESAFE</p>
                  <p className="text-sm font-black">{selectedBus.eta} <span className="text-[9px] font-bold opacity-60">({selectedBus.distToNext})</span></p>
                </div>
              </div>

              {/* Traffic Alert Banner if congested */}
              {selectedBus.trafficStatus === 'congested' && (
                <div className="bg-rose-500 text-white px-4 py-3 rounded-2xl flex items-center gap-2.5 animate-pulse shrink-0">
                  <AlertCircle size={16} />
                  <span className="text-[9px] font-black uppercase tracking-widest">DİKKAT: ARAÇ TRAFİKTE SIKIŞTI (HIZ &lt; 5 KM/H)</span>
                </div>
              )}

              {/* Upcoming Stops Timeline */}
              {selectedBus.upcomingStops && selectedBus.upcomingStops.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Hat Boyunca Tahmini Varış Süreleri</span>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
                    {selectedBus.upcomingStops.map((stop, i) => (
                      <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-col min-w-[110px] shrink-0">
                        <span className="text-[7px] font-black text-indigo-500 uppercase tracking-widest truncate">{stop.name}</span>
                        <span className="text-xs font-black text-slate-800 mt-1">{stop.eta}</span>
                        <span className="text-[8px] font-bold text-slate-400 mt-0.5">{stop.dist}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Laps, Speed & Heading details */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 bg-slate-50 border border-slate-100/50 rounded-2xl flex flex-col items-center justify-center text-center">
                  <RotateCw className="text-emerald-500 mb-1" size={15} />
                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Tur (Lap)</p>
                  <span className="font-black text-slate-800 text-xs">{selectedBus.laps} Tur</span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-100/50 rounded-2xl flex flex-col items-center justify-center text-center">
                  <Compass className="text-indigo-500 mb-1" size={15} />
                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Hız</p>
                  <span className="font-black text-slate-800 text-xs">{selectedBus.speed} KM/H</span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-100/50 rounded-2xl flex flex-col items-center justify-center text-center">
                  <Compass className="text-slate-400 mb-1" size={15} style={{ transform: `rotate(${selectedBus.heading}deg)` }} />
                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Yön</p>
                  <span className="font-black text-slate-800 text-xs">{selectedBus.heading}°</span>
                </div>
              </div>

              {/* View Driver Profile Button */}
              <button 
                onClick={() => navigate(`/driver/${selectedBus.id}`)}
                className="w-full bg-[#1e1b4b] text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg active:scale-95 transition-transform"
              >
                Sürücü Profilini İncele
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{__html: `
        .leaflet-container { background: #f8fafc !important; height: 100% !important; }
        .custom-icon { background: none !important; border: none !important; }
        @keyframes pulse-red {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(225, 29, 72, 0.7); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(225, 29, 72, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(225, 29, 72, 0); }
        }
        .pulsing-red-marker {
          animation: pulse-red 1.2s infinite !important;
        }
      `}} />
    </div>
  );
}
