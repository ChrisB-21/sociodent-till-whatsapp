/**
 * Doctor Weekly Schedule Generator
 * Generates weekly schedules for doctors based on predefined constraints
 */

export interface ScheduleEntry {
  day: string;
  shift_time: string;
  doctor: string;
  type: 'Clinic' | 'Home Visit';
}

export interface DoctorShift {
  doctorName: string;
  dayOfWeek: string;
  shiftType: 'Morning' | 'Evening';
  startTime: string;
  endTime: string;
  type: 'Clinic' | 'Home Visit';
}

// Doctor names as defined in requirements
const DOCTORS = ['dhanush', 'suriya', 'ram', 'siva'];

// Days of the week
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const SATURDAY = 'Saturday';
const DAYS_OF_WEEK = [...WEEKDAYS, SATURDAY];

// Working hours constraints
const WEEKDAY_HOURS = {
  MORNING: { start: '8:00 AM', end: '2:00 PM' },
  EVENING: { start: '2:00 PM', end: '8:00 PM' }
};

const SATURDAY_HOURS = {
  MORNING: { start: '9:00 AM', end: '1:00 PM' },
  EVENING: { start: '1:00 PM', end: '5:00 PM' }
};

// Home visit hours (outside clinic shifts)
const HOME_VISIT_HOURS = {
  WEEKDAY: { start: '6:00 PM', end: '9:00 PM' },
  SATURDAY: { start: '5:30 PM', end: '8:00 PM' }
};

/**
 * Converts 12-hour time format to minutes for easier calculation
 */
function timeToMinutes(time: string): number {
  const [timePart, meridiem] = time.split(' ');
  const [hours, minutes] = timePart.split(':').map(Number);
  let totalMinutes = hours * 60 + minutes;
  
  if (meridiem === 'PM' && hours !== 12) {
    totalMinutes += 12 * 60;
  } else if (meridiem === 'AM' && hours === 12) {
    totalMinutes = minutes;
  }
  
  return totalMinutes;
}

/**
 * Converts minutes back to 12-hour time format
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${mins.toString().padStart(2, '0')} ${meridiem}`;
}

/**
 * Generates a balanced rotation schedule ensuring fair distribution
 */
function generateRotation(totalSlots: number, doctorCount: number): number[] {
  const rotation: number[] = [];
  let currentDoctor = 0;
  
  for (let i = 0; i < totalSlots; i++) {
    rotation.push(currentDoctor);
    currentDoctor = (currentDoctor + 1) % doctorCount;
  }
  
  return rotation;
}

/**
 * Creates a shift time string from start and end times
 */
function createShiftTime(startTime: string, endTime: string): string {
  // Convert to shorter format for display
  const start = startTime.replace(':00', '').replace(' ', '');
  const end = endTime.replace(':00', '').replace(' ', '');
  return `${start}–${end}`;
}

/**
 * Generates clinic shifts for all days
 */
function generateClinicShifts(): ScheduleEntry[] {
  const clinicShifts: ScheduleEntry[] = [];
  
  // Calculate total clinic shifts (weekdays: 2 shifts each, Saturday: 2 shifts)
  const totalClinicShifts = WEEKDAYS.length * 2 + 2; // 5 weekdays * 2 + Saturday * 2 = 12 shifts
  const doctorRotation = generateRotation(totalClinicShifts, DOCTORS.length);
  
  let shiftIndex = 0;
  
  // Generate weekday shifts
  for (const day of WEEKDAYS) {
    // Morning shift
    const morningDoctorIndex = doctorRotation[shiftIndex++];
    clinicShifts.push({
      day,
      shift_time: createShiftTime(WEEKDAY_HOURS.MORNING.start, WEEKDAY_HOURS.MORNING.end),
      doctor: DOCTORS[morningDoctorIndex],
      type: 'Clinic'
    });
    
    // Evening shift
    const eveningDoctorIndex = doctorRotation[shiftIndex++];
    clinicShifts.push({
      day,
      shift_time: createShiftTime(WEEKDAY_HOURS.EVENING.start, WEEKDAY_HOURS.EVENING.end),
      doctor: DOCTORS[eveningDoctorIndex],
      type: 'Clinic'
    });
  }
  
  // Generate Saturday shifts
  const satMorningDoctorIndex = doctorRotation[shiftIndex++];
  clinicShifts.push({
    day: SATURDAY,
    shift_time: createShiftTime(SATURDAY_HOURS.MORNING.start, SATURDAY_HOURS.MORNING.end),
    doctor: DOCTORS[satMorningDoctorIndex],
    type: 'Clinic'
  });
  
  const satEveningDoctorIndex = doctorRotation[shiftIndex++];
  clinicShifts.push({
    day: SATURDAY,
    shift_time: createShiftTime(SATURDAY_HOURS.EVENING.start, SATURDAY_HOURS.EVENING.end),
    doctor: DOCTORS[satEveningDoctorIndex],
    type: 'Clinic'
  });
  
  return clinicShifts;
}

/**
 * Generates home visit slots for all doctors for all days
 */
function generateHomeVisitSlots(): ScheduleEntry[] {
  const homeVisitSlots: ScheduleEntry[] = [];
  
  // Each doctor gets one home visit slot per day
  for (const day of DAYS_OF_WEEK) {
    const isWeekday = WEEKDAYS.includes(day);
    const homeVisitHours = isWeekday ? HOME_VISIT_HOURS.WEEKDAY : HOME_VISIT_HOURS.SATURDAY;
    
    for (const doctor of DOCTORS) {
      homeVisitSlots.push({
        day,
        shift_time: createShiftTime(homeVisitHours.start, homeVisitHours.end),
        doctor,
        type: 'Home Visit'
      });
    }
  }
  
  return homeVisitSlots;
}

