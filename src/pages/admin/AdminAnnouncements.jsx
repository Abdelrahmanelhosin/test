import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2, Bell, AlertTriangle, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AdminAnnouncements() {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError('Duyurular yüklenirken hata oluştu.');
    } else {
      setAnnouncements(data || []);
    }
    setLoading(false);
  };

  const handleAddAnnouncement = async (e) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !content.trim()) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Kullanıcı oturumu bulunamadı.');
      return;
    }

    const { error: insertError } = await supabase
      .from('announcements')
      .insert([{
        title: title.trim(),
        content: content.trim(),
        author_id: user.id
      }]);

    if (insertError) {
      setError(`Duyuru yayınlanamadı: ${insertError.message}`);
    } else {
      setTitle('');
      setContent('');
      setIsModalOpen(false);
      fetchAnnouncements();
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Bu duyuruyu silmek istediğinizden emin misiniz?')) return;
    setError(null);
    const { error: deleteError } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (deleteError) {
      setError('Duyuru silinirken hata oluştu.');
    } else {
      setAnnouncements(announcements.filter(a => a.id !== id));
    }
  };

  return (
    <div className="flex flex-col bg-[#f8fafc] min-h-screen font-sans pb-32">
      {/* HEADER */}
      <header className="bg-white px-6 pt-12 pb-6 sticky top-0 z-50 shadow-sm flex items-center justify-between border-b border-slate-100">
         <div>
            <p className="text-[9px] text-indigo-600 font-black uppercase tracking-widest leading-none mb-1">ADMİN / DUYURULAR</p>
            <h1 className="text-xl font-black text-slate-800 leading-tight">Duyuru Paneli</h1>
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
          <div className="text-center py-10 font-bold text-slate-400">Duyurular yükleniyor...</div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-10 font-bold text-slate-400 bg-white border border-slate-100 rounded-3xl">Yayınlanmış duyuru bulunmamaktadır.</div>
        ) : (
          announcements.map((anon) => (
            <motion.div
              key={anon.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-3"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
                    <Bell size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 tracking-tight leading-tight">{anon.title}</h3>
                    <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                      {new Date(anon.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteAnnouncement(anon.id)}
                  className="p-2 bg-slate-50 text-slate-400 hover:text-rose-500 border border-slate-100 rounded-xl transition-colors active:scale-95"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                <p className="text-xs font-bold text-slate-600 leading-relaxed whitespace-pre-wrap">{anon.content}</p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* ADD ANNOUNCEMENT MODAL */}
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
              <h3 className="text-lg font-black text-slate-800 mb-4 uppercase tracking-tight">Yeni Duyuru Yayınla</h3>
              <form onSubmit={handleAddAnnouncement} className="space-y-4">
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Duyuru Başlığı</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Duyuru Başlığı"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-4 py-3.5 outline-none font-bold placeholder-slate-400 focus:border-indigo-500 focus:bg-white transition-all text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">İçerik</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Sürücülere yayınlanacak mesaj..."
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-4 py-3.5 outline-none font-bold placeholder-slate-400 focus:border-indigo-500 focus:bg-white transition-all text-xs resize-none"
                    required
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
                    className="flex-1 bg-indigo-600 border border-indigo-700 text-white font-black text-[11px] uppercase tracking-widest py-3.5 rounded-2xl shadow-lg shadow-indigo-100 active:scale-95 transition-transform flex items-center justify-center gap-1.5"
                  >
                    <Send size={12} /> Yayınla
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
