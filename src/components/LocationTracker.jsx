import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MapPin, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LocationTracker = ({ userProfile }) => {
  const [permissionState, setPermissionState] = useState(localStorage.getItem('locationGranted') === 'true' ? 'granted' : 'prompt');

  useEffect(() => {
    // 1. If we already have a record that it's granted, we can assume it's okay unless it fails
    if (localStorage.getItem('locationGranted') === 'true') {
      setPermissionState('granted');
    }

    // 2. Check permissions API if available (Chrome/Android)
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        if (result.state === 'granted') {
          setPermissionState('granted');
          localStorage.setItem('locationGranted', 'true');
        } else if (result.state === 'denied') {
          setPermissionState('denied');
        }
        result.onchange = () => {
           setPermissionState(result.state);
           if (result.state === 'granted') localStorage.setItem('locationGranted', 'true');
        };
      });
    }

    // 3. Always try a "Silent Check" on mount
    navigator.geolocation.getCurrentPosition(
      () => {
        setPermissionState('granted');
        localStorage.setItem('locationGranted', 'true');
      },
      (err) => {
        // If not granted, and no record in localStorage, show prompt
        if (err.code === 1 && localStorage.getItem('locationGranted') !== 'true') {
          setPermissionState('denied');
        }
      },
      { enableHighAccuracy: false, timeout: 2000 } // Fast silent check
    );

    if (!userProfile) return;

    let watchId;
    const startTracking = () => {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          setPermissionState('granted');
          localStorage.setItem('locationGranted', 'true');
          const { latitude, longitude, speed, heading } = position.coords;
          
          await supabase.from('vehicle_locations').upsert({
            driver_id: userProfile.id,
            latitude,
            longitude,
            speed: speed ? (speed * 3.6) : 0, 
            heading: heading || 0,
            updated_at: new Date().toISOString()
          }, { onConflict: 'driver_id' });
        },
        (error) => {
           if (error.code === 1) {
             setPermissionState('denied');
             localStorage.removeItem('locationGranted');
           }
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
    };

    startTracking();

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [userProfile]);

  const requestPermission = () => {
    navigator.geolocation.getCurrentPosition(
      () => {
        setPermissionState('granted');
        localStorage.setItem('locationGranted', 'true');
      },
      (err) => {
         if (err.code === 1) setPermissionState('denied');
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <AnimatePresence>
      {(permissionState === 'prompt' || permissionState === 'denied') && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-6"
        >
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
             
             <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 shadow-lg ${
               permissionState === 'denied' ? 'bg-red-50 text-red-500 shadow-red-500/20' : 'bg-indigo-50 text-indigo-600 shadow-indigo-600/20'
             }`}>
                {permissionState === 'denied' ? <AlertTriangle size={32} /> : <MapPin size={32} />}
             </div>

             <h2 className="text-xl font-black text-slate-800 mb-2">
               {permissionState === 'denied' ? 'Konum İzni Reddedildi' : 'Konum İzni Gerekli'}
             </h2>
             
             <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">
               {permissionState === 'denied' 
                 ? 'Sistemi kullanabilmek için tarayıcı ayarlarından (adres çubuğundaki kilit simgesinden) konum erişimine izin vermelisiniz.'
                 : 'Kaptan Modu\'nun çalışabilmesi ve filodaki diğer araçlarla mesafenizin hesaplanabilmesi için anlık konumunuza ihtiyacımız var.'}
             </p>

             {permissionState !== 'denied' && (
               <button 
                 onClick={requestPermission}
                 className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
               >
                 KONUMA İZİN VER
               </button>
             )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LocationTracker;
