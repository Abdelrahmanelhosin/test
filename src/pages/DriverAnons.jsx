import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Radio, Volume2, X, AlertCircle, Headphones, Waves, Send } from 'lucide-react';

const DriverAnons = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleFinish = () => {
    setIsRecording(false);
    setIsSent(true);
    setTimeout(() => setIsSent(false), 3000);
  };

  return (
    <div className="flex flex-col min-h-full bg-[#f8fafc] relative overflow-hidden">
      
      {/* Header */}
      <header className="bg-white px-6 py-5 sticky top-0 z-30 border-b border-slate-100 shadow-sm flex justify-between items-center">
        <div>
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">KOMUTA MERKEZİ</p>
          <h1 className="text-xl font-black text-slate-800">Merkez İletişim</h1>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
           <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
           <span className="text-[10px] font-black text-emerald-700 uppercase">BAĞLI</span>
        </div>
      </header>

      <div className="flex-1 p-8 flex flex-col justify-between relative z-10">
        
        {/* Info Card */}
        <div className="bg-indigo-50 p-5 rounded-[2rem] border border-indigo-100 flex items-start gap-4">
           <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
              <Radio size={24} />
           </div>
           <div className="flex-1">
              <h3 className="text-xs font-black text-indigo-900 uppercase">MERKEZ HATTI AKTİF</h3>
              <p className="text-[10px] font-bold text-indigo-600/70 mt-1 leading-relaxed">
                Yol durumu, trafik veya acil durum raporlarını sesli olarak iletebilirsiniz.
              </p>
           </div>
        </div>

        {/* Visualizer / Recording Animation */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-8">
           <div className="relative">
              <AnimatePresence>
                 {isRecording && (
                    <>
                       <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 2.2, opacity: 0 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute inset-0 bg-indigo-500/20 rounded-full"
                       />
                       <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1.6, opacity: 0 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                        className="absolute inset-0 bg-indigo-500/20 rounded-full"
                       />
                    </>
                 )}
              </AnimatePresence>
              
              <div className={`w-44 h-44 rounded-full flex items-center justify-center relative z-10 transition-all duration-500 border-8 ${
                isRecording 
                ? 'bg-white border-indigo-500 shadow-[0_20px_50px_rgba(79,70,229,0.2)] scale-105' 
                : 'bg-white border-slate-50 shadow-inner'
              }`}>
                 {isRecording ? (
                   <div className="flex gap-1 items-end h-10">
                      {[1,2,3,4,5].map(i => (
                        <motion.div 
                          key={i}
                          animate={{ height: [10, 30, 10] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                          className="w-1.5 bg-indigo-500 rounded-full"
                        />
                      ))}
                   </div>
                 ) : (
                   <Mic size={48} className="text-slate-200" />
                 )}
              </div>
           </div>

           <div className="text-center">
              <h2 className={`text-xl font-black uppercase tracking-widest transition-colors ${isRecording ? 'text-indigo-600' : 'text-slate-300'}`}>
                {isRecording ? 'SES KAYDEDİLİYOR' : 'MERKEZE BAĞLAN'}
              </h2>
              {isRecording && (
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 animate-pulse">
                  Kayıt bittiğinde butonu bırakın
                </p>
              )}
           </div>
        </div>

        {/* Push to Talk Button */}
        <div className="pb-32 flex justify-center">
           <motion.button 
            onMouseDown={() => setIsRecording(true)}
            onMouseUp={handleFinish}
            onTouchStart={() => setIsRecording(true)}
            onTouchEnd={handleFinish}
            whileTap={{ scale: 0.9 }}
            className={`w-full max-w-[300px] py-6 rounded-[2.5rem] font-black uppercase tracking-[0.3em] shadow-2xl transition-all select-none flex items-center justify-center gap-3 ${
              isRecording 
                ? 'bg-rose-600 text-white shadow-rose-900/20' 
                : 'bg-[#114B36] text-white shadow-emerald-900/20'
            }`}
           >
              {isRecording ? <X size={20} /> : <Mic size={20} />}
              {isRecording ? 'BİTİR' : 'BAS KONUŞ'}
           </motion.button>
        </div>

      </div>

      {/* Success Feedback Overlay */}
      <AnimatePresence>
        {isSent && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="absolute bottom-40 left-6 right-6 z-50"
          >
             <div className="bg-emerald-600 text-white p-5 rounded-[2rem] shadow-2xl flex items-center gap-4 border border-white/20">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                   <Send size={24} />
                </div>
                <div>
                   <h4 className="text-sm font-black uppercase">MESAJ GÖNDERİLDİ</h4>
                   <p className="text-[10px] font-bold opacity-70">Merkez talebinizi inceleyecektir.</p>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DriverAnons;
