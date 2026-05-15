import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { AlertTriangle, Map } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex justify-center items-start md:pt-10 font-sans">
      <div className="w-full max-w-md bg-[#114B36] h-screen md:h-[850px] relative shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] md:rounded-[3.5rem] border border-slate-200 flex flex-col justify-center items-center p-6 overflow-hidden">
        {/* Background Map Element */}
        <div className="absolute inset-0 opacity-5 flex items-center justify-center pointer-events-none">
          <Map size={400} />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 relative z-10"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto bg-[#114B36] rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-900/30 mb-4 transform -translate-y-12 border-4 border-white">
              <span className="text-white text-3xl font-black">M</span>
            </div>
            <h1 className="text-2xl font-black text-slate-800 -mt-8">Kaptan Girişi</h1>
            <p className="text-xs text-slate-400 font-bold tracking-widest mt-1 uppercase">Sisteme Hoşgeldiniz</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium mb-6 flex items-start gap-2 border border-red-100">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">E-Posta</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 outline-none focus:border-[#114B36] focus:ring-2 focus:ring-emerald-900/10 transition-all font-medium"
                placeholder="kaptan@ornek.com"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Şifre</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 outline-none focus:border-[#114B36] focus:ring-2 focus:ring-emerald-900/10 transition-all font-medium"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#114B36] text-white rounded-xl py-3.5 font-bold shadow-lg shadow-emerald-900/20 hover:bg-[#0c3626] active:scale-[0.98] transition-all disabled:opacity-70 disabled:active:scale-100 flex justify-center items-center"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                'Giriş Yap'
              )}
            </button>
          </form>

        </motion.div>
        
        <div className="text-white/40 text-[10px] font-black uppercase tracking-widest absolute bottom-6 text-center w-full">
          Güvenli Bağlantı Sağlanıyor
        </div>
      </div>
    </div>
  );
}
