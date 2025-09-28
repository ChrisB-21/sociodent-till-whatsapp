import { ref, get, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '@/firebase';

// Types for appointment scheduling
interface Doctor {
  id: string;
  name: string;
  email: string;
  specialization: string;
  role: string;
  status: string;
  area?: string;
  city?: string;
  state?: string;
  address?: {
    city?: string;
    state?: string;
    area?: string;
    pincode?: string;
    fullAddress?: string;
  };
}

interface Appointment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  doctorId?: string;
  doctorName?: string;
  consultationType: 'virtual' | 'home' | 'clinic';
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM format
  symptoms: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  specialization?: string;
  createdAt?: number;
  updatedAt?: number;
}

interface ConflictRule {
  visitType: 'home' | 'virtual' | 'clinic';
  blockBefore: number; // minutes before appointment
  blockAfter: number; // minutes after appointment
}

interface AvailabilityResult {
  doctorId: string;
  doctorName: string;
  specialization: string;
  isAvailable: boolean;
  conflictReason?: string;
  conflictDetails?: {
    conflictingAppointmentId: string;
    conflictingAppointmentTime: string;
    conflictingAppointmentType: string;
  };
  locality?: string;
  distance?: number | null;
}

interface SchedulingResult {
  availableDoctors: AvailabilityResult[];
  totalDoctors: number;
  availableCount: number;
  unavailableCount: number;
}

// Conflict detection rules as per requirements
const CONFLICT_RULES: ConflictRule[] = [
  {
    visitType: 'home',
    blockBefore: 120, // 2 hours before (updated from 1 hour)
    blockAfter: 120   // 2 hours after (updated from 1 hour)
  },
  {
    visitType: 'virtual',
    blockBefore: 0,  // No buffer before - only exact time
    blockAfter: 0    // No buffer after - only exact time
  },
  {
    visitType: 'clinic',
    blockBefore: 0,  // No buffer before - only exact time
    blockAfter: 0    // No buffer after - only exact time
  }
];

/**
 * Parse time string to minutes since midnight
 */
const parseTimeToMinutes = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Convert minutes since midnight back to time string
 */
const minutesToTimeString = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Check if two time periods overlap
 */
const hasTimeOverlap = (
  start1: number, 
  end1: number, 
  start2: number, 
  end2: number
): boolean => {
  return start1 < end2 && start2 < end1;
};

/**
 * Get conflict rule for appointment type
 */
const getConflictRule = (appointmentType: 'home' | 'virtual' | 'clinic'): ConflictRule => {
  const rule = CONFLICT_RULES.find(r => r.visitType === appointmentType);
  if (!rule) {
    throw new Error(`No conflict rule found for appointment type: ${appointmentType}`);
  }
  return rule;
};

/**
 * Calculate blocked time range for an appointment
 */
const calculateBlockedTimeRange = (
  appointmentTime: string, 
  appointmentType: 'home' | 'virtual' | 'clinic'
): { startTime: number; endTime: number } => {
  const rule = getConflictRule(appointmentType);
  const appointmentMinutes = parseTimeToMinutes(appointmentTime);
  
  const startTime = Math.max(0, appointmentMinutes - rule.blockBefore);
  const endTime = Math.min(24 * 60 - 1, appointmentMinutes + rule.blockAfter);
  
  return { startTime, endTime };
};

/**
 * Fetch all approved doctors from Firebase
 */
const getApprovedDoctors = async (): Promise<Doctor[]> => {
  try {
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const users = snapshot.val();
    const doctors: Doctor[] = [];
    
    Object.entries(users).forEach(([id, userData]: [string, any]) => {
      if (userData.role === 'doctor' && userData.status === 'approved') {
        doctors.push({
          id,
          name: userData.fullName || userData.name || 'Unknown Doctor',
          email: userData.email || '',
          specialization: userData.specialization || 'General',
          role: userData.role,
          status: userData.status,
          area: userData.area,
          city: userData.city,
          state: userData.state,
          address: userData.address
        });
      }
    });
    
    console.log(`🔍 Found ${doctors.length} approved doctors in database:`);
    doctors.forEach(doctor => {
      console.log(`   - Dr. ${doctor.name} (${doctor.specialization}) - ID: ${doctor.id}`);
    });
    
    return doctors;
  } catch (error) {
    console.error('Error fetching approved doctors:', error);
    throw new Error('Failed to fetch doctors from database');
  }
};

