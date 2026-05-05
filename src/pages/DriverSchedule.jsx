import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, ChevronRight, CheckCircle2, Navigation } from 'lucide-react';

const STOPS = [
  { id: 1, name: 'Tuzla Sahil', time: '08:00', status: 'completed' },
  { id: 2, name: 'İçmeler Köprüsü', time: '08:15', status: 'completed' },
  { id: 3, name: 'Pendik YHT', time: '08:30', status: 'current' },
  { id: 4, name: 'Kartal Metro', time: '08:45', status: 'upcoming' },
  { id: 5, name: 'Maltepe Sahil', time: '09:05', status: 'upcoming' },
  { id: 6, name: 'Bostancı İskele', time: '09:20', status: 'upcoming' },
  { id: 7, name: 'Kadıköy Merkez', time: '09:45', status: 'upcoming' },
];

const DriverSchedule = () => {
  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md px-6 py-5 sticky top-0 z-30 border-b border-slate-100 shadow-sm flex justify-between items-center">
        <div>
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">GÜNCEL SEFER</p>
          <h1 className="text-lg font-black text-slate-800">500T Hattı Durakları</h1>
        </div>
        <div className="bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
           <span className="text-[10px] font-black text-emerald-700 uppercase">7 Durak</span>
        </div>
      </header>

      {/* Schedule Timeline - Scrollable area with more padding at bottom */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 pb-64">
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-slate-100" />

          <div className="space-y-8">
            {STOPS.map((stop, index) => (
              <motion.div 
                key={stop.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative flex items-start gap-6 group"
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
                    : 'bg-white border-slate-50'
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
                      <span className="bg-indigo-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-md">
                        BURADASINIZ
                      </span>
                    )}
                  </div>

                  {stop.status === 'upcoming' && index === STOPS.findIndex(s => s.status === 'upcoming') && (
                    <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                       <span className="text-[10px] font-bold text-slate-400 uppercase">Sıradaki Durak</span>
                       <ChevronRight size={14} className="text-slate-300" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      {/* FLOAT STATS BAR - Raised to avoid overlap with Nav Bar */}
      <div className="absolute bottom-36 left-0 right-0 px-6 z-20">
         <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-[#114B36] p-5 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex justify-between items-center text-white border border-white/10"
         >
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center border border-white/5">
                  <MapPin size={20} className="text-emerald-300" />
               </div>
               <div>
                  <p className="text-[9px] font-black opacity-50 uppercase tracking-widest leading-none mb-1">DURAK BİLGİSİ</p>
                  <p className="text-xs font-black uppercase">4 DURAK KALDI</p>
               </div>
            </div>
            <div className="h-8 w-px bg-white/10 mx-2" />
            <div className="text-right">
               <p className="text-[9px] font-black opacity-50 uppercase tracking-widest leading-none mb-1">VARALAN SÜRE</p>
               <p className="text-xs font-black uppercase text-emerald-300">45 DK</p>
            </div>
         </motion.div>
      </div>
    </div>
  );
};

export default DriverSchedule;
