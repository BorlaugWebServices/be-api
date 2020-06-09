const debug       = require("debug")("be-api:config"),
      dotenv      = require('dotenv'),
      Store       = require("be-datastore"),
      jayson      = require("jayson/promise"),
      RedisClient = require("redis"),
      RedisClustr = require("redis-clustr");

dotenv.config({path: `${__dirname}/../.env`});

const REDIS_HOSTS = process.env.REDIS_HOSTS.split(',');
const REDIS_PORTS = process.env.REDIS_PORTS.split(',');
const servers     = [];

if(REDIS_HOSTS.length !== REDIS_PORTS.length) {
    throw new Error("Redis cluster config mismatch");
} else {
    for(let i = 0; i < REDIS_HOSTS.length; i++) {
        servers.push({host: REDIS_HOSTS[i], port: REDIS_PORTS[i]})
    }
}

const client = new RedisClustr({
    servers: servers,
    createClient: function(port, host) {
        return RedisClient.createClient(port, host);
    }
});

client.on('error', (error) => {
    debug(error.message);
});
client.on('connectionError', (error) => {
    debug(error.message);
});
client.on('connect', () => {
    debug('Client Successfully connected to redis');
});
client.on('fullReady', () => {
    debug('Successfully connected to redis and ready');
});

const subscriber = new RedisClustr({
    servers: servers,
    createClient: function(port, host) {
        return RedisClient.createClient(port, host);
    }
});

subscriber.on('error', (error) => {
    debug('Subscriber', error.message);
});
subscriber.on('connectionError', (error) => {
    debug(error.message);
});
subscriber.on('connect', () => {
    debug('Subscriber Successfully connected to redis');
});
subscriber.on('fullReady', () => {
    debug('Successfully connected to redis and ready');
});


module.exports.host               = process.env.HOST;
module.exports.port               = process.env.PORT;
module.exports.redis              = client;
module.exports.subscriber         = subscriber;
module.exports.harvester          = jayson.client.http(process.env.HARVESTER);
module.exports.cacheCleanupSecret = process.env.CACHE_CLEANUP_SECRET;
module.exports.dataStore          = {
    store: null,
    getStore: async function() {
        if(!this.store) {
            this.store = await Store.DataStore(process.env.DB_CONNECTION_TYPE, process.env.DB_CONNECTION_URL, REDIS_HOSTS, REDIS_PORTS);
        }
        return this.store;
    }
};