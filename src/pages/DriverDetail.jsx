import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Phone, Heart, MessageCircle, MapPin, Clock, Bus, ChevronDown, Navigation, Home } from 'lucide-react';
import { motion } from 'framer-motion';

const DriverDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bus, setBus] = useState(null);
  const [myLoc, setMyLoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: busData } = await supabase.from('vehicle_locations')
      .select('*, profiles(*), vehicles(*)')
      .eq('id', id)
      .single();
    
    const { data: myData } = await supabase.from('vehicle_locations')
      .select('*')
      .eq('driver_id', user?.id)
      .single();

    if (busData) setBus(busData);
    if (myData) setMyLoc(myData);
    setLoading(false);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  if (loading) return null;
  if (!bus) return <div className="h-full flex items-center justify-center bg-white text-rose-400">Hata: Veri Alınamadı</div>;

  const dist = myLoc ? calculateDistance(myLoc.latitude, myLoc.longitude, bus.latitude, bus.longitude) : 0;
  const gapMin = Math.round((dist / 20) * 60);

  return (
    <motion.div 
      initial={{ y: "100%" }} 
      animate={{ y: 0 }} 
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="absolute inset-0 z-[100] bg-slate-50 flex flex-col font-sans"
    >
       {/* Drag Header */}
       <div className="bg-white px-6 py-4 pb-8 rounded-b-[3rem] shadow-xl border-b border-slate-100 shrink-0">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[#114B36] rounded-[1.8rem] flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-emerald-900/20">
                   {bus.profiles?.full_name?.[0]}
                </div>
                <div>
                   <h1 className="text-xl font-black text-slate-800 uppercase leading-none mb-2">{bus.profiles?.full_name}</h1>
                   <div className="flex items-center gap-2">
                      <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg text-[9px] font-black">{bus.vehicles?.plate_number}</span>
                   </div>
                </div>
             </div>
             <div className="flex gap-2">
                <button onClick={() => navigate('/')} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 active:scale-90" title="Ana Sayfa">
                   <Home size={22} />
                </button>
                <button onClick={() => navigate(-1)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 active:scale-90" title="Haritaya Dön">
                   <ChevronDown size={24} />
                </button>
             </div>
          </div>
       </div>

       {/* Content */}
       <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center">
                <MapPin className="text-indigo-500 mb-2" size={28} />
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Mesafe</p>
                <p className="text-xl font-black text-slate-800">{dist.toFixed(1)} KM</p>
             </div>
             <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center">
                <Clock className="text-emerald-500 mb-2" size={28} />
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Dakika</p>
                <p className="text-xl font-black text-slate-800">{gapMin} DK</p>
             </div>
          </div>

          <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                   <Navigation className="text-emerald-400" size={20} />
                   <h4 className="text-[10px] font-black opacity-50 uppercase tracking-[0.2em]">Konum Bilgisi</h4>
                </div>
                <p className="text-lg font-black leading-tight mb-2">{bus.profiles?.current_route || 'Yolda'}</p>
                <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Sinyal: {new Date(bus.updated_at).toLocaleTimeString()}</p>
             </div>
             <Bus className="absolute -right-8 -bottom-8 text-white/5" size={160} />
          </div>

          <div className="pt-4 space-y-4">
             <a href={`tel:${bus.profiles?.phone}`} className="w-full bg-[#114B36] text-white p-6 rounded-[2rem] flex items-center justify-center gap-4 shadow-xl shadow-emerald-900/20 active:scale-95 transition-all">
                <Phone size={24} />
                <span className="text-sm font-black uppercase tracking-widest">KAPTANI ARA</span>
             </a>
             <div className="grid grid-cols-2 gap-4">
                <button className="bg-rose-50 text-rose-600 p-6 rounded-[2rem] flex flex-col items-center gap-2 border border-rose-100">
                   <Heart size={28} />
                   <span className="text-[10px] font-black uppercase">KALP</span>
                </button>
                <button className="bg-indigo-50 text-indigo-600 p-6 rounded-[2rem] flex flex-col items-center gap-2 border border-indigo-100">
                   <MessageCircle size={28} />
                   <span className="text-[10px] font-black uppercase">MESAJ</span>
                </button>
             </div>
          </div>
       </div>
    </motion.div>
  );
};

export default DriverDetail;