/**
 * Validates that no doctor has overlapping shifts
 */
function validateSchedule(schedule: ScheduleEntry[]): { isValid: boolean; conflicts: string[] } {
  const conflicts: string[] = [];
  const doctorDayShifts: Record<string, Record<string, { start: number; end: number; type: string }[]>> = {};
  
  // Group shifts by doctor and day
  for (const entry of schedule) {
    if (!doctorDayShifts[entry.doctor]) {
      doctorDayShifts[entry.doctor] = {};
    }
    if (!doctorDayShifts[entry.doctor][entry.day]) {
      doctorDayShifts[entry.doctor][entry.day] = [];
    }
    
    const [startTime, endTime] = entry.shift_time.split('–');
    const start = timeToMinutes(startTime.replace(/([AP]M)/, ' $1'));
    const end = timeToMinutes(endTime.replace(/([AP]M)/, ' $1'));
    
    doctorDayShifts[entry.doctor][entry.day].push({
      start,
      end,
      type: `${entry.type} (${entry.shift_time})`
    });
  }
  
  // Check for overlaps
  for (const doctor of Object.keys(doctorDayShifts)) {
    for (const day of Object.keys(doctorDayShifts[doctor])) {
      const shifts = doctorDayShifts[doctor][day];
      
      for (let i = 0; i < shifts.length; i++) {
        for (let j = i + 1; j < shifts.length; j++) {
          const shift1 = shifts[i];
          const shift2 = shifts[j];
          
          // Check for overlap
          if (shift1.start < shift2.end && shift2.start < shift1.end) {
            conflicts.push(
              `${doctor} has overlapping shifts on ${day}: ${shift1.type} and ${shift2.type}`
            );
          }
        }
      }
    }
  }
  
  return {
    isValid: conflicts.length === 0,
    conflicts
  };
}

/**
 * Generates a complete weekly schedule for all doctors
 */
export function generateWeeklySchedule(): {
  schedule: ScheduleEntry[];
  validation: { isValid: boolean; conflicts: string[] };
  summary: {
    totalShifts: number;
    clinicShifts: number;
    homeVisitSlots: number;
    shiftsPerDoctor: Record<string, number>;
  };
} {
  // Generate clinic shifts with rotation
  const clinicShifts = generateClinicShifts();
  
  // Generate home visit slots (one per doctor per day)
  const homeVisitSlots = generateHomeVisitSlots();
  
  // Combine all shifts
  const fullSchedule = [...clinicShifts, ...homeVisitSlots];
  
  // Sort by day and time for better readability
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  fullSchedule.sort((a, b) => {
    const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
    if (dayDiff !== 0) return dayDiff;
    
    // Sort by time within the same day
    const aStart = timeToMinutes(a.shift_time.split('–')[0].replace(/([AP]M)/, ' $1'));
    const bStart = timeToMinutes(b.shift_time.split('–')[0].replace(/([AP]M)/, ' $1'));
    
    return aStart - bStart;
  });
  
  // Validate the schedule
  const validation = validateSchedule(fullSchedule);
  
  // Generate summary
  const shiftsPerDoctor: Record<string, number> = {};
  for (const doctor of DOCTORS) {
    shiftsPerDoctor[doctor] = fullSchedule.filter(shift => shift.doctor === doctor).length;
  }
  
  const summary = {
    totalShifts: fullSchedule.length,
    clinicShifts: clinicShifts.length,
    homeVisitSlots: homeVisitSlots.length,
    shiftsPerDoctor
  };
  
  return {
    schedule: fullSchedule,
    validation,
    summary
  };
}

/**
 * Formats the schedule for display or export
 */
export function formatScheduleForDisplay(schedule: ScheduleEntry[]): string {
  let output = 'Weekly Doctor Schedule\n';
  output += '='.repeat(50) + '\n\n';
  
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  for (const day of dayOrder) {
    const dayShifts = schedule.filter(shift => shift.day === day);
    if (dayShifts.length === 0) continue;
    
    output += `${day}\n`;
    output += '-'.repeat(day.length) + '\n';
    
    // Group by type
    const clinicShifts = dayShifts.filter(shift => shift.type === 'Clinic');
    const homeVisits = dayShifts.filter(shift => shift.type === 'Home Visit');
    
    if (clinicShifts.length > 0) {
      output += 'Clinic Shifts:\n';
      for (const shift of clinicShifts) {
        output += `  ${shift.shift_time}: Dr. ${shift.doctor}\n`;
      }
    }
    
    if (homeVisits.length > 0) {
      output += 'Home Visits:\n';
      for (const visit of homeVisits) {
        output += `  ${visit.shift_time}: Dr. ${visit.doctor}\n`;
      }
    }
    
    output += '\n';
  }
  
  return output;
}

/**
 * Gets schedule for a specific doctor
 */
export function getDoctorSchedule(schedule: ScheduleEntry[], doctorName: string): ScheduleEntry[] {
  return schedule.filter(shift => shift.doctor === doctorName);
}

/**
 * Gets schedule for a specific day
 */
export function getDaySchedule(schedule: ScheduleEntry[], day: string): ScheduleEntry[] {
  return schedule.filter(shift => shift.day === day);
}

/**
 * Exports schedule as JSON
 */
export function exportScheduleAsJSON(schedule: ScheduleEntry[]): string {
  return JSON.stringify(schedule, null, 2);
}