/**
 * Fetch doctor's appointments for a specific date
 */
const getDoctorAppointmentsForDate = async (
  doctorId: string, 
  date: string
): Promise<Appointment[]> => {
  try {
    const appointmentsRef = ref(db, 'appointments');
    const snapshot = await get(appointmentsRef);
    
    if (!snapshot.exists()) {
      console.log(`📅 No appointments found in database`);
      return [];
    }
    
    const appointments = snapshot.val();
    const doctorAppointments: Appointment[] = [];
    
    console.log(`🔍 Searching for doctor ${doctorId} appointments on ${date}`);
    console.log(`📋 Total appointments in database: ${Object.keys(appointments).length}`);
    
    Object.entries(appointments).forEach(([id, appointmentData]: [string, any]) => {
      // Enhanced logging to debug doctor assignment matching
      const appointmentDoctorId = appointmentData.doctorId;
      const appointmentDoctorName = appointmentData.doctorName;
      const appointmentDate = appointmentData.date;
      const appointmentStatus = appointmentData.status;
      
      // Check if this appointment matches our criteria
      const isMatchingDoctor = appointmentDoctorId === doctorId;
      const isMatchingDate = appointmentDate === date;
      const isActiveAppointment = appointmentStatus !== 'cancelled';
      
      if (appointmentDate === date) {
        console.log(`📍 Found appointment on ${date}:`, {
          id,
          doctorId: appointmentDoctorId,
          doctorName: appointmentDoctorName,
          time: appointmentData.time,
          status: appointmentStatus,
          isMatchingDoctor,
          isActiveAppointment
        });
      }
      
      if (isMatchingDoctor && isMatchingDate && isActiveAppointment) {
        doctorAppointments.push({
          id,
          ...appointmentData
        });
        console.log(`✅ Added conflicting appointment: ${appointmentData.time} (${appointmentStatus})`);
      }
    });
    
    console.log(`📊 Found ${doctorAppointments.length} active appointments for doctor ${doctorId} on ${date}`);
    return doctorAppointments;
  } catch (error) {
    console.error(`Error fetching appointments for doctor ${doctorId}:`, error);
    throw new Error('Failed to fetch doctor appointments');
  }
};

/**
 * Check if a doctor has a conflict for a specific date and time
 */
