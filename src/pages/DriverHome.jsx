import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ChevronRight, ArrowDown, MapPin, RadioTower, Heart, MessageSquare, PhoneCall, Radio, AlertCircle, X, Shield, Fuel, Gauge, Play, Square, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const DriverHome = () => {
  const navigate = useNavigate();
  const [telemetry, setTelemetry] = useState({
    speed: 0, gapMin: '869:25', gapKm: '289.8', colleagueId: null, colleagueName: '34 AHM 555', currentLoc: 'YOLDA', arkadakiMin: '12:20'
  });
  const [colleagues, setColleagues] = useState([]);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({ active_captains: 0 });
  const [isCalling, setIsCalling] = useState(false);
  const [stops, setStops] = useState([]);
  const channelRef = useRef(null);
  const [callStream, setCallStream] = useState(null);
  const [callRecorder, setCallRecorder] = useState(null);
  const isCallingRef = useRef(false);

  // Shift & Fuel States
  const [activeShift, setActiveShift] = useState(null);
  const [assignedSchedule, setAssignedSchedule] = useState(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [startOdometer, setStartOdometer] = useState('');
  const [startFuel, setStartFuel] = useState('');
  const [endOdometer, setEndOdometer] = useState('');
  const [endFuel, setEndFuel] = useState('');

  // SOS States
  const [holdProgress, setHoldProgress] = useState(0);
  const [sosActive, setSosActive] = useState(false);
  const holdIntervalRef = useRef(null);

  useEffect(() => {
    fetchInitialData();
    const interval = setInterval(updateTelemetry, 3000);

    const channel = supabase.channel('voice-anons-channel').subscribe();
    channelRef.current = channel;

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [stops]);

  const startCallRecording = (stream) => {
    if (!isCallingRef.current) return;
    try {
      const recorder = new MediaRecorder(stream);
      let chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        if (blob.size > 1000 && isCallingRef.current) {
          sendCallAudio(blob);
        }
        if (isCallingRef.current) {
          setTimeout(() => {
            startCallRecording(stream);
          }, 100);
        }
      };

      recorder.start();
      setCallRecorder(recorder);

      setTimeout(() => {
        if (recorder.state === 'recording' && isCallingRef.current) {
          recorder.stop();
        }
      }, 2500);

    } catch (err) {
      console.error("Error in call recorder:", err);
    }
  };

  const sendCallAudio = async (blob) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      const base64data = reader.result;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from('voice_anons').insert({
          sender_id: user.id,
          audio_base64: base64data,
          duration: 2.5
        });
      } catch (err) {
        console.error("Error inserting call voice chunk:", err);
      }
    };
  };

  const handleCallStatus = async (status) => {
    setIsCalling(status);
    isCallingRef.current = status;

    const { data: { user } } = await supabase.auth.getUser();
    let profileName = 'Bir Kaptan';
    let vehiclePlate = 'Bilinmiyor';

    if (user && channelRef.current) {
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
      const { data: shift } = await supabase
        .from('shift_logs')
        .select('*, vehicles(plate_number)')
        .eq('driver_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      profileName = profile?.full_name || 'Bir Kaptan';
      vehiclePlate = shift?.vehicles?.plate_number || 'Bilinmiyor';

      channelRef.current.send({
        type: 'broadcast',
        event: 'calling-status',
        payload: {
          driverName: profileName,
          vehiclePlate: vehiclePlate,
          isCalling: status,
          senderId: user.id
        }
      });
    }

    if (status) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setCallStream(stream);
        startCallRecording(stream);
      } catch (err) {
        console.error("Mic access failed:", err);
      }
    } else {
      if (callRecorder && callRecorder.state !== 'inactive') {
        try { callRecorder.stop(); } catch (e) { }
      }
      if (callStream) {
        callStream.getTracks().forEach(track => track.stop());
      }
      setCallStream(null);
      setCallRecorder(null);
    }
  };

  const checkActiveSos = async (userId) => {
    const { data } = await supabase
      .from('sos_alerts')
      .select('id')
      .eq('driver_id', userId)
      .eq('status', 'active')
      .maybeSingle();
    if (data) {
      setSosActive(true);
      setHoldProgress(100);
    } else {
      setSosActive(false);
      setHoldProgress(0);
    }
  };

  const startSosHold = (e) => {
    if (e && e.cancelable) e.preventDefault();
    if (sosActive) return;
    setHoldProgress(0);
    
    let progress = 0;
    holdIntervalRef.current = setInterval(() => {
      progress += 5;
      if (progress >= 100) {
        setHoldProgress(100);
        triggerSosAlarm();
        clearInterval(holdIntervalRef.current);
      } else {
        setHoldProgress(progress);
      }
    }, 100);
  };

  const cancelSosHold = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
    }
    if (!sosActive) {
      setHoldProgress(0);
    }
  };

  const triggerSosAlarm = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: loc } = await supabase.from('vehicle_locations').select('latitude, longitude').eq('driver_id', user.id).maybeSingle();
      const latitude = loc?.latitude || 36.9160;
      const longitude = loc?.longitude || 34.8800;

      const { error } = await supabase.from('sos_alerts').insert({
        driver_id: user.id,
        vehicle_id: activeShift?.vehicle_id || null,
        latitude,
        longitude,
        status: 'active'
      });

      if (!error) {
        setSosActive(true);
      } else {
        console.error("SOS Alarm insert error:", error);
      }
    } catch(err) {
      console.error("SOS Alarm trigger error:", err);
    }
  };

  const fetchInitialData = async () => {
    // 1. Fetch Stops
    const { data: stopData } = await supabase.from('stops').select('*').order('sequence_order', { ascending: true });
    if (stopData) setStops(stopData);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      checkActiveSos(user.id);
      
      const channel = supabase.channel(`sos-driver-update-${user.id}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sos_alerts', filter: `driver_id=eq.${user.id}` }, (payload) => {
          if (payload.new.status === 'resolved') {
            setSosActive(false);
            setHoldProgress(0);
          }
        })
        .subscribe();

      // 2. Fetch Active Shift for Current Driver
      const { data: shiftData } = await supabase
        .from('shift_logs')
        .select('*, vehicles(*)')
        .eq('driver_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (shiftData) {
        setActiveShift(shiftData);
        setShowCheckInModal(false);
      } else {
        // Fetch assigned schedule for driver
        const { data: scheduleData } = await supabase
          .from('schedules')
          .select('*, vehicles(*)')
          .eq('driver_id', user.id)
          .in('status', ['in_progress', 'upcoming'])
          .order('start_time', { ascending: false })
          .limit(1)
          .maybeSingle();

        setAssignedSchedule(scheduleData || null);
        setShowCheckInModal(true);
      }
    }

    // 4. Fetch Active Captains
    const { data: colData } = await supabase.from('profiles').select('*, vehicle_locations(*)').neq('status', 'offline').limit(10);
    if (colData) setColleagues(colData);

    // 5. Fetch Stats
    const { data: statData } = await supabase.from('active_stats').select('*').single();
    if (statData) setStats(statData);

    // 6. Fetch Social Posts
    const { data: postData } = await supabase.from('social_posts').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(2);
    if (postData) setPosts(postData);

    updateTelemetry(stopData);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const updateTelemetry = async (initialStops = null) => {
    const currentStops = initialStops || stops;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: allLocs } = await supabase.from('vehicle_locations').select('*, profiles(full_name), vehicles(plate_number)');
    if (allLocs) {
      const myLoc = allLocs.find(l => l.driver_id === user.id);
      const others = allLocs.filter(l => l.driver_id !== user.id).map(o => ({ ...o, dist: myLoc ? calculateDistance(myLoc.latitude, myLoc.longitude, o.latitude, o.longitude) : 0 })).sort((a, b) => a.dist - b.dist);
      const ondeki = others[0];
      const arka = others[1] || others[0];

      let nearestStopName = 'YOLDA';
      if (myLoc && currentStops.length > 0) {
        let minDist = Infinity;
        currentStops.forEach(stop => {
          const dist = calculateDistance(myLoc.latitude, myLoc.longitude, stop.latitude, stop.longitude);
          if (dist < minDist) {
            minDist = dist;
            nearestStopName = stop.name;
          }
        });
      }

      if (myLoc) {
        setTelemetry({
          speed: Math.round(myLoc.speed || 0),
          gapKm: ondeki ? ondeki.dist.toFixed(1) : '289.8',
          gapMin: ondeki ? `${Math.floor((ondeki.dist / 20) * 60).toString().padStart(2, '0')}:${Math.floor(((ondeki.dist / 20) * 3600) % 60).toString().padStart(2, '0')}` : '869:25',
          colleagueId: ondeki ? ondeki.id : null,
          colleagueName: ondeki ? (ondeki.vehicles?.plate_number || '34 AHM 555') : '34 AHM 555',
          currentLoc: nearestStopName.toUpperCase(),
          arkadakiMin: arka ? `${Math.floor((arka.dist / 20) * 60).toString().padStart(2, '0')}:${Math.floor(((arka.dist / 20) * 3600) % 60).toString().padStart(2, '0')}` : '12:20'
        });
      }
    }
  };

  const handleCheckInSubmit = async (e) => {
    if (e) e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !assignedSchedule) return;

    // Dynamically retrieve the last shift log's values for this vehicle
    const { data: lastShift } = await supabase
      .from('shift_logs')
      .select('end_odometer, end_fuel')
      .eq('vehicle_id', assignedSchedule.vehicle_id)
      .order('end_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    const startOdom = lastShift?.end_odometer || 12500;
    const startF = lastShift?.end_fuel || 90;

    const { data, error } = await supabase
      .from('shift_logs')
      .insert([{
        driver_id: user.id,
        vehicle_id: assignedSchedule.vehicle_id,
        start_odometer: startOdom,
        start_fuel: startF,
        status: 'active'
      }])
      .select('*, vehicles(*)')
      .single();

    if (error) {
      alert('Vardiya başlatılamadı: ' + error.message);
    } else {
      setActiveShift(data);
      setShowCheckInModal(false);
      setStartOdometer('');
      setStartFuel('');
      fetchInitialData();
    }
  };

  const handleCheckOutSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!activeShift) return;

    const { error } = await supabase
      .from('shift_logs')
      .update({
        end_odometer: activeShift.start_odometer + 10,
        end_fuel: Math.max(0, activeShift.start_fuel - 5),
        end_time: new Date().toISOString(),
        status: 'completed'
      })
      .eq('id', activeShift.id);

    if (error) {
      alert('Vardiya bitirilemedi: ' + error.message);
    } else {
      setActiveShift(null);
      setShowCheckOutModal(false);
      setShowCheckInModal(true);
      setAssignedSchedule(null);
      setEndOdometer('');
      setEndFuel('');
      fetchInitialData();
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col bg-[#fdfdfd] font-sans">
      <div className="flex-1 overflow-y-auto p-5 space-y-5 pb-40">

        {/* Active Shift Header Widget */}
        {activeShift && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-50 border border-emerald-100 p-4 rounded-[1.8rem] flex justify-between items-center"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shrink-0">
                <Zap size={20} />
              </div>
              <div>
                <p className="text-[7px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-0.5">AKTİF ARAÇ</p>
                <h4 className="text-xs font-black text-emerald-900 uppercase">{activeShift.vehicles?.plate_number}</h4>
                <p className="text-[9px] font-bold text-emerald-700/60 mt-0.5">Km: {activeShift.start_odometer} • Yakıt: %{activeShift.start_fuel}</p>
              </div>
            </div>
            <button
              onClick={() => setShowCheckOutModal(true)}
              className="bg-rose-500 hover:bg-rose-600 text-white font-black text-[9px] px-3.5 py-2 rounded-xl uppercase tracking-widest shadow-md shadow-rose-100 active:scale-95 transition-all flex items-center gap-1"
            >
              <Square size={10} fill="white" /> BİTİR
            </button>
          </motion.div>
        )}

        {/* --- AKTİF MESLEKDAŞLAR --- */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-[10px] font-black text-[#10b981] uppercase tracking-widest">AKTİF MESLEKDAŞLAR</h3>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
              <span className="text-[9px] font-bold text-[#10b981] uppercase">{stats.active_captains} AKTİF</span>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
            {colleagues.map(col => (
              <motion.div key={col.id} whileTap={{ scale: 0.9 }} onClick={() => navigate(`/driver/${col.vehicle_locations?.[0]?.id}`)} className="flex flex-col items-center gap-1.5 min-w-[50px] cursor-pointer">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[13px] font-black border-2 border-emerald-50 bg-emerald-50 text-emerald-600 shadow-sm">{col.full_name?.[0]}</div>
                <span className="text-[8px] font-black text-emerald-800 uppercase tracking-tighter truncate w-12 text-center">{col.full_name?.split(' ')[0]}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* --- TOP CARD (Öndeki Araç Mesafesi) --- */}
        <div className="relative h-[210px] rounded-[1.8rem] bg-[#0c4a34] shadow-xl p-5 flex flex-col justify-between overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 border border-dashed border-[#10b981]/20 rounded-full" />
          <div className="absolute top-0 right-1/4 w-28 h-28 bg-[#10b981]/10 rounded-full blur-[30px]" />

          <div className="relative z-10 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-2 h-2 bg-[#10b981] rounded-full shadow-[0_0_8px_#10b981]" />
                <span className="text-[9px] font-bold text-[#10b981] uppercase tracking-widest">ÖNDEKİ ARAÇ MESAFESİ</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[48px] font-black text-white leading-none tracking-tighter">{telemetry.gapMin}</span>
                <span className="text-[11px] font-bold text-[#10b981] uppercase tracking-widest">DAKİKA</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2.5 mt-1">
              <div className="bg-[#1e2b3c] px-3.5 py-2 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-[9px] font-black text-white text-center leading-tight whitespace-pre-wrap w-8">{telemetry.colleagueName.replace(' ', '\n')}</span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className={`w-1 h-3 rounded-full ${i <= 4 ? 'bg-[#10b981]' : 'bg-[#1e2b3c]'}`} />)}
              </div>
            </div>
          </div>

          <div className="bg-[#083525] p-3.5 rounded-[1.2rem] flex justify-between items-center border border-white/5 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#10b981]/10 rounded-xl flex items-center justify-center text-[#10b981]">
                <MapPin size={20} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-[8px] font-bold text-[#10b981] uppercase tracking-widest mb-0.5">GÜNCEL KONUM</p>
                <p className="text-xs font-black text-white uppercase tracking-tight leading-none truncate max-w-[130px]">{telemetry.currentLoc}</p>
              </div>
            </div>
            <div className="text-right flex items-baseline gap-1">
              <p className="text-[22px] font-black text-white tracking-tighter leading-none">{telemetry.gapKm}</p>
              <span className="text-[9px] font-bold text-[#10b981] uppercase">KM</span>
            </div>
          </div>
        </div>

        {/* --- PURPLE FILO BUTTON --- */}
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/fleet')} className="w-full bg-[#7367f0] p-4 rounded-[1.5rem] shadow-lg shadow-indigo-500/20 flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center text-white"><Zap size={22} strokeWidth={2.5} /></div>
            <div className="text-left flex flex-col justify-center">
              <p className="text-[8px] font-bold text-white/60 uppercase tracking-widest mb-0.5">FİLO DURUMU</p>
              <p className="text-sm font-black text-white uppercase tracking-tight leading-none">TÜM HATTI GÖRÜNTÜLE</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-white opacity-70 group-hover:opacity-100 transition-opacity mr-1" />
        </motion.button>

        {/* --- DUAL CARDS (ARKADAKİ & HIZINIZ) --- */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-5 rounded-[1.5rem] flex items-center gap-3 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-50">
            <div className="w-11 h-11 bg-[#eff6ff] rounded-full flex items-center justify-center text-[#3b82f6]"><ArrowDown size={20} strokeWidth={2.5} /></div>
            <div className="flex flex-col justify-center">
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">ARKADAKİ</p>
              <div className="flex items-baseline gap-1"><p className="text-[18px] font-black text-slate-800 tracking-tighter leading-none">{telemetry.arkadakiMin}</p></div>
              <span className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">DK</span>
            </div>
          </div>
          <div className="bg-white p-5 rounded-[1.5rem] flex items-center gap-3 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-50">
            <div className="w-11 h-11 bg-[#eff6ff] rounded-full flex items-center justify-center text-[#3b82f6]"><RadioTower size={20} strokeWidth={2.5} /></div>
            <div className="flex flex-col justify-center">
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">HIZINIZ</p>
              <div className="flex items-baseline gap-1"><p className="text-[18px] font-black text-slate-800 tracking-tighter leading-none">{telemetry.speed}</p></div>
              <span className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">KM/H</span>
            </div>
          </div>
        </div>

        {/* --- KAPTANLAR DUVARI --- */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">KAPTANLAR DUVARI</h3>
            <button onClick={() => navigate('/social')} className="text-[9px] font-black text-[#7367f0] uppercase">TÜMÜNÜ GÖR</button>
          </div>
          <div className="space-y-3">
            {posts.map(post => (
              <div key={post.id} className="bg-white p-4 rounded-[1.5rem] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-50 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-600">{post.profiles?.full_name?.[0] || 'K'}</div>
                    <span className="text-[11px] font-black text-slate-700">{post.profiles?.full_name}</span>
                  </div>
                  <span className="text-[9px] font-bold text-slate-300 uppercase">
                    {Math.floor((new Date() - new Date(post.created_at)) / 60000)} DK ÖNCE
                  </span>
                </div>
                <p className="text-[12px] font-bold text-slate-600 leading-relaxed mt-1">{post.content}</p>
                <div className="flex items-center gap-4 mt-2">
                  <button className="flex items-center gap-1.5 text-slate-400"><Heart size={14} /><span className="text-[10px] font-bold">{post.likes_count}</span></button>
                  <button className="flex items-center gap-1.5 text-slate-400"><MessageSquare size={14} /><span className="text-[10px] font-bold">0</span></button>
                </div>
              </div>
            ))}
            {posts.length === 0 && (
              <div className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-slate-50 text-center">
                <p className="text-[11px] font-bold text-slate-400">Henüz paylaşım yok</p>
              </div>
            )}
          </div>
        </div>

        {/* SOS Emergency Press & Hold Button */}
        {activeShift && (
          <div className="relative">
            <button
              onMouseDown={startSosHold}
              onMouseUp={cancelSosHold}
              onTouchStart={startSosHold}
              onTouchEnd={cancelSosHold}
              className={`w-full py-4 px-6 rounded-[1.5rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2.5 transition-all select-none relative overflow-hidden ${
                sosActive 
                  ? 'bg-rose-700 text-white shadow-xl shadow-rose-900/20 animate-pulse' 
                  : 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/20 active:scale-[0.98]'
              }`}
            >
              <div className="relative z-10 flex items-center gap-2.5">
                <ShieldAlert size={20} className={sosActive ? "animate-bounce" : ""} />
                <span>{sosActive ? "SOS ACİL ALARM AKTİF" : "SOS: BASILI TUTUN (2 SN)"}</span>
              </div>
              {holdProgress > 0 && !sosActive && (
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-white/20 transition-all duration-75 pointer-events-none" 
                  style={{ width: `${holdProgress}%` }} 
                />
              )}
            </button>
          </div>
        )}

        {/* --- QUICK ACTION BUTTONS --- */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <button onClick={() => handleCallStatus(true)} className="bg-white py-4 px-2 rounded-[1.2rem] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-50 flex flex-col items-center gap-2 active:scale-95 transition-transform">
            <PhoneCall size={22} className="text-slate-600" />
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">MERKEZ</span>
          </button>
          <button onClick={() => navigate('/anons')} className="bg-[#eff6ff] py-4 px-2 rounded-[1.2rem] flex flex-col items-center gap-2 active:scale-95 transition-transform">
            <Radio size={22} className="text-[#3b82f6]" />
            <span className="text-[9px] font-black text-[#3b82f6] uppercase tracking-widest">ANONS</span>
          </button>
          <button onClick={() => navigate('/reports')} className="bg-[#fff1f2] py-4 px-2 rounded-[1.2rem] flex flex-col items-center gap-2 active:scale-95 transition-transform">
            <AlertCircle size={22} className="text-[#e11d48]" />
            <span className="text-[9px] font-black text-[#e11d48] uppercase tracking-widest">ARIZA</span>
          </button>
        </div>
      </div>

      {/* --- CHECK-IN MODAL (FORCE ON SHIFT START) --- */}
      <AnimatePresence>
        {showCheckInModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border border-slate-100 flex flex-col gap-4"
            >
              {assignedSchedule ? (
                <>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-3">
                      <Play size={24} fill="currentColor" />
                    </div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Vardiya Başlat</h3>
                    <p className="text-[11px] font-bold text-slate-400 mt-1">Sürüşe başlamadan önce vardiyanızı aktif ediniz.</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                    <div>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Bugünkü Atanan Aracınız</span>
                      <span className="text-xs font-black text-slate-700 uppercase">{assignedSchedule.vehicles?.plate_number} ({assignedSchedule.vehicles?.model})</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Atanan Sefer Hattı</span>
                      <span className="text-xs font-black text-slate-700 uppercase">{assignedSchedule.route_name}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckInSubmit}
                    className="w-full bg-emerald-600 border border-emerald-700 text-white font-black text-[11px] uppercase tracking-widest py-4 rounded-2xl shadow-lg shadow-emerald-100 active:scale-95 transition-transform mt-2"
                  >
                    VARDİYAYI BAŞLAT
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center text-center py-4">
                  <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-3">
                    <AlertCircle size={24} />
                  </div>
                  <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">Atanmış Sefer Yok</h3>
                  <p className="text-[11px] font-bold text-slate-400 mt-2 leading-relaxed px-4">
                    Yönetici tarafından adınıza planlanmış aktif bir sefer bulunmuyor. Lütfen yöneticinizin size bir sefer planlamasını bekleyin.
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- CHECK-OUT MODAL --- */}
      <AnimatePresence>
        {showCheckOutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border border-slate-100 flex flex-col gap-4"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-3">
                  <Square size={20} fill="currentColor" />
                </div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Vardiyayı Bitir</h3>
                <p className="text-[11px] font-bold text-slate-400 mt-1">Mesaiden çıkmak ve turlarınızı tamamlamak istediğinize emin misiniz?</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCheckOutModal(false)}
                  className="flex-1 bg-slate-50 border border-slate-200 text-slate-500 font-black text-[11px] uppercase tracking-widest py-4 rounded-2xl active:scale-95 transition-transform"
                >
                  VAZGEÇ
                </button>
                <button
                  onClick={handleCheckOutSubmit}
                  className="flex-1 bg-rose-600 border border-rose-700 text-white font-black text-[11px] uppercase tracking-widest py-4 rounded-2xl shadow-lg shadow-rose-100 active:scale-95 transition-transform"
                >
                  VARDİYAYI BİTİR
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- CALLING MODAL --- */}
      <AnimatePresence>
        {isCalling && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-white text-center">
            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.5)] mb-8">
              <Shield size={48} />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-[0.1em] mb-3">MERKEZ ARANIYOR</h2>
            <p className="text-xs font-bold opacity-40 uppercase tracking-widest mb-10">Güvenli Bağlantı...</p>
            <button onClick={() => handleCallStatus(false)} className="w-16 h-16 bg-rose-600 rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-transform"><X size={32} /></button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default DriverHome;
