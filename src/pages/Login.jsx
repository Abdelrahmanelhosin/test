import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { AlertTriangle, Bus, Lock, Mail, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';
import StopRecorder from './StopRecorder';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAdminStops, setShowAdminStops] = useState(false);

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

  if (showAdminStops) {
    return (
      <div className="relative">
        <StopRecorder />
        <button 
          onClick={() => setShowAdminStops(false)}
          className="fixed top-10 right-10 z-[100] bg-white/20 backdrop-blur-md p-3 rounded-full text-slate-800 border border-white/40 shadow-xl"
        >
          <ArrowRight className="rotate-180" />
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex justify-center items-start md:pt-10 font-sans relative">
      <div className="w-full max-w-md bg-white/20 h-screen md:h-[850px] relative shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] md:rounded-[3.5rem] border border-white/40 flex flex-col overflow-hidden">
        
        {/* Full Screen Animated 3D Image */}
        <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
           <motion.img 
             initial={{ scale: 1.05, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             transition={{ duration: 1.5, ease: "easeOut" }}
             src="/login_3d_bg.png" 
             alt="City Illustration" 
             className="w-full h-full object-cover object-center"
           />
           {/* Glassmorphism Overlay to make text readable */}
           <div className="absolute inset-0 bg-white/60 backdrop-blur-[8px]" />
           <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/50 to-transparent" />
        </div>

        <div className="relative z-20 flex flex-col items-center pt-20 px-8 h-full">
          
          {/* Logo & Welcome Text */}
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="w-full text-center mb-10"
          >
             <div className="w-24 h-24 mx-auto bg-[#114B36] rounded-[2rem] flex items-center justify-center shadow-[0_20px_40px_rgba(17,75,54,0.3)] mb-6 border-4 border-white rotate-3">
                <Bus size={42} className="text-white -rotate-3" />
             </div>
             <h1 className="text-4xl font-black text-slate-800 tracking-tight drop-shadow-sm">Kaptan Modu</h1>
             <p className="text-emerald-700 font-black uppercase tracking-[0.2em] text-[10px] mt-2 bg-emerald-50/80 backdrop-blur-md border border-emerald-100/50 py-1.5 px-4 rounded-full inline-block shadow-sm">Sisteme Hoş Geldiniz</p>
          </motion.div>

          {/* Login Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, type: "spring", stiffness: 100 }}
            className="w-full bg-white/80 backdrop-blur-2xl border border-white/80 rounded-[2.5rem] p-7 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)]"
          >
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-2xl text-[11px] font-black uppercase tracking-widest mb-6 flex items-center gap-3 shadow-inner"
              >
                <AlertTriangle size={20} className="shrink-0 text-red-500" />
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">E-Posta Adresi</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={18} className="text-slate-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl pl-11 pr-4 py-4 outline-none focus:border-emerald-500 focus:bg-white focus:shadow-[0_0_0_4px_rgba(16,185,129,0.1)] transition-all font-bold placeholder-slate-400"
                    placeholder="kaptan@ornek.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Şifre</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={18} className="text-slate-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl pl-11 pr-4 py-4 outline-none focus:border-emerald-500 focus:bg-white focus:shadow-[0_0_0_4px_rgba(16,185,129,0.1)] transition-all font-bold placeholder-slate-400"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-[#114B36] text-white rounded-2xl py-4 font-black text-sm uppercase tracking-widest shadow-[0_15px_30px_rgba(17,75,54,0.3)] hover:shadow-[0_20px_40px_rgba(17,75,54,0.4)] active:scale-[0.98] transition-all disabled:opacity-70 disabled:active:scale-100 flex justify-center items-center gap-2 group relative overflow-hidden"
              >
                {/* Button shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                
                {loading ? (
                  <span className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    SİSTEME GİRİŞ YAP
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowAdminStops(true)}
                className="w-full mt-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <MapPin size={14} /> Durak Ayarları (Admin)
              </button>
            </form>
          </motion.div>

          <div className="mt-auto pb-8 flex items-center gap-2 text-slate-400 opacity-80">
             <ShieldCheck size={14} className="text-emerald-600" />
             <span className="text-[9px] font-black uppercase tracking-widest">End-to-End Güvenlik</span>
          </div>

        </div>
      </div>
    </div>
  );
}