const checkDoctorConflict = async (
  doctorId: string,
  requestedDate: string,
  requestedTime: string,
  requestedMode: 'home' | 'virtual' | 'clinic'
): Promise<{
  hasConflict: boolean;
  conflictReason?: string;
  conflictDetails?: {
    conflictingAppointmentId: string;
    conflictingAppointmentTime: string;
    conflictingAppointmentType: string;
  };
}> => {
  try {
    const doctorAppointments = await getDoctorAppointmentsForDate(doctorId, requestedDate);
    
    console.log(`🔍 Checking conflicts for Doctor ID ${doctorId} on ${requestedDate} at ${requestedTime} (${requestedMode})`);
    console.log(`📅 Found ${doctorAppointments.length} existing appointments for this doctor on this date:`);
    
    if (doctorAppointments.length > 0) {
      doctorAppointments.forEach(apt => {
        console.log(`   - ${apt.time} (${apt.consultationType || 'clinic'}) - Status: ${apt.status}`);
      });
    } else {
      console.log(`   ✅ No existing appointments found for this doctor on ${requestedDate}`);
    }
    
    const requestedTimeMinutes = parseTimeToMinutes(requestedTime);
    
    for (const appointment of doctorAppointments) {
      // Convert appointment time to 24-hour format for consistent comparison
      let normalizedAppointmentTime = appointment.time;
      try {
        // Try to convert to 24-hour format if it's in 12-hour format
        if (appointment.time.includes('AM') || appointment.time.includes('PM')) {
          const timeRegex = /^(1[0-2]|[1-9]):([0-5][0-9])\s*(AM|PM)$/i;
          const match = appointment.time.match(timeRegex);
          if (match) {
            let [, hours, minutes, period] = match;
            let hourNum = parseInt(hours);
            
            if (period.toUpperCase() === 'PM' && hourNum !== 12) {
              hourNum += 12;
            } else if (period.toUpperCase() === 'AM' && hourNum === 12) {
              hourNum = 0;
            }
            
            normalizedAppointmentTime = `${hourNum.toString().padStart(2, '0')}:${minutes}`;
          }
        }
      } catch (error) {
        console.warn(`Warning: Could not normalize time format for appointment ${appointment.id}: ${appointment.time}`);
      }
      
      console.log(`🔍 Comparing times: Requested=${requestedTime} vs Existing=${appointment.time} (normalized: ${normalizedAppointmentTime})`);
      
      const existingTimeMinutes = parseTimeToMinutes(normalizedAppointmentTime);
      
      // Rule 1: EXACT TIME CONFLICT - Highest Priority (zero tolerance)
      if (existingTimeMinutes === requestedTimeMinutes) {
        console.log(`🚨 EXACT TIME CONFLICT DETECTED: Doctor has appointment at exactly ${normalizedAppointmentTime} (${appointment.time})`);
        return {
          hasConflict: true,
          conflictReason: `Doctor already has an appointment at exactly ${appointment.time} (${appointment.status})`,
          conflictDetails: {
            conflictingAppointmentId: appointment.id,
            conflictingAppointmentTime: appointment.time,
            conflictingAppointmentType: appointment.consultationType || 'clinic'
          }
        };
      }
      
      // Rule 2: Check buffer-based conflicts for home visits only
      const existingRule = getConflictRule(appointment.consultationType as 'home' | 'virtual' | 'clinic');
      const requestedRule = getConflictRule(requestedMode);
      
      // Skip buffer checks for virtual/clinic appointments since they only conflict at exact times
      if (existingRule.blockBefore === 0 && existingRule.blockAfter === 0 &&
          requestedRule.blockBefore === 0 && requestedRule.blockAfter === 0) {
        continue; // No buffer conflict possible
      }
      
      // Calculate blocked time ranges for appointments with buffer time
      if (existingRule.blockBefore > 0 || existingRule.blockAfter > 0) {
        const existingBlockedRange = calculateBlockedTimeRange(
          appointment.time, 
          appointment.consultationType as 'home' | 'virtual' | 'clinic'
        );
        
        // Check if the requested time falls within the existing appointment's blocked range
        if (requestedTimeMinutes >= existingBlockedRange.startTime && 
            requestedTimeMinutes <= existingBlockedRange.endTime) {
          const blockedRangeStart = minutesToTimeString(existingBlockedRange.startTime);
          const blockedRangeEnd = minutesToTimeString(existingBlockedRange.endTime);
          
          return {
            hasConflict: true,
            conflictReason: `Doctor has a ${appointment.consultationType} visit at ${appointment.time}, blocking ${blockedRangeStart}-${blockedRangeEnd}`,
            conflictDetails: {
              conflictingAppointmentId: appointment.id,
              conflictingAppointmentTime: appointment.time,
              conflictingAppointmentType: appointment.consultationType
            }
          };
        }
      }
      
      // Check if the existing appointment falls within the requested appointment's blocked range
      if (requestedRule.blockBefore > 0 || requestedRule.blockAfter > 0) {
        const requestedBlockedRange = calculateBlockedTimeRange(requestedTime, requestedMode);
        
        if (existingTimeMinutes >= requestedBlockedRange.startTime && 
            existingTimeMinutes <= requestedBlockedRange.endTime) {
          const requestedBlockedStart = minutesToTimeString(requestedBlockedRange.startTime);
          const requestedBlockedEnd = minutesToTimeString(requestedBlockedRange.endTime);
          
          return {
            hasConflict: true,
            conflictReason: `Requested ${requestedMode} visit at ${requestedTime} would block ${requestedBlockedStart}-${requestedBlockedEnd}, conflicting with existing ${appointment.consultationType} at ${appointment.time}`,
            conflictDetails: {
              conflictingAppointmentId: appointment.id,
              conflictingAppointmentTime: appointment.time,
              conflictingAppointmentType: appointment.consultationType
            }
          };
        }
      }
    }
    
    console.log(`✅ No conflicts found for Doctor ID ${doctorId} - Available for ${requestedDate} at ${requestedTime}`);
    return { hasConflict: false };
  } catch (error) {
    console.error(`Error checking doctor conflict for ${doctorId}:`, error);
    return {
      hasConflict: true,
      conflictReason: 'Error checking doctor availability'
    };
  }
};

