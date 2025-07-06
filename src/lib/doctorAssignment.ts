import { ref, get, update } from 'firebase/database';
import { db } from '@/firebase';
import { notifyDoctorOfAssignment, notifyPatientOfConfirmation } from './notifications';

// Types for data structures
interface Doctor {
  id: string;
  name: string;
  specialization?: string;
  status: string;
  area?: string;
  address?: {
    city?: string;
    state?: string;
    pincode?: string;
    area?: string;
    fullAddress?: string;
  };
}

interface DoctorSchedule {
  id: string;
  doctorId: string;
  doctorName: string;
  specialization: string;
  days: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  startTime: string;
  endTime: string;
  slotDuration: number;
  breakStartTime?: string;
  breakEndTime?: string;
}

interface Appointment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  consultationType: 'virtual' | 'home' | 'clinic';
  date: string;
  time: string;
  symptoms: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  doctorId?: string;
  doctorName?: string;
  specialization?: string;
  userArea?: string;
  userAddress?: {
    city?: string;
    state?: string;
    pincode?: string;
    area?: string;
    fullAddress?: string;
  };
  assignmentType?: 'auto' | 'manual';
  assignedBy?: string;
  assignedAt?: number;
}

interface LocationInfo {
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  fullAddress?: string;
}

interface DoctorMatch {
  doctor: Doctor;
  score: number;
  distance?: number;
  specializationMatch: number;
  areaMatch: number;
  distanceScore: number;
  details?: {
    specializationReason: string;
    locationReason: string;
    distanceReason: string;
  };
}

// Enhanced specialization keywords with weights
const SPECIALIZATION_KEYWORDS: Record<string, { keywords: string[]; weight: number }> = {
  'Orthodontist': {
    keywords: ['braces', 'alignment', 'crooked', 'bite', 'jaw', 'overbite', 'underbite', 'malocclusion', 'teeth straightening', 'misaligned'],
    weight: 5
  },
  'Pediatric Dentist': {
    keywords: ['child', 'baby', 'kid', 'children', 'infant', 'toddler', 'pediatric', 'young', 'minor'],
    weight: 5
  },
  'Oral Surgeon': {
    keywords: ['surgery', 'extraction', 'wisdom', 'implant', 'trauma', 'oral surgery', 'surgical', 'remove', 'cut', 'wisdom tooth'],
    weight: 5
  },
  'Periodontist': {
    keywords: ['gum', 'bleeding', 'gingivitis', 'periodontitis', 'gum disease', 'swollen gums', 'receding', 'gum infection'],
    weight: 4
  },
  'Endodontist': {
    keywords: ['root canal', 'nerve', 'pulp', 'abscess', 'tooth pain', 'severe pain', 'infection', 'tooth infection'],
    weight: 4
  },
  'Prosthodontist': {
    keywords: ['denture', 'crown', 'bridge', 'prosthetic', 'artificial teeth', 'replacement', 'missing teeth', 'partial denture'],
    weight: 4
  },
  'Cosmetic Dentist': {
    keywords: ['whitening', 'bleaching', 'veneers', 'cosmetic', 'smile makeover', 'aesthetic', 'teeth whitening'],
    weight: 3
  },
  'General': {
    keywords: ['cleaning', 'checkup', 'routine', 'cavity', 'filling', 'general', 'maintenance', 'polish'],
    weight: 2
  }
};

// Cache for coordinates to avoid repeated API calls
const COORDINATES_CACHE: Map<string, { lat: number; lng: number } | null> = new Map();

/**
 * Get coordinates for an address using OpenStreetMap Nominatim API
 */
const getCoordinatesFromAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    // Check cache first
    if (COORDINATES_CACHE.has(address)) {
      return COORDINATES_CACHE.get(address) ?? null;
    }

    // Using OpenStreetMap Nominatim API (free alternative to Google Maps)
    const encodedAddress = encodeURIComponent(`${address}, India`);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=in`,
      {
        headers: {
          'User-Agent': 'SocioSmile/1.0 (dental-appointment-system)'
        }
      }
    );
    
    if (!response.ok) {
      console.error('Geocoding service unavailable');
      COORDINATES_CACHE.set(address, null);
      return null;
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const coords = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
      COORDINATES_CACHE.set(address, coords);
      return coords;
    }
    
    COORDINATES_CACHE.set(address, null);
    return null;
  } catch (error) {
    console.error('Error getting coordinates:', error);
    COORDINATES_CACHE.set(address, null);
    return null;
  }
};

/**
 * Calculate distance between two coordinates using Haversine formula
 */
const calculateDistance = (
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

/**
 * Get distance between patient and doctor using external geocoding
 */
const getDistanceBetweenLocations = async (
  patientLocation: LocationInfo,
  doctorLocation: LocationInfo
): Promise<number | null> => {
  try {
    // Build address strings
    const patientAddress = buildAddressString(patientLocation);
    const doctorAddress = buildAddressString(doctorLocation);
    
    if (!patientAddress || !doctorAddress) {
      return null;
    }
    
    // Get coordinates for both addresses with rate limiting
    const patientCoords = await getCoordinatesFromAddress(patientAddress);
    
    // Add small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const doctorCoords = await getCoordinatesFromAddress(doctorAddress);
    
    if (!patientCoords || !doctorCoords) {
      return null;
    }
    
    // Calculate distance
    return calculateDistance(
      patientCoords.lat,
      patientCoords.lng,
      doctorCoords.lat,
      doctorCoords.lng
    );
  } catch (error) {
    console.error('Error calculating distance:', error);
    return null;
  }
};

/**
 * Build address string from location info
 */
const buildAddressString = (location: LocationInfo): string => {
  if (location.fullAddress) {
    return location.fullAddress;
  }
  
  const parts: string[] = [];
  if (location.area) parts.push(location.area);
  if (location.city) parts.push(location.city);
  if (location.state) parts.push(location.state);
  if (location.pincode) parts.push(location.pincode);
  
  return parts.join(', ');
};

/**
 * Calculate pincode-based proximity score
 */
const getPincodeProximity = (patientPincode?: string, doctorPincode?: string): number => {
  if (!patientPincode || !doctorPincode) {
    return 0;
  }
  
  // Exact match
  if (patientPincode === doctorPincode) {
    return 10;
  }
  
  // Same first 3 digits (same postal circle)
  if (patientPincode.substring(0, 3) === doctorPincode.substring(0, 3)) {
    return 7;
  }
  
  // Same first 2 digits (same state/region)
  if (patientPincode.substring(0, 2) === doctorPincode.substring(0, 2)) {
    return 4;
  }
  
  // Same first digit (same zone)
  if (patientPincode.substring(0, 1) === doctorPincode.substring(0, 1)) {
    return 2;
  }
  
  return 0;
};

/**
 * Calculate specialization match score with detailed reasoning
 */
const getSpecializationMatchScore = (specialization: string, symptoms: string): { score: number; reason: string } => {
  const spec = SPECIALIZATION_KEYWORDS[specialization] ?? SPECIALIZATION_KEYWORDS['General'];
  let score = 0;
  const matchedKeywords: string[] = [];
  
  const lowercaseSymptoms = symptoms.toLowerCase();
  
  spec.keywords.forEach(keyword => {
    if (lowercaseSymptoms.includes(keyword.toLowerCase())) {
      score += spec.weight;
      matchedKeywords.push(keyword);
    }
  });
  
  const reason = matchedKeywords.length > 0 
    ? `Matched keywords: ${matchedKeywords.join(', ')}`
    : `No specific keywords matched for ${specialization}`;
  
  return { score, reason };
};

/**
 * Calculate distance-based score
 */
const getDistanceScore = (distance: number | null): { score: number; reason: string } => {
  if (distance === null) {
    return { score: 1, reason: 'Distance unknown' };
  }
  
  // Score decreases exponentially with distance
  if (distance <= 5) return { score: 10, reason: `Excellent proximity (${distance.toFixed(1)}km)` };
  if (distance <= 10) return { score: 8, reason: `Very good proximity (${distance.toFixed(1)}km)` };
  if (distance <= 20) return { score: 6, reason: `Good proximity (${distance.toFixed(1)}km)` };
  if (distance <= 50) return { score: 4, reason: `Fair proximity (${distance.toFixed(1)}km)` };
  if (distance <= 100) return { score: 2, reason: `Poor proximity (${distance.toFixed(1)}km)` };
  
  return { score: 1, reason: `Very poor proximity (${distance.toFixed(1)}km)` };
};

/**
 * Calculate area match score
 */
const getAreaMatchScore = (patientLocation: LocationInfo, doctorLocation: LocationInfo): { score: number; reason: string } => {
  const patientArea = patientLocation.area?.toLowerCase();
  const doctorArea = doctorLocation.area?.toLowerCase();
  const patientCity = patientLocation.city?.toLowerCase();
  const doctorCity = doctorLocation.city?.toLowerCase();
  
  // Exact area match
  if (patientArea && doctorArea && patientArea === doctorArea) {
    return { score: 10, reason: 'Same area' };
  }
  
  // Same city
  if (patientCity && doctorCity && patientCity === doctorCity) {
    return { score: 6, reason: 'Same city' };
  }
  
  // Pincode proximity
  const pincodeScore = getPincodeProximity(patientLocation.pincode, doctorLocation.pincode);
  if (pincodeScore > 0) {
    return { 
      score: pincodeScore, 
      reason: `Pincode proximity (${patientLocation.pincode} - ${doctorLocation.pincode})` 
    };
  }
  
  return { score: 0, reason: 'No area/location match' };
};

/**
 * Calculate match scores for a single doctor
 */
const calculateDoctorMatchScores = async (
  doctor: Doctor,
  symptoms: string,
  patientLocation: LocationInfo
): Promise<DoctorMatch> => {
  // Calculate specialization match
  const specializationResult = getSpecializationMatchScore(doctor.specialization ?? 'General', symptoms);
  
  // Calculate area match
  const doctorLocation: LocationInfo = {
    area: doctor.area ?? doctor.address?.area,
    city: doctor.address?.city,
    state: doctor.address?.state,
    pincode: doctor.address?.pincode,
    fullAddress: doctor.address?.fullAddress
  };
  
  const areaResult = getAreaMatchScore(patientLocation, doctorLocation);
  
  // Calculate distance (with error handling)
  const distanceResult = await calculateDistanceForDoctor(patientLocation, doctorLocation);
  
  // Weighted scoring: 40% specialization, 30% area/pincode, 30% distance
  const totalScore = 
    (specializationResult.score * 0.4) + 
    (areaResult.score * 0.3) + 
    (distanceResult.score * 0.3);
  
  return {
    doctor,
    score: totalScore,
    distance: distanceResult.distance,
    specializationMatch: specializationResult.score,
    areaMatch: areaResult.score,
    distanceScore: distanceResult.score,
    details: {
      specializationReason: specializationResult.reason,
      locationReason: areaResult.reason,
      distanceReason: distanceResult.reason
    }
  };
};

/**
 * Calculate distance for a doctor with proper error handling
 */
const calculateDistanceForDoctor = async (
  patientLocation: LocationInfo,
  doctorLocation: LocationInfo
): Promise<{ score: number; reason: string; distance: number | null }> => {
  let distance: number | null = null;
  let distanceResult = { score: 1, reason: 'Distance not calculated' };
  
  try {
    distance = await getDistanceBetweenLocations(patientLocation, doctorLocation);
    distanceResult = getDistanceScore(distance);
    
    // Small delay to avoid API rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  } catch (error) {
    console.error('Error calculating distance:', error);
  }
  
  return { ...distanceResult, distance };
};

/**
 * Enhanced doctor matching with weighted scoring
 */
const findBestDoctorMatches = async (
  doctors: Doctor[], 
  symptoms: string,
  patientLocation: LocationInfo
): Promise<DoctorMatch[]> => {
  const matches: DoctorMatch[] = [];
  
  for (const doctor of doctors) {
    const match = await calculateDoctorMatchScores(doctor, symptoms, patientLocation);
    matches.push(match);
  }
  
  // Sort by total score (highest first)
  return matches.sort((a, b) => b.score - a.score);
};

/**
 * Checks if a doctor is available at the specified date and time
 */
const isDoctorAvailable = async (
  doctorId: string, 
  date: string, 
  time: string
): Promise<boolean> => {
  try {
    // Get all appointments for the doctor on the given date
    const appointmentsRef = ref(db, 'appointments');
    const snapshot = await get(appointmentsRef);
    
    if (!snapshot.exists()) {
      return true; // No appointments at all, doctor is available
    }
    
    const appointments = snapshot.val();
    
    // Check if the doctor has any appointments at the given time and date
    const conflictingAppointment = Object.values(appointments).find(
      (appointment: any) => 
        appointment.doctorId === doctorId && 
        appointment.date === date && 
        appointment.time === time &&
        ['pending', 'confirmed'].includes(appointment.status)
    );
    
    return !conflictingAppointment;
  } catch (error) {
    console.error('Error checking doctor availability:', error);
    return false;
  }
};

// --- PATCH: Robust time parsing utility ---
function parseTimeToMinutes(time: string): number {
  let t = time.trim().toLowerCase();
  let isPM = t.includes('pm');
  t = t.replace(/am|pm/, '').trim();
  let [h, m] = t.split(':').map(Number);
  if (isNaN(h)) h = 0;
  if (isNaN(m)) m = 0;
  if (isPM && h < 12) h += 12;
  if (!isPM && h === 12) h = 0;
  return h * 60 + m;
}

// --- PATCH: Improved isInDoctorSchedule ---
const isInDoctorSchedule = (
  schedule: DoctorSchedule, 
  date: string, 
  time: string
): boolean => {
  // Get day of week from date (0 = Sunday, 1 = Monday, etc.)
  const dateObj = new Date(date);
  const dayOfWeek = dateObj.getDay();
  const dayMap: Record<number, keyof DoctorSchedule['days']> = {
    0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday'
  };
  const scheduleDay = dayMap[dayOfWeek];
  if (!schedule.days[scheduleDay]) return false;
  // Use robust time parsing
  const appointmentTimeInMinutes = parseTimeToMinutes(time);
  const scheduleStartInMinutes = parseTimeToMinutes(schedule.startTime);
  const scheduleEndInMinutes = parseTimeToMinutes(schedule.endTime);
  if (appointmentTimeInMinutes < scheduleStartInMinutes || appointmentTimeInMinutes > scheduleEndInMinutes) return false;
  if (schedule.breakStartTime && schedule.breakEndTime) {
    const breakStartInMinutes = parseTimeToMinutes(schedule.breakStartTime);
    const breakEndInMinutes = parseTimeToMinutes(schedule.breakEndTime);
    if (appointmentTimeInMinutes >= breakStartInMinutes && appointmentTimeInMinutes <= breakEndInMinutes) return false;
  }
  return true;
};

// --- PATCH: Unified doctor filtering for availability ---
const getAvailableDoctorsForTime = async (
  doctors: Doctor[],
  date: string,
  time: string,
  allowNoSchedule: boolean = false // If true, include doctors with no schedule (for manual assignment)
): Promise<{available: Doctor[], noSchedule: Doctor[]}> => {
  const schedulesRef = ref(db, 'doctorSchedules');
  const schedulesSnapshot = await get(schedulesRef);
  const doctorSchedules: DoctorSchedule[] = schedulesSnapshot.exists() 
    ? Object.values(schedulesSnapshot.val()) 
    : [];
  
  if (doctorSchedules.length === 0) {
    console.warn('No doctor schedules found in database');
  } else {
    console.log(`Found ${doctorSchedules.length} doctor schedules`);
  }
  
  const availableDoctors: Doctor[] = [];
  const noScheduleDoctors: Doctor[] = [];
  
  for (const doctor of doctors) {
    const schedule = doctorSchedules.find(s => s.doctorId === doctor.id);
    if (!schedule) {
      if (allowNoSchedule) {
        console.log(`Doctor ${doctor.name} has no schedule, adding to noSchedule list`);
        noScheduleDoctors.push(doctor);
      }
      continue;
    }
    
    if (!isInDoctorSchedule(schedule, date, time)) {
      console.log(`Doctor ${doctor.name} is not available at the requested time based on schedule`);
      continue;
    }
    
    const available = await isDoctorAvailable(doctor.id, date, time);
    if (available) {
      console.log(`Doctor ${doctor.name} is available at the requested time`);
      availableDoctors.push(doctor);
    } else {
      console.log(`Doctor ${doctor.name} has a conflicting appointment at the requested time`);
    }
  }
  
  console.log(`Found ${availableDoctors.length} available doctors and ${noScheduleDoctors.length} doctors with no schedule`);
  return { available: availableDoctors, noSchedule: noScheduleDoctors };
};

// --- PATCH: Ensure helper functions are defined before use ---
// (1) getPatientLocationInfo
const getPatientLocationInfo = async (appointment: Appointment): Promise<LocationInfo> => {
  const userRef = ref(db, `users/${appointment.userId}`);
  const userSnapshot = await get(userRef);
  let patientLocation: LocationInfo = {};
  if (userSnapshot.exists()) {
    const userData = userSnapshot.val();
    patientLocation = {
      area: userData.area ?? userData.address?.area ?? appointment.userArea,
      city: userData.address?.city ?? appointment.userAddress?.city,
      state: userData.address?.state ?? appointment.userAddress?.state,
      pincode: userData.address?.pincode ?? appointment.userAddress?.pincode,
      fullAddress: userData.address?.fullAddress ?? appointment.userAddress?.fullAddress
    };
  }
  return patientLocation;
};
// (2) getActiveDoctors
const getActiveDoctors = async (): Promise<Doctor[]> => {
  const doctorsRef = ref(db, 'users');
  const doctorsSnapshot = await get(doctorsRef);
  if (!doctorsSnapshot.exists()) {
    console.warn('No doctors found in database');
    return [];
  }
  const doctorsData = doctorsSnapshot.val();
  const doctors = Object.entries(doctorsData)
    .filter(([_, userData]: [string, any]) => userData.role === 'doctor' && userData.status === 'approved')
    .map(([id, userData]: [string, any]) => ({
      id,
      name: userData.fullName ?? 'Dr. Unknown',
      specialization: userData.specialization ?? 'General',
      status: userData.status,
      area: userData.area,
      address: userData.address
    }));
  
  if (doctors.length === 0) {
    console.warn('No active doctors found with approved status');
  } else {
    console.log(`Found ${doctors.length} active doctors`);
  }
  
return doctors;
};
// (3) updateAppointmentWithDoctor
const updateAppointmentWithDoctor = async (
  appointmentRef: any,
  appointment: Appointment,
  bestMatch: DoctorMatch
): Promise<void> => {
  await update(appointmentRef, {
    doctorId: bestMatch.doctor.id,
    doctorName: bestMatch.doctor.name,
    specialization: bestMatch.doctor.specialization ?? 'General',
    status: 'confirmed',
    assignmentType: 'auto',
    assignedAt: Date.now(),
    updatedAt: Date.now()
  });
  await Promise.all([
    notifyDoctorOfAssignment(
      bestMatch.doctor.id,
      bestMatch.doctor.name,
      appointment.id,
      appointment.userName,
      appointment.date,
      appointment.time
    ),
    notifyPatientOfConfirmation(
      appointment.userId,
      appointment.id,
      bestMatch.doctor.name,
      appointment.date,
      appointment.time
    )
  ]);
};

// --- PATCH: Use new filtering in assignDoctorToAppointment ---
export const assignDoctorToAppointment = async (
  appointmentId: string
): Promise<{ 
  success: boolean; 
  message: string; 
  doctorId?: string; 
  doctorName?: string;
  matchDetails?: DoctorMatch;
}> => {
  try {
    // Get appointment details
    const appointmentRef = ref(db, `appointments/${appointmentId}`);
    const appointmentSnapshot = await get(appointmentRef);
    
    if (!appointmentSnapshot.exists()) {
      return { success: false, message: 'Appointment not found' };
    }
    
    const appointment: Appointment = { id: appointmentId, ...appointmentSnapshot.val() };
    
    // If doctor is already assigned, no need to reassign
    if (appointment.doctorId && appointment.doctorName) {
      return { success: true, message: 'Doctor already assigned', doctorId: appointment.doctorId, doctorName: appointment.doctorName };
    }
    
    // Get patient location information
    const patientLocation = await getPatientLocationInfo(appointment);
    
    // Get all active doctors
    const activeDoctors = await getActiveDoctors();
    
    if (activeDoctors.length === 0) {
      return { success: false, message: 'No active doctors available' };
    }
    
    // Use new filtering
    const { available: availableDoctors, noSchedule: noScheduleDoctors } = await getAvailableDoctorsForTime(
      activeDoctors,
      appointment.date,
      appointment.time,
      true // allowNoSchedule: include doctors with no schedule for fallback
    );
    
    if (availableDoctors.length === 0 && noScheduleDoctors.length === 0) {
      return { success: false, message: 'No doctors available at the requested time (no schedules set for any doctor)' };
    }
    if (availableDoctors.length === 0 && noScheduleDoctors.length > 0) {
      // All approved doctors have no schedule, allow assignment with warning
      // Pick the first no-schedule doctor for fallback (or let admin choose in manual flow)
      const fallbackDoctor = noScheduleDoctors[0];
      await update(appointmentRef, {
        doctorId: fallbackDoctor.id,
        doctorName: fallbackDoctor.name,
        specialization: fallbackDoctor.specialization ?? 'General',
        status: 'confirmed',
        assignmentType: 'auto',
        assignedAt: Date.now(),
        updatedAt: Date.now(),
        assignmentWarning: 'Doctor has no schedule set. Please verify availability manually.'
      });
      await Promise.all([
        notifyDoctorOfAssignment(
          fallbackDoctor.id,
          fallbackDoctor.name,
          appointment.id,
          appointment.userName,
          appointment.date,
          appointment.time
        ),
        notifyPatientOfConfirmation(
          appointment.userId,
          appointment.id,
          fallbackDoctor.name,
          appointment.date,
          appointment.time
        )
      ]);
      return {
        success: true,
        message: 'Doctor assigned (no schedule set, please verify availability)',
        doctorId: fallbackDoctor.id,
        doctorName: fallbackDoctor.name
      };
    }
    
    // Normal flow: use best match
    const doctorMatches = await findBestDoctorMatches(
      availableDoctors, 
      appointment.symptoms ?? '', 
      patientLocation
    );
    
    if (doctorMatches.length === 0) {
      return { success: false, message: 'Could not find a suitable doctor' };
    }
    
    const bestMatch = doctorMatches[0];
    
    // Update appointment and send notifications
    await updateAppointmentWithDoctor(appointmentRef, appointment, bestMatch);
    
    return {
      success: true,
      message: 'Doctor assigned successfully using intelligent matching',
      doctorId: bestMatch.doctor.id,
      doctorName: bestMatch.doctor.name,
      matchDetails: bestMatch
    };
  } catch (error) {
    console.error('Error assigning doctor to appointment:', error);
    return {
      success: false,
      message: `Error assigning doctor: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Validate doctor for manual assignment
 */
