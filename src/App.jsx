import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Map as MapIcon, Route as RouteIcon, User, Bell, Radio, AlertTriangle, List, LogOut } from 'lucide-react';
import DriverHome from './pages/DriverHome';
import DriverMap from './pages/DriverMap';
import DriverSchedule from './pages/DriverSchedule';
import DriverReports from './pages/DriverReports';
import DriverAnons from './pages/DriverAnons';
import DriverSocialWall from './pages/DriverSocialWall';
import DriverFleet from './pages/DriverFleet';
import DriverDetail from './pages/DriverDetail';
import StopRecorder from './pages/StopRecorder';
import Login from './pages/Login';
import { supabase } from './lib/supabase';
import LocationTracker from './components/LocationTracker';

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data);
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

  if (!session) {
    return <Login />;
  }

  if (location.pathname === '/admin/stops') {
    return <StopRecorder />;
  }

  const isDetailPage = location.pathname.includes('/driver/');

  return (
    <>
      <LocationTracker userProfile={profile} />
      <div className="min-h-screen bg-[#f1f5f9] flex justify-center items-start md:pt-10 overflow-hidden font-sans">
        {/* Mobile Wrapper */}
        <div className="w-full max-w-md bg-[#f8fafc] h-screen md:h-[850px] relative shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] md:rounded-[3.5rem] border border-slate-200 flex flex-col overflow-hidden">
          
          <header className="bg-white/95 backdrop-blur-xl px-6 py-5 z-[60] rounded-b-[2.5rem] border-b border-slate-100 shadow-sm flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-lg uppercase">
                {(profile?.full_name || 'K')[0]}
              </div>
              <div>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">KAPTAN MODU</p>
                <h1 className="text-lg font-black text-slate-800">{profile?.full_name || 'Kaptan'}</h1>
              </div>
            </div>
            <div className="flex gap-2">
               <button onClick={handleLogout} className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center border border-red-100 text-red-400"><LogOut size={18} /></button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto no-scrollbar relative">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<PageWrapper><DriverHome /></PageWrapper>} />
                <Route path="/map" element={<PageWrapper><DriverMap /></PageWrapper>} />
                <Route path="/schedule" element={<PageWrapper><DriverSchedule /></PageWrapper>} />
                <Route path="/reports" element={<PageWrapper><DriverReports /></PageWrapper>} />
                <Route path="/anons" element={<PageWrapper><DriverAnons /></PageWrapper>} />
                <Route path="/social" element={<PageWrapper><DriverSocialWall /></PageWrapper>} />
                <Route path="/fleet" element={<PageWrapper><DriverFleet /></PageWrapper>} />
                <Route path="/driver/:id" element={<DriverDetail />} />
                <Route path="/profile" element={<PageWrapper><div className="p-10 text-center font-bold text-slate-400 uppercase text-xs tracking-widest">Kaptan Ayarları</div></PageWrapper>} />
              </Routes>
            </AnimatePresence>
          </div>

          {!isDetailPage && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[92%] z-[1000]">
              <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.1)] border border-white/60 px-6 py-3 flex justify-between items-center relative">
                <NavButton to="/" icon={<Home size={22} />} label="Ana Sayfa" />
                <NavButton to="/schedule" icon={<List size={22} />} label="Sefer" />
                <div className="relative -top-8 flex flex-col items-center">
                  <Link to="/map">
                    <motion.div whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.9 }} className="w-16 h-16 bg-[#114B36] rounded-full flex items-center justify-center shadow-2xl border-4 border-[#f8fafc]">
                      <MapIcon size={26} className="text-white" strokeWidth={2.5} />
                    </motion.div>
                  </Link>
                  <span className="text-[10px] font-black text-emerald-800 mt-1 uppercase tracking-tighter">CANLI</span>
                </div>
                <NavButton to="/reports" icon={<AlertTriangle size={22} />} label="Arıza" />
                <NavButton to="/profile" icon={<User size={22} />} label="Profil" />
              </div>
            </div>
          )}
        </div>
      </div>
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
          color: isActive ? '#114B36' : '#94a3b8'
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {icon}
      </motion.div>
      <span className={`text-[10px] font-black uppercase tracking-tighter transition-colors ${isActive ? 'text-[#114B36]' : 'text-slate-400'}`}>
        {label}
      </span>
      {isActive && (
        <motion.div 
          layoutId="nav-glow-final"
          className="absolute -top-4 w-8 h-1 bg-emerald-500 rounded-full blur-[1px]"
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
    className="h-full"
  >
    {children}
  </motion.div>
);

export default App;
