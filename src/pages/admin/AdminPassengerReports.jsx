import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, TrendingUp, Calendar, ChevronLeft, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function AdminPassengerReports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayTotal: 0,
    weekTotal: 0,
    monthTotal: 0,
    activeLaps: 0,
    shifts: []
  });

  useEffect(() => {
    fetchStats();

    const channel = supabase.channel('passenger-admin-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shift_logs' }, () => {
        fetchStats(); // Refetch on any shift change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); // Monday
    
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Fetch this month's data
    const { data: monthData } = await supabase
      .from('shift_logs')
      .select('*, profiles:driver_id(full_name), vehicles:vehicle_id(plate_number)')
      .gte('start_time', firstDayOfMonth.toISOString())
      .order('start_time', { ascending: false });

    if (monthData) {
      let todayCount = 0;
      let weekCount = 0;
      let monthCount = 0;
      let lapsCount = 0;

      monthData.forEach(shift => {
        const pCount = shift.passenger_count || 0;
        monthCount += pCount;
        lapsCount += (shift.laps_completed || 0);

        const shiftDate = new Date(shift.start_time);
        
        if (shiftDate >= firstDayOfWeek) {
          weekCount += pCount;
        }
        if (shiftDate >= today) {
          todayCount += pCount;
        }
      });

      setStats({
        todayTotal: todayCount,
        weekTotal: weekCount,
        monthTotal: monthCount,
        activeLaps: lapsCount,
        shifts: monthData.filter(s => new Date(s.start_time) >= today) // Only show today's shifts in list
      });
    }

    setLoading(false);
  };

  return (
    <div className="bg-[#f8fafc] min-h-[850px] flex flex-col font-sans pb-24 relative">
      <header className="bg-[#1e1b4b] px-6 pt-12 pb-6 sticky top-0 z-50 rounded-b-[2.5rem] shadow-sm flex items-center gap-4">
        <button 
          onClick={() => navigate('/admin')}
          className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-white active:scale-95 transition-transform shrink-0"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-black text-white">Yolcu Raporları</h1>
          <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mt-1">İstatistikler ve Veriler</p>
        </div>
      </header>

      <div className="px-5 mt-6 space-y-6">
        
        {/* Metric Cards */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-indigo-600 rounded-[2rem] p-5 text-white shadow-lg shadow-indigo-600/20 relative overflow-hidden">
            <Users className="absolute -right-4 -bottom-4 opacity-10" size={80} />
            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-200">BUGÜNKÜ YOLCU</p>
            <h2 className="text-3xl font-black mt-2">{stats.todayTotal}</h2>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-emerald-600 rounded-[2rem] p-5 text-white shadow-lg shadow-emerald-600/20 relative overflow-hidden">
            <TrendingUp className="absolute -right-4 -bottom-4 opacity-10" size={80} />
            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-200">BU HAFTA YOLCU</p>
            <h2 className="text-3xl font-black mt-2">{stats.weekTotal}</h2>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Calendar size={12}/> BU AY TOPLAM</p>
            <h2 className="text-4xl font-black text-slate-800 mt-1">{stats.monthTotal}</h2>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 justify-end"><MapPin size={12}/> AYLIK TUR</p>
            <h2 className="text-4xl font-black text-indigo-600 mt-1">{stats.activeLaps}</h2>
          </div>
        </motion.div>

        {/* Today's breakdown */}
        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2 mb-4">Bugünkü Araç Verileri</h3>
          {loading ? (
            <div className="text-center p-4 text-xs font-bold text-slate-400">Yükleniyor...</div>
          ) : stats.shifts.length === 0 ? (
             <div className="bg-white p-6 rounded-[2rem] border border-slate-100 text-center shadow-sm">
                <p className="text-xs font-bold text-slate-400">Bugün henüz veri yok</p>
             </div>
          ) : (
            <div className="space-y-3">
              {stats.shifts.map((shift, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + (idx * 0.05) }}
                  key={shift.id} 
                  className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-slate-800 text-xs">
                       {shift.vehicles?.plate_number || 'PLK'}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-700">{shift.profiles?.full_name}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{shift.status === 'active' ? 'Aktif Vardiya' : 'Tamamlandı'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                     <p className="text-lg font-black text-indigo-600">{shift.passenger_count || 0}</p>
                     <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Yolcu</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
