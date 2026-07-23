import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Map as MapIcon, Route as RouteIcon, User, Bell, Radio, AlertTriangle, List, LogOut, Navigation, Bus, Calendar, MessageSquare, ShieldAlert } from 'lucide-react';
import DriverHome from './pages/DriverHome';
import DriverMap from './pages/DriverMap';
import DriverSchedule from './pages/DriverSchedule';
import DriverReports from './pages/DriverReports';
import DriverAnons from './pages/DriverAnons';
import DriverSocialWall from './pages/DriverSocialWall';
import DriverFleet from './pages/DriverFleet';
import DriverDetail from './pages/DriverDetail';
import DriverChat from './pages/DriverChat';
import StopRecorder from './pages/StopRecorder';
import Login from './pages/Login';
import { supabase } from './lib/supabase';
import LocationTracker from './components/LocationTracker';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminVehicles from './pages/admin/AdminVehicles';
import AdminSchedules from './pages/admin/AdminSchedules';
import AdminReports from './pages/admin/AdminReports';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminStops from './pages/admin/AdminStops';
import AdminPassengerReports from './pages/admin/AdminPassengerReports';
import DriverPassenger from './pages/DriverPassenger';
import AdminMap from './pages/admin/AdminMap';
import AdminShiftLogs from './pages/admin/AdminShiftLogs';
import AdminDrivers from './pages/admin/AdminDrivers';
import AdminActiveShifts from './pages/admin/AdminActiveShifts';
import AdminChat from './pages/admin/AdminChat';

// Web Audio API emergency warble siren generator
const startSiren = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(500, audioCtx.currentTime);
    
    const mod = audioCtx.createOscillator();
    const modGain = audioCtx.createGain();
    mod.frequency.value = 2; // 2Hz frequency oscillation
    modGain.gain.value = 200; // Oscillation depth
    
    mod.connect(modGain);
    modGain.connect(osc.frequency);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    
    osc.start();
    mod.start();
    
    return {
      stop: () => {
        try {
          osc.stop();
          mod.stop();
          audioCtx.close();
        } catch(e){}
      }
    };
  } catch(e) {
    console.log("Siren audio error:", e);
    return null;
  }
};

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  return (
    <Router>
      <AppContent session={session} setSession={setSession} profile={profile} setProfile={setProfile} loading={loading} setLoading={setLoading} />
    </Router>
  );
}