const validateDoctorForAssignment = async (
  doctorId: string,
  appointment: Appointment
): Promise<{ isValid: boolean; message?: string; doctorData?: any }> => {
  // Get doctor details
  const doctorRef = ref(db, `users/${doctorId}`);
  const doctorSnapshot = await get(doctorRef);
  
  if (!doctorSnapshot.exists()) {
    return { isValid: false, message: 'Doctor not found' };
  }
  
  const doctorData = doctorSnapshot.val();
  
  if (doctorData.role !== 'doctor' || doctorData.status !== 'approved') {
    return { isValid: false, message: 'Doctor is not available for assignments' };
  }
  
  // Check doctor availability
  const available = await isDoctorAvailable(doctorId, appointment.date, appointment.time);
  
  if (!available) {
    return { isValid: false, message: 'Doctor is not available at the requested time' };
  }
  
  return { isValid: true, doctorData };
};

/**
 * Check if doctor is scheduled to work at the requested time
 */
const validateDoctorSchedule = async (
  doctorId: string,
  appointment: Appointment
): Promise<{ isValid: boolean; message?: string }> => {
  const schedulesRef = ref(db, 'doctorSchedules');
  const schedulesSnapshot = await get(schedulesRef);
  
  if (!schedulesSnapshot.exists()) {
    return { isValid: true };
  }
  
  const doctorSchedules: DoctorSchedule[] = Object.values(schedulesSnapshot.val());
  const schedule = doctorSchedules.find(s => s.doctorId === doctorId);
  
  if (schedule && !isInDoctorSchedule(schedule, appointment.date, appointment.time)) {
    return { 
      isValid: false, 
      message: 'Doctor is not scheduled to work at the requested time' 
    };
  }
  
  return { isValid: true };
};

