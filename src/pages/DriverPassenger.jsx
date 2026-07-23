import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Plus, Minus, Bus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DriverPassenger() {
  const [activeShift, setActiveShift] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveShift();

    // Listen to changes for realtime feedback
    const channel = supabase.channel('passenger-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'shift_logs' }, (payload) => {
        if (activeShift && payload.new.id === activeShift.id) {
          setActiveShift(payload.new);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchActiveShift = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('shift_logs')
        .select('*, vehicles(plate_number)')
        .eq('driver_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      
      setActiveShift(data);
    }
    setLoading(false);
  };

  const handleUpdatePassenger = async (change) => {
    if (!activeShift) return;
    const newCount = Math.max(0, (activeShift.passenger_count || 0) + change); // Prevent negative numbers
    
    setActiveShift(prev => ({ ...prev, passenger_count: newCount }));
    
    await supabase
      .from('shift_logs')
      .update({ passenger_count: newCount })
      .eq('id', activeShift.id);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-bold text-sm mt-20">Yükleniyor...</div>;
  }

  if (!activeShift) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <Bus size={32} className="text-slate-400" />
        </div>
        <h2 className="text-xl font-black text-slate-800 mb-2">Aktif Vardiya Yok</h2>
        <p className="text-sm font-bold text-slate-400">Yolcu sayımı yapabilmek için önce Ana Sayfadan bir vardiya başlatmalısınız.</p>
      </div>
    );
  }

  return (
    <div className="p-6 pb-24 max-w-md mx-auto space-y-6">
      <div className="text-center mt-6 mb-8">
        <h2 className="text-2xl font-black text-slate-800">Yolcu Sayacı</h2>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
          {activeShift.vehicles?.plate_number} - Aktif Vardiya
        </p>
      </div>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-indigo-600 rounded-[2.5rem] p-8 text-center text-white shadow-xl shadow-indigo-600/30 border border-indigo-500 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
          <Users size={120} />
        </div>
        
        <p className="text-xs font-black uppercase tracking-widest text-indigo-200 mb-2">Toplam Binen Yolcu</p>
        <h1 className="text-7xl font-black tracking-tighter drop-shadow-md">
          {activeShift.passenger_count || 0}
        </h1>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 mt-8">
        <button 
          onClick={() => handleUpdatePassenger(1)} 
          className="bg-white hover:bg-slate-50 active:scale-95 transition-all text-emerald-600 py-5 rounded-[2rem] font-black text-lg border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
            <Plus size={24} />
          </div>
          1 Yolcu Ekle
        </button>

        <button 
          onClick={() => handleUpdatePassenger(5)} 
          className="bg-white hover:bg-slate-50 active:scale-95 transition-all text-indigo-600 py-5 rounded-[2rem] font-black text-lg border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2"
        >
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
            <Plus size={24} />
          </div>
          5 Yolcu Ekle
        </button>
      </div>

      <div className="flex justify-center mt-6">
        <button 
          onClick={() => handleUpdatePassenger(-1)} 
          className="bg-white hover:bg-rose-50 active:scale-95 transition-all text-rose-500 px-8 py-4 rounded-[1.5rem] font-black text-sm border border-slate-100 shadow-sm flex items-center gap-2"
        >
          <Minus size={18} /> 1 Yolcu Çıkar
        </button>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-100 p-5 rounded-3xl text-center">
        <p className="text-[11px] font-bold text-blue-800 leading-relaxed">
          Bu sayı, yöneticilerinize canlı olarak iletilmektedir. Durağa geldiğinizde binen yolcu kadar ekleme yapmayı unutmayınız.
        </p>
      </div>
    </div>
  );
}
