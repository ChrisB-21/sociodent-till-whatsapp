const authService = require('../services/authService');

class AuthController {
    async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }

            const authData = await authService.login(email, password);

            res.json({
                success: true,
                data: authData
            });
        } catch (error) {
            console.error('Login error:', error);

            if (error.message === 'User not found' || error.message === 'Invalid password') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error during login'
            });
        }
    }

    async register(req, res) {
        try {
            const userData = req.body;

            const authData = await authService.register(userData);

            res.status(201).json({
                success: true,
                data: authData
            });
        } catch (error) {
            console.error('Registration error:', error);

            if (error.message === 'Email already registered') {
                return res.status(409).json({
                    success: false,
                    message: 'Email already registered'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error during registration'
            });
        }
    }

    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Refresh token is required'
                });
            }

            const tokens = await authService.refreshToken(refreshToken);

            res.json({
                success: true,
                data: tokens
            });
        } catch (error) {
            console.error('Token refresh error:', error);
            res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }
    }

    async logout(req, res) {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            const userId = req.user.userId;

            await authService.logout(userId, token);

            res.json({
                success: true,
                message: 'Logged out successfully'
            });
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                success: false,
                message: 'Error during logout'
            });
        }
    }
}

module.exports = new AuthController();