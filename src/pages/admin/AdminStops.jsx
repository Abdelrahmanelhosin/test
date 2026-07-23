import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2, MapPin, CheckCircle2, Navigation, AlertTriangle, ShieldCheck, Edit3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AdminStops() {
  const navigate = useNavigate();
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recordingId, setRecordingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [sequenceOrder, setSequenceOrder] = useState('');

  useEffect(() => {
    fetchStops();
  }, []);

  const fetchStops = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('stops')
      .select('*')
      .order('sequence_order', { ascending: true });

    if (error) {
      setError('Duraklar yüklenirken hata oluştu.');
    } else {
      setStops(data || []);
    }
    setLoading(false);
  };

  const handleAddStop = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Lütfen durak adını girin.');
      return;
    }

    const orderVal = parseInt(sequenceOrder) || (stops.length + 1);

    const { error: insertError } = await supabase
      .from('stops')
      .insert([{
        name: name.trim(),
        sequence_order: orderVal,
        latitude: 36.9167, // Default centered in Tarsus
        longitude: 34.8833
      }]);

    if (insertError) {
      setError(`Durak eklenemedi: ${insertError.message}`);
    } else {
      setName('');
      setSequenceOrder('');
      setIsModalOpen(false);
      fetchStops();
    }
  };

  const recordLocation = (stopId, stopName) => {
    setRecordingId(stopId);
    setError(null);

    if (!navigator.geolocation) {
      setError('Cihazınız GPS özelliğini desteklemiyor.');
      setRecordingId(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        const { error } = await supabase
          .from('stops')
          .update({ latitude, longitude })
          .eq('id', stopId);

        if (error) {
          setError(`${stopName} kaydedilemedi: ${error.message}`);
        } else {
          setStops(stops.map(s => s.id === stopId ? { ...s, latitude, longitude, recorded_now: true } : s));
        }
        setRecordingId(null);
      },
      (err) => {
        setError(`GPS hatası: Lütfen konum izinlerini verdiğinizden emin olun. (${err.message})`);
        setRecordingId(null);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleDeleteStop = async (id) => {
    if (!window.confirm('Bu durağı silmek istediğinizden emin misiniz?')) return;
    setError(null);
    const { error: deleteError } = await supabase
      .from('stops')
      .delete()
      .eq('id', id);

    if (deleteError) {
      setError('Durak silinirken hata oluştu.');
    } else {
      setStops(stops.filter(s => s.id !== id));
    }
  };

  return (
    <div className="flex flex-col bg-[#f8fafc] min-h-screen font-sans pb-32">
      {/* HEADER */}
      <header className="bg-white px-6 pt-12 pb-6 sticky top-0 z-50 shadow-sm flex items-center justify-between border-b border-slate-100">
         <div>
            <p className="text-[9px] text-indigo-600 font-black uppercase tracking-widest leading-none mb-1">ADMİN / HARİTA</p>
            <h1 className="text-xl font-black text-slate-800 leading-tight">Durak Ayarları</h1>
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

      {/* GPS INSTRUCTIONS */}
      <div className="mx-5 mt-4 bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-start gap-3">
         <ShieldCheck className="text-indigo-500 shrink-0 mt-0.5" size={20} />
         <p className="text-[11px] font-bold text-indigo-700 leading-relaxed">
           GPS Konum tespiti için lütfen otobüsle tam durağa geldiğinizde "KONUMU KAYDET" butonuna basın.
         </p>
      </div>

      {/* BODY CONTENT */}
      <div className="px-5 mt-6 space-y-4">
        {loading ? (
          <div className="text-center py-10 font-bold text-slate-400">Duraklar yükleniyor...</div>
        ) : stops.length === 0 ? (
          <div className="text-center py-10 font-bold text-slate-400 bg-white border border-slate-100 rounded-3xl">Sistemde durak bulunmamaktadır.</div>
        ) : (
          stops.map((stop, index) => (
            <motion.div
              key={stop.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-3.5"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">DURAK {stop.sequence_order || index + 1}</span>
                  <h3 className="text-sm font-black text-slate-800 tracking-tight mt-1.5">{stop.name}</h3>
                </div>

                <button
                  onClick={() => handleDeleteStop(stop.id)}
                  className="p-2 bg-slate-50 text-slate-400 hover:text-rose-500 border border-slate-100 rounded-xl transition-colors active:scale-95"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Coordinates info */}
              <div className="bg-slate-50 p-3 rounded-2xl flex justify-between items-center text-[10px] text-slate-500 font-bold border border-slate-100/50">
                <div className="flex items-center gap-1.5">
                  <MapPin size={12} className="text-indigo-500" />
                  <span>Enlem: {stop.latitude?.toFixed(4)}, Boylam: {stop.longitude?.toFixed(4)}</span>
                </div>
              </div>

              {/* Record GPS Button */}
              <button 
                onClick={() => recordLocation(stop.id, stop.name)}
                disabled={recordingId !== null}
                className={`w-full py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  stop.recorded_now 
                    ? 'bg-emerald-500 text-white shadow-md'
                    : recordingId === stop.id
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      : 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                }`}
              >
                 {recordingId === stop.id ? (
                   <>Bekleniyor...</>
                 ) : stop.recorded_now ? (
                   <><CheckCircle2 size={14} /> BAŞARIYLA GÜNCELLENDİ</>
                 ) : (
                   <><Navigation size={14} /> ŞU ANKİ KONUMU KAYDET</>
                 )}
              </button>
            </motion.div>
          ))
        )}
      </div>

      {/* ADD STOP MODAL */}
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
              <h3 className="text-lg font-black text-slate-800 mb-4 uppercase tracking-tight">Yeni Durak Ekle</h3>
              <form onSubmit={handleAddStop} className="space-y-4">
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Durak Adı</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Durak Adı"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-4 py-3.5 outline-none font-bold placeholder-slate-400 focus:border-indigo-500 focus:bg-white transition-all text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sıra Numarası (Sequence)</label>
                  <input
                    type="number"
                    value={sequenceOrder}
                    onChange={(e) => setSequenceOrder(e.target.value)}
                    placeholder="Örn: 5"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-4 py-3.5 outline-none font-bold placeholder-slate-400 focus:border-indigo-500 focus:bg-white transition-all text-xs"
                  />
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
