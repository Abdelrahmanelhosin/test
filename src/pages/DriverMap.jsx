import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { Bus, AlertCircle } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { supabase } from '../lib/supabase';

const createStopIcon = (sequence) => {
  const html = renderToStaticMarkup(
    <div style={{
      background: '#10b981',
      border: '2px solid white',
      borderRadius: '50%',
      width: '20px',
      height: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
      color: 'white',
      fontSize: '8px',
      fontWeight: '900'
    }}>
      {sequence}
    </div>
  );
  return L.divIcon({ html, className: '', iconSize: [20, 20], iconAnchor: [10, 10] });
};

const createBusIcon = (isMe, plaka, trafficStatus = 'clear', isEmergency = false) => {
  const isCongested = trafficStatus === 'congested';
  const color = isEmergency ? '#e11d48' : (isCongested ? '#ef4444' : (isMe ? '#6366f1' : '#10b981'));
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
      <Bus size={24} strokeWidth={3} />
      <div style={{
        position: 'absolute',
        top: '-22px',
        background: isEmergency ? '#e11d48' : (isCongested ? '#ef4444' : '#1e293b'),
        color: 'white',
        fontSize: '9px',
        fontWeight: '900',
        padding: '2px 8px',
        borderRadius: '6px',
        whiteSpace: 'nowrap'
      }}>{isMe ? 'SİZ' : (isEmergency ? `🚨 ${plaka}` : (isCongested ? `⚠️ ${plaka}` : plaka))}</div>
    </div>
  );
  return L.divIcon({ html, className: '', iconSize: [44, 44], iconAnchor: [22, 22] });
};

const DriverMap = () => {
  const navigate = useNavigate();
  const [buses, setBuses] = useState([]);
  const [stops, setStops] = useState([]);
  const [debugMsg, setDebugMsg] = useState('Yükleniyor...');

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('live-map-final')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicle_locations' }, () => fetchData())
      .subscribe();
    return () => channel.unsubscribe();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase.from('vehicle_locations').select('*, profiles(*), vehicles(*)');
      
      const { data: activeSosAlerts } = await supabase.from('sos_alerts').select('driver_id').eq('status', 'active');

      const { data: stopData } = await supabase.from('stops').select('*').order('sequence_order', { ascending: true });
      if (stopData) {
        setStops(stopData);
      }

      if (data) {
        setDebugMsg(`${data.length} Araç Aktif`);
        const formatted = data.map(v => {
          const isEmergency = activeSosAlerts?.some(s => s.driver_id === v.driver_id) || false;
          return {
            id: v.id,
            plaka: v.vehicles?.plate_number,
            lat: v.latitude,
            lon: v.longitude,
            isMe: v.driver_id === user?.id,
            trafficStatus: v.traffic_status || 'clear',
            isEmergency
          };
        });
        setBuses(formatted);
      }
    } catch (err) {
      setDebugMsg('Hata!');
    }
  };

  return (
    <div className="h-full w-full relative bg-slate-100 flex flex-col font-sans">
      
      <div className="absolute top-20 left-6 right-6 z-[100] bg-slate-900 text-white p-3 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-between">
         <div className="flex items-center gap-2">
            <AlertCircle size={14} className="text-amber-400" />
            <span>{debugMsg} • AYRINTI İÇİN ARACA TIKLA</span>
         </div>
      </div>

      <MapContainer center={[36.9167, 34.8833]} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
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
        
        {buses.map(bus => (
          <Marker 
            key={bus.id} 
            position={[bus.lat, bus.lon]} 
            icon={createBusIcon(bus.isMe, bus.plaka, bus.trafficStatus, bus.isEmergency)}
            eventHandlers={{ 
              click: () => {
                navigate(`/driver/${bus.id}`);
              } 
            }}
          />
        ))}
      </MapContainer>

      <style dangerouslySetInnerHTML={{__html: `
        .leaflet-container { background: #f1f5f9 !important; height: 100% !important; }
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
};

export default DriverMap;
