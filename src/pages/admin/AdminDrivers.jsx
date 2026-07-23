import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Users, UserPlus, Mail, Phone, Lock, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AdminDrivers() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'driver')
        .order('full_name', { ascending: true });

      if (fetchErr) throw fetchErr;
      setDrivers(data || []);
    } catch (err) {
      setError('Kaptan listesi yüklenemedi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDriver = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/drivers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
          phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Kaptan kaydı başarısız oldu.');
      }

      setSuccess('Kaptan başarıyla oluşturuldu!');
      setFullName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setIsModalOpen(false);
      fetchDrivers();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDriver = async (id, name) => {
    if (!window.confirm(`${name} isimli kaptan hesabını silmek istediğinize emin misiniz? (Bu işlem Auth kaydını silmez, sadece profili siler)`)) return;
    setError(null);
    setSuccess(null);

    try {
      const { error: delErr } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (delErr) throw delErr;
      setSuccess('Kaptan profili başarıyla silindi.');
      fetchDrivers();
    } catch (err) {
      setError('Kaptan silinemedi: ' + err.message);
    }
  };

  return (
    <div className="flex flex-col bg-[#f8fafc] min-h-screen font-sans pb-32">
      {/* HEADER */}
      <header className="bg-white px-6 pt-12 pb-6 sticky top-0 z-50 shadow-sm flex items-center justify-between border-b border-slate-100">
        <div>
          <p className="text-[9px] text-indigo-600 font-black uppercase tracking-widest leading-none mb-1">ADMİN / SÜRÜCÜLER</p>
          <h1 className="text-xl font-black text-slate-800 leading-tight">Kaptan Yönetimi</h1>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="p-2.5 bg-indigo-600 rounded-xl text-white active:scale-95 border border-indigo-700 shadow-md shadow-indigo-100 flex items-center gap-1.5 font-bold text-xs"
          >
            <UserPlus size={16} />
            <span className="hidden sm:inline">Yeni Kaptan</span>
          </button>
          <button onClick={() => navigate(-1)} className="p-2.5 bg-slate-50 rounded-xl text-slate-600 active:scale-95 border border-slate-100">
            <ChevronLeft size={20} />
          </button>
        </div>
      </header>

      {/* ALERTS */}
      <div className="px-5 mt-4 space-y-2">
        {error && (
          <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 flex items-start gap-3">
            <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={20} />
            <p className="text-xs font-bold text-rose-700 leading-relaxed">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-start gap-3">
            <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={20} />
            <p className="text-xs font-bold text-emerald-700 leading-relaxed">{success}</p>
          </div>
        )}
      </div>

      {/* DRIVERS LIST */}
      <div className="px-5 mt-4 space-y-3">
        {loading ? (
          <div className="text-center py-10 font-bold text-slate-400">Kaptanlar yükleniyor...</div>
        ) : drivers.length === 0 ? (
          <div className="text-center py-10 font-bold text-slate-400 bg-white border border-slate-100 rounded-3xl">
            Sistemde kayıtlı kaptan bulunamadı.
          </div>
        ) : (
          drivers.map((driver) => (
            <motion.div
              key={driver.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-4.5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100">
                  <Users size={22} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-slate-800 truncate">{driver.full_name}</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-[10px] font-bold text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Phone size={10} /> {driver.phone || 'Telefon Yok'}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${driver.status === 'online' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                      {driver.status === 'online' ? 'Çevrimiçi' : 'Çevrimdışı'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDeleteDriver(driver.id, driver.full_name)}
                className="p-2.5 bg-slate-50 text-slate-400 hover:text-rose-600 border border-slate-100 rounded-xl transition-colors active:scale-95 shrink-0"
              >
                <Trash2 size={16} />
              </button>
            </motion.div>
          ))
        )}
      </div>

      {/* ADD DRIVER MODAL */}
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
              <h3 className="text-lg font-black text-slate-800 mb-4 uppercase tracking-tight">Yeni Kaptan Ekle</h3>
              <form onSubmit={handleAddDriver} className="space-y-4">
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kaptan Adı Soyadı</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Örn: Ahmet Yılmaz"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-4 py-3.5 outline-none font-bold focus:border-indigo-500 focus:bg-white transition-all text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-Posta Adresi</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="driver@ornek.com"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl pl-10 pr-4 py-3.5 outline-none font-bold focus:border-indigo-500 focus:bg-white transition-all text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefon Numarası</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0555 123 45 67"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl pl-10 pr-4 py-3.5 outline-none font-bold focus:border-indigo-500 focus:bg-white transition-all text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Giriş Şifresi</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl pl-10 pr-4 py-3.5 outline-none font-bold focus:border-indigo-500 focus:bg-white transition-all text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-slate-50 border border-slate-200 text-slate-500 font-black text-[11px] uppercase tracking-widest py-3.5 rounded-2xl active:scale-95 transition-transform"
                    disabled={isSubmitting}
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 border border-indigo-700 text-white font-black text-[11px] uppercase tracking-widest py-3.5 rounded-2xl shadow-lg shadow-indigo-100 active:scale-95 transition-transform flex items-center justify-center gap-1.5"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
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
