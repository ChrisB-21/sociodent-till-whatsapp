const User = require('../models/User');
const jwtService = require('../config/jwt');
const bcrypt = require('bcrypt');
const { getAsync, setExAsync } = require('../config/redis');

const USER_CACHE_PREFIX = 'user:';
const CACHE_TTL = 3600; // 1 hour

class AuthService {
    async login(email, password) {
        try {
            // Check cache first
            const cachedUser = await this.getCachedUser(email);
            const user = cachedUser || await User.findOne({ email });

            if (!user) {
                throw new Error('User not found');
            }

            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                throw new Error('Invalid password');
            }

            // Cache user data
            if (!cachedUser) {
                await this.cacheUser(user);
            }

            // Generate tokens
            const { accessToken, refreshToken } = await jwtService.generateTokenPair(
                user._id,
                user.role
            );

            return {
                user: this.sanitizeUser(user),
                accessToken,
                refreshToken
            };
        } catch (error) {
            throw error;
        }
    }

    async register(userData) {
        try {
            const { email, password, ...rest } = userData;

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                throw new Error('Email already registered');
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await User.create({
                ...rest,
                email,
                password: hashedPassword
            });

            // Cache new user
            await this.cacheUser(user);

            const { accessToken, refreshToken } = await jwtService.generateTokenPair(
                user._id,
                user.role
            );

            return {
                user: this.sanitizeUser(user),
                accessToken,
                refreshToken
            };
        } catch (error) {
            throw error;
        }
    }

    async refreshToken(refreshToken) {
        try {
            const newAccessToken = await jwtService.refreshAccessToken(refreshToken);
            return { accessToken: newAccessToken };
        } catch (error) {
            throw new Error('Invalid refresh token');
        }
    }

    async logout(userId, token) {
        try {
            await Promise.all([
                jwtService.invalidateToken(token),
                this.clearUserCache(userId)
            ]);
            return true;
        } catch (error) {
            console.error('Logout error:', error);
            return false;
        }
    }

    async getCachedUser(email) {
        const cachedUser = await getAsync(`${USER_CACHE_PREFIX}${email}`);
        return cachedUser ? JSON.parse(cachedUser) : null;
    }

    async cacheUser(user) {
        await setExAsync(
            `${USER_CACHE_PREFIX}${user.email}`,
            JSON.stringify(user),
            CACHE_TTL
        );
    }

    async clearUserCache(userId) {
        const user = await User.findById(userId);
        if (user) {
            await delAsync(`${USER_CACHE_PREFIX}${user.email}`);
        }
    }

    sanitizeUser(user) {
        const { password, ...userWithoutPassword } = user.toObject();
        return userWithoutPassword;
    }
}

module.exports = new AuthService();