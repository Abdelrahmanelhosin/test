import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, MapPin, Clock, ArrowUp, ArrowDown, AlertCircle, PhoneCall, ShieldCheck, Bell, X, User, MessageSquare, Heart, Share2, Circle, ChevronRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const COLLEAGUES = [
  { id: 1, name: 'Ahmet K.', status: 'online', route: '500T', img: 'A' },
  { id: 2, name: 'Mehmet S.', status: 'online', route: '11ÜS', img: 'M' },
  { id: 3, name: 'Selim Y.', status: 'busy', route: '34G', img: 'S' },
  { id: 4, name: 'Caner D.', status: 'offline', route: '15F', img: 'C' },
];

const FEED_POSTS = [
  { id: 1, author: 'Ahmet K.', text: 'Tuzla girişi kaza var, sağ şerit kapalı arkadaşlar.', time: '2 dk önce', likes: 12 },
  { id: 2, author: 'Mehmet S.', text: 'Hayırlı işler bol kazançlar tüm kaptanlara!', time: '15 dk önce', likes: 8 },
];

const NOTIFICATIONS = [
  { id: 1, title: 'Merkezden Mesaj', text: '500T hattında yoğunluk var, sefer süresini koruyun.', time: '5 dk önce', type: 'info' },
  { id: 2, title: 'Arıza Bildirimi', text: '34G-02 nolu araçta lastik arızası bildirildi.', time: '12 dk önce', type: 'alert' },
  { id: 3, title: 'Tebrik', text: 'Kaptan Selim size bir selam gönderdi! 👋', time: '20 dk önce', type: 'social' },
];

