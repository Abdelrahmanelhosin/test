import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2, Calendar, Route, AlertTriangle, Users, Bus, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const getLocalDateTimeString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function AdminSchedules() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);

  // Form states
  const [driverId, setDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [routeName, setRouteName] = useState('Yenihal - Yaramış');
  const [startTime, setStartTime] = useState(getLocalDateTimeString());
  const [status, setStatus] = useState('upcoming');

  useEffect(() => {
    fetchSchedules();
    fetchDriversAndVehicles();
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('schedules')
      .select('*, profiles:driver_id(full_name), vehicles:vehicle_id(plate_number)')
      .order('start_time', { ascending: false });

    if (error) {
      setError('Seferler yüklenirken hata oluştu.');
    } else {
      setSchedules(data || []);
    }
    setLoading(false);
  };

  const fetchDriversAndVehicles = async () => {
    // Fetch drivers (role = 'driver')
    const { data: driverData } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'driver');
    if (driverData) setDrivers(driverData);

    // Fetch active vehicles
    const { data: vehicleData } = await supabase
      .from('vehicles')
      .select('id, plate_number')
      .eq('status', 'active');
    if (vehicleData) setVehicles(vehicleData);
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    setError(null);

    if (!driverId || !vehicleId || !routeName.trim() || !startTime) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }

    try {
      const parsedDate = new Date(startTime);
      if (isNaN(parsedDate.getTime())) {
        setError('Geçersiz bir başlangıç zamanı seçtiniz.');
        return;
      }

      const { error: insertError } = await supabase
        .from('schedules')
        .insert([{
          driver_id: driverId,
          vehicle_id: vehicleId,
          route_name: routeName.trim(),
          start_time: parsedDate.toISOString(),
          status
        }]);

      if (insertError) {
        setError(`Sefer eklenemedi: ${insertError.message}`);
      } else {
        setDriverId('');
        setVehicleId('');
        setStartTime(getLocalDateTimeString());
        setStatus('upcoming');
        setIsModalOpen(false);
        fetchSchedules();
      }
    } catch (err) {
      setError(`Tarih hatası: ${err.message}`);
    }
  };

  const updateScheduleStatus = async (id, nextStatus) => {
    setError(null);
    const updates = { status: nextStatus };
    if (nextStatus === 'completed') {
      updates.end_time = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('schedules')
      .update(updates)
      .eq('id', id);

    if (updateError) {
      setError('Sefer durumu güncellenemedi.');
    } else {
      fetchSchedules();
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm('Bu seferi silmek istediğinizden emin misiniz?')) return;
    setError(null);
    const { error: deleteError } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id);

    if (deleteError) {
      setError('Sefer silinirken hata oluştu.');
    } else {
      setSchedules(schedules.filter(s => s.id !== id));
    }
  };

  return (
    <div className="flex flex-col bg-[#f8fafc] min-h-screen font-sans pb-32">
      {/* HEADER */}
      <header className="bg-white px-6 pt-12 pb-6 sticky top-0 z-50 shadow-sm flex items-center justify-between border-b border-slate-100">
         <div>
            <p className="text-[9px] text-indigo-600 font-black uppercase tracking-widest leading-none mb-1">ADMİN / SEFERLER</p>
            <h1 className="text-xl font-black text-slate-800 leading-tight">Sefer Planlama</h1>
         </div>
         <div className="flex gap-2">
            <button 
              onClick={() => {
                setStartTime(getLocalDateTimeString());
                setIsModalOpen(true);
              }}
              className="p-2.5 bg-indigo-600 rounded-xl text-white active:scale-95 border border-indigo-700 shadow-md shadow-indigo-100"
            >
              <Plus size={20} />
            </button>
            <button onClick={() => navigate(-1)} className="p-2.5 bg-slate-50 rounded-xl text-slate-600 active:scale-95 border border-slate-100"><ChevronLeft size={20} /></button>
         </div>
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
          <div className="text-center py-10 font-bold text-slate-400">Sefer planı yükleniyor...</div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-10 font-bold text-slate-400 bg-white border border-slate-100 rounded-3xl">Planlanmış sefer bulunmamaktadır.</div>
        ) : (
          schedules.map((schedule) => (
            <motion.div
              key={schedule.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-3.5"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider">{schedule.route_name}</span>
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5 mt-1">
                    <Clock size={14} className="text-slate-400" />
                    {new Date(schedule.start_time).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                  </h3>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => handleDeleteSchedule(schedule.id)}
                    className="p-2 bg-slate-50 text-slate-400 hover:text-rose-500 border border-slate-100 rounded-xl transition-colors active:scale-95"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Driver & Vehicle detail */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-100/50 rounded-xl">
                  <Users size={14} className="text-slate-400" />
                  <div className="truncate">
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Kaptan</p>
                    <span className="font-bold text-slate-700 text-[10px]">{schedule.profiles?.full_name || 'Silinmiş Hesap'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-100/50 rounded-xl">
                  <Bus size={14} className="text-slate-400" />
                  <div className="truncate">
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Plaka</p>
                    <span className="font-bold text-slate-700 text-[10px] uppercase">{schedule.vehicles?.plate_number || 'Araç Yok'}</span>
                  </div>
                </div>
              </div>

              {/* Status & Transitions */}
              <div className="flex justify-between items-center pt-1.5 border-t border-slate-50">
                <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  schedule.status === 'upcoming' 
                    ? 'bg-amber-50 text-amber-700' 
                    : schedule.status === 'in_progress' 
                      ? 'bg-blue-50 text-blue-700 animate-pulse' 
                      : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {schedule.status === 'upcoming' ? 'BEKLEYEN' : schedule.status === 'in_progress' ? 'YOLDA' : 'TAMAMLANDI'}
                </span>

                <div className="flex gap-1.5">
                  {schedule.status === 'upcoming' && (
                    <button
                      onClick={() => updateScheduleStatus(schedule.id, 'in_progress')}
                      className="bg-indigo-600 text-white text-[8px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-sm active:scale-95 transition-transform"
                    >
                      SEFERİ BAŞLAT
                    </button>
                  )}
                  {schedule.status === 'in_progress' && (
                    <button
                      onClick={() => updateScheduleStatus(schedule.id, 'completed')}
                      className="bg-emerald-600 text-white text-[8px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-sm active:scale-95 transition-transform"
                    >
                      BİTİR
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* ADD SCHEDULE MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border border-slate-100 max-h-[85vh] overflow-y-auto"
            >
              <h3 className="text-lg font-black text-slate-800 mb-4 uppercase tracking-tight">Yeni Sefer Planla</h3>
              <form onSubmit={handleAddSchedule} className="space-y-4">
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kaptan Seçin</label>
                  <select
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-4 py-3.5 outline-none font-bold focus:border-indigo-500 focus:bg-white transition-all text-xs"
                    required
                  >
                    <option value="">-- Kaptan Seçin --</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.full_name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Araç Plakası</label>
                  <select
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-4 py-3.5 outline-none font-bold focus:border-indigo-500 focus:bg-white transition-all text-xs"
                    required
                  >
                    <option value="">-- Plaka Seçin --</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.plate_number}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hat Adı</label>
                  <input
                    type="text"
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                    placeholder="Örn: Yenihal - Yaramış"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-4 py-3.5 outline-none font-bold focus:border-indigo-500 focus:bg-white transition-all text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Başlangıç Zamanı</label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-4 py-3.5 outline-none font-bold focus:border-indigo-500 focus:bg-white transition-all text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">İlk Sefer Durumu</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-4 py-3.5 outline-none font-bold focus:border-indigo-500 focus:bg-white transition-all text-xs"
                  >
                    <option value="upcoming">Planlandı (Bekliyor)</option>
                    <option value="in_progress">Aktif (Yolda)</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-slate-50 border border-slate-200 text-slate-500 font-black text-[11px] uppercase tracking-widest py-3.5 rounded-2xl active:scale-95 transition-transform"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 border border-indigo-700 text-white font-black text-[11px] uppercase tracking-widest py-3.5 rounded-2xl shadow-lg shadow-indigo-100 active:scale-95 transition-transform"
                  >
                    Kaydet
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
