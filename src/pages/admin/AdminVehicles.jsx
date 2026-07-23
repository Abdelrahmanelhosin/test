import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2, Bus, AlertTriangle, ShieldCheck, CheckCircle2, Settings } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AdminVehicles() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);

  // Form states
  const [plateNumber, setPlateNumber] = useState('');
  const [model, setModel] = useState('');
  const [status, setStatus] = useState('active');

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('vehicles').select('*').order('plate_number', { ascending: true });
    if (error) {
      setError('Araçlar yüklenirken hata oluştu.');
    } else {
      setVehicles(data || []);
    }
    setLoading(false);
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setError(null);

    if (!plateNumber.trim() || !model.trim()) {
      setError('Tüm alanları doldurmanız gerekmektedir.');
      return;
    }

    const cleanedPlate = plateNumber.trim().toUpperCase();

    const { error: insertError } = await supabase
      .from('vehicles')
      .insert([{ plate_number: cleanedPlate, model: model.trim(), status }]);

    if (insertError) {
      if (insertError.code === '23505') {
        setError('Bu plaka numarasına sahip bir araç zaten mevcut.');
      } else {
        setError(`Araç eklenemedi: ${insertError.message}`);
      }
    } else {
      setPlateNumber('');
      setModel('');
      setStatus('active');
      setIsModalOpen(false);
      fetchVehicles();
    }
  };

  const toggleVehicleStatus = async (id, currentStatus) => {
    setError(null);
    const nextStatus = currentStatus === 'active' ? 'maintenance' : 'active';
    const { error: updateError } = await supabase
      .from('vehicles')
      .update({ status: nextStatus })
      .eq('id', id);

    if (updateError) {
      setError('Araç durumu güncellenemedi.');
    } else {
      setVehicles(vehicles.map(v => v.id === id ? { ...v, status: nextStatus } : v));
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (!window.confirm('Bu aracı silmek istediğinizden emin misiniz?')) return;
    setError(null);
    const { error: deleteError } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (deleteError) {
      setError('Araç silinirken hata oluştu. (Schedules veya Locations tablosunda referans olabilir.)');
    } else {
      setVehicles(vehicles.filter(v => v.id !== id));
    }
  };

  return (
    <div className="flex flex-col bg-[#f8fafc] min-h-screen font-sans pb-32">
      {/* HEADER */}
      <header className="bg-white px-6 pt-12 pb-6 sticky top-0 z-50 shadow-sm flex items-center justify-between border-b border-slate-100">
         <div>
            <p className="text-[9px] text-indigo-600 font-black uppercase tracking-widest leading-none mb-1">ADMİN / FİLO</p>
            <h1 className="text-xl font-black text-slate-800 leading-tight">Araç Yönetimi</h1>
         </div>
         <div className="flex gap-2">
            <button 
              onClick={() => setIsModalOpen(true)}
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
          <div className="text-center py-10 font-bold text-slate-400">Araç listesi yükleniyor...</div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-10 font-bold text-slate-400 bg-white border border-slate-100 rounded-3xl">Filoda kayıtlı araç bulunmamaktadır.</div>
        ) : (
          vehicles.map((vehicle) => (
            <motion.div
              key={vehicle.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-3"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm ${
                    vehicle.status === 'active' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-500'
                  }`}>
                    <Bus size={22} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{vehicle.model}</span>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{vehicle.plate_number}</h3>
                  </div>
                </div>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => toggleVehicleStatus(vehicle.id, vehicle.status)}
                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                      vehicle.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'bg-rose-50 text-rose-700 border border-rose-100'
                    }`}
                  >
                    {vehicle.status === 'active' ? 'AKTİF' : 'SERVİS DIŞI'}
                  </button>
                  <button
                    onClick={() => handleDeleteVehicle(vehicle.id)}
                    className="p-2 bg-slate-50 text-slate-400 hover:text-rose-500 border border-slate-100 rounded-xl transition-colors active:scale-95"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl flex justify-between items-center text-[10px] text-slate-500 font-bold border border-slate-100/50">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className={vehicle.status === 'active' ? 'text-emerald-500' : 'text-rose-500'} />
                  <span>Durum: {vehicle.status === 'active' ? 'Trafikte / Aktif' : 'Bakımda / Servis Dışı'}</span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* ADD VEHICLE MODAL */}
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
              className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border border-slate-100"
            >
              <h3 className="text-lg font-black text-slate-800 mb-4 uppercase tracking-tight">Yeni Araç Ekle</h3>
              <form onSubmit={handleAddVehicle} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Plaka Numarası</label>
                  <input
                    type="text"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    placeholder="Örn: 34 KPT 123"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-4 py-3.5 outline-none font-bold uppercase placeholder-slate-400 focus:border-indigo-500 focus:bg-white transition-all text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Model / Marka</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Örn: Otokar Kent LF"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-4 py-3.5 outline-none font-bold placeholder-slate-400 focus:border-indigo-500 focus:bg-white transition-all text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Araç Durumu</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-4 py-3.5 outline-none font-bold focus:border-indigo-500 focus:bg-white transition-all text-xs"
                  >
                    <option value="active">Aktif</option>
                    <option value="maintenance">Bakımda</option>
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
                    Ekle
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
