import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bus, Navigation, Info, X, MapPin, Wind } from 'lucide-react';

const INITIAL_BUSES = [
  { id: 1, route: '500T', name: 'Tuzla - Cevizlibağ', x: 20, y: 30, speed: 0.15, eta: '5 dk', color: 'emerald' },
  { id: 2, route: '11ÜS', name: 'Sultanbeyli - Üsküdar', x: 60, y: 50, speed: 0.12, eta: '12 dk', color: 'blue' },
  { id: 3, route: '34G', name: 'Beylikdüzü - Söğütlü', x: 40, y: 70, speed: 0.2, eta: '2 dk', color: 'orange' },
];

const UserTracker = () => {
  const [buses, setBuses] = useState(INITIAL_BUSES);
  const [selectedBus, setSelectedBus] = useState(null);

  // Simulate real-time bus movement
  useEffect(() => {
    const interval = setInterval(() => {
      setBuses(prevBuses => 
        prevBuses.map(bus => {
          const newX = bus.x + (Math.random() - 0.3) * bus.speed;
          const newY = bus.y + (Math.random() - 0.3) * bus.speed;
          
          return {
            ...bus,
            x: newX > 90 ? 10 : newX < 10 ? 90 : newX,
            y: newY > 90 ? 10 : newY < 10 ? 90 : newY,
          };
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full w-full relative bg-[#eef2f3]">
      {/* Fake Map Elements */}
      <div className="absolute inset-0 opacity-40 overflow-hidden pointer-events-none">
         <div className="absolute top-[20%] w-full h-[60px] bg-white rotate-[-5deg] shadow-inner" />
         <div className="absolute left-[30%] h-full w-[60px] bg-white rotate-[15deg] shadow-inner" />
         <div className="absolute inset-0 bg-[radial-gradient(#114B36_1px,transparent_1px)] [background-size:30px_30px] opacity-10" />
      </div>

      {/* Header Overlay */}
      <div className="absolute top-6 left-6 right-6 z-20 flex flex-col gap-3">
         <div className="bg-white/80 backdrop-blur-xl p-4 rounded-3xl border border-white shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
               <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Canlı Takip</h2>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
               <Bus size={14} className="text-slate-500" />
               <span className="text-[10px] font-bold text-slate-600">{buses.length} Otobüs Aktif</span>
            </div>
         </div>
      </div>

      {/* Map Content */}
      <div className="relative h-full w-full overflow-hidden">
        {buses.map((bus) => (
          <motion.div
            key={bus.id}
            animate={{ top: `${bus.y}%`, left: `${bus.x}%` }}
            transition={{ duration: 2, ease: "linear" }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
            onClick={() => setSelectedBus(bus)}
          >
            <div className="relative group cursor-pointer">
              {/* Pulse effect */}
              <div className={`absolute -inset-4 bg-${bus.color}-500/20 rounded-full animate-ping`} />
              
              {/* Bus Marker */}
              <motion.div 
                whileHover={{ scale: 1.2 }}
                className={`w-12 h-12 bg-white rounded-2xl shadow-2xl border-4 border-${bus.color}-500 flex items-center justify-center relative z-10 overflow-hidden`}
              >
                <div className={`absolute bottom-0 w-full h-1/3 bg-${bus.color}-500/10`} />
                <Bus size={22} className={`text-${bus.color}-600`} />
                
                {/* Route Label mini */}
                <div className={`absolute top-0 right-0 px-1 bg-${bus.color}-500 text-[6px] font-black text-white rounded-bl-md`}>
                   {bus.route}
                </div>
              </motion.div>

              {/* ETA Label */}
              <div className="mt-2 bg-white px-2 py-1 rounded-lg shadow-md border border-slate-100 flex items-center gap-1">
                 <Wind size={8} className="text-emerald-500" />
                 <span className="text-[8px] font-black text-slate-700">{bus.eta}</span>
              </div>
            </div>
          </motion.div>
        ))}

        {/* User Location */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
           <div className="relative">
              <div className="w-8 h-8 bg-blue-500 border-4 border-white rounded-full shadow-2xl z-20" />
              <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping scale-150 opacity-30" />
           </div>
        </div>
      </div>

      {/* Selected Bus Detail Card */}
      <AnimatePresence>
        {selectedBus && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-32 left-6 right-6 z-30"
          >
            <div className="bg-white rounded-[2.5rem] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-slate-100">
               <button 
                onClick={() => setSelectedBus(null)}
                className="absolute top-4 right-4 p-2 hover:bg-slate-50 rounded-full transition-colors"
               >
                 <X size={20} className="text-slate-400" />
               </button>

               <div className="flex items-center gap-5">
                  <div className={`w-20 h-20 rounded-3xl bg-${selectedBus.color}-500 flex flex-col items-center justify-center text-white shadow-xl`}>
                     <Bus size={32} />
                     <span className="text-xs font-black mt-1 tracking-widest">{selectedBus.route}</span>
                  </div>
                  <div className="flex-1 space-y-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">HATTIN ADI</p>
                     <h3 className="text-lg font-black text-slate-800">{selectedBus.name}</h3>
                     <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                           <Clock size={12} className="text-emerald-500" />
                           <span className="text-xs font-bold text-slate-600">Varış: {selectedBus.eta}</span>
                        </div>
                        <div className="flex items-center gap-1">
                           <MapPin size={12} className="text-blue-500" />
                           <span className="text-xs font-bold text-slate-600">1.2 km kaldı</span>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="mt-6 flex gap-3">
                  <button className="flex-1 bg-[#114B36] text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-transform">
                     DURAĞA GİT
                  </button>
                  <button className="w-14 h-14 bg-slate-100 flex items-center justify-center rounded-2xl text-slate-600 active:scale-95 transition-transform">
                     <Info size={24} />
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Map Actions */}
      <div className="absolute right-6 top-32 flex flex-col gap-3">
         <MapActionButton icon={<Navigation size={20} />} />
         <MapActionButton icon={<Wind size={20} />} />
      </div>
    </div>
  );
};

const MapActionButton = ({ icon }) => (
  <motion.button
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    className="w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white text-slate-700"
  >
    {icon}
  </motion.button>
);

export default UserTracker;
