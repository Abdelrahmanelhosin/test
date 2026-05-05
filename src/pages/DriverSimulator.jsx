import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Navigation, Shield, Radio, Activity, Map as MapIcon, Wifi } from 'lucide-react';

const DriverSimulator = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState('1');
  const [coords, setCoords] = useState({ lat: 41.0082, lng: 28.9784 });

  const routes = [
    { id: '1', name: 'Kadıköy - Pendik (E-10)' },
    { id: '2', name: 'Beşiktaş - Sarıyer (25E)' },
    { id: '3', name: 'Üsküdar - Çekmeköy (11ÜS)' },
  ];

  useEffect(() => {
    let interval;
    if (isTracking) {
      interval = setInterval(() => {
        setCoords(prev => ({
          lat: prev.lat + (Math.random() - 0.5) * 0.0005,
          lng: prev.lng + (Math.random() - 0.5) * 0.0005,
        }));
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isTracking]);

  return (
    <div className="space-y-8 pt-2">
      {/* Header Info */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Şoför Modu</h1>
        <div className="flex items-center justify-center space-x-2">
           <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
           <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Sistem Hazır</p>
        </div>
      </div>

      {/* Main Control Card */}
      <motion.div 
        layout
        className="glass-card p-8 rounded-5xl border border-white relative overflow-hidden flex flex-col items-center"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <MapIcon size={120} />
        </div>

        <div className="w-full space-y-6">
          <div className="space-y-3">
             <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Güzergah Seçin</label>
             <select 
                value={selectedRoute}
                onChange={(e) => setSelectedRoute(e.target.value)}
                disabled={isTracking}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-4 px-6 text-slate-800 font-extrabold focus:outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer shadow-inner"
              >
                {routes.map(route => (
                  <option key={route.id} value={route.id}>{route.name}</option>
                ))}
             </select>
          </div>

          {/* Huge Animated Button */}
          <div className="flex justify-center py-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsTracking(!isTracking)}
              className={`w-40 h-40 rounded-full flex flex-col items-center justify-center space-y-2 shadow-2xl transition-all border-8 border-white ${
                isTracking 
                  ? 'bg-rose-500 shadow-rose-500/40 text-white' 
                  : 'gradient-bg shadow-indigo-500/40 text-white'
              }`}
            >
              {isTracking ? (
                <>
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                    <Square size={40} fill="white" />
                  </motion.div>
                  <span className="text-xs font-black uppercase tracking-tighter">BİTİR</span>
                </>
              ) : (
                <>
                  <Play size={40} fill="white" className="ml-2" />
                  <span className="text-xs font-black uppercase tracking-tighter">BAŞLAT</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Telemetry Grid */}
      <div className="grid grid-cols-2 gap-4">
        <TelemetryCard 
          icon={<Wifi size={20} className="text-indigo-500" />} 
          label="Sinyal" 
          value={isTracking ? "%98" : "%0"} 
          color="indigo"
        />
        <TelemetryCard 
          icon={<Activity size={20} className="text-rose-500" />} 
          label="Hız" 
          value={isTracking ? "42 km/h" : "0 km/h"} 
          color="rose"
        />
      </div>

      {/* Live Location Stats */}
      <AnimatePresence>
        {isTracking && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="glass-card p-6 rounded-4xl border border-white space-y-4"
          >
            <div className="flex items-center justify-between">
               <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Canlı Konum</h3>
               <div className="flex space-x-1">
                  {[1,2,3].map(i => (
                    <motion.div 
                      key={i}
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                      className="w-1 h-4 bg-indigo-500 rounded-full"
                    />
                  ))}
               </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-inner">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Enlem</p>
                  <p className="text-sm font-mono font-bold text-slate-800">{coords.lat.toFixed(6)}</p>
               </div>
               <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-inner">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Boylam</p>
                  <p className="text-sm font-mono font-bold text-slate-800">{coords.lng.toFixed(6)}</p>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TelemetryCard = ({ icon, label, value, color }) => (
  <div className="glass-card p-4 rounded-4xl border border-white flex items-center space-x-3">
    <div className={`w-10 h-10 bg-${color}-50 rounded-2xl flex items-center justify-center shadow-sm`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-extrabold text-slate-800">{value}</p>
    </div>
  </div>
);

export default DriverSimulator;