/**
 * Main function: Get available doctors for appointment booking
 * 
 * @param date - Appointment date in YYYY-MM-DD format
 * @param time - Appointment time in HH:MM format
 * @param mode - Appointment type: 'home', 'virtual', or 'clinic'
 * @returns SchedulingResult with available doctors and conflict details
 */
export const getAvailableDoctors = async (
  date: string,
  time: string,
  mode: 'home' | 'virtual' | 'clinic'
): Promise<SchedulingResult> => {
  try {
    // Validate input parameters
    if (!date || !time || !mode) {
      throw new Error('Date, time, and mode are required parameters');
    }
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      throw new Error('Date must be in YYYY-MM-DD format');
    }
    
    // Validate time format
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(time)) {
      throw new Error('Time must be in HH:MM format');
    }
    
    // Validate mode
    if (!['home', 'virtual', 'clinic'].includes(mode)) {
      throw new Error('Mode must be one of: home, virtual, clinic');
    }
    
    // Fetch all approved doctors
    console.log(`\n🔍 Fetching approved doctors for appointment on ${date} at ${time} (${mode} visit)...`);
    const allDoctors = await getApprovedDoctors();
    
    if (allDoctors.length === 0) {
      console.warn('⚠️ No approved doctors found in the database!');
      return {
        availableDoctors: [],
        totalDoctors: 0,
        availableCount: 0,
        unavailableCount: 0
      };
    }
    
    // For proximity, we need patient location. Assume patient info is available in the appointment context (or pass as argument if needed)
    // For now, fallback to doctor locality/city and set distance to null if not computable
    // If you have patient location, replace the nulls with actual distance calculation
    const patientLocation = null; // TODO: Pass patient location if available

    const availabilityPromises = allDoctors.map(async (doctor): Promise<AvailabilityResult> => {
      const conflictCheck = await checkDoctorConflict(doctor.id, date, time, mode);
      // Locality: prefer doctor.locality, fallback to doctor.address?.city or area
      let locality = (doctor as any).locality || (doctor.address && (doctor.address.area || doctor.address.city)) || '';
      // Distance: if patientLocation and doctor.address available, calculate, else null
      let distance: number | null = null;
      // TODO: If patientLocation is available, use geocoding/haversine here
      // Example: distance = await getDistanceBetweenLocations(patientLocation, doctor.address)

      return {
        doctorId: doctor.id,
        doctorName: doctor.name,
        specialization: doctor.specialization,
        isAvailable: !conflictCheck.hasConflict,
        conflictReason: conflictCheck.conflictReason,
        conflictDetails: conflictCheck.conflictDetails,
        locality,
        distance
      };
    });

    let availabilityResults = await Promise.all(availabilityPromises);

    // Sort: available first, then unavailable; within each, by distance (ascending, nulls last)
    availabilityResults = availabilityResults.sort((a, b) => {
      if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
      if (a.distance == null && b.distance != null) return 1;
      if (a.distance != null && b.distance == null) return -1;
      if (a.distance != null && b.distance != null) return a.distance - b.distance;
      return 0;
    });

    const availableDoctors = availabilityResults.filter(result => result.isAvailable);
    const unavailableDoctors = availabilityResults.filter(result => !result.isAvailable);

    return {
      availableDoctors: availabilityResults,
      totalDoctors: allDoctors.length,
      availableCount: availableDoctors.length,
      unavailableCount: unavailableDoctors.length
    };
    
  } catch (error) {
    console.error('Error in getAvailableDoctors:', error);
    throw new Error(`Failed to get available doctors: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Helper function to get only available doctors (filtered list)
 */
export const getOnlyAvailableDoctors = async (
  date: string,
  time: string,
  mode: 'home' | 'virtual' | 'clinic'
): Promise<AvailabilityResult[]> => {
  const result = await getAvailableDoctors(date, time, mode);
  return result.availableDoctors.filter(doctor => doctor.isAvailable);
};

/**
 * Helper function to validate appointment scheduling rules
 */
export const validateAppointmentScheduling = (
  appointmentType: 'home' | 'virtual' | 'clinic',
  appointmentTime: string
): {
  isValid: boolean;
  blockingPeriod: {
    start: string;
    end: string;
    durationMinutes: number;
  };
  rule: ConflictRule;
} => {
  const rule = getConflictRule(appointmentType);
  const { startTime, endTime } = calculateBlockedTimeRange(appointmentTime, appointmentType);
  
  return {
    isValid: true,
    blockingPeriod: {
      start: minutesToTimeString(startTime),
      end: minutesToTimeString(endTime),
      durationMinutes: endTime - startTime
    },
    rule
  };
};

/**
 * Demo function to test the scheduling rules
 */
export const demonstrateSchedulingRules = () => {
  console.log('\n📋 Updated Appointment Scheduling Rules:');
  console.log('=========================================');
  
  CONFLICT_RULES.forEach(rule => {
    console.log(`\n${rule.visitType.toUpperCase()} VISITS:`);
    if (rule.blockBefore === 0 && rule.blockAfter === 0) {
      console.log(`  - Only blocks the exact appointment time`);
      console.log(`  - No buffer time before or after`);
      console.log(`  - Multiple ${rule.visitType} appointments can be scheduled back-to-back`);
    } else {
      console.log(`  - Blocks ${rule.blockBefore} minutes before appointment`);
      console.log(`  - Blocks ${rule.blockAfter} minutes after appointment`);
      console.log(`  - Total blocking duration: ${rule.blockBefore + rule.blockAfter} minutes`);
    }
    
    // Example with 10:00 AM appointment
    const exampleTime = '10:00';
    const { blockingPeriod } = validateAppointmentScheduling(rule.visitType, exampleTime);
    if (rule.blockBefore === 0 && rule.blockAfter === 0) {
      console.log(`  - Example: ${exampleTime} ${rule.visitType} visit only blocks exactly ${exampleTime}`);
    } else {
      console.log(`  - Example: ${exampleTime} ${rule.visitType} visit blocks ${blockingPeriod.start} - ${blockingPeriod.end}`);
    }
  });
  
  console.log('\n📌 Updated Key Rules:');
  console.log('  1. HOME visits block 1 hour before and after (total 2+ hours)');
  console.log('  2. VIRTUAL visits block only the exact appointment time');
  console.log('  3. CLINICAL visits block only the exact appointment time');
  console.log('  4. Exact time conflicts are not allowed (highest priority)');
  console.log('  5. Virtual/Clinical appointments can be scheduled back-to-back');
};

export default {
  getAvailableDoctors,
  getOnlyAvailableDoctors,
  validateAppointmentScheduling,
  demonstrateSchedulingRules
};