/**
 * Update appointment with manually assigned doctor and send notifications
 */
const updateManualAssignment = async (
  appointmentRef: any,
  appointment: Appointment,
  doctorId: string,
  doctorData: any,
  assignedBy: string
): Promise<void> => {
  const doctorName = doctorData.fullName ?? 'Dr. Unknown';
  
  // Update the appointment
  await update(appointmentRef, {
    doctorId: doctorId,
    doctorName: doctorName,
    specialization: doctorData.specialization ?? 'General',
    status: 'confirmed',
    assignmentType: 'manual',
    assignedBy: assignedBy,
    assignedAt: Date.now(),
    updatedAt: Date.now()
  });
  
  // Send notifications
  await Promise.all([
    notifyDoctorOfAssignment(
      doctorId,
      doctorName,
      appointment.id,
      appointment.userName,
      appointment.date,
      appointment.time
    ),
    notifyPatientOfConfirmation(
      appointment.userId,
      appointment.id,
      doctorName,
      appointment.date,
      appointment.time
    )
  ]);

  // Send email notification to doctor
  try {
    const { sendDoctorAssignmentNotificationToDoctor } = await import('../services/emailService');
    if (doctorData.email) {
      await sendDoctorAssignmentNotificationToDoctor(
        doctorName,
        doctorData.email,
        appointment.userName,
        appointment.userEmail,
        appointment.date,
        appointment.time,
        appointment.consultationType,
        appointment.id
      );
    }
  } catch (emailError) {
    console.error('Error sending doctor assignment email notification:', emailError);
  }
};

