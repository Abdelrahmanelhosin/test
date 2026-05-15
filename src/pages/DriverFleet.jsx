import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, MapPin, Bus, RefreshCw, Activity, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const DriverFleet = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
  };

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setMyId(user.id);

    const { data: stopData } = await supabase.from('stops').select('*').order('sequence_order', { ascending: true });
    const { data: locData } = await supabase.from('vehicle_locations').select('*, profiles(full_name, id), vehicles(plate_number)');

    if (stopData && locData) {
      const mappedVehicles = locData.map(loc => {
        let nearestStop = stopData[0];
        let minDist = Infinity;
        
        stopData.forEach(stop => {
          const dist = calculateDistance(loc.latitude, loc.longitude, stop.latitude, stop.longitude);
          if (dist < minDist) {
            minDist = dist;
            nearestStop = stop;
          }
        });

        return { 
          ...loc, 
          nearestStopName: nearestStop.name, 
          distToStop: minDist 
        };
      });

      // Sort by some logic or just distance to first stop
      mappedVehicles.sort((a,b) => b.distToStop - a.distToStop);
      setVehicles(mappedVehicles);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col bg-[#f8fafc] min-h-screen font-sans pb-32">
      {/* HEADER */}
      <header className="bg-white px-6 pt-12 pb-6 sticky top-0 z-50 shadow-sm flex items-center justify-between border-b border-slate-100">
         <div>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">HAT MONİTÖRÜ</p>
            <h1 className="text-xl font-black text-slate-800 leading-tight">Yenihal - Yaramış<br/>Filo Durumu</h1>
         </div>
         <div className="flex flex-col items-end gap-2">
            <button onClick={() => navigate(-1)} className="p-2.5 bg-slate-50 rounded-xl text-slate-600 active:scale-95 border border-slate-100"><ChevronLeft size={20} /></button>
         </div>
      </header>

      {/* STATS OVERVIEW */}
      <div className="px-5 mt-6 mb-2">
         <div className="bg-[#6366f1] p-6 rounded-[2rem] shadow-xl shadow-indigo-200 flex flex-col gap-4">
            <div className="flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
                     <Activity size={20} />
                  </div>
                  <div>
                     <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-0.5">SİSTEM DURUMU</p>
                     <p className="text-sm font-black text-white uppercase">{vehicles.length} ARAÇ AKTİF</p>
                  </div>
               </div>
               <div className="text-right">
                  <p className="text-[9px] font-bold text-indigo-200 uppercase tracking-widest mb-0.5">İDEAL ARALIK</p>
                  <p className="text-xl font-black text-white tracking-tighter leading-none">10 <span className="text-[10px]">DK</span></p>
               </div>
            </div>
         </div>
      </div>

      <div className="px-6 mt-6 mb-4 flex justify-between items-end">
         <div>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">FİLO ANALİZİ</h2>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Veriler anlık olarak güncelleniyor.</p>
         </div>
         <button onClick={fetchData} className={`text-slate-400 ${loading ? 'animate-spin' : ''}`}><RefreshCw size={16} /></button>
      </div>

      {/* VEHICLES LIST */}
      <div className="px-5 space-y-4">
         {vehicles.map((car, index) => {
            const isMe = car.driver_id === myId;
            const prevCar = index > 0 ? vehicles[index - 1] : null;
            
            const totalKm = calculateDistance(
              vehicles[0].latitude, vehicles[0].longitude, 
              car.latitude, car.longitude
            );
            
            // Realistic calculation: 1 km = ~3 mins in city traffic
            const gapMin = prevCar ? Math.round(totalKm * 3) : 0; 

            return (
              <motion.div 
                key={car.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(`/driver/${car.profiles?.id}`)}
                className={`p-5 rounded-[2rem] border shadow-sm flex flex-col gap-3 cursor-pointer transition-all active:scale-95 ${
                  isMe ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-slate-100'
                }`}
              >
                 <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm ${
                         isMe ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                       }`}>
                          {isMe ? <CheckCircle2 size={20} /> : (car.profiles?.full_name?.[0] || 'K')}
                       </div>
                       <div>
                          <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${
                            isMe ? 'text-indigo-600' : 'text-slate-400'
                          }`}>
                            {car.vehicles?.plate_number || 'PLAKA YOK'}
                          </p>
                          <h3 className="text-sm font-black text-slate-800">{car.profiles?.full_name}</h3>
                       </div>
                    </div>
                    {isMe && (
                      <span className="bg-indigo-600 text-white text-[9px] font-black px-2.5 py-1 rounded-xl uppercase tracking-widest">
                         SİZSİNİZ
                      </span>
                    )}
                 </div>

                 <div className="bg-slate-50 p-3.5 rounded-2xl flex justify-between items-center mt-1 border border-slate-100/50">
                    <div className="flex items-center gap-2">
                       <MapPin size={14} className={isMe ? 'text-indigo-500' : 'text-slate-400'} />
                       <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight truncate max-w-[120px]">
                         {car.nearestStopName}
                       </span>
                    </div>
                    <div className="text-right">
                       <span className="text-sm font-black text-slate-800">{totalKm.toFixed(1)} <span className="text-[9px] text-slate-400 uppercase">km</span></span>
                    </div>
                 </div>

                 {index > 0 && (
                    <div className="flex justify-between items-center px-2 pt-1">
                       <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ÖNDEKİ İLE MESAFE</span>
                       <span className="text-[11px] font-black text-rose-500 uppercase">{gapMin} dk ARALIK</span>
                    </div>
                 )}
                 {index === 0 && (
                    <div className="flex justify-between items-center px-2 pt-1">
                       <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ÖNDEKİ İLE MESAFE</span>
                       <span className="text-[11px] font-black text-emerald-500 uppercase">0 dk ARALIK</span>
                    </div>
                 )}
              </motion.div>
            );
         })}
      </div>
    </div>
  );
};

export default DriverFleet;
