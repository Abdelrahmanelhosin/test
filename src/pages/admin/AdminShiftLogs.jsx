import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, User, Bus, Gauge, Fuel, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AdminShiftLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchShiftLogs();
  }, []);

  const fetchShiftLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('shift_logs')
      .select('*, profiles(full_name), vehicles(plate_number)')
      .order('start_time', { ascending: false });

    if (error) {
      setError('Vardiya kayıtları yüklenirken hata oluştu.');
    } else {
      setLogs(data || []);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col bg-[#f8fafc] min-h-screen font-sans pb-32">
      {/* HEADER */}
      <header className="bg-white px-6 pt-12 pb-6 sticky top-0 z-50 shadow-sm flex items-center justify-between border-b border-slate-100">
         <div>
            <p className="text-[9px] text-indigo-600 font-black uppercase tracking-widest leading-none mb-1">ADMİN / RAPORLAR</p>
            <h1 className="text-xl font-black text-slate-800 leading-tight">Vardiya Kayıtları</h1>
         </div>
         <button onClick={() => navigate(-1)} className="p-2.5 bg-slate-50 rounded-xl text-slate-600 active:scale-95 border border-slate-100"><ChevronLeft size={20} /></button>
      </header>

      {/* ERROR ALERT */}
      {error && (
        <div className="mx-5 mt-4 bg-rose-50 p-4 rounded-2xl border border-rose-100 flex items-start gap-3">
           <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={20} />
           <p className="text-xs font-bold text-rose-700 leading-relaxed">{error}</p>
        </div>
      )}

      {/* BODY CONTENT */}
      <div className="px-5 mt-6 space-y-4">
        {loading ? (
          <div className="text-center py-10 font-bold text-slate-400">Vardiyalar yükleniyor...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-10 font-bold text-slate-400 bg-white border border-slate-100 rounded-3xl">Sistemde vardiya kaydı bulunmamaktadır.</div>
        ) : (
          logs.map((log) => {
            const distance = log.end_odometer ? (log.end_odometer - log.start_odometer) : null;
            const fuelUsage = log.end_fuel ? (log.start_fuel - log.end_fuel) : null;

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-3.5`}
              >
                {/* Header info */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                      log.status === 'active' ? 'bg-emerald-50 text-emerald-700 animate-pulse' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {log.status === 'active' ? 'AKTİF SÜRÜŞ' : 'TAMAMLANDI'}
                    </span>
                    <h3 className="text-xs font-black text-slate-800 mt-2 flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-400" />
                      {new Date(log.start_time).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      {log.end_time && ` - ${new Date(log.end_time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`}
                    </h3>
                  </div>

                  <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded uppercase tracking-wider">
                    {log.vehicles?.plate_number}
                  </span>
                </div>

                {/* Driver Name */}
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <User size={14} className="text-slate-400" />
                  <span>Kaptan: {log.profiles?.full_name}</span>
                </div>

                {/* Start Odometer & Fuel Grid */}
                <div className="grid grid-cols-2 gap-3 text-[10px] font-bold text-slate-500 bg-slate-50 p-3.5 rounded-2xl border border-slate-100/50">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">BAŞLANGIÇ</p>
                    <p className="flex items-center gap-1 font-black text-slate-700"><Gauge size={12} /> {log.start_odometer} KM</p>
                    <p className="flex items-center gap-1 font-black text-slate-700 mt-1"><Fuel size={12} /> %{log.start_fuel} Yakıt</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">BİTİŞ</p>
                    {log.end_odometer ? (
                      <>
                        <p className="flex items-center gap-1 font-black text-slate-700"><Gauge size={12} /> {log.end_odometer} KM</p>
                        <p className="flex items-center gap-1 font-black text-slate-700 mt-1"><Fuel size={12} /> %{log.end_fuel} Yakıt</p>
                      </>
                    ) : (
                      <p className="text-slate-400 italic">Devam Ediyor...</p>
                    )}
                  </div>
                </div>

                {/* Calculated statistics (Km Driven / Fuel Consumed) */}
                {log.status === 'completed' && distance !== null && (
                  <div className="border-t border-slate-50 pt-3 flex justify-between items-center text-[10px] font-black text-indigo-700">
                    <span>Mesafe: {distance} KM</span>
                    <span>Tüketilen Yakıt: %{fuelUsage !== null ? Math.max(0, fuelUsage) : 0}</span>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