function AppContent({ session, setSession, profile, setProfile, loading, setLoading }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [activeSos, setActiveSos] = useState(null);
  const sirenRef = useRef(null);

  useEffect(() => {
    // Unlock AudioContext for warnings on first user click interaction
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
    if (session) {
      fetchActiveSos();
      
      const channel = supabase.channel('global-sos-alerts')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sos_alerts' }, () => {
          fetchActiveSos();
        })
        .subscribe();

      return () => {
        channel.unsubscribe();
        if (sirenRef.current) {
          sirenRef.current.stop();
          sirenRef.current = null;
        }
      };
    } else {
      setActiveSos(null);
      if (sirenRef.current) {
        sirenRef.current.stop();
        sirenRef.current = null;
      }
    }
  }, [session]);

  const fetchActiveSos = async () => {
    const { data } = await supabase
      .from('sos_alerts')
      .select('*, profiles(full_name), vehicles(plate_number)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      const activeAlert = data[0];
      setActiveSos(activeAlert);
      if (!sirenRef.current) {
        sirenRef.current = startSiren();
      }
    } else {
      setActiveSos(null);
      if (sirenRef.current) {
        sirenRef.current.stop();
        sirenRef.current = null;
      }
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setIsAdminMode(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      setProfile(data);
      if (data.role === 'admin') {
        setIsAdminMode(true);
        if (location.pathname === '/' || location.pathname === '') {
          navigate('/admin');
        }
      } else {
        setIsAdminMode(false);
      }
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#114B36] flex items-center justify-center">
        <span className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin"></span>
      </div>
    );
  }

  const renderContent = () => {
    if (!session) return <Login />;

    const isAdmin = profile?.role === 'admin';

    // Protect admin routes from non-admins
    if (location.pathname.startsWith('/admin') && !isAdmin) {
      return <Navigate to="/" replace />;
    }

    const isDetailPage = location.pathname.includes('/driver/');

    return (
      <div className="min-h-screen bg-[#f1f5f9] flex justify-center items-start md:pt-10 overflow-hidden font-sans">
        {/* Mobile Wrapper */}
        <div className="w-full max-w-md bg-[#f8fafc] h-screen md:h-[850px] relative shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] md:rounded-[3.5rem] border border-slate-200 flex flex-col overflow-hidden">
          
          <header className={`px-6 py-5 z-[60] rounded-b-[2.5rem] border-b border-slate-100 shadow-sm flex justify-between items-center shrink-0 transition-colors duration-300 ${
            isAdminMode ? 'bg-[#1e1b4b] text-white border-indigo-900/10' : 'bg-white text-slate-800'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg uppercase transition-colors ${
                isAdminMode ? 'bg-indigo-600' : 'bg-emerald-600'
              }`}>
                {(profile?.full_name || 'K')[0]}
              </div>
              <div>
                <p className={`text-[9px] font-black uppercase tracking-widest leading-none mb-1 ${
                  isAdminMode ? 'text-indigo-300' : 'text-slate-400'
                }`}>
                  {isAdminMode ? 'ADMİN PANELİ' : 'KAPTAN MODU'}
                </p>
                <h1 className={`text-lg font-black leading-tight ${isAdminMode ? 'text-white' : 'text-slate-800'}`}>
                  {profile?.full_name || 'Kaptan'}
                </h1>
              </div>
            </div>
            
            <div className="flex gap-2 items-center">
               {isAdmin && (
                 <button 
                   onClick={() => {
                     const nextMode = !isAdminMode;
                     setIsAdminMode(nextMode);
                     navigate(nextMode ? '/admin' : '/');
                   }}
                   className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                     isAdminMode 
                       ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                       : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                   }`}
                 >
                   {isAdminMode ? 'KAPTAN' : 'YÖNETİM'}
                 </button>
               )}
               <button onClick={handleLogout} className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center border border-red-100 text-red-400 active:scale-95"><LogOut size={18} /></button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto no-scrollbar relative">
            <AnimatePresence>
              {activeSos && (
                <motion.div
                  initial={{ opacity: 0, y: -50, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  className="absolute top-4 left-4 right-4 z-[99999] bg-rose-600 border border-rose-500 text-white p-4 rounded-[1.8rem] shadow-2xl flex flex-col gap-2.5 overflow-hidden animate-pulse"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center animate-bounce shrink-0">
                      <ShieldAlert size={22} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[7.5px] font-black text-rose-200 uppercase tracking-widest leading-none mb-0.5">ACİL SOS ÇAĞRISI</p>
                      <h4 className="text-xs font-black truncate">{activeSos.profiles?.full_name} Acil Yardım İstiyor!</h4>
                      <p className="text-[9px] text-rose-100 font-bold">Araç: {activeSos.vehicles?.plate_number || 'Bilinmiyor'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        navigate(isAdminMode ? '/admin/map' : '/map');
                      }}
                      className="flex-1 bg-white text-rose-700 text-[9px] font-black py-2 rounded-xl uppercase tracking-wider text-center active:scale-95 transition-transform"
                    >
                      Konumu Gör
                    </button>
                    {isAdminMode && (
                      <button
                        onClick={async () => {
                          await supabase.from('sos_alerts').update({ status: 'resolved' }).eq('id', activeSos.id);
                        }}
                        className="flex-1 bg-rose-800 text-white text-[9px] font-black py-2 rounded-xl uppercase tracking-wider text-center border border-rose-500 active:scale-95 transition-transform"
                      >
                        Çözüldü
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <Routes>
                {isAdminMode ? (
                  <>
                    <Route path="/admin" element={<PageWrapper><AdminDashboard /></PageWrapper>} />
                    <Route path="/admin/vehicles" element={<PageWrapper><AdminVehicles /></PageWrapper>} />
                    <Route path="/admin/schedules" element={<PageWrapper><AdminSchedules /></PageWrapper>} />
                    <Route path="/admin/reports" element={<PageWrapper><AdminReports /></PageWrapper>} />
                    <Route path="/admin/passengers" element={<PageWrapper><AdminPassengerReports /></PageWrapper>} />
                    <Route path="/admin/announcements" element={<PageWrapper><AdminAnnouncements /></PageWrapper>} />
                    <Route path="/admin/stops" element={<PageWrapper><AdminStops /></PageWrapper>} />
                    <Route path="/admin/map" element={<PageWrapper><AdminMap /></PageWrapper>} />
                    <Route path="/admin/shifts" element={<PageWrapper><AdminShiftLogs /></PageWrapper>} />
                    <Route path="/admin/drivers" element={<PageWrapper><AdminDrivers /></PageWrapper>} />
                    <Route path="/admin/tracking" element={<PageWrapper><AdminActiveShifts /></PageWrapper>} />
                    <Route path="/admin/chat" element={<PageWrapper><AdminChat /></PageWrapper>} />
                    <Route path="/driver/:id" element={<DriverDetail />} />
                    <Route path="*" element={<Navigate to="/admin" replace />} />
                  </>
                ) : (
                  <>
                    <Route path="/" element={<PageWrapper><DriverHome /></PageWrapper>} />
                    <Route path="/passengers" element={<PageWrapper><DriverPassenger /></PageWrapper>} />
                    <Route path="/map" element={<PageWrapper><DriverMap /></PageWrapper>} />
                    <Route path="/schedule" element={<PageWrapper><DriverSchedule /></PageWrapper>} />
                    <Route path="/reports" element={<PageWrapper><DriverReports /></PageWrapper>} />
                    <Route path="/anons" element={<PageWrapper><DriverAnons /></PageWrapper>} />
                    <Route path="/social" element={<PageWrapper><DriverSocialWall /></PageWrapper>} />
                    <Route path="/fleet" element={<PageWrapper><DriverFleet /></PageWrapper>} />
                    <Route path="/driver/:id" element={<DriverDetail />} />
                    <Route path="/profile" element={<PageWrapper><DriverChat /></PageWrapper>} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </>
                )}
              </Routes>
            </AnimatePresence>
          </div>

          {!isDetailPage && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[92%] z-[1000]">
              <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.1)] border border-white/60 px-6 py-3 flex justify-between items-center relative">
                {isAdminMode ? (
                  <>
                    <NavButton to="/admin" icon={<Home size={20} />} label="Ana" />
                    <NavButton to="/admin/tracking" icon={<Activity size={20} />} label="Takip" />
                    <div className="relative -top-8 flex flex-col items-center">
                      <Link to="/admin/map">
                        <motion.div whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.9 }} className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-[#f8fafc]">
                          <MapIcon size={24} className="text-white" strokeWidth={2.5} />
                        </motion.div>
                      </Link>
                      <span className="text-[10px] font-black text-indigo-800 mt-1 uppercase tracking-tighter">CANLI</span>
                    </div>
                    <NavButton to="/admin/passengers" icon={<Users size={20} />} label="Yolcu" />
                    <NavButton to="/admin/schedules" icon={<Calendar size={20} />} label="Sefer" />
                  </>
                ) : (
                  <>
                    <NavButton to="/" icon={<Home size={22} />} label="Ana" />
                    <NavButton to="/passengers" icon={<Users size={22} />} label="Yolcu" />
                    <div className="relative -top-8 flex flex-col items-center">
                      <Link to="/map">
                        <motion.div whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.9 }} className="w-16 h-16 bg-[#114B36] rounded-full flex items-center justify-center shadow-2xl border-4 border-[#f8fafc]">
                          <MapIcon size={26} className="text-white" strokeWidth={2.5} />
                        </motion.div>
                      </Link>
                      <span className="text-[10px] font-black text-emerald-800 mt-1 uppercase tracking-tighter">CANLI</span>
                    </div>
                    <NavButton to="/fleet" icon={<Navigation size={22} />} label="Filo" />
                    <NavButton to="/profile" icon={<MessageSquare size={22} />} label="Sohbet" />
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <LocationTracker userProfile={profile} />
      {renderContent()}
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </>
  );
}

const NavButton = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link to={to} className="flex flex-col items-center justify-center space-y-1 group relative py-1">
      <motion.div 
        animate={{ 
          scale: isActive ? 1.2 : 1,
          y: isActive ? -2 : 0,
          color: isActive ? '#4f46e5' : '#94a3b8'
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {icon}
      </motion.div>
      <span className={`text-[10px] font-black uppercase tracking-tighter transition-colors ${isActive ? 'text-[#4f46e5]' : 'text-slate-400'}`}>
        {label}
      </span>
      {isActive && (
        <motion.div 
          layoutId="nav-glow-final"
          className="absolute -top-4 w-8 h-1 bg-indigo-500 rounded-full blur-[1px]"
        />
      )}
    </Link>
  );
};

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3, ease: "easeOut" }}
    className="h-full font-sans"
  >
    {children}
  </motion.div>
);

export default App;
