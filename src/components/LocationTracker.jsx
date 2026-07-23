import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { MapPin, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateDistanceMeters, checkAndTriggerAutomaticSpeech, getDistanceToRoute } from '../utils/transitEngine';

const LocationTracker = ({ userProfile }) => {
  const [permissionState, setPermissionState] = useState('prompt'); // 'granted', 'prompt', 'denied'
  const [bypassed, setBypassed] = useState(false);

  const stopsRef = useRef([]);
  const visitedStopsRef = useRef(new Set());
  const lowSpeedStartTimeRef = useRef(null);

  // Fetch stops once on mount
  useEffect(() => {
    const fetchStops = async () => {
      const { data } = await supabase
        .from('stops')
        .select('*')
        .order('sequence_order', { ascending: true });
      if (data) {
        stopsRef.current = data;
      }
    };
    fetchStops();
  }, []);

  useEffect(() => {
    // Check initial permission state
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        setPermissionState(result.state);
        result.onchange = () => setPermissionState(result.state);
      });
    }

    if (!userProfile) return;

    let watchId;

    // Only start tracking if granted (or if we don't know, we'll try)
    const startTracking = () => {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          setPermissionState('granted');
          const { latitude, longitude, speed, heading } = position.coords;

          // 1. Automatic Speech Announcement Engine
          if (stopsRef.current.length > 0) {
            checkAndTriggerAutomaticSpeech(latitude, longitude, stopsRef.current);
          }

          // 2. Calculate Traffic Congestion Status (P2P Traffic Radar)
          // Geolocation speed is in m/s. 5 km/h = 1.38 m/s.
          let trafficStatus = 'clear';
          const speedVal = speed || 0;
          if (speedVal > 0 && speedVal < 1.38) {
            if (!lowSpeedStartTimeRef.current) {
              lowSpeedStartTimeRef.current = Date.now();
            } else if (Date.now() - lowSpeedStartTimeRef.current > 120000) { // 2 minutes
              trafficStatus = 'congested';
            }
          } else {
            lowSpeedStartTimeRef.current = null;
          }

          // Fetch active shift log to find vehicle_id and current laps
          const { data: activeShift } = await supabase
            .from('shift_logs')
            .select('*')
            .eq('driver_id', userProfile.id)
            .eq('status', 'active')
            .maybeSingle();

          const vehicleId = activeShift?.vehicle_id || null;

          // Calculate Route Deviation (Geofencing Threshold = 100 meters)
          let isOffRoute = false;
          let deviationDistance = 0;
          if (stopsRef.current.length > 0) {
            deviationDistance = getDistanceToRoute(latitude, longitude, stopsRef.current);
            if (deviationDistance > 100) {
              isOffRoute = true;
            }
          }

          await supabase.from('vehicle_locations').upsert({
            driver_id: userProfile.id,
            vehicle_id: vehicleId,
            latitude,
            longitude,
            speed: speedVal * 3.6, // Store in km/h
            heading: heading || 0,
            traffic_status: trafficStatus,
            is_off_route: isOffRoute,
            deviation_distance: deviationDistance,
            updated_at: new Date().toISOString()
          }, { onConflict: 'driver_id' });

          // 3. Auto-Lap/Round Detection
          if (activeShift && stopsRef.current.length > 0) {
            const currentStops = stopsRef.current;
            const firstStop = currentStops[0];

            // Add stop to visited stops list if within 40m
            currentStops.forEach(stop => {
              const dist = calculateDistanceMeters(latitude, longitude, stop.latitude, stop.longitude);
              if (dist <= 40) {
                visitedStopsRef.current.add(stop.id);
              }
            });

            // If back at first stop and visited at least half of the stops, complete a lap
            const distToFirst = calculateDistanceMeters(latitude, longitude, firstStop.latitude, firstStop.longitude);
            if (distToFirst <= 40 && visitedStopsRef.current.size >= Math.ceil(currentStops.length / 2)) {
              const nextLaps = (activeShift.laps_completed || 0) + 1;
              await supabase
                .from('shift_logs')
                .update({ laps_completed: nextLaps })
                .eq('id', activeShift.id);

              visitedStopsRef.current.clear();
              visitedStopsRef.current.add(firstStop.id);
            }
          }

          // Log history for route tracking
          if (vehicleId) {
            await supabase.from('vehicle_location_logs').insert([{
              vehicle_id: vehicleId,
              latitude,
              longitude
            }]);
          }
        },
        (error) => {
          console.error('GPS Hata:', error);
          if (error.code === 1) setPermissionState('denied'); // Permission denied
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
      () => setPermissionState('granted'),
      (err) => {
        if (err.code === 1) setPermissionState('denied');
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <AnimatePresence>
      {(permissionState === 'prompt' || permissionState === 'denied') && !bypassed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-6"
        >
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />

            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 shadow-lg ${permissionState === 'denied' ? 'bg-red-50 text-red-500 shadow-red-500/20' : 'bg-indigo-50 text-indigo-600 shadow-indigo-600/20'
              }`}>
              {permissionState === 'denied' ? <AlertTriangle size={32} /> : <MapPin size={32} />}
            </div>

            <h2 className="text-xl font-black text-slate-800 mb-2">
              {permissionState === 'denied' ? 'Konum İzni Reddedildi' : 'Konum İzni Gerekli'}
            </h2>

            <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed">
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

            <button
              onClick={() => setBypassed(true)}
              className="mt-4 text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
            >
              Şimdilik Atla (Takipler Çalışmayacaktır)
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LocationTracker;
