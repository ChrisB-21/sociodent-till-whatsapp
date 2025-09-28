const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const { setExAsync, getAsync, delAsync, DEFAULT_CACHE_TTL } = require('../config/redis');

class AppointmentService {
    constructor() {
        this.CACHE_KEYS = {
            doctorSchedule: (doctorId) => `doctor:${doctorId}:schedule`,
            appointmentList: (doctorId, date) => `appointments:${doctorId}:${date}`
        };
    }

    async getDoctorSchedule(doctorId, date) {
        try {
            // Get cached schedule
            const schedule = await Doctor.getCachedSchedule(doctorId);
            if (!schedule) {
                throw new Error('Doctor schedule not found');
            }

            // Get appointments for the specific date
            const appointments = await this.getAppointmentsForDate(doctorId, date);
            
            // Merge schedule with appointments
            return this.mergeScheduleWithAppointments(schedule, appointments, date);
        } catch (error) {
            console.error('Error getting doctor schedule:', error);
            throw error;
        }
    }

    async bookAppointment(doctorId, patientId, date, startTime) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Check availability using optimized method
            const doctor = await Doctor.findById(doctorId);
            const isAvailable = await doctor.isSlotAvailable(date, startTime);

            if (!isAvailable) {
                throw new Error('Time slot not available');
            }

            // Create appointment
            const appointment = await Appointment.create([{
                doctorId,
                patientId,
                date,
                startTime,
                status: 'confirmed'
            }], { session });

            // Update doctor's schedule
            await this.updateDoctorSchedule(doctorId, date, startTime, session);

            // Invalidate relevant caches
            await Promise.all([
                Doctor.invalidateScheduleCache(doctorId),
                this.invalidateAppointmentCache(doctorId, date)
            ]);

            await session.commitTransaction();
            return appointment[0];
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async getAppointmentsForDate(doctorId, date) {
        const cacheKey = this.CACHE_KEYS.appointmentList(doctorId, date);
        
        // Try cache first
        const cachedAppointments = await getAsync(cacheKey);
        if (cachedAppointments) {
            return JSON.parse(cachedAppointments);
        }

        // Get from DB if not in cache
        const appointments = await Appointment.find({
            doctorId,
            date,
            status: { $ne: 'cancelled' }
        }).lean();

        // Cache the results
        await setExAsync(cacheKey, JSON.stringify(appointments), DEFAULT_CACHE_TTL);

        return appointments;
    }

    async updateDoctorSchedule(doctorId, date, startTime, session) {
        const day = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
        
        await Doctor.findOneAndUpdate(
            {
                _id: doctorId,
                'availability.day': day,
                'availability.slots.startTime': startTime
            },
            {
                $set: {
                    'availability.$.slots.$[slot].isBooked': true
                }
            },
            {
                arrayFilters: [{ 'slot.startTime': startTime }],
                session
            }
        );
    }

    async invalidateAppointmentCache(doctorId, date) {
        const cacheKey = this.CACHE_KEYS.appointmentList(doctorId, date);
        await delAsync(cacheKey);
    }

    mergeScheduleWithAppointments(schedule, appointments, date) {
        const daySchedule = schedule.availability.find(a => 
            a.day === new Date(date).toLocaleDateString('en-US', { weekday: 'long' })
        );

        if (!daySchedule) return null;

        return {
            ...schedule,
            availability: [{
                ...daySchedule,
                slots: daySchedule.slots.map(slot => ({
                    ...slot,
                    isBooked: slot.isBooked || appointments.some(apt => 
                        apt.startTime === slot.startTime
                    )
                }))
            }]
        };
    }
}

module.exports = new AppointmentService();