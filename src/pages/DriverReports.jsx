import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ShieldAlert, Truck, Wrench, Zap, Info, ChevronRight, CheckCircle2, MapPin } from 'lucide-react';

const ISSUES = [
  { id: 1, label: 'Motor Arızası', icon: <Wrench />, color: 'bg-rose-100 text-rose-600' },
  { id: 2, label: 'Lastik Patlaması', icon: <Zap />, color: 'bg-amber-100 text-amber-600' },
  { id: 3, label: 'Kaza / Çarpışma', icon: <ShieldAlert />, color: 'bg-red-100 text-red-600' },
  { id: 4, label: 'Elektrik Arızası', icon: <Zap />, color: 'bg-blue-100 text-blue-600' },
  { id: 5, label: 'Yolcu Acil Durum', icon: <AlertCircle />, color: 'bg-purple-100 text-purple-600' },
  { id: 6, label: 'Diğer', icon: <Info />, color: 'bg-slate-100 text-slate-600' },
];

const DriverReports = () => {
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isSent, setIsSent] = useState(false);

  const handleSend = () => {
    if (!selectedIssue) return;
    setIsSent(true);
    setTimeout(() => setIsSent(false), 3000);
  };

  return (
    <div className="flex flex-col min-h-full pb-32">
      {/* Header */}
      <header className="bg-white px-6 py-5 sticky top-0 z-30 border-b border-slate-100 shadow-sm flex justify-between items-center">
        <div>
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">BİLDİRİM PANELİ</p>
          <h1 className="text-xl font-black text-slate-800">Arıza Bildir</h1>
        </div>
        <AlertCircle size={24} className="text-rose-500" />
      </header>

      <div className="p-6 space-y-6">
        {/* Helper Text */}
        <div className="bg-rose-50 p-4 rounded-3xl border border-rose-100 flex gap-3">
           <ShieldAlert className="text-rose-500 shrink-0" size={20} />
           <p className="text-xs font-bold text-rose-700 leading-relaxed">
             Lütfen arıza tipini seçin. Konumunuz otomatik olarak merkeze iletilecektir.
           </p>
        </div>

        {/* Issue Grid */}
        <div className="grid grid-cols-2 gap-4">
          {ISSUES.map((issue) => (
            <motion.button
              key={issue.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedIssue(issue.id)}
              className={`p-5 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-3 relative ${
                selectedIssue === issue.id 
                  ? 'border-rose-500 bg-white shadow-xl shadow-rose-500/10' 
                  : 'border-transparent bg-white shadow-sm'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${issue.color}`}>
                 {issue.icon}
              </div>
              <span className="text-[10px] font-black uppercase text-slate-700 tracking-tight text-center">{issue.label}</span>
              
              {selectedIssue === issue.id && (
                <div className="absolute top-3 right-3">
                   <CheckCircle2 size={16} className="text-rose-500" />
                </div>
              )}
            </motion.button>
          ))}
        </div>

        {/* Location Preview */}
        <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                 <MapPin size={20} className="text-indigo-500" />
              </div>
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mevcut Konum</p>
                 <p className="text-xs font-bold text-slate-700">Kartal, İstanbul (34.12, 41.01)</p>
              </div>
           </div>
        </div>

        {/* Action Button */}
        <div className="pt-4">
           <button 
            disabled={!selectedIssue}
            onClick={handleSend}
            className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
              selectedIssue 
                ? 'bg-rose-600 text-white shadow-rose-900/20' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
           >
              {isSent ? 'GÖNDERİLDİ!' : 'ARIZA BİLDİR'}
              <ChevronRight size={20} />
           </button>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {isSent && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-10 pointer-events-none"
          >
             <div className="bg-[#114B36] text-white p-8 rounded-[3rem] shadow-2xl flex flex-col items-center text-center gap-4 border border-white/20">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                   <Truck size={40} className="text-emerald-300 animate-pulse" />
                </div>
                <div>
                   <h2 className="text-xl font-black uppercase">Bildirim Alındı</h2>
                   <p className="text-xs font-bold opacity-60 mt-1 uppercase tracking-widest leading-relaxed">
                     Ekipler bilgilendirildi. Lütfen aracın güvenliğini sağlayın.
                   </p>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DriverReports;
