import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MapPin, CheckCircle2, Navigation, AlertTriangle, ShieldCheck } from 'lucide-react';

const StopRecorder = () => {
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recordingId, setRecordingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStops();
  }, []);

  const fetchStops = async () => {
    const { data, error } = await supabase.from('stops').select('*').order('sequence_order', { ascending: true });
    if (error) {
      setError('Duraklar yüklenirken hata oluştu.');
    } else {
      setStops(data);
    }
    setLoading(false);
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
        const { latitude, longitude, accuracy } = position.coords;
        
        // Optional: Ensure accuracy is good enough, but for now just save it
        if (accuracy > 100) {
           // Warn but proceed or just log
           console.warn(`Düşük GPS hassasiyeti: ${accuracy} metre`);
        }

        const { error } = await supabase
          .from('stops')
          .update({ latitude, longitude })
          .eq('id', stopId);

        if (error) {
          setError(`${stopName} kaydedilemedi: ${error.message}`);
        } else {
          // Success, update local state to show it's saved
          setStops(stops.map(s => s.id === stopId ? { ...s, recorded_now: true } : s));
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

  if (loading) return <div className="p-10 text-center font-bold text-slate-500">Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex justify-center items-start md:pt-10 font-sans">
      <div className="w-full max-w-md bg-slate-50 h-screen md:h-[850px] relative shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] md:rounded-[3.5rem] border border-slate-200 flex flex-col overflow-y-auto no-scrollbar p-5 pb-20">
      
        {/* Header */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 mb-6 flex items-center gap-4">
         <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Navigation size={24} />
         </div>
         <div>
            <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">DURAK KAYIT SİSTEMİ</h1>
            <p className="text-xs font-bold text-slate-500 mt-1">Saha GPS Tespit Modülü</p>
         </div>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex items-start gap-3 mb-6">
           <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
           <p className="text-xs font-bold text-red-700 leading-relaxed">{error}</p>
        </div>
      )}

      <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-start gap-3 mb-6">
         <ShieldCheck className="text-indigo-500 shrink-0 mt-0.5" size={20} />
         <p className="text-xs font-bold text-indigo-700 leading-relaxed">
           Lütfen otobüsle tam durağa geldiğinizde "KONUMU KAYDET" butonuna basın. Cihazınızın GPS (Konum) özelliğinin açık olduğundan emin olun.
         </p>
      </div>

      {/* Stops List */}
      <div className="space-y-4">
         {stops.map((stop, index) => (
           <div key={stop.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                 <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">DURAK {stop.sequence_order || index + 1}</span>
                    <h3 className="text-lg font-black text-slate-800 mt-2">{stop.name}</h3>
                 </div>
                 {stop.recorded_now && (
                   <div className="bg-emerald-50 text-emerald-600 p-2 rounded-full">
                     <CheckCircle2 size={24} />
                   </div>
                 )}
              </div>

              <button 
                onClick={() => recordLocation(stop.id, stop.name)}
                disabled={recordingId !== null}
                className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  stop.recorded_now 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                    : recordingId === stop.id
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      : 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                }`}
              >
                 {recordingId === stop.id ? (
                   <>Bekleniyor...</>
                 ) : stop.recorded_now ? (
                   <><CheckCircle2 size={18} /> BAŞARIYLA KAYDEDİLDİ</>
                 ) : (
                   <><MapPin size={18} /> BURANIN KONUMUNU KAYDET</>
                 )}
              </button>
           </div>
         ))}
      </div>

      </div>
    </div>
  );
};

export default StopRecorder;
