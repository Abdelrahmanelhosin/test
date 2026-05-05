import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Search, MapPin, Route, Clock, Bus, ChevronRight, Navigation } from 'lucide-react';

const UserHome = () => {
  const buses = [
    { id: 1, route: '500T', name: 'Tuzla - Cevizlibağ', eta: '5 dk', status: 'Yaklaşıyor', color: 'bg-emerald-500' },
    { id: 2, route: '11ÜS', name: 'Sultanbeyli - Üsküdar', eta: '12 dk', status: 'Hareket Halinde', color: 'bg-blue-500' },
    { id: 3, route: '34G', name: 'Beylikdüzü - Metrobüs', eta: '2 dk', status: 'Durakta', color: 'bg-orange-500' },
  ];

  return (
    <div className="flex flex-col space-y-6 pt-6 px-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800 font-black text-xl shadow-inner border border-emerald-200">
            Y
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">GÜNAYDIN</p>
            <h1 className="text-xl font-black text-slate-800">Youssef</h1>
          </div>
        </div>
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center relative shadow-sm"
        >
          <Bell size={20} className="text-slate-600" />
          <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
        </motion.button>
      </div>

      {/* Search */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Nereye gitmek istiyorsunuz?" 
          className="w-full bg-white border border-slate-100 py-4 pl-12 pr-4 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
        />
      </div>

      {/* Main Status Card */}
      <motion.div 
        whileHover={{ y: -5 }}
        className="bg-gradient-to-br from-[#114B36] to-[#1a6b4c] rounded-[2.5rem] p-7 text-white shadow-2xl shadow-emerald-900/20 relative overflow-hidden group"
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
        
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-white/20 rounded-xl">
             <MapPin size={20} />
          </div>
          <span className="text-lg font-bold tracking-tight">Kadıköy Merkez Durağı</span>
        </div>

        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">BEKLENEN OTOBÜS</p>
            <div className="flex items-baseline gap-2">
               <span className="text-4xl font-black">500T</span>
               <span className="text-lg font-bold opacity-80">/ 5 dk</span>
            </div>
          </div>
          <button className="bg-white text-[#114B36] px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl active:scale-95 transition-transform">
            CANLI İZLE
          </button>
        </div>
      </motion.div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <QuickAction 
          icon={<Route size={24} className="text-blue-500" />} 
          label="Tüm Hatlar" 
          bg="bg-blue-50"
        />
        <QuickAction 
          icon={<Clock size={24} className="text-orange-500" />} 
          label="Seferler" 
          bg="bg-orange-50"
        />
      </div>

      {/* Approaching List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-black text-slate-800 tracking-tight">Yaklaşan Otobüsler</h3>
          <button className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Tümünü Gör</button>
        </div>

        <div className="space-y-3 pb-4">
          {buses.map((bus, i) => (
            <motion.div 
              key={bus.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center justify-between group hover:border-emerald-200 transition-all cursor-pointer shadow-sm hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-white font-black text-sm shadow-lg ${bus.color}`}>
                  <Bus size={20} />
                  <span className="text-[8px] mt-0.5">{bus.route}</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm group-hover:text-emerald-700 transition-colors">{bus.name}</h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold mt-1 uppercase">
                    <Navigation size={12} className="text-emerald-500" />
                    <span>{bus.status}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-emerald-600 tracking-tighter">{bus.eta}</div>
                <ChevronRight size={16} className="text-slate-300 ml-auto" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const QuickAction = ({ icon, label, bg }) => (
  <motion.button 
    whileHover={{ y: -3, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="bg-white p-5 rounded-[2rem] border border-slate-100 flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition-all group"
  >
    <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center transition-transform group-hover:rotate-12`}>
      {icon}
    </div>
    <span className="text-xs font-black text-slate-700 uppercase tracking-widest">{label}</span>
  </motion.button>
);

export default UserHome;
