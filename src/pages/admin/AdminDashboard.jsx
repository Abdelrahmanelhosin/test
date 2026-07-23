import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Bus, Users, AlertTriangle, Route, Bell, Settings, ArrowRight, ShieldAlert, Sparkles, Navigation, Activity, X, Volume2, Phone, PhoneOff, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeCaptains: 0,
    activeVehicles: 0,
    pendingIssues: 0,
    totalStops: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentReports, setRecentReports] = useState([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const [activeRadioSpeaker, setActiveRadioSpeaker] = useState(null);
  const [activeCall, setActiveCall] = useState(null);

  const playWalkieTalkieBeep = (type) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (type === 'start') {
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        osc.start();
        osc.frequency.setValueAtTime(1000, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.stop(ctx.currentTime + 0.2);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch (err) {
      console.error('Audio beep error:', err);
    }
  };

  const playReceivedAudio = (base64) => {
    try {
      playWalkieTalkieBeep('start');
      setTimeout(() => {
        const audio = new Audio(base64);
        audio.onended = () => {
          playWalkieTalkieBeep('end');
        };
        audio.play().catch(err => console.error("Audio play failed:", err));
      }, 250);
    } catch (err) {
      console.error('Error playing received audio:', err);
    }
  };

  useEffect(() => {
    const unlockAudio = () => {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      document.removeEventListener('click', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);
    return () => document.removeEventListener('click', unlockAudio);
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);

    const channel = supabase
      .channel('admin-dashboard-reports')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reports' },
        async (payload) => {
          const { data: newReport } = await supabase
            .from('reports')
            .select('*, profiles(full_name), vehicles(plate_number)')
            .eq('id', payload.new.id)
            .single();

          if (newReport) {
            setActiveAlert(newReport);
            fetchDashboardData();
            setTimeout(() => {
              setActiveAlert(null);
            }, 10000);
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const voiceChannel = supabase
      .channel('voice-anons-channel')
      .on('broadcast', { event: 'speaking-status' }, (payload) => {
        const { driverName, isSpeaking } = payload.payload;
        if (isSpeaking) {
          setActiveRadioSpeaker(driverName);
        } else {
          setActiveRadioSpeaker(null);
        }
      })
      .on('broadcast', { event: 'calling-status' }, (payload) => {
        const { driverName, vehiclePlate, isCalling } = payload.payload;
        if (isCalling) {
          setActiveCall({ driverName, vehiclePlate });
        } else {
          setActiveCall(null);
        }
      })
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'voice_anons' },
        async (payload) => {
          playReceivedAudio(payload.new.audio_base64);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(voiceChannel);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Stats
      const { data: profileData } = await supabase.from('profiles').select('id').neq('status', 'offline');
      const { data: vehicleData } = await supabase.from('vehicles').select('id').eq('status', 'active');
      const { data: reportData } = await supabase.from('reports').select('id').eq('status', 'pending');
      const { data: stopData } = await supabase.from('stops').select('id');

      setStats({
        activeCaptains: profileData?.length || 0,
        activeVehicles: vehicleData?.length || 0,
        pendingIssues: reportData?.length || 0,
        totalStops: stopData?.length || 0
      });

      // 2. Fetch Recent Reports
      const { data: reports } = await supabase
        .from('reports')
        .select('*, profiles(full_name), vehicles(plate_number)')
        .order('created_at', { ascending: false })
        .limit(2);
      if (reports) setRecentReports(reports);

      // 3. Fetch Recent Announcements
      const { data: announcements } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(2);
      if (announcements) setRecentAnnouncements(announcements);

    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { label: 'Filo Yönetimi', desc: 'Araç ekle & durum değiştir', icon: <Bus size={22} />, path: '/admin/vehicles', color: 'bg-blue-500/10 text-blue-600 border-blue-100' },
    { label: 'Sefer Planlama', desc: 'Sürücü & hat atama', icon: <Route size={22} />, path: '/admin/schedules', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-100' },
    { label: 'Kaptan Yönetimi', desc: 'Yeni kaptan ekle & hesap yönetimi', icon: <Users size={22} />, path: '/admin/drivers', color: 'bg-teal-500/10 text-teal-600 border-teal-100' },
    { label: 'Çalışma Durumları', desc: 'Görevdeki sürücüler & canlı turları', icon: <Activity size={22} />, path: '/admin/tracking', color: 'bg-rose-500/10 text-rose-600 border-rose-100' },
    { label: 'Vardiya Kayıtları', desc: 'Yakıt, Km & çalışma süreleri', icon: <Settings size={22} />, path: '/admin/shifts', color: 'bg-purple-500/10 text-purple-600 border-purple-100' },
    { label: 'Arıza Kayıtları', desc: 'Saha arıza & bakım kontrolü', icon: <AlertTriangle size={22} />, path: '/admin/reports', color: 'bg-orange-500/10 text-orange-600 border-orange-100', badge: stats.pendingIssues > 0 ? stats.pendingIssues : null },
    { label: 'Durak Konumları', desc: 'GPS & durak sırası yönetimi', icon: <Navigation size={22} />, path: '/admin/stops', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-100' },
    { label: 'Duyurular', desc: 'Kaptanlara genel duyuru yayınla', icon: <Bell size={22} />, path: '/admin/announcements', color: 'bg-amber-500/10 text-amber-600 border-amber-100' },
    { label: 'Kaptan Sohbetleri', desc: 'Kaptanlarla canlı yazışma', icon: <MessageSquare size={22} />, path: '/admin/chat', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-100' },
  ];

  return (
    <div className="flex flex-col bg-[#fdfdfd] min-h-full font-sans p-5 space-y-5 pb-36 overflow-y-auto">
      {/* Realtime Emergency Alert Toast */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-6 right-6 z-[9999] bg-rose-600 border border-rose-500 text-white p-5 rounded-[2rem] shadow-2xl shadow-rose-900/30 flex items-center justify-between gap-4 overflow-hidden"
          >
            <div className="absolute inset-0 bg-rose-700/30 animate-pulse pointer-events-none" />
            
            <div className="flex items-center gap-4 relative z-10 min-w-0 flex-1">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center animate-bounce shrink-0 overflow-hidden">
                {activeAlert.image_base64 ? (
                  <img src={activeAlert.image_base64} className="w-full h-full object-cover" alt="Arıza" />
                ) : (
                  <ShieldAlert size={26} className="text-white" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-black text-rose-200 uppercase tracking-widest leading-none mb-1">
                  ACİL DURUM / ARIZA BİLDİRİMİ
                </p>
                <h4 className="text-sm font-black uppercase truncate">
                  {activeAlert.profiles?.full_name || 'Kaptan'} - {activeAlert.issue_description}
                </h4>
                <p className="text-[10px] text-rose-100 font-bold mt-0.5 truncate">
                  Araç: {activeAlert.vehicles?.plate_number || 'Bilinmiyor'} 
                  {activeAlert.custom_address ? ` • Tarif: ${activeAlert.custom_address}` : activeAlert.latitude ? ` • Konum: (${activeAlert.latitude.toFixed(4)}, ${activeAlert.longitude.toFixed(4)})` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 relative z-10 shrink-0">
              <button
                onClick={() => {
                  setActiveAlert(null);
                  navigate('/admin/reports');
                }}
                className="bg-white text-rose-700 hover:bg-rose-50 text-[10px] font-black px-4 py-2.5 rounded-xl uppercase tracking-widest shadow-md transition-all active:scale-95"
              >
                Görüntüle
              </button>
              <button
                onClick={() => setActiveAlert(null)}
                className="p-2 text-rose-200 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#1e1b4b] to-[#312e81] p-5 rounded-[2rem] shadow-xl text-white relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-indigo-400 animate-pulse" />
          <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">YÖNETİM KONTROL PANELİ</span>
        </div>
        <h2 className="text-xl font-black tracking-tight">Sistem Genel Durumu</h2>
        <p className="text-[11px] font-bold text-indigo-200 mt-1 opacity-80">Hat, araç ve sürücü kontrol paneline hoş geldiniz.</p>
      </motion.div>

      {/* Realtime Walkie Talkie Speaker Alert */}
      <AnimatePresence>
        {activeRadioSpeaker && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-indigo-600 text-white p-4 rounded-[1.5rem] shadow-lg border border-indigo-500 flex items-center gap-3.5 animate-pulse"
          >
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <Volume2 size={18} className="text-white animate-bounce" />
            </div>
            <div>
              <p className="text-[8px] font-black text-indigo-200 uppercase tracking-widest leading-none mb-1">TELSİZ AKTİF BANT</p>
              <h4 className="text-xs font-black uppercase">{activeRadioSpeaker} Telsizden Konuşuyor...</h4>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard title="Aktif Kaptan" value={stats.activeCaptains} icon={<Users size={16} />} color="text-emerald-600 bg-emerald-50" />
        <StatCard title="Aktif Filo" value={stats.activeVehicles} icon={<Bus size={16} />} color="text-blue-600 bg-blue-50" />
        <StatCard title="Bekleyen Hata" value={stats.pendingIssues} icon={<AlertTriangle size={16} />} color="text-rose-600 bg-rose-50" isAlert={stats.pendingIssues > 0} />
        <StatCard title="Toplam Durak" value={stats.totalStops} icon={<Navigation size={16} />} color="text-indigo-600 bg-indigo-50" />
      </div>

      {/* Menu Options */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Kontrol Merkez Modülleri</h3>
        <div className="grid grid-cols-1 gap-3">
          {menuItems.map((item, idx) => (
            <motion.button
              key={idx}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(item.path)}
              className="bg-white border border-slate-100 p-4 rounded-[1.5rem] shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-colors"
            >
              <div className="flex items-center gap-4 text-left">
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${item.color.split(' ')[0]} ${item.color.split(' ')[1]} ${item.color.split(' ')[2]}`}>
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-black text-slate-800 text-sm">{item.label}</h4>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">{item.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {item.badge !== undefined && item.badge !== null && (
                  <span className="bg-rose-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full animate-bounce">
                    {item.badge}
                  </span>
                )}
                <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="space-y-4 pt-1">
        {/* Recent Reports */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SON ARIZA BİLDİRİMLERİ</h3>
            <button onClick={() => navigate('/admin/reports')} className="text-[9px] font-black text-indigo-600 uppercase">TÜMÜNÜ GÖR</button>
          </div>
          <div className="space-y-2.5">
            {recentReports.map(report => (
              <div key={report.id} className="bg-white border border-slate-100 p-3.5 rounded-[1.2rem] shadow-sm flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                  {report.image_base64 ? (
                    <img src={report.image_base64} className="w-full h-full object-cover" alt="Arıza" />
                  ) : (
                    <ShieldAlert size={18} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black text-slate-700 truncate max-w-[120px]">{report.profiles?.full_name}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">{new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs font-black text-slate-700 leading-snug line-clamp-1">{report.issue_description}</p>
                  {report.custom_address && (
                    <p className="text-[9px] font-bold text-slate-400 truncate mt-0.5">Tarif: {report.custom_address}</p>
                  )}
                </div>
              </div>
            ))}
            {recentReports.length === 0 && (
              <div className="text-center py-4 bg-slate-50 border border-slate-100/50 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Bekleyen arıza bildirimi bulunmuyor</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Announcements */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SON DUYURULAR</h3>
            <button onClick={() => navigate('/admin/announcements')} className="text-[9px] font-black text-indigo-600 uppercase">YÖNET</button>
          </div>
          <div className="space-y-2.5">
            {recentAnnouncements.map(anon => (
              <div key={anon.id} className="bg-white border border-slate-100 p-3.5 rounded-[1.2rem] shadow-sm flex items-start gap-3">
                <div className="p-2 bg-amber-50 rounded-xl text-amber-500 shrink-0">
                  <Bell size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black text-slate-700 truncate max-w-[150px]">{anon.title}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">{new Date(anon.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-500 leading-snug line-clamp-1">{anon.content}</p>
                </div>
              </div>
            ))}
            {recentAnnouncements.length === 0 && (
              <div className="text-center py-4 bg-slate-50 border border-slate-100/50 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Herhangi bir duyuru yayınlanmamış</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Realtime Incoming Call Overlay */}
      <AnimatePresence>
        {activeCall && (
          <div className="fixed inset-0 z-[9999] bg-slate-955/70 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-800 w-full max-w-sm flex flex-col items-center justify-center text-center relative"
            >
               <div className="w-20 h-20 bg-indigo-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.4)] mb-6 animate-pulse">
                  <Volume2 size={36} className="text-white animate-bounce" />
               </div>
               <h2 className="text-xl font-black uppercase tracking-[0.1em] mb-2">CANLI BAĞLANTI AKTİF</h2>
               <p className="text-sm font-black text-indigo-300 uppercase tracking-widest mb-1">{activeCall.driverName}</p>
               <p className="text-xs font-bold opacity-50 uppercase tracking-wider mb-6">Araç: {activeCall.vehiclePlate}</p>

               {/* Animation Waves */}
               <div className="flex gap-1 justify-center items-end h-8 mb-8">
                  {[1,2,3,4,5,6].map(i => (
                    <motion.div 
                      key={i}
                      animate={{ height: [8, 28, 8] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.08 }}
                      className="w-1 bg-indigo-400 rounded-full"
                    />
                  ))}
               </div>
               
               <button 
                  onClick={() => setActiveCall(null)}
                  className="w-full py-4 bg-rose-600 hover:bg-rose-700 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
               >
                  <PhoneOff size={16} /> BAĞLANTIYI KES
               </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ title, value, icon, color, isAlert = false }) {
  return (
    <div className={`p-4 bg-white border border-slate-100 rounded-3xl shadow-sm flex items-center gap-3.5 ${isAlert ? 'ring-2 ring-rose-500/20 border-rose-100' : ''}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{title}</p>
        <p className="text-lg font-black text-slate-800 leading-none">{value}</p>
      </div>
    </div>
  );
}
