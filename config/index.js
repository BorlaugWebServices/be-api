const debug = require("debug")("be-api:config");

const nconf  = require("nconf"),
      path   = require("path"),
      jayson = require("jayson/promise");

const Store = require("be-datastore");

let configPath = path.join(__dirname, '../config');
nconf.env().argv();
nconf.file({file: path.join(configPath, "env.json")});

const RedisClient = require("redis");
const RedisClustr = require("redis-clustr");

const client     = new RedisClustr({
    servers: nconf.get("redisCluster"),
    createClient: function(port, host) {
        // this is the default behaviour
        return RedisClient.createClient(port, host);
    }
});
const subscriber = new RedisClustr({
    servers: nconf.get("redisCluster"),
    createClient: function(port, host) {
        // this is the default behaviour
        return RedisClient.createClient(port, host);
    }
});
const harvester  = jayson.client.http(nconf.get('harvester'));

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

subscriber.on('error', (error) => {
    debug('Subscriber', error.message);
});
subscriber.on('connectionError', (error) => {
    debug(error.message);
});
subscriber.on('connect', () => {
    debug('Subscriber Successfully connected to redis');
});
client.on('fullReady', () => {
    debug('Successfully connected to redis and ready');
});

module.exports            = nconf;
module.exports.redis      = client;
module.exports.subscriber = subscriber;
module.exports.harvester  = harvester;
module.exports.dataStore  = {
    store: null,
    getStore: async function() {
        if(!this.store) {
            this.store = await Store.DataStore(nconf.get('db:type'), nconf.get('db:url'), nconf.get('cache:redisHosts'), nconf.get('cache:redisPorts'));
        }
        return this.store;
    }
};