/**
 * Manually assign a specific doctor to an appointment
 */
export const manuallyAssignDoctor = async (
  appointmentId: string,
  doctorId: string,
  assignedBy: string
): Promise<{ success: boolean; message: string; doctorName?: string }> => {
  try {
    // Get appointment details
    const appointmentRef = ref(db, `appointments/${appointmentId}`);
    const appointmentSnapshot = await get(appointmentRef);
    
    if (!appointmentSnapshot.exists()) {
      return { 
        success: false, 
        message: 'Appointment not found' 
      };
    }
    
    const appointment: Appointment = appointmentSnapshot.val();
      // Validate doctor for assignment
    const doctorValidation = await validateDoctorForAssignment(doctorId, appointment);
    if (!doctorValidation.isValid) {
      return { 
        success: false, 
        message: doctorValidation.message || 'Validation failed'
      };
    }
    
    // Check doctor schedule
    const scheduleValidation = await validateDoctorSchedule(doctorId, appointment);
    if (!scheduleValidation.isValid) {
      return { 
        success: false, 
        message: scheduleValidation.message || 'Schedule validation failed'
      };
    }
    
    // Update appointment and send notifications
    await updateManualAssignment(
      appointmentRef,
      appointment,
      doctorId,
      doctorValidation.doctorData,
      assignedBy
    );
    
    return {
      success: true,
      message: 'Doctor assigned manually',
      doctorName: doctorValidation.doctorData.fullName ?? 'Dr. Unknown'
    };
  } catch (error) {
    console.error('Error manually assigning doctor:', error);
    return {
      success: false,
      message: `Error assigning doctor: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Reassign an appointment to a different doctor
 */
export const reassignDoctor = async (
  appointmentId: string,
  newDoctorId: string,
  reassignedBy: string,
  reason?: string
): Promise<{ success: boolean; message: string; oldDoctorName?: string; newDoctorName?: string }> => {
  try {
    // Get appointment details
    const appointmentRef = ref(db, `appointments/${appointmentId}`);
    const appointmentSnapshot = await get(appointmentRef);
    
    if (!appointmentSnapshot.exists()) {
      return { 
        success: false, 
        message: 'Appointment not found' 
      };
    }
    
    const appointment: Appointment = appointmentSnapshot.val();
    const oldDoctorName = appointment.doctorName;
    
    // Use manual assignment logic for reassignment
    const result = await manuallyAssignDoctor(appointmentId, newDoctorId, reassignedBy);
    
    if (result.success) {
      // Update with reassignment info
      await update(appointmentRef, {
        reassignmentReason: reason,
        previousDoctorId: appointment.doctorId,
        previousDoctorName: appointment.doctorName,
        reassignedAt: Date.now(),
        reassignedBy: reassignedBy
      });
      
      return {
        success: true,
        message: 'Doctor reassigned successfully',
        oldDoctorName: oldDoctorName,
        newDoctorName: result.doctorName
      };
    }
    
    return result;
  } catch (error) {
    console.error('Error reassigning doctor:', error);
    return {
      success: false,
      message: `Error reassigning doctor: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Get all active doctors from database with proper filtering
 */
const getActiveDoctorsFromDatabase = async (): Promise<{ success: boolean; doctors: Doctor[]; message: string }> => {
  const doctorsRef = ref(db, 'users');
  const doctorsSnapshot = await get(doctorsRef);
  
  if (!doctorsSnapshot.exists()) {
    return { 
      success: false, 
      doctors: [],
      message: 'No doctors found in the system' 
    };
  }
  
  const doctorsData = doctorsSnapshot.val();
  
  // Filter to active doctors only
  const activeDoctors: Doctor[] = Object.entries(doctorsData)
    .filter(([_, userData]: [string, any]) => 
      userData.role === 'doctor' && userData.status === 'approved')
    .map(([id, userData]: [string, any]) => ({
      id,
      name: userData.fullName ?? 'Dr. Unknown',
      specialization: userData.specialization ?? 'General',
      status: userData.status,
      area: userData.area,
      address: userData.address
    }));
  
  if (activeDoctors.length === 0) {
    return { 
      success: false, 
      doctors: [],
      message: 'No active doctors available' 
    };
  }
  
  return {
    success: true,
    doctors: activeDoctors,
    message: `Found ${activeDoctors.length} active doctors`
  };
};

/**
 * Filter doctors by availability for specific date and time
 */
const filterDoctorsByAvailability = async (
  doctors: Doctor[],
  date: string,
  time: string
): Promise<Doctor[]> => {
  // Get doctor schedules
  const schedulesRef = ref(db, 'doctorSchedules');
  const schedulesSnapshot = await get(schedulesRef);
  const doctorSchedules: DoctorSchedule[] = schedulesSnapshot.exists() 
    ? Object.values(schedulesSnapshot.val()) 
    : [];
  
  const availableDoctors: Doctor[] = [];
  
  for (const doctor of doctors) {
    const isAvailable = await checkDoctorTimeAvailability(doctor, doctorSchedules, date, time);
    if (isAvailable) {
      availableDoctors.push(doctor);
    }
  }
  
  return availableDoctors;
};

/**
 * Check if a specific doctor is available at the given time
 */
const checkDoctorTimeAvailability = async (
  doctor: Doctor,
  schedules: DoctorSchedule[],
  date: string,
  time: string
): Promise<boolean> => {
  // Find doctor's schedule
  const schedule = schedules.find(s => s.doctorId === doctor.id);
  
  // If doctor has no schedule, not available
  if (!schedule) return false;
  
  // Check if doctor is scheduled to work at the requested time
  if (!isInDoctorSchedule(schedule, date, time)) {
    return false;
  }
  
  // Check if doctor is available (no conflicting appointments)
  return await isDoctorAvailable(doctor.id, date, time);
};

/**
 * Create basic doctor matches without scoring
 */
const createBasicDoctorMatches = (doctors: Doctor[]): DoctorMatch[] => {
  return doctors.map(doctor => ({
    doctor,
    score: 1,
    specializationMatch: 1,
    areaMatch: 1,
    distanceScore: 1
  }));
};

/**
 * Get available doctors for a specific appointment time
 */
export const getAvailableDoctorsForAppointment = async (
  date: string,
  time: string,
  symptoms?: string,
  patientLocation?: LocationInfo
): Promise<{ 
  success: boolean; 
  doctors: DoctorMatch[]; 
  message: string 
}> => {
  try {
    // Get all active doctors
    const doctorsResult = await getActiveDoctorsFromDatabase();
    if (!doctorsResult.success) {
      return {
        success: false,
        doctors: [],
        message: doctorsResult.message
      };
    }
    
    // Filter doctors by availability
    const availableDoctors = await filterDoctorsByAvailability(
      doctorsResult.doctors,
      date,
      time
    );
    
    if (availableDoctors.length === 0) {
      return { 
        success: false, 
        doctors: [],
        message: 'No doctors available at the requested time' 
      };
    }
    
    // If symptoms and location provided, calculate matches
    if (symptoms && patientLocation) {
      const doctorMatches = await findBestDoctorMatches(
        availableDoctors, 
        symptoms, 
        patientLocation
      );
      
      return {
        success: true,
        doctors: doctorMatches,
        message: `Found ${doctorMatches.length} available doctors with match scores`
      };
    }
    
    // Otherwise return basic doctor info
    const basicMatches = createBasicDoctorMatches(availableDoctors);
    
    return {
      success: true,
      doctors: basicMatches,
      message: `Found ${basicMatches.length} available doctors`
    };
  } catch (error) {
    console.error('Error getting available doctors:', error);
    return {
      success: false,
      doctors: [],
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Process a single appointment assignment and return result
 */
const processAppointmentAssignment = async (
  appointment: any
): Promise<{ id: string, success: boolean, message: string, matchScore?: number }> => {
  const result = await assignDoctorToAppointment(appointment.id);
  
  if (result.success) {
    return {
      id: appointment.id,
      success: true,
      message: `Assigned to ${result.doctorName}`,
      matchScore: result.matchDetails?.score
    };
  } else {
    return {
      id: appointment.id,
      success: false,
      message: result.message
    };
  }
};

/**
 * Get all pending appointments that need doctor assignment
 */
const getPendingAppointments = async (): Promise<any[]> => {
  const appointmentsRef = ref(db, 'appointments');
  const snapshot = await get(appointmentsRef);
  
  if (!snapshot.exists()) {
    return [];
  }
  
  const appointments = snapshot.val();
  return Object.entries(appointments)
    .filter(([_, data]: [string, any]) => 
      data.status === 'pending' && !data.doctorId)
    .map(([id, data]: [string, any]) => ({ id, ...data }));
};

/**
 * Enhanced batch assignment with intelligent matching
 */
export const assignDoctorsToAllPendingAppointments = async (): Promise<{
  total: number;
  successful: number;
  failed: number;
  details: Array<{id: string, success: boolean, message: string, matchScore?: number}>
}> => {
  try {
    const pendingAppointments = await getPendingAppointments();
    
    if (pendingAppointments.length === 0) {
      return { total: 0, successful: 0, failed: 0, details: [] };
    }
    
    let successful = 0;
    let failed = 0;
    const details: Array<{id: string, success: boolean, message: string, matchScore?: number}> = [];
    
    // Process each appointment
    for (const appointment of pendingAppointments) {
      const result = await processAppointmentAssignment(appointment);
      if (result.success) {
        successful++;
      } else {
        failed++;
      }
      details.push(result);
    }
    return { total: pendingAppointments.length, successful, failed, details };
  } catch (error) {
    console.error('Error in batch doctor assignment:', error);
    return { total: 0, successful: 0, failed: 0, details: [] };
  }
};
