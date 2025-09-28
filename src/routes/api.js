const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const appointmentController = require('../controllers/appointmentController');
const authController = require('../controllers/authController');

// Auth routes
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.post('/auth/refresh-token', authController.refreshToken);
router.post('/auth/logout', auth, authController.logout);

// Appointment routes
router.get('/doctors/:doctorId/schedule/:date', auth, appointmentController.getDoctorSchedule);
router.post('/appointments', auth, appointmentController.bookAppointment);
router.get('/doctors/available', auth, appointmentController.getAvailableDoctors);

// Protected routes with role-based authorization
router.get('/admin/appointments', 
    auth, 
    authorize('admin'), 
    appointmentController.getAvailableDoctors
);

module.exports = router;