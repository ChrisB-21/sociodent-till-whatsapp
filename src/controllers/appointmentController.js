const appointmentService = require('../services/appointmentService');
const { validateAppointmentData } = require('../utils/validation');

class AppointmentController {
    async getDoctorSchedule(req, res) {
        try {
            const { doctorId, date } = req.params;
            
            const schedule = await appointmentService.getDoctorSchedule(doctorId, date);
            
            if (!schedule) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Schedule not found' 
                });
            }

            res.json({
                success: true,
                data: schedule
            });
        } catch (error) {
            console.error('Get schedule error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error fetching schedule' 
            });
        }
    }

    async bookAppointment(req, res) {
        try {
            const { doctorId, patientId, date, startTime } = req.body;

            // Validate appointment data
            const validationError = validateAppointmentData(req.body);
            if (validationError) {
                return res.status(400).json({
                    success: false,
                    message: validationError
                });
            }

            const appointment = await appointmentService.bookAppointment(
                doctorId,
                patientId,
                date,
                startTime
            );

            res.status(201).json({
                success: true,
                data: appointment
            });
        } catch (error) {
            console.error('Booking error:', error);
            
            if (error.message === 'Time slot not available') {
                return res.status(409).json({
                    success: false,
                    message: 'This time slot is no longer available'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error booking appointment'
            });
        }
    }

    async getAvailableDoctors(req, res) {
        try {
            const { date, startTime } = req.query;
            
            const doctors = await Doctor.getAvailableDoctors(date, startTime);
            
            res.json({
                success: true,
                data: doctors
            });
        } catch (error) {
            console.error('Error getting available doctors:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching available doctors'
            });
        }
    }
}

module.exports = new AppointmentController();