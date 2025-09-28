const mongoose = require('mongoose');
const { getAsync, setAsync, delAsync, DEFAULT_CACHE_TTL } = require('../config/redis');

const doctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    specialization: { type: String, required: true },
    availability: [{
        day: String,
        slots: [{
            startTime: String,
            endTime: String,
            isBooked: { type: Boolean, default: false }
        }]
    }]
});

// Cache methods
doctorSchema.statics.getCachedSchedule = async function(doctorId) {
    const cacheKey = `doctor:${doctorId}:schedule`;
    
    // Try getting from cache
    const cachedSchedule = await getAsync(cacheKey);
    if (cachedSchedule) {
        return JSON.parse(cachedSchedule);
    }

    // If not in cache, get from DB
    const schedule = await this.findById(doctorId)
        .select('availability')
        .lean();

    if (schedule) {
        // Cache the result
        await setAsync(cacheKey, JSON.stringify(schedule), 'EX', DEFAULT_CACHE_TTL);
    }

    return schedule;
};

doctorSchema.statics.invalidateScheduleCache = async function(doctorId) {
    const cacheKey = `doctor:${doctorId}:schedule`;
    await delAsync(cacheKey);
};

// Optimize availability check
doctorSchema.methods.isSlotAvailable = async function(slotDate, startTime) {
    const day = new Date(slotDate).toLocaleDateString('en-US', { weekday: 'long' });
    
    const daySchedule = this.availability.find(a => a.day === day);
    if (!daySchedule) return false;

    const slot = daySchedule.slots.find(s => 
        s.startTime === startTime && !s.isBooked
    );

    return !!slot;
};

// Bulk availability check for better performance
doctorSchema.statics.getAvailableDoctors = async function(date, startTime) {
    const day = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    
    return this.find({
        'availability.day': day,
        'availability.slots': {
            $elemMatch: {
                startTime: startTime,
                isBooked: false
            }
        }
    }).select('name specialization').lean();
};

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor;