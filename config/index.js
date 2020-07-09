const debug  = require("debug")("be-api:config"),
      dotenv = require('dotenv'),
      Store  = require("be-datastore"),
      jayson = require("jayson/promise"),
      redis  = require("redis");

dotenv.config({path: `${__dirname}/../.env`});

const REDIS_SERVER = process.env.REDIS_SERVER.split(":");
const REDIS_HOST   = REDIS_SERVER[0];
const REDIS_PORT   = REDIS_SERVER[1];
const DB_TYPE      = process.env.DATABASE_TYPE;
const DB_URL       = `${process.env.DATABASE_SERVER}/${process.env.DATABASE}`;
const TTL_MIN      = process.env.TTL_MIN;
const TTL_MAX      = process.env.TTL_MAX;

const client = new redis.createClient(REDIS_PORT, REDIS_HOST);
client.on('error', (error) => {
    debug(error.message);
});
client.on('ready', (error) => {
    debug('Redis client Ready');
});

const subscriber = new redis.createClient(REDIS_PORT, REDIS_HOST);
subscriber.on('error', (error) => {
    debug(error.message);
});
subscriber.on('ready', (error) => {
    debug('Redis subscriber Ready');
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
            this.store = await Store.DataStore(DB_TYPE, DB_URL, REDIS_HOST, REDIS_PORT, TTL_MIN, TTL_MAX);
        }
        return this.store;
    }
};