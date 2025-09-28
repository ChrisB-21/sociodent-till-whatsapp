const Redis = require('redis');
const { promisify } = require('util');

const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    retry_strategy: function(options) {
        if (options.error && options.error.code === 'ECONNREFUSED') {
            return new Error('The server refused the connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
            return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
    }
};

const client = Redis.createClient(redisConfig);

// Promisify Redis commands
const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);
const delAsync = promisify(client.del).bind(client);
const setExAsync = promisify(client.setex).bind(client);

client.on('error', (err) => console.error('Redis Client Error:', err));
client.on('connect', () => console.log('Redis Client Connected'));

module.exports = {
    client,
    getAsync,
    setAsync,
    delAsync,
    setExAsync,
    DEFAULT_CACHE_TTL: 3600 // 1 hour in seconds
};