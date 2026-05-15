import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { Bus, AlertCircle } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { supabase } from '../lib/supabase';

const createBusIcon = (isMe, plaka) => {
  const html = renderToStaticMarkup(
    <div style={{
      background: 'white',
      border: `4px solid ${isMe ? '#6366f1' : '#10b981'}`,
      borderRadius: '12px',
      width: '44px',
      height: '44px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 8px 15px rgba(0,0,0,0.3)',
      color: isMe ? '#6366f1' : '#10b981'
    }}>
      <Bus size={24} strokeWidth={3} />
      <div style={{
        position: 'absolute',
        top: '-22px',
        background: '#1e293b',
        color: 'white',
        fontSize: '9px',
        fontWeight: '900',
        padding: '2px 8px',
        borderRadius: '6px',
        whiteSpace: 'nowrap'
      }}>{isMe ? 'SİZ' : plaka}</div>
    </div>
  );
  return L.divIcon({ html, className: '', iconSize: [44, 44], iconAnchor: [22, 22] });
};

const DriverMap = () => {
  const navigate = useNavigate();
  const [buses, setBuses] = useState([]);
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
      
      if (data) {
        setDebugMsg(`${data.length} Araç Aktif`);
        const formatted = data.map(v => ({
          id: v.id,
          plaka: v.vehicles?.plate_number,
          lat: v.latitude,
          lon: v.longitude,
          isMe: v.driver_id === user?.id
        }));
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

      <MapContainer center={[40.892, 29.225]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {buses.map(bus => (
          <Marker 
            key={bus.id} 
            position={[bus.lat, bus.lon]} 
            icon={createBusIcon(bus.isMe, bus.plaka)}
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
      `}} />
    </div>
  );
};

export default DriverMap;
