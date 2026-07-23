import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, AlertTriangle, ShieldCheck, Bus, Users, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AdminReports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchReports();

    const channel = supabase
      .channel('admin-reports-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        () => {
          fetchReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reports')
      .select('*, profiles:driver_id(full_name), vehicles:vehicle_id(plate_number)')
      .order('created_at', { ascending: false });

    if (error) {
      setError('Arıza kayıtları yüklenirken hata oluştu.');
    } else {
      setReports(data || []);
    }
    setLoading(false);
  };

  const resolveReport = async (id) => {
    setError(null);
    const { error: updateError } = await supabase
      .from('reports')
      .update({ status: 'resolved' })
      .eq('id', id);

    if (updateError) {
      setError('Rapor durumu güncellenemedi.');
    } else {
      setReports(reports.map(r => r.id === id ? { ...r, status: 'resolved' } : r));
    }
  };

  return (
    <div className="flex flex-col bg-[#f8fafc] min-h-screen font-sans pb-32">
      {/* HEADER */}
      <header className="bg-white px-6 pt-12 pb-6 sticky top-0 z-50 shadow-sm flex items-center justify-between border-b border-slate-100">
         <div>
            <p className="text-[9px] text-indigo-600 font-black uppercase tracking-widest leading-none mb-1">ADMİN / ARIZALAR</p>
            <h1 className="text-xl font-black text-slate-800 leading-tight">Arıza Kayıtları</h1>
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
          <div className="text-center py-10 font-bold text-slate-400">Arıza kayıtları yükleniyor...</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-10 font-bold text-slate-400 bg-white border border-slate-100 rounded-3xl">Sistemde arıza kaydı bulunmamaktadır.</div>
        ) : (
          reports.map((report) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-[2rem] border shadow-sm flex flex-col gap-3.5 ${
                report.status === 'pending' ? 'bg-white border-slate-100' : 'bg-slate-50/50 border-slate-100'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                    report.status === 'pending' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {report.status === 'pending' ? 'BEKLEYEN ARIZA' : 'ÇÖZÜLDÜ'}
                  </span>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">
                    {new Date(report.created_at).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </p>
                </div>

                {report.status === 'pending' && (
                  <button
                    onClick={() => resolveReport(report.id)}
                    className="flex items-center gap-1 bg-emerald-500 text-white text-[9px] font-black px-3 py-2 rounded-xl uppercase tracking-widest shadow-md shadow-emerald-100 active:scale-95 transition-transform"
                  >
                    <Check size={12} /> Çözüldü İşaretle
                  </button>
                )}
              </div>

              {/* Description */}
              <div className="bg-slate-50/50 border border-slate-100/50 p-3.5 rounded-2xl">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest text-[8px] mb-1">Açıklama</p>
                <p className="text-xs font-bold text-slate-700 leading-relaxed">{report.issue_description}</p>
              </div>

              {/* Location Details / Custom Address */}
              {(report.custom_address || report.latitude) && (
                <div className="bg-slate-50/50 border border-slate-100/50 p-3.5 rounded-2xl">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest text-[8px] mb-1">Konum Detayı / Tarif</p>
                  {report.custom_address && (
                    <p className="text-xs font-bold text-slate-700 leading-relaxed mb-1">{report.custom_address}</p>
                  )}
                  {report.latitude && (
                    <a 
                      href={`https://maps.google.com/?q=${report.latitude},${report.longitude}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[9px] font-black text-indigo-600 uppercase hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      📍 Google Haritalar'da Gör ({report.latitude.toFixed(4)}, {report.longitude.toFixed(4)})
                    </a>
                  )}
                </div>
              )}

              {/* Image Preview */}
              {report.image_base64 && (
                <div className="space-y-1">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest text-[8px] ml-1">Eklenti Görsel</p>
                  <div 
                    onClick={() => setSelectedImage(report.image_base64)}
                    className="w-full h-32 rounded-2xl overflow-hidden border border-slate-100 shadow-sm cursor-zoom-in"
                  >
                    <img src={report.image_base64} alt="Arıza Görsel" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              {/* Driver & Vehicle detail */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-100/50 rounded-xl">
                  <Users size={14} className="text-slate-400" />
                  <div className="truncate">
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Bildiren Kaptan</p>
                    <span className="font-bold text-slate-700 text-[10px]">{report.profiles?.full_name || 'Silinmiş Hesap'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-100/50 rounded-xl">
                  <Bus size={14} className="text-slate-400" />
                  <div className="truncate">
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Araç Plaka</p>
                    <span className="font-bold text-slate-700 text-[10px] uppercase">{report.vehicles?.plate_number || 'Bilinmiyor'}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* FULL IMAGE MODAL */}
      <AnimatePresence>
        {selectedImage && (
          <div 
            className="fixed inset-0 z-[9999] bg-slate-900/95 flex items-center justify-center p-6"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center">
              <img src={selectedImage} alt="Büyük Görsel" className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md active:scale-90 transition-transform"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
