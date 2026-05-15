import React, { useEffect } from 'react';
import { supabase } from '../lib/supabase';

const LocationTracker = ({ userProfile }) => {
  useEffect(() => {
    if (!userProfile) return;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, speed, heading } = position.coords;
        
        // Upsert location with real-time speed
        await supabase.from('vehicle_locations').upsert({
          driver_id: userProfile.id,
          latitude,
          longitude,
          speed: speed ? (speed * 3.6) : 0, // Convert m/s to km/h
          heading: heading || 0,
          updated_at: new Date().toISOString()
        }, { onConflict: 'driver_id' });
      },
      (error) => console.error('GPS Hata:', error),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [userProfile]);

  return null;
};

export default LocationTracker;
