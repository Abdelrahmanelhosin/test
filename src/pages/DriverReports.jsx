import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ShieldAlert, Truck, Wrench, Zap, Info, ChevronRight, CheckCircle2, MapPin, Camera, X, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ISSUES = [
  { id: 1, label: 'Motor Arızası', icon: <Wrench />, color: 'bg-rose-100 text-rose-600' },
  { id: 2, label: 'Lastik Patlaması', icon: <Zap />, color: 'bg-amber-100 text-amber-600' },
  { id: 3, label: 'Kaza / Çarpışma', icon: <ShieldAlert />, color: 'bg-red-100 text-red-600' },
  { id: 4, label: 'Elektrik Arızası', icon: <Zap />, color: 'bg-blue-100 text-blue-600' },
  { id: 5, label: 'Yolcu Acil Durum', icon: <AlertCircle />, color: 'bg-purple-100 text-purple-600' },
  { id: 6, label: 'Diğer', icon: <Info />, color: 'bg-slate-100 text-slate-600' },
];

const DriverReports = () => {
  const [step, setStep] = useState(1);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [customAddress, setCustomAddress] = useState('');
  const [gpsCoords, setGpsCoords] = useState(null);
  const [isSent, setIsSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleProceedToStep2 = () => {
    if (!selectedIssue) return;
    setStep(2);

    // Fetch GPS coordinates in background
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        console.error('GPS fetch error:', error);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert("Resim boyutu çok büyük (Maksimum 3MB).");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setPhotoBase64(reader.result);
    };
  };

  const handleSend = async () => {
    if (!selectedIssue) return;
    setLoading(true);

    try {
      // 1. Get logged-in user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Kullanıcı oturumu bulunamadı.');
        setLoading(false);
        return;
      }

      // 2. Fetch active shift to find vehicle_id
      const { data: activeShift } = await supabase
        .from('shift_logs')
        .select('vehicle_id')
        .eq('driver_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      const vehicleId = activeShift?.vehicle_id || null;

      // 3. Find selected issue label
      const issueObj = ISSUES.find(i => i.id === selectedIssue);
      const description = issueObj ? issueObj.label : 'Diğer Arıza';

      // 4. Insert report
      const { error } = await supabase.from('reports').insert({
        driver_id: user.id,
        vehicle_id: vehicleId,
        issue_description: description,
        latitude: gpsCoords?.latitude || null,
        longitude: gpsCoords?.longitude || null,
        image_base64: photoBase64,
        custom_address: customAddress.trim() || null,
        status: 'pending'
      });

      if (error) throw error;

      setIsSent(true);
      setTimeout(() => {
        setIsSent(false);
        setStep(1);
        setSelectedIssue(null);
        setPhotoBase64(null);
        setCustomAddress('');
        setGpsCoords(null);
      }, 4000);

    } catch (err) {
      console.error('Arıza bildirimi gönderilirken hata oluştu:', err);
      alert('Bildirim gönderilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const activeIssueObj = ISSUES.find(i => i.id === selectedIssue);

  return (
    <div className="flex flex-col min-h-full pb-32 relative">
      
      {/* Header */}
      <header className="bg-white px-6 py-5 sticky top-0 z-30 border-b border-slate-100 shadow-sm flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          {step === 2 && (
            <button 
              onClick={() => setStep(1)} 
              className="p-1.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-500"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">
              {step === 1 ? 'BİLDİRİM PANELİ' : 'BİLDİRİM DETAYI'}
            </p>
            <h1 className="text-xl font-black text-slate-800">
              {step === 1 ? 'Arıza Bildir' : 'Detay Ekle'}
            </h1>
          </div>
        </div>
        <AlertCircle size={24} className="text-rose-500" />
      </header>

      {step === 1 ? (
        // STEP 1: CATEGORY SELECTION
        <div className="p-6 space-y-6">
          <div className="bg-rose-50 p-4 rounded-3xl border border-rose-100 flex gap-3">
             <ShieldAlert className="text-rose-500 shrink-0" size={20} />
             <p className="text-xs font-bold text-rose-700 leading-relaxed">
               Lütfen arıza tipini seçin. Bir sonraki adımda fotoğraf ve detay ekleyebilirsiniz.
             </p>
          </div>

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

          <div className="pt-4">
             <button 
              disabled={!selectedIssue}
              onClick={handleProceedToStep2}
              className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
                selectedIssue
                  ? 'bg-rose-600 text-white shadow-rose-900/20' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
             >
                DEVAM ET
                <ChevronRight size={20} />
             </button>
          </div>
        </div>
      ) : (
        // STEP 2: MEDIA & DETAILS UPLOAD
        <div className="p-6 space-y-6">
          
          {/* Selected Category Header */}
          {activeIssueObj && (
            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${activeIssueObj.color} shrink-0`}>
                {activeIssueObj.icon}
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Seçilen Arıza</p>
                <h3 className="text-sm font-black text-slate-800 uppercase">{activeIssueObj.label}</h3>
              </div>
            </div>
          )}

          {/* Photo Upload Area */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Arıza Görseli Ekle</label>
            {photoBase64 ? (
              <div className="relative w-full h-48 rounded-[2rem] overflow-hidden border border-slate-200 shadow-inner group">
                <img src={photoBase64} alt="Arıza Önizleme" className="w-full h-full object-cover" />
                <button 
                  onClick={() => setPhotoBase64(null)}
                  className="absolute top-4 right-4 w-10 h-10 bg-slate-900/80 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <label className="w-full h-44 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100/50 transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm">
                  <Camera size={22} />
                </div>
                <div className="text-center">
                  <p className="text-xs font-black text-slate-600">Fotoğraf Çek veya Yükle</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Maksimum 3MB</p>
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handlePhotoChange} 
                />
              </label>
            )}
          </div>

          {/* Custom Address Input */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Konum Tarifi / Detaylar</label>
            <textarea
              value={customAddress}
              onChange={(e) => setCustomAddress(e.target.value)}
              placeholder="Örn: Tuzla durağının 50 metre gerisinde sağ şeritte..."
              className="w-full h-24 bg-slate-50 border border-slate-200 rounded-[1.5rem] p-4 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-rose-500 transition-all resize-none"
            />
          </div>

          {/* Location / GPS Status */}
          <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                <MapPin size={20} className={gpsCoords ? "text-emerald-500" : "text-amber-500"} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">GPS Durumu</p>
                <p className="text-xs font-bold text-slate-700">
                  {gpsCoords 
                    ? `Konum Alındı (${gpsCoords.latitude.toFixed(4)}, ${gpsCoords.longitude.toFixed(4)})` 
                    : 'Konum aranıyor...'}
                </p>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              disabled={loading}
              onClick={handleSend}
              className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
                loading 
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                  : 'bg-rose-600 text-white shadow-rose-900/20'
              }`}
            >
              {loading ? 'BİLDİRİLİYOR...' : 'ARIZAYI BİLDİR'}
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Success Modal - absolute position inside parent container */}
      <AnimatePresence>
        {isSent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-[#114B36] flex flex-col items-center justify-center p-6 text-white text-center"
          >
             <motion.div 
               initial={{ scale: 0.9, y: 10 }}
               animate={{ scale: 1, y: 0 }}
               className="flex flex-col items-center gap-4"
             >
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                   <Truck size={40} className="text-emerald-300 animate-bounce" />
                </div>
                <div>
                   <h2 className="text-xl font-black uppercase tracking-wide">Bildirim Alındı</h2>
                   <p className="text-xs font-bold opacity-75 mt-2 uppercase tracking-widest leading-relaxed px-4">
                     Arıza raporu ve konum detayları merkeze iletildi. Güvenliğinizi sağlayın.
                   </p>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DriverReports;
