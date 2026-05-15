import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ChevronRight, ArrowDown, MapPin, RadioTower, Heart, MessageSquare, PhoneCall, Radio, AlertCircle, X, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const DriverHome = () => {
  const navigate = useNavigate();
  const [telemetry, setTelemetry] = useState({ 
    speed: 0, gapMin: '869:25', gapKm: '289.8', colleagueId: null, colleagueName: '34 AHM 555', currentLoc: 'YOLDA', arkadakiMin: '12:20'
  });
  const [colleagues, setColleagues] = useState([]);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({ active_captains: 0 });
  const [isCalling, setIsCalling] = useState(false);
  const [stops, setStops] = useState([]);

  useEffect(() => {
    fetchInitialData();
    const interval = setInterval(updateTelemetry, 3000);
    return () => clearInterval(interval);
  }, [stops]);

  const fetchInitialData = async () => {
    // Fetch Stops
    const { data: stopData } = await supabase.from('stops').select('*').order('sequence_order', { ascending: true });
    if (stopData) setStops(stopData);

    // Fetch Active Captains
    const { data: colData } = await supabase.from('profiles').select('*, vehicle_locations(*)').neq('status', 'offline').limit(10);
    if (colData) setColleagues(colData);
    
    // Fetch Stats
    const { data: statData } = await supabase.from('active_stats').select('*').single();
    if (statData) setStats(statData);
    
    // Fetch Social Posts
    const { data: postData } = await supabase.from('social_posts').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(2);
    if (postData) setPosts(postData);

    updateTelemetry(stopData);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
  };

  const updateTelemetry = async (initialStops = null) => {
    const currentStops = initialStops || stops;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: allLocs } = await supabase.from('vehicle_locations').select('*, profiles(full_name), vehicles(plate_number)');
    if (allLocs) {
      const myLoc = allLocs.find(l => l.driver_id === user.id);
      const others = allLocs.filter(l => l.driver_id !== user.id).map(o => ({...o, dist: myLoc ? calculateDistance(myLoc.latitude, myLoc.longitude, o.latitude, o.longitude) : 0})).sort((a,b) => a.dist - b.dist);
      const ondeki = others[0];
      const arka = others[1] || others[0];
      
      let nearestStopName = 'YOLDA';
      if (myLoc && currentStops.length > 0) {
        let minDist = Infinity;
        currentStops.forEach(stop => {
          const dist = calculateDistance(myLoc.latitude, myLoc.longitude, stop.latitude, stop.longitude);
          if (dist < minDist) {
            minDist = dist;
            nearestStopName = stop.name;
          }
        });
      }

      if (myLoc) {
        setTelemetry({
          speed: Math.round(myLoc.speed || 0),
          gapKm: ondeki ? ondeki.dist.toFixed(1) : '289.8',
          gapMin: ondeki ? `${Math.floor((ondeki.dist/20)*60).toString().padStart(2, '0')}:${Math.floor(((ondeki.dist/20)*3600)%60).toString().padStart(2, '0')}` : '869:25',
          colleagueId: ondeki ? ondeki.id : null,
          colleagueName: ondeki ? (ondeki.vehicles?.plate_number || '34 AHM 555') : '34 AHM 555',
          currentLoc: nearestStopName.toUpperCase(),
          arkadakiMin: arka ? `${Math.floor((arka.dist/20)*60).toString().padStart(2, '0')}:${Math.floor(((arka.dist/20)*3600)%60).toString().padStart(2, '0')}` : '12:20'
        });
      }
    }
  };


  return (
    <div className="flex flex-col bg-[#fdfdfd] min-h-full font-sans p-5 space-y-5 pb-48 overflow-y-auto">
      
      {/* --- AKTİF MESLEKDAŞLAR --- */}
      <div className="space-y-2">
         <div className="flex justify-between items-center px-1">
            <h3 className="text-[10px] font-black text-[#10b981] uppercase tracking-widest">AKTİF MESLEKDAŞLAR</h3>
            <div className="flex items-center gap-1">
               <div className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
               <span className="text-[9px] font-bold text-[#10b981] uppercase">{stats.active_captains} AKTİF</span>
            </div>
         </div>
         <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
            {colleagues.map(col => (
              <motion.div key={col.id} whileTap={{ scale: 0.9 }} onClick={() => navigate(`/driver/${col.vehicle_locations?.[0]?.id}`)} className="flex flex-col items-center gap-1.5 min-w-[50px] cursor-pointer">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[13px] font-black border-2 border-emerald-50 bg-emerald-50 text-emerald-600 shadow-sm">{col.full_name?.[0]}</div>
                <span className="text-[8px] font-black text-emerald-800 uppercase tracking-tighter truncate w-12 text-center">{col.full_name?.split(' ')[0]}</span>
              </motion.div>
            ))}
         </div>
      </div>

      {/* --- TOP CARD (Öndeki Araç Mesafesi) --- */}
      <div className="relative h-[210px] rounded-[1.8rem] bg-[#0c4a34] shadow-xl p-5 flex flex-col justify-between overflow-hidden">
         <div className="absolute -top-10 -right-10 w-40 h-40 border border-dashed border-[#10b981]/20 rounded-full" />
         <div className="absolute top-0 right-1/4 w-28 h-28 bg-[#10b981]/10 rounded-full blur-[30px]" />

         <div className="relative z-10 flex justify-between items-start">
            <div>
               <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-2 h-2 bg-[#10b981] rounded-full shadow-[0_0_8px_#10b981]" />
                  <span className="text-[9px] font-bold text-[#10b981] uppercase tracking-widest">ÖNDEKİ ARAÇ MESAFESİ</span>
               </div>
               <div className="flex items-baseline gap-1.5">
                  <span className="text-[48px] font-black text-white leading-none tracking-tighter">{telemetry.gapMin}</span>
                  <span className="text-[11px] font-bold text-[#10b981] uppercase tracking-widest">DAKİKA</span>
               </div>
            </div>
            <div className="flex flex-col items-end gap-2.5 mt-1">
               <div className="bg-[#1e2b3c] px-3.5 py-2 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-[9px] font-black text-white text-center leading-tight whitespace-pre-wrap w-8">{telemetry.colleagueName.replace(' ', '\n')}</span>
               </div>
               <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => <div key={i} className={`w-1 h-3 rounded-full ${i <= 4 ? 'bg-[#10b981]' : 'bg-[#1e2b3c]'}`} />)}
               </div>
            </div>
         </div>

         <div className="bg-[#083525] p-3.5 rounded-[1.2rem] flex justify-between items-center border border-white/5 relative z-10">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-[#10b981]/10 rounded-xl flex items-center justify-center text-[#10b981]">
                  <MapPin size={20} strokeWidth={2.5} />
               </div>
               <div className="flex flex-col justify-center">
                  <p className="text-[8px] font-bold text-[#10b981] uppercase tracking-widest mb-0.5">GÜNCEL KONUM</p>
                  <p className="text-xs font-black text-white uppercase tracking-tight leading-none truncate max-w-[130px]">{telemetry.currentLoc}</p>
               </div>
            </div>
            <div className="text-right flex items-baseline gap-1">
               <p className="text-[22px] font-black text-white tracking-tighter leading-none">{telemetry.gapKm}</p>
               <span className="text-[9px] font-bold text-[#10b981] uppercase">KM</span>
            </div>
         </div>
      </div>

      {/* --- PURPLE FILO BUTTON --- */}
      <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/fleet')} className="w-full bg-[#7367f0] p-4 rounded-[1.5rem] shadow-lg shadow-indigo-500/20 flex items-center justify-between group">
        <div className="flex items-center gap-4">
           <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center text-white"><Zap size={22} strokeWidth={2.5} /></div>
           <div className="text-left flex flex-col justify-center">
              <p className="text-[8px] font-bold text-white/60 uppercase tracking-widest mb-0.5">FİLO DURUMU</p>
              <p className="text-sm font-black text-white uppercase tracking-tight leading-none">TÜM HATTI GÖRÜNTÜLE</p>
           </div>
        </div>
        <ChevronRight size={20} className="text-white opacity-70 group-hover:opacity-100 transition-opacity mr-1" />
      </motion.button>

      {/* --- DUAL CARDS (ARKADAKİ & HIZINIZ) --- */}
      <div className="grid grid-cols-2 gap-3">
         <div className="bg-white p-5 rounded-[1.5rem] flex items-center gap-3 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-50">
            <div className="w-11 h-11 bg-[#eff6ff] rounded-full flex items-center justify-center text-[#3b82f6]"><ArrowDown size={20} strokeWidth={2.5} /></div>
            <div className="flex flex-col justify-center">
               <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">ARKADAKİ</p>
               <div className="flex items-baseline gap-1"><p className="text-[18px] font-black text-slate-800 tracking-tighter leading-none">{telemetry.arkadakiMin}</p></div>
               <span className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">DK</span>
            </div>
         </div>
         <div className="bg-white p-5 rounded-[1.5rem] flex items-center gap-3 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-50">
            <div className="w-11 h-11 bg-[#eff6ff] rounded-full flex items-center justify-center text-[#3b82f6]"><RadioTower size={20} strokeWidth={2.5} /></div>
            <div className="flex flex-col justify-center">
               <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">HIZINIZ</p>
               <div className="flex items-baseline gap-1"><p className="text-[18px] font-black text-slate-800 tracking-tighter leading-none">{telemetry.speed}</p></div>
               <span className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">KM/H</span>
            </div>
         </div>
      </div>

      {/* --- KAPTANLAR DUVARI --- */}
      <div className="space-y-3">
         <div className="flex justify-between items-center px-1">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">KAPTANLAR DUVARI</h3>
            <button onClick={() => navigate('/social')} className="text-[9px] font-black text-[#7367f0] uppercase">TÜMÜNÜ GÖR</button>
         </div>
         <div className="space-y-3">
            {posts.map(post => (
              <div key={post.id} className="bg-white p-4 rounded-[1.5rem] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-50 flex flex-col gap-2">
                 <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-600">{post.profiles?.full_name?.[0] || 'K'}</div>
                       <span className="text-[11px] font-black text-slate-700">{post.profiles?.full_name}</span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-300 uppercase">
                      {Math.floor((new Date() - new Date(post.created_at)) / 60000)} DK ÖNCE
                    </span>
                 </div>
                 <p className="text-[12px] font-bold text-slate-600 leading-relaxed mt-1">{post.content}</p>
                 <div className="flex items-center gap-4 mt-2">
                    <button className="flex items-center gap-1.5 text-slate-400"><Heart size={14} /><span className="text-[10px] font-bold">{post.likes_count}</span></button>
                    <button className="flex items-center gap-1.5 text-slate-400"><MessageSquare size={14} /><span className="text-[10px] font-bold">0</span></button>
                 </div>
              </div>
            ))}
            {posts.length === 0 && (
              <div className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-slate-50 text-center">
                 <p className="text-[11px] font-bold text-slate-400">Henüz paylaşım yok</p>
              </div>
            )}
         </div>
      </div>

      {/* --- QUICK ACTION BUTTONS --- */}
      <div className="grid grid-cols-3 gap-3 pt-2">
         <button onClick={() => setIsCalling(true)} className="bg-white py-4 px-2 rounded-[1.2rem] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-50 flex flex-col items-center gap-2 active:scale-95 transition-transform">
            <PhoneCall size={22} className="text-slate-600" />
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">MERKEZ</span>
         </button>
         <button onClick={() => navigate('/anons')} className="bg-[#eff6ff] py-4 px-2 rounded-[1.2rem] flex flex-col items-center gap-2 active:scale-95 transition-transform">
            <Radio size={22} className="text-[#3b82f6]" />
            <span className="text-[9px] font-black text-[#3b82f6] uppercase tracking-widest">ANONS</span>
         </button>
         <button onClick={() => navigate('/reports')} className="bg-[#fff1f2] py-4 px-2 rounded-[1.2rem] flex flex-col items-center gap-2 active:scale-95 transition-transform">
            <AlertCircle size={22} className="text-[#e11d48]" />
            <span className="text-[9px] font-black text-[#e11d48] uppercase tracking-widest">ARIZA</span>
         </button>
      </div>

      {/* --- CALLING MODAL --- */}
      <AnimatePresence>
        {isCalling && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-center p-12 text-white text-center">
             <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.5)] mb-8">
                <Shield size={48} />
             </div>
             <h2 className="text-2xl font-black uppercase tracking-[0.1em] mb-3">MERKEZ ARANIYOR</h2>
             <p className="text-xs font-bold opacity-40 uppercase tracking-widest mb-10">Güvenli Bağlantı...</p>
             <button onClick={() => setIsCalling(false)} className="w-16 h-16 bg-rose-600 rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-transform"><X size={32} /></button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default DriverHome;