const DriverHome = () => {
  const navigate = useNavigate();
  const [isCalling, setIsCalling] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  return (
    <div className="flex flex-col bg-[#f8fafc] min-h-full relative">
      
      <div className="px-6 space-y-8 pt-6 pb-48">
        
        {/* SHIFT SYNC - COLLEAGUES ONLINE */}
        <div className="space-y-3">
           <div className="flex justify-between items-center px-1">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AKTİF MESSADAŞLAR</h3>
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">12 Kaptan Aktif</span>
           </div>
           <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
              {COLLEAGUES.map(col => (
                <div key={col.id} className="flex flex-col items-center gap-2 min-w-[64px]">
                   <div className="relative">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black shadow-sm border-2 ${
                        col.status === 'online' ? 'bg-white border-emerald-500 text-emerald-600' : 
                        col.status === 'busy' ? 'bg-white border-amber-500 text-amber-600' : 'bg-slate-50 border-slate-200 text-slate-300'
                      }`}>
                        {col.img}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                        col.status === 'online' ? 'bg-emerald-500' : 
                        col.status === 'busy' ? 'bg-amber-500' : 'bg-slate-300'
                      }`} />
                   </div>
                   <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter truncate w-14 text-center">{col.name}</span>
                </div>
              ))}
           </div>
        </div>

        {/* COMPACT TELEMETRY DASHBOARD */}
        <div className="grid grid-cols-1 gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            className="relative h-60 rounded-[2.5rem] overflow-hidden shadow-xl border border-emerald-400/20 group"
          >
            {/* Background Gradient & Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#064e3b] to-[#111827]" />
            <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px]" />

            {/* Content Layer */}
            <div className="relative h-full p-6 flex flex-col justify-between z-10">
               <div className="flex justify-between items-start">
                  <div>
                     <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#34d399]" />
                        <span className="text-[9px] font-black text-emerald-400/80 uppercase tracking-widest">ÖNDEKİ ARAÇ MESAFESİ</span>
                     </div>
                     <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black tracking-tighter text-white">08:45</span>
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Dakika</span>
                     </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                     <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                        <span className="text-[10px] font-black text-white tracking-widest">500T-11</span>
                     </div>
                     <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className={`w-1 h-3 rounded-full ${i <= 4 ? 'bg-emerald-400' : 'bg-white/10'}`} />
                        ))}
                     </div>
                  </div>
               </div>

               {/* Location Glass Pill */}
               <div className="bg-white/5 backdrop-blur-xl p-4 rounded-[2rem] border border-white/10 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                        <MapPin size={20} />
                     </div>
                     <div>
                        <p className="text-[8px] font-black text-emerald-400/60 uppercase tracking-widest mb-0.5">GÜNCEL KONUM</p>
                        <p className="text-xs font-black text-white uppercase tracking-tight">Kartal Köprüsü Mevkii</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-xl font-black text-white tracking-tighter">1.8 <span className="text-[9px] text-emerald-400 uppercase">km</span></p>
                  </div>
               </div>
            </div>

            {/* SOPHISTICATED ANIMATED ROUTE PATH BACKGROUND */}
            <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-10 pointer-events-none overflow-hidden">
               <svg viewBox="0 0 100 200" className="h-full w-full">
                  <motion.path 
                    d="M50,200 Q80,150 50,100 T50,0" 
                    fill="none" 
                    stroke="#34d399" 
                    strokeWidth="2" 
                    strokeDasharray="10,10"
                    animate={{ strokeDashoffset: [0, -20] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
               </svg>
            </div>
          </motion.div>
        </div>

        {/* FLEET MONITOR QUICK LINK */}
        <motion.button 
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/fleet')}
          className="w-full bg-indigo-600 p-5 rounded-[2.5rem] shadow-xl shadow-indigo-900/20 flex items-center justify-between group"
        >
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
                 <Zap size={20} />
              </div>
              <div className="text-left">
                 <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest">FİLO DURUMU</p>
                 <p className="text-sm font-black text-white uppercase tracking-tight">Tüm Hattı Görüntüle</p>
              </div>
           </div>
           <ChevronRight size={20} className="text-white opacity-40 group-hover:opacity-100 transition-opacity" />
        </motion.button>

        {/* SECONDARY STATS - COMPACT */}
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-50 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 shadow-inner">
                 <ArrowDown size={22} />
              </div>
              <div>
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">ARKADAKİ</p>
                 <p className="text-lg font-black text-slate-800 tracking-tighter">12:20 <span className="text-[9px] text-slate-400">DK</span></p>
              </div>
           </div>
           <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-50 flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 shadow-inner">
                 <Radio size={22} />
              </div>
              <div>
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">HIZINIZ</p>
                 <p className="text-lg font-black text-slate-800 tracking-tighter">48 <span className="text-[9px] text-slate-400">KM/H</span></p>
              </div>
           </div>
        </div>


        {/* KAPTANLAR DUVARI (SOCIAL FEED PREVIEW) */}
        <div className="space-y-4">
           <div className="flex justify-between items-center px-1">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">KAPTANLAR DUVARI</h3>
              <button onClick={() => navigate('/social')} className="text-[9px] font-black text-indigo-600 uppercase">Tümünü Gör</button>
           </div>
           <div className="space-y-3">
              {FEED_POSTS.map(post => (
                <div key={post.id} className="bg-white p-4 rounded-3xl border border-slate-50 shadow-sm flex flex-col gap-3">
                   <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black">{post.author[0]}</div>
                         <span className="text-[11px] font-black text-slate-700">{post.author}</span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-300 uppercase">{post.time}</span>
                   </div>
                   <p className="text-xs font-bold text-slate-600 leading-relaxed">{post.text}</p>
                   <div className="flex items-center gap-4 pt-1 border-t border-slate-50">
                      <button className="flex items-center gap-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                         <Heart size={14} />
                         <span className="text-[10px] font-bold">{post.likes}</span>
                      </button>
                      <button className="flex items-center gap-1.5 text-slate-400">
                         <MessageSquare size={14} />
                         <span className="text-[10px] font-bold">2</span>
                      </button>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* QUICK CONTROLS */}
        <div className="grid grid-cols-3 gap-3">
           <ControlBtn icon={<PhoneCall size={20} />} label="MERKEZ" color="bg-slate-50" text="text-slate-600" onClick={() => setIsCalling(true)} />
           <ControlBtn icon={<Radio size={20} />} label="ANONS" color="bg-indigo-50" text="text-indigo-600" onClick={() => navigate('/anons')} />
           <ControlBtn icon={<AlertCircle size={20} />} label="ARIZA" color="bg-rose-50" text="text-rose-600" onClick={() => navigate('/reports')} />
        </div>

      </div>

      {/* CALLING MODAL */}
      <AnimatePresence>
        {isCalling && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-center p-10 text-white">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="flex flex-col items-center gap-8 w-full max-w-xs">
              <div className="relative">
                 <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 bg-emerald-500 rounded-full" />
                 <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.5)] relative z-10">
                    <User size={48} />
                 </div>
              </div>
              <div className="text-center">
                 <h2 className="text-2xl font-black uppercase tracking-widest">MERKEZ ARANIYOR</h2>
                 <p className="text-xs font-bold opacity-40 mt-2 uppercase tracking-widest">Güvenli Hat Bağlantısı...</p>
              </div>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsCalling(false)} className="w-16 h-16 bg-rose-600 rounded-full flex items-center justify-center shadow-2xl mt-10">
                <X size={32} />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NOTIFICATIONS PANEL */}
      <AnimatePresence>
        {isNotifOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsNotifOpen(false)}
              className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }} 
              className="fixed right-0 top-0 bottom-0 w-[85%] max-w-md bg-white z-[110] shadow-[-20px_0_50px_rgba(0,0,0,0.1)] flex flex-col"
            >
               <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                  <h2 className="text-xl font-black text-slate-800">Bildirimler</h2>
                  <button onClick={() => setIsNotifOpen(false)} className="p-2 bg-slate-100 rounded-xl text-slate-500"><X size={20} /></button>
               </div>
               <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {NOTIFICATIONS.map(n => (
                    <div key={n.id} className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex gap-4">
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                         n.type === 'alert' ? 'bg-rose-100 text-rose-600' : 
                         n.type === 'social' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                       }`}>
                          {n.type === 'alert' ? <AlertCircle size={20} /> : n.type === 'social' ? <Heart size={20} /> : <Bell size={20} />}
                       </div>
                       <div>
                          <h4 className="text-xs font-black text-slate-800 uppercase mb-1">{n.title}</h4>
                          <p className="text-[11px] font-bold text-slate-500 leading-relaxed">{n.text}</p>
                          <span className="text-[9px] font-black text-slate-300 uppercase mt-2 block">{n.time}</span>
                       </div>
                    </div>
                  ))}
               </div>
               <div className="p-6 bg-slate-50 border-t border-slate-100">
                  <button className="w-full py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest">Tümünü Okundu İşaretle</button>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const ControlBtn = ({ icon, label, color, text, onClick }) => (
  <motion.button 
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`${color} ${text} p-4 rounded-3xl flex flex-col items-center gap-2 border border-white shadow-sm transition-all`}
  >
    {icon}
    <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
  </motion.button>
);

export default DriverHome;
