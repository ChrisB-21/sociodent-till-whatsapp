const jwt = require('jsonwebtoken');
const { getAsync, setExAsync } = require('./redis');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const TOKEN_CACHE_PREFIX = 'token:';
const REFRESH_CACHE_PREFIX = 'refresh:';

class JWTService {
    constructor() {
        this.tokenBlacklist = new Set();
    }

    async generateTokenPair(userId, userRole) {
        const tokenPayload = { userId, userRole };
        const refreshPayload = { userId, tokenVersion: Date.now() };

        const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
        const refreshToken = jwt.sign(refreshPayload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });

        // Cache the tokens
        await Promise.all([
            this.cacheToken(userId, accessToken),
            this.cacheRefreshToken(userId, refreshToken)
        ]);

        return { accessToken, refreshToken };
    }

    async verifyToken(token) {
        try {
            if (this.tokenBlacklist.has(token)) {
                throw new Error('Token is blacklisted');
            }

            const decoded = jwt.verify(token, JWT_SECRET);
            
            // Check if token is in cache
            const cachedToken = await getAsync(`${TOKEN_CACHE_PREFIX}${decoded.userId}`);
            if (cachedToken !== token) {
                throw new Error('Token is not in cache');
            }

            return decoded;
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    async refreshAccessToken(refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
            
            // Verify refresh token in cache
            const cachedRefreshToken = await getAsync(`${REFRESH_CACHE_PREFIX}${decoded.userId}`);
            if (cachedRefreshToken !== refreshToken) {
                throw new Error('Invalid refresh token');
            }

            const newAccessToken = jwt.sign(
                { userId: decoded.userId },
                JWT_SECRET,
                { expiresIn: TOKEN_EXPIRY }
            );

            // Cache new access token
            await this.cacheToken(decoded.userId, newAccessToken);

            return newAccessToken;
        } catch (error) {
            throw new Error('Invalid refresh token');
        }
    }

    async invalidateToken(token) {
        try {
            const decoded = jwt.decode(token);
            if (decoded && decoded.userId) {
                await Promise.all([
                    this.removeTokenFromCache(decoded.userId),
                    this.blacklistToken(token)
                ]);
            }
        } catch (error) {
            console.error('Error invalidating token:', error);
        }
    }

    async cacheToken(userId, token) {
        await setExAsync(
            `${TOKEN_CACHE_PREFIX}${userId}`,
            token,
            parseInt(TOKEN_EXPIRY) * 60 // Convert minutes to seconds
        );
    }

    async cacheRefreshToken(userId, token) {
        await setExAsync(
            `${REFRESH_CACHE_PREFIX}${userId}`,
            token,
            7 * 24 * 60 * 60 // 7 days in seconds
        );
    }

    async removeTokenFromCache(userId) {
        await Promise.all([
            delAsync(`${TOKEN_CACHE_PREFIX}${userId}`),
            delAsync(`${REFRESH_CACHE_PREFIX}${userId}`)
        ]);
    }

    blacklistToken(token) {
        this.tokenBlacklist.add(token);
        // Remove from blacklist after expiry
        setTimeout(() => {
            this.tokenBlacklist.delete(token);
        }, parseInt(TOKEN_EXPIRY) * 60 * 1000);
    }
}

module.exports = new JWTService();