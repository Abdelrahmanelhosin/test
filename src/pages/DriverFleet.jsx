import React from 'react';
import { motion } from 'framer-motion';
import { Bus, Clock, MapPin, ChevronRight, Zap, ArrowDown, ArrowUp, Navigation } from 'lucide-react';

const FLEET_DATA = [
  { id: 1, route: '500T-09', driver: 'Selim K.', gap: '15 dk', dist: '4.2 km', status: 'Önde', pos: 'Pendik' },
  { id: 2, route: '500T-10', driver: 'Ahmet Y.', gap: '08 dk', dist: '2.1 km', status: 'Önde', pos: 'Kartal' },
  { id: 3, route: '500T-11', driver: 'Mustafa K.', gap: '0 dk', dist: '0 km', status: 'Siz', pos: 'Maltepe', isUser: true },
  { id: 4, route: '500T-12', driver: 'Mehmet S.', gap: '12 dk', dist: '3.5 km', status: 'Arkada', pos: 'Bostancı' },
  { id: 5, route: '500T-13', driver: 'Caner D.', gap: '18 dk', dist: '5.8 km', status: 'Arkada', pos: 'Kadıköy' },
];

const DriverFleet = () => {
  const [isSyncing, setIsSyncing] = React.useState(false);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 1500);
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50">
      
      {/* Header Area */}
      <div className="bg-white px-6 py-8 pb-10 rounded-b-[3rem] shadow-sm border-b border-slate-100">
         <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-2">HAT MONİTÖRÜ</p>
         <h1 className="text-2xl font-black text-slate-800 tracking-tight">500T Filo Durumu</h1>
         <div className="flex items-center gap-4 mt-6">
            <div className="bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
               <span className="text-[10px] font-black text-emerald-700 uppercase">5 ARAÇ AKTİF</span>
            </div>
            <div className="bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100">
               <span className="text-[10px] font-black text-indigo-700 uppercase">İDEAL ARALIK: 10 DK</span>
            </div>
      </div>
      </div>

      {/* Floating Top Info */}
      <div className="px-6 -mt-8 relative z-[20]">
         <motion.div 
           whileTap={{ scale: 0.98 }}
           className="bg-slate-900 text-white p-5 rounded-[2.5rem] shadow-2xl flex items-center justify-between border border-white/10"
         >
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white">
                  <Zap size={24} />
               </div>
               <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400">FİLO ANALİZİ</h4>
                  <p className="text-[10px] font-bold opacity-70 uppercase tracking-tighter">Hızınız ideal, aralıklar korunuyor.</p>
               </div>
            </div>
            <motion.div 
              onClick={handleSync}
              whileTap={{ scale: 0.8 }}
              className="bg-white/10 p-3 rounded-2xl text-white cursor-pointer hover:bg-white/20 transition-colors"
            >
               <Navigation size={20} className={`rotate-45 ${isSyncing ? 'animate-spin' : ''}`} />
            </motion.div>
         </motion.div>
         {isSyncing && (
           <motion.p 
             initial={{ opacity: 0, y: -10 }} 
             animate={{ opacity: 1, y: 0 }} 
             className="text-[9px] font-black text-emerald-600 uppercase text-center mt-3 tracking-widest"
           >
             Veriler Canlı Senkronize Ediliyor...
           </motion.p>
         )}
      </div>

      {/* Fleet List - SCROLLABLE */}
      <div className="flex-1 overflow-y-auto p-6 pb-20 relative no-scrollbar">
         
         {/* Vertical Road Line */}
         <div className="absolute left-12 top-0 bottom-20 w-1 bg-slate-200 rounded-full" />

         <div className="space-y-10 relative z-10">
            {FLEET_DATA.map((bus, index) => (
              <div key={bus.id} className="flex flex-col gap-4">
                 
                 {/* BUS CARD */}
                 <motion.div 
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: index * 0.1 }}
                   className={`flex items-center gap-4 ${bus.isUser ? 'scale-105' : ''}`}
                 >
                    {/* Bus Icon Marker */}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg z-10 border-4 ${
                      bus.isUser ? 'bg-emerald-600 border-white text-white' : 'bg-white border-slate-100 text-slate-400'
                    }`}>
                       <Bus size={22} />
                    </div>

                    {/* Bus Details Card */}
                    <div className={`flex-1 p-5 rounded-[2rem] shadow-sm border transition-all ${
                      bus.isUser 
                        ? 'bg-[#114B36] text-white border-emerald-900 shadow-emerald-900/20' 
                        : 'bg-white text-slate-800 border-slate-100'
                    }`}>
                       <div className="flex justify-between items-start mb-2">
                          <div>
                             <h3 className={`text-sm font-black uppercase tracking-tight ${bus.isUser ? 'text-emerald-400' : 'text-slate-800'}`}>
                               {bus.route}
                             </h3>
                             <p className={`text-[10px] font-bold ${bus.isUser ? 'text-white/60' : 'text-slate-400'}`}>
                               {bus.driver}
                             </p>
                          </div>
                          {bus.isUser && (
                            <span className="bg-white/20 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest text-white">SİZSİNİZ</span>
                          )}
                       </div>
                       <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-1.5">
                             <MapPin size={12} className={bus.isUser ? 'text-emerald-400' : 'text-slate-300'} />
                             <span className="text-[10px] font-black uppercase">{bus.pos}</span>
                          </div>
                          <div className="flex items-center gap-1.5 ml-auto">
                             <Navigation size={12} className={bus.isUser ? 'text-emerald-400' : 'text-slate-300'} />
                             <span className="text-[10px] font-black uppercase">{bus.dist}</span>
                          </div>
                       </div>
                    </div>
                 </motion.div>

                 {/* GAP INDICATOR (Between buses) */}
                 {index < FLEET_DATA.length - 1 && (
                   <div className="ml-6 pl-10">
                      <div className="flex items-center gap-3">
                         <div className="h-px flex-1 bg-slate-200" />
                         <div className="bg-white px-4 py-1.5 rounded-full border border-slate-100 shadow-sm flex items-center gap-2">
                            <Clock size={12} className="text-indigo-500" />
                            <span className="text-[11px] font-black text-indigo-600 tracking-tighter">
                               {FLEET_DATA[index+1].gap} ARALIK
                            </span>
                         </div>
                         <div className="h-px flex-1 bg-slate-200" />
                      </div>
                   </div>
                 )}

              </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default DriverFleet;
