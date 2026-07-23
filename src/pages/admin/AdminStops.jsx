import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2, MapPin, CheckCircle2, Navigation, AlertTriangle, ShieldCheck, Edit3, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AdminStops() {
  const navigate = useNavigate();
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recordingId, setRecordingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStop, setEditingStop] = useState(null);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [sequenceOrder, setSequenceOrder] = useState('');
  const [latitudeInput, setLatitudeInput] = useState('36.9160');
  const [longitudeInput, setLongitudeInput] = useState('34.8800');

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

  const handleAddOrUpdateStop = async (e) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (!name.trim()) {
      setError('Lütfen durak adını girin.');
      return;
    }

    const orderVal = parseInt(sequenceOrder) || (stops.length + 1);
    const latVal = parseFloat(latitudeInput) || 36.9160;
    const lngVal = parseFloat(longitudeInput) || 34.8800;

    if (editingStop) {
      // Update existing stop
      const { error: updateError } = await supabase
        .from('stops')
        .update({
          name: name.trim(),
          sequence_order: orderVal,
          latitude: latVal,
          longitude: lngVal
        })
        .eq('id', editingStop.id);

      if (updateError) {
        setError(`Durak güncellenemedi: ${updateError.message}`);
      } else {
        setInfoMessage(`${name} durağı başarıyla güncellendi.`);
        closeModal();
        fetchStops();
      }
    } else {
      // Insert new stop
      const { error: insertError } = await supabase
        .from('stops')
        .insert([{
          name: name.trim(),
          sequence_order: orderVal,
          latitude: latVal,
          longitude: lngVal
        }]);

      if (insertError) {
        setError(`Durak eklenemedi: ${insertError.message}`);
      } else {
        setInfoMessage(`${name} durağı başarıyla eklendi.`);
        closeModal();
        fetchStops();
      }
    }
  };

  const openAddModal = () => {
    setEditingStop(null);
    setName('');
    setSequenceOrder((stops.length + 1).toString());
    setLatitudeInput('36.9160');
    setLongitudeInput('34.8800');
    setIsModalOpen(true);
  };

  const openEditModal = (stop) => {
    setEditingStop(stop);
    setName(stop.name || '');
    setSequenceOrder((stop.sequence_order || 1).toString());
    setLatitudeInput(stop.latitude ? stop.latitude.toString() : '36.9160');
    setLongitudeInput(stop.longitude ? stop.longitude.toString() : '34.8800');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStop(null);
    setName('');
    setSequenceOrder('');
  };

  const saveCoordinates = async (stopId, stopName, lat, lng, isFallback = false) => {
    const { error } = await supabase
      .from('stops')
      .update({ latitude: lat, longitude: lng })
      .eq('id', stopId);

    if (error) {
      setError(`${stopName} kaydedilemedi: ${error.message}`);
    } else {
      setStops(stops.map(s => s.id === stopId ? { ...s, latitude: lat, longitude: lng, recorded_now: true } : s));
      if (isFallback) {
        setInfoMessage(`${stopName} için varsayılan GPS konumu kaydedildi.`);
      } else {
        setInfoMessage(`${stopName} konumu başarıyla güncellendi.`);
      }
    }
    setRecordingId(null);
  };

  const recordLocation = (stopId, stopName) => {
    setRecordingId(stopId);
    setError(null);
    setInfoMessage(null);

    if (!navigator.geolocation) {
      // Fallback if browser doesn't support geolocation
      saveCoordinates(stopId, stopName, 36.9160, 34.8800, true);
      return;
    }

    // Try High Accuracy first (5 sec timeout)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        saveCoordinates(stopId, stopName, position.coords.latitude, position.coords.longitude);
      },
      (err) => {
        // Fallback Attempt: Try Standard Accuracy (8 sec timeout)
        navigator.geolocation.getCurrentPosition(
          (position) => {
            saveCoordinates(stopId, stopName, position.coords.latitude, position.coords.longitude);
          },
          (secondErr) => {
            // Final Fallback: If device has no GPS access/times out on Desktop, set default Tarsus center
            saveCoordinates(stopId, stopName, 36.9160, 34.8800, true);
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
        );
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
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
              onClick={openAddModal}
              className="p-2.5 bg-indigo-600 rounded-xl text-white active:scale-95 border border-indigo-700 shadow-md shadow-indigo-100 flex items-center gap-1 text-xs font-black px-3"
            >
              <Plus size={18} /> Durağı Ekle
            </button>
            <button onClick={() => navigate(-1)} className="p-2.5 bg-slate-50 rounded-xl text-slate-600 active:scale-95 border border-slate-100"><ChevronLeft size={20} /></button>
         </div>
      </header>

      {/* SUCCESS INFO ALERT */}
      {infoMessage && (
        <div className="mx-5 mt-4 bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-start gap-3">
           <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
           <p className="text-xs font-bold text-emerald-700 leading-relaxed">{infoMessage}</p>
        </div>
      )}

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
           Durak ekleyebilir, koordinatlarını elle düzenleyebilir veya "KONUMU KAYDET" butonuna basarak bulunduğunuz yeri atayabilirsiniz.
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

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(stop)}
                    className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 rounded-xl transition-colors active:scale-95 flex items-center gap-1 text-[10px] font-black px-2.5"
                  >
                    <Edit3 size={13} /> Düzenle
                  </button>
                  <button
                    onClick={() => handleDeleteStop(stop.id)}
                    className="p-2 bg-slate-50 text-slate-400 hover:text-rose-500 border border-slate-100 rounded-xl transition-colors active:scale-95"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Coordinates info */}
              <div className="bg-slate-50 p-3 rounded-2xl flex justify-between items-center text-[10px] text-slate-500 font-bold border border-slate-100/50">
                <div className="flex items-center gap-1.5">
                  <MapPin size={12} className="text-indigo-500" />
                  <span>Enlem: {stop.latitude ? Number(stop.latitude).toFixed(4) : '36.9160'}, Boylam: {stop.longitude ? Number(stop.longitude).toFixed(4) : '34.8800'}</span>
                </div>
                {stop.latitude && stop.longitude && (
                  <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1">
                    <CheckCircle2 size={10} /> KAYITLI
                  </span>
                )}
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
                   <>GPS Konumu Alınıyor...</>
                 ) : stop.recorded_now ? (
                   <><CheckCircle2 size={14} /> BAŞARIYLA GÜNCELLENDİ</>
                 ) : (
                   <><Navigation size={14} /> {stop.latitude && stop.longitude ? 'KONUMU GÜNCELLE' : 'ŞU ANKİ KONUMU KAYDET'}</>
                 )}
              </button>
            </motion.div>
          ))
        )}
      </div>

      {/* ADD / EDIT STOP MODAL */}
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
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                  {editingStop ? 'Durağı Düzenle' : 'Yeni Durak Ekle'}
                </h3>
                <button onClick={closeModal} className="p-1.5 bg-slate-100 rounded-full text-slate-500"><X size={16} /></button>
              </div>

              <form onSubmit={handleAddOrUpdateStop} className="space-y-3.5">
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Durak Adı</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Örn: Kesmen Petrol"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-4 py-3 outline-none font-bold placeholder-slate-400 focus:border-indigo-500 focus:bg-white transition-all text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sıra Numarası (Sequence)</label>
                  <input
                    type="number"
                    value={sequenceOrder}
                    onChange={(e) => setSequenceOrder(e.target.value)}
                    placeholder="Örn: 1"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-4 py-3 outline-none font-bold placeholder-slate-400 focus:border-indigo-500 focus:bg-white transition-all text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Enlem (Lat)</label>
                    <input
                      type="text"
                      value={latitudeInput}
                      onChange={(e) => setLatitudeInput(e.target.value)}
                      placeholder="36.9160"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-3 py-2.5 outline-none font-bold text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Boylam (Lng)</label>
                    <input
                      type="text"
                      value={longitudeInput}
                      onChange={(e) => setLongitudeInput(e.target.value)}
                      placeholder="34.8800"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-3 py-2.5 outline-none font-bold text-xs"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 bg-slate-50 border border-slate-200 text-slate-500 font-black text-[11px] uppercase tracking-widest py-3.5 rounded-2xl active:scale-95 transition-transform"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 border border-indigo-700 text-white font-black text-[11px] uppercase tracking-widest py-3.5 rounded-2xl shadow-lg shadow-indigo-100 active:scale-95 transition-transform"
                  >
                    {editingStop ? 'Güncelle' : 'Ekle'}
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

