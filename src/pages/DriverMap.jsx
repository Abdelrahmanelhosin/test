import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { Bus, Navigation, MapPin, Zap, X, MessageCircle, Heart, Hand, Send, Clock, AlertCircle } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

// Custom Marker Component
const BusMarker = ({ type, route, name }) => {
  const iconHtml = renderToStaticMarkup(
    <div className="relative group cursor-pointer pointer-events-none">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl border-4 transition-all ${
        type === 'current' ? 'bg-white border-indigo-500 text-indigo-600' : 'bg-white border-emerald-500 text-emerald-600'
      }`}>
        <Bus size={28} strokeWidth={2.5} />
      </div>
      <div className={`absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 rounded-xl text-[9px] font-black uppercase whitespace-nowrap shadow-xl border flex items-center gap-2 ${
        type === 'current' ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-slate-800 text-emerald-400 border-slate-700'
      }`}>
        <div className={`w-1.5 h-1.5 rounded-full ${type === 'current' ? 'bg-white animate-pulse' : 'bg-emerald-500'}`} />
        {type === 'current' ? 'SİZ' : `${route} - ${name}`}
      </div>
    </div>
  );

  return L.divIcon({
    html: iconHtml,
    className: 'custom-bus-icon',
    iconSize: [56, 56],
    iconAnchor: [28, 28],
  });
};

const SocialBtn = ({ icon, label, color, onClick }) => (
  <button onClick={onClick} className={`${color} p-5 rounded-[2rem] flex flex-col items-center gap-2 border border-white shadow-sm active:scale-90 transition-all group`}>
     <div className="group-hover:scale-110 transition-transform">{icon}</div>
     <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const DriverMap = () => {
  const [buses, setBuses] = useState([
    { id: 1, route: '500T-11', name: 'Ahmet K.', position: [40.895, 29.230], type: 'preceding', depTime: '08:30', dur: '27 dk önce çıktı', status: 'Hızlı', plaka: '34 AAA 123', incident: 'Yoğun Trafik: Tuzla girişi kaza var', hasArıza: false, signal: '92%', battery: '85%' },
    { id: 2, route: '500T-12', name: 'Mustafa K.', position: [40.890, 29.220], type: 'current', depTime: '08:45', dur: '12 dk önce çıktı', status: 'Normal', plaka: '34 BBB 456', incident: null, hasArıza: false, signal: '98%', battery: '90%' },
    { id: 3, route: '11ÜS-04', name: 'Mehmet S.', position: [40.898, 29.215], type: 'colleague', depTime: '09:00', dur: '5 dk önce çıktı', status: 'Yavaş', plaka: '34 CCC 789', incident: 'Yol Çalışması: Sağ şerit kapalı', hasArıza: true, arızaType: 'Motor Isınması', signal: '75%', battery: '42%' },
    { id: 4, route: '34G-22', name: 'Selim Y.', position: [40.885, 29.235], type: 'colleague', depTime: '08:45', dur: '12 dk önce çıktı', status: 'Normal', plaka: '34 DDD 012', incident: 'Hava Yağışlı: Görüş mesafesi düşük', hasArıza: false, signal: '88%', battery: '76%' },
  ]);

  const [selectedColleague, setSelectedColleague] = useState(null);
  const [isMessaging, setIsMessaging] = useState(false);
  const [message, setMessage] = useState('');
  const [interactionActive, setInteractionActive] = useState(null);

  // Simulate movement
  useEffect(() => {
    const interval = setInterval(() => {
      setBuses(prev => prev.map(bus => ({
        ...bus,
        position: [
          bus.position[0] + (Math.random() - 0.4) * 0.0004,
          bus.position[1] + (Math.random() - 0.4) * 0.0004,
        ]
      })));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const sendInteraction = (type) => {
    setInteractionActive(type);
    setTimeout(() => {
      setInteractionActive(null);
      if (!isMessaging) setSelectedColleague(null);
    }, 2000);
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    sendInteraction('msj');
    setMessage('');
    setIsMessaging(false);
    setSelectedColleague(null);
  };

  return (
    <div className="h-full w-full relative bg-slate-100 overflow-hidden font-sans">
      
      {/* REAL MAP */}
      <MapContainer 
        center={[40.892, 29.225]} 
        zoom={14} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        className="z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <Polyline positions={[buses[0].position, buses[1].position]} color="#114B36" weight={4} dashArray="10, 10" opacity={0.3} />
        {buses.map(bus => (
          <Marker 
            key={bus.id} 
            position={bus.position} 
            icon={BusMarker({ type: bus.type, route: bus.route, name: bus.name })} 
            eventHandlers={{ 
              click: () => {
                if(bus.type !== 'current') {
                  setSelectedColleague(bus);
                  setIsMessaging(false);
                }
              } 
            }} 
          />
        ))}
      </MapContainer>

      {/* OVERLAYS */}
      <div className="absolute top-6 left-6 right-6 z-20">
         <div className="bg-white/95 backdrop-blur-xl p-5 rounded-[2.5rem] border border-white shadow-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700 border border-emerald-100">
                  <Zap size={22} className="animate-pulse" />
               </div>
               <div>
                  <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Mesafe Takip</h2>
                  <p className="text-xl font-black text-slate-800 tracking-tighter">08:45 <span className="text-xs text-emerald-600 font-bold uppercase">dk</span></p>
               </div>
            </div>
         </div>
      </div>

      {/* SOCIAL INTERACTION CARD */}
      <AnimatePresence>
        {selectedColleague && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-32 left-6 right-6 z-40"
          >
             <div className="bg-white p-6 pt-10 rounded-[3rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] border border-slate-100 relative">
                <button 
                  onClick={() => { setSelectedColleague(null); setIsMessaging(false); }} 
                  className="absolute top-4 right-4 p-3 text-slate-300 hover:text-slate-600 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors z-[50]"
                >
                   <X size={20} />
                </button>
                
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-[1.8rem] flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-emerald-500/20">
                      {selectedColleague?.name?.[0] || 'K'}
                   </div>
                   <div>
                      <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{selectedColleague?.name || 'Kaptan'}</h3>
                      <div className="flex gap-2 items-center mt-1">
                         <p className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg inline-block uppercase tracking-widest">
                           {selectedColleague?.route || '500T'} Kaptanı
                         </p>
                         <p className="text-[9px] font-bold text-slate-400 border border-slate-200 px-2 py-0.5 rounded-lg uppercase">
                           {selectedColleague?.plaka || '34 --- 00'}
                         </p>
                      </div>
                   </div>
                   <div className="ml-auto">
                      <button className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-colors">
                         <Navigation size={18} />
                      </button>
                   </div>
                </div>

                {!isMessaging ? (
                  <>
                    {/* INCIDENT ALERT BANNER (Only shows if there's an incident or malfunction) */}
                    {(selectedColleague?.incident || selectedColleague?.hasArıza) && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-4 rounded-[1.5rem] mb-4 border flex items-center gap-4 ${
                          selectedColleague?.hasArıza 
                            ? 'bg-rose-50 border-rose-100 text-rose-700' 
                            : 'bg-amber-50 border-amber-100 text-amber-700'
                        }`}
                      >
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                           selectedColleague?.hasArıza ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'
                         }`}>
                            <AlertCircle size={20} />
                         </div>
                         <div>
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-60">
                               {selectedColleague?.hasArıza ? 'KRİTİK ARIZA BİLDİRİMİ' : 'YOL DURUM RAPORU'}
                            </p>
                            <p className="text-xs font-black leading-tight mt-0.5">
                               {selectedColleague?.hasArıza ? selectedColleague?.arızaType : selectedColleague?.incident}
                            </p>
                         </div>
                      </motion.div>
                    )}

                    {/* PRIMARY INSIGHTS */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                       <div className="bg-slate-50 p-4 rounded-[1.5rem] border border-slate-100">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock size={12} className="text-indigo-500" />
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">DURAK ÇIKIŞ</p>
                          </div>
                          <p className="text-lg font-black text-slate-800">{selectedColleague?.depTime || '--:--'}</p>
                          <p className="text-[10px] font-bold text-slate-400">{selectedColleague?.dur || 'Veri yok'}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-[1.5rem] border border-slate-100">
                          <div className="flex items-center gap-2 mb-1">
                            <Zap size={12} className="text-emerald-500" />
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">TEMPO</p>
                          </div>
                          <p className="text-lg font-black text-slate-800">{selectedColleague?.status || 'Normal'}</p>
                          <div className="flex gap-1 mt-1">
                            {[1,2,3].map(i => (
                              <div key={i} className={`h-1 flex-1 rounded-full ${i <= (selectedColleague?.status === 'Hızlı' ? 3 : 2) ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                            ))}
                          </div>
                      </div>
                    </div>

                    {/* OPERATIONAL STATUS GRID */}
                    <div className="bg-slate-900 text-white/90 p-5 rounded-[2rem] mb-6 grid grid-cols-3 gap-4 border border-white/10 shadow-xl shadow-slate-900/20">
                       <div className="text-center">
                          <p className="text-[8px] font-black opacity-40 uppercase tracking-widest mb-1">SİNYAL</p>
                          <p className="text-xs font-black text-emerald-400 flex items-center justify-center gap-1">
                             {selectedColleague?.signal || '100%'}
                          </p>
                       </div>
                       <div className="text-center border-x border-white/10">
                          <p className="text-[8px] font-black opacity-40 uppercase tracking-widest mb-1">BATARYA</p>
                          <p className="text-xs font-black text-white">{selectedColleague?.battery || '90%'}</p>
                       </div>
                       <div className="text-center">
                          <p className="text-[8px] font-black opacity-40 uppercase tracking-widest mb-1">DURUM</p>
                          <p className={`text-[10px] font-black ${selectedColleague?.hasArıza ? 'text-rose-400' : 'text-emerald-400'}`}>
                             {selectedColleague?.hasArıza ? 'PASİF' : 'AKTİF'}
                          </p>
                       </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <SocialBtn icon={<Hand size={20} />} label="SELAM" color="bg-indigo-50 text-indigo-600" onClick={() => sendInteraction('selam')} />
                      <SocialBtn icon={<Heart size={20} />} label="KALP" color="bg-rose-50 text-rose-600" onClick={() => sendInteraction('kalp')} />
                      <SocialBtn icon={<MessageCircle size={20} />} label="MESAJ" color="bg-[#114B36] text-white" onClick={() => setIsMessaging(true)} />
                    </div>
                  </>
                ) : (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                     <textarea 
                      autoFocus
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Mesajınızı yazın..."
                      className="w-full bg-slate-50 rounded-2xl p-4 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none h-20 border-none resize-none"
                     />
                     <div className="flex gap-2">
                        <button onClick={() => setIsMessaging(false)} className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest">İPTAL</button>
                        <button onClick={handleSendMessage} className="flex-[2] py-4 rounded-2xl bg-[#114B36] text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2">
                           GÖNDER <Send size={14} />
                        </button>
                     </div>
                  </motion.div>
                )}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FEEDBACK ANIMATION */}
      <AnimatePresence>
        {interactionActive && (
          <motion.div initial={{ scale: 0.5, opacity: 0, y: 0 }} animate={{ scale: 1.5, opacity: 1, y: -200 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none">
             <div className="bg-white/20 backdrop-blur-3xl p-10 rounded-full border border-white/30 shadow-2xl">
                {interactionActive === 'selam' && <Hand size={80} className="text-indigo-400" />}
                {interactionActive === 'kalp' && <Heart size={80} className="text-rose-400 fill-rose-400" />}
                {interactionActive === 'msj' && <Send size={80} className="text-emerald-400" />}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{__html: `
        .leaflet-container { background: #f1f5f9 !important; }
        .custom-bus-icon { background: none !important; border: none !important; }
      `}} />
    </div>
  );
};

export default DriverMap;
