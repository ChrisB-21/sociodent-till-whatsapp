import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: 3,
});

// General rate limiter
export const generalLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth specific rate limiter (more strict)
export const authLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 auth requests per windowMs
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Cache middleware
export const cacheMiddleware = async (req, res, next) => {
  try {
    const key = `cache:${req.originalUrl}`;
    const cachedResponse = await redis.get(key);
    
    if (cachedResponse) {
      return res.json(JSON.parse(cachedResponse));
    }
    
    res.sendResponse = res.json;
    res.json = async (body) => {
      await redis.set(key, JSON.stringify(body), 'EX', 300); // Cache for 5 minutes
      res.sendResponse(body);
    };
    
    next();
  } catch (error) {
    console.error('Cache middleware error:', error);
    next();
  }
};