import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { AlertTriangle, Bus, Lock, Mail, Navigation, ArrowRight } from 'lucide-react';

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
      setError('E-Posta veya şifre hatalı.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex justify-center items-start md:pt-10 font-sans">
      <div className="w-full max-w-md bg-slate-900 h-screen md:h-[850px] relative shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] md:rounded-[3.5rem] flex flex-col overflow-hidden">
        
        {/* Animated Background Blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
           <motion.div 
             animate={{ 
               y: [0, -20, 0],
               x: [0, 10, 0],
               scale: [1, 1.05, 1]
             }}
             transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
             className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-600/30 rounded-full blur-[100px]" 
           />
           <motion.div 
             animate={{ 
               y: [0, 30, 0],
               x: [0, -20, 0],
               scale: [1, 1.1, 1]
             }}
             transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
             className="absolute top-1/2 -right-32 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px]" 
           />
           <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-slate-900 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col justify-center items-center h-full p-8">
          
          {/* Logo & Welcome Text */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full text-center mb-10"
          >
             <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)] mb-6 rotate-3">
                <Bus size={36} className="text-white -rotate-3" />
             </div>
             <h1 className="text-3xl font-black text-white tracking-tight">Kaptan Modu</h1>
             <p className="text-emerald-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">Sisteme Hoş Geldiniz</p>
          </motion.div>

          {/* Login Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full bg-white/10 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-2xl"
          >
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-500/10 text-red-400 border border-red-500/20 p-4 rounded-2xl text-sm font-bold mb-6 flex items-center gap-3"
              >
                <AlertTriangle size={18} className="shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-Posta Adresiniz</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={18} className="text-slate-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-2xl pl-11 pr-4 py-3.5 outline-none focus:border-emerald-500 focus:bg-slate-900 transition-all font-medium placeholder-slate-600"
                    placeholder="kaptan@ornek.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Şifreniz</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={18} className="text-slate-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-2xl pl-11 pr-4 py-3.5 outline-none focus:border-emerald-500 focus:bg-slate-900 transition-all font-medium placeholder-slate-600"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl py-4 font-black text-sm uppercase tracking-widest shadow-[0_10px_25px_rgba(16,185,129,0.3)] hover:shadow-[0_15px_30px_rgba(16,185,129,0.4)] active:scale-[0.98] transition-all disabled:opacity-70 disabled:active:scale-100 flex justify-center items-center gap-2 group"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    SİSTEME GİRİŞ YAP
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </motion.div>

        </div>

        <div className="absolute bottom-8 w-full flex justify-center items-center gap-2 text-slate-500 opacity-50">
           <Navigation size={12} />
           <span className="text-[9px] font-black uppercase tracking-[0.2em]">Güvenli Bağlantı SSS-256</span>
        </div>
      </div>
    </div>
  );
}
