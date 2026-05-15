import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, ChevronRight, CheckCircle2, Navigation } from 'lucide-react';
import { supabase } from '../lib/supabase';

const DriverSchedule = () => {
  const [stops, setStops] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);

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
    // Fetch Stops
    const { data: stopData } = await supabase.from('stops').select('*').order('sequence_order', { ascending: true });
    
    // Fetch Current Location
    const { data: { user } } = await supabase.auth.getUser();
    if (user && stopData) {
       const { data: locData } = await supabase.from('vehicle_locations').select('*').eq('driver_id', user.id).single();
       if (locData) {
          setCurrentLocation(locData);
          
          // Determine status of each stop
          let nearestStopIdx = 0;
          let minDist = Infinity;
          stopData.forEach((stop, idx) => {
            const dist = calculateDistance(locData.latitude, locData.longitude, stop.latitude, stop.longitude);
            if (dist < minDist) {
              minDist = dist;
              nearestStopIdx = idx;
            }
          });

          const mappedStops = stopData.map((stop, index) => {
             let status = 'upcoming';
             if (index < nearestStopIdx) status = 'completed';
             if (index === nearestStopIdx) status = 'current';
             
             // Mock time for visual
             const time = new Date();
             time.setMinutes(time.getMinutes() + (index - nearestStopIdx) * 15);
             const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;

             return { ...stop, status, time: timeStr };
          });
          setStops(mappedStops);
       } else {
          // No location yet
          setStops(stopData.map(s => ({ ...s, status: 'upcoming', time: '--:--' })));
       }
    } else if (stopData) {
       setStops(stopData.map(s => ({ ...s, status: 'upcoming', time: '--:--' })));
    }
  };

  const currentStopIndex = stops.findIndex(s => s.status === 'current');
  const remainingStops = stops.length - (currentStopIndex >= 0 ? currentStopIndex : 0);

  return (
    <div className="flex flex-col h-full relative font-sans">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md px-6 py-5 sticky top-0 z-30 border-b border-slate-100 shadow-sm flex justify-between items-center">
        <div>
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">GÜNCEL SEFER</p>
          <h1 className="text-base font-black text-slate-800 leading-tight">Yenihal - Yaramış Hattı</h1>
        </div>
        <div className="bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 flex-shrink-0">
           <span className="text-[10px] font-black text-emerald-700 uppercase">{stops.length} Durak</span>
        </div>
      </header>

      {/* Schedule Timeline */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 pb-64">
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-slate-100" />

          <div className="space-y-6">
            {stops.map((stop, index) => (
              <motion.div 
                key={stop.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative flex items-start gap-5 group"
              >
                {/* Status Indicator */}
                <div className="relative z-10 mt-1">
                  {stop.status === 'completed' ? (
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                      <CheckCircle2 size={16} />
                    </div>
                  ) : stop.status === 'current' ? (
                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 border-4 border-white animate-pulse">
                      <Navigation size={14} className="rotate-45" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-300 border-2 border-slate-100 group-hover:border-slate-300 transition-colors">
                      <div className="w-2 h-2 bg-slate-100 rounded-full" />
                    </div>
                  )}
                </div>

                {/* Stop Card */}
                <div className={`flex-1 p-4 rounded-3xl border transition-all ${
                  stop.status === 'current' 
                    ? 'bg-indigo-50/50 border-indigo-100 shadow-sm' 
                    : 'bg-white border-slate-50 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)]'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className={`font-black text-sm uppercase tracking-tight ${
                        stop.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-800'
                      }`}>
                        {stop.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock size={12} className={stop.status === 'current' ? 'text-indigo-500' : 'text-slate-300'} />
                        <span className={`text-[11px] font-bold ${
                          stop.status === 'current' ? 'text-indigo-600' : 'text-slate-400'
                        }`}>
                          {stop.time}
                        </span>
                      </div>
                    </div>
                    
                    {stop.status === 'current' && (
                      <span className="bg-indigo-600 text-white text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest shadow-md">
                        BURADASINIZ
                      </span>
                    )}
                  </div>

                  {stop.status === 'upcoming' && index === currentStopIndex + 1 && (
                    <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sıradaki Durak</span>
                       <ChevronRight size={14} className="text-slate-300" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      {/* FLOAT STATS BAR */}
      <div className="absolute bottom-36 left-0 right-0 px-5 z-20">
         <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-[#0c4a34] p-5 rounded-[2rem] shadow-2xl flex justify-between items-center text-white border border-white/10"
         >
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-[#10b981]/20 rounded-2xl flex items-center justify-center border border-[#10b981]/10 text-[#10b981]">
                  <MapPin size={24} />
               </div>
               <div>
                  <p className="text-[8px] font-bold text-[#10b981] uppercase tracking-widest mb-0.5">KALAN DURAK</p>
                  <p className="text-sm font-black uppercase text-white">{remainingStops} DURAK KALDI</p>
               </div>
            </div>
            <div className="h-10 w-px bg-white/10 mx-2" />
            <div className="text-right flex flex-col justify-center">
               <p className="text-[8px] font-bold text-[#10b981] uppercase tracking-widest mb-0.5">TAHMİNİ SÜRE</p>
               <p className="text-xl font-black uppercase text-white tracking-tighter leading-none">{remainingStops * 15} <span className="text-[10px]">DK</span></p>
            </div>
         </motion.div>
      </div>
    </div>
  );
};

export default DriverSchedule;
