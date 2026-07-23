/**
 * TRANSIT & TELEMATICS LOGIC ENGINE (محرك الحسابات والتوقيت المباشر)
 * Provides high-precision mathematical models for:
 * 1. Haversine Geographic Distance & Bearing
 * 2. Real-time ETA Calculation with Traffic & Speed Weighting
 * 3. Schedule Delay & On-Time Performance Tracking
 * 4. Automatic Hands-Free Voice Announcements (Text-to-Speech)
 */

// Earth Radius in meters
const EARTH_RADIUS_METERS = 6371000;

/**
 * Calculates high-precision Haversine distance in meters between two lat/lng coordinates
 */
export const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const radLat1 = (lat1 * Math.PI) / 180;
  const radLat2 = (lat2 * Math.PI) / 180;
  const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) *
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
};

/**
 * Calculates compass bearing (0-360 deg) between two coordinates
 */
export const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const radLat1 = (lat1 * Math.PI) / 180;
  const radLat2 = (lat2 * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(dLon) * Math.cos(radLat2);
  const x = Math.cos(radLat1) * Math.sin(radLat2) - Math.sin(radLat1) * Math.cos(radLat2) * Math.cos(dLon);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
};

/**
 * Calculates real-time dynamic ETA (Estimated Time of Arrival) in minutes
 * @param {number} distanceMeters Distance to target stop in meters
 * @param {number} currentSpeedKmh Current vehicle speed in km/h (0 if stationary)
 * @param {string} trafficStatus Traffic status ('clear', 'congested', etc.)
 * @param {number} intermediateStopsCount Number of stops between current position and target
 * @returns {object} { etaMinutes, formattedEta, isDelayed, speedUsedKmh }
 */
export const calculateETA = (distanceMeters, currentSpeedKmh, trafficStatus = 'clear', intermediateStopsCount = 0) => {
  if (distanceMeters <= 20) {
    return { etaMinutes: 0, formattedEta: 'GELDİNİZ / ARRIVED', secondsTotal: 0, delayStatus: 'ON_TIME' };
  }

  // Minimum fallback speed assumed in city traffic if vehicle is temporarily stopped (e.g. 22 km/h)
  const effectiveSpeedKmh = currentSpeedKmh > 5 ? currentSpeedKmh : 22;
  const speedMetersPerSecond = (effectiveSpeedKmh * 1000) / 3600;

  // Traffic slowdown factor (congested traffic increases travel time by 70%)
  const trafficFactor = trafficStatus === 'congested' ? 1.7 : 1.0;

  // Dwell time per intermediate stop (average 35 seconds per stop for passengers boarding)
  const totalDwellTimeSeconds = intermediateStopsCount * 35;

  // Travel time calculation
  const travelTimeSeconds = (distanceMeters / speedMetersPerSecond) * trafficFactor;
  const totalSeconds = travelTimeSeconds + totalDwellTimeSeconds;

  const etaMinutes = Math.ceil(totalSeconds / 60);

  let formattedEta = '';
  if (etaMinutes <= 1) {
    formattedEta = '1 dk (Yaklaşıyor)';
  } else if (etaMinutes < 60) {
    formattedEta = `${etaMinutes} dk`;
  } else {
    const hrs = Math.floor(etaMinutes / 60);
    const mins = etaMinutes % 60;
    formattedEta = `${hrs} sa ${mins} dk`;
  }

  return {
    etaMinutes,
    formattedEta,
    secondsTotal: Math.round(totalSeconds),
    effectiveSpeedKmh: Math.round(effectiveSpeedKmh),
    trafficMultiplier: trafficFactor
  };
};

/**
 * AUTOMATIC HANDS-FREE VOICE ANNOUNCEMENTS (Text-to-Speech)
 * Automatically speaks stop arrivals and next stop warnings when vehicle gets near
 */
let lastSpokenStopKey = null;

export const speakAutoAnnouncement = (text, language = 'tr-TR') => {
  if (!('speechSynthesis' in window)) return;

  try {
    // Cancel any previous queue so current alert plays immediately
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language; // 'tr-TR' or 'ar-SA'
    utterance.rate = 0.95; // Natural speaking rate
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error('TTS Announcement Error:', err);
  }
};

/**
 * Evaluates bus proximity to stops and triggers automated speech announcements
 */
export const checkAndTriggerAutomaticSpeech = (currentLat, currentLng, stops = []) => {
  if (!stops || stops.length === 0) return null;

  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    const dist = calculateDistanceMeters(currentLat, currentLng, stop.latitude, stop.longitude);

    // 1. ARRIVED AT STOP (< 40m)
    if (dist <= 40) {
      const stopKey = `arrived_${stop.id}`;
      if (lastSpokenStopKey !== stopKey) {
        lastSpokenStopKey = stopKey;
        const msg = `${stop.name} durağına geldiniz.`;
        speakAutoAnnouncement(msg);
        return { type: 'ARRIVED', stop, distance: dist };
      }
    }
    // 2. APPROACHING NEXT STOP (100m to 250m)
    else if (dist > 40 && dist <= 200) {
      const stopKey = `approaching_${stop.id}`;
      if (lastSpokenStopKey !== stopKey) {
        lastSpokenStopKey = stopKey;
        const msg = `Gelecek durak: ${stop.name}. Lütfen hazırlanın.`;
        speakAutoAnnouncement(msg);
        return { type: 'APPROACHING', stop, distance: dist };
      }
    }
  }

  return null;
};
