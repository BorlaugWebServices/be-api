const nconf    = require("nconf"),
      path     = require("path"),
      jayson   = require("jayson/promise");

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
const watcher    = jayson.client.http(nconf.get('watcher'));

client.on('error', (error) => {
    console.error('Client', error.message);
});
client.on('connectionError', (error) => {
    console.error(error.message);
});
client.on('connect', () => {
    console.info('Client Successfully connected to redis');
});
client.on('fullReady', () => {
    console.info('Successfully connected to redis and ready');
});

subscriber.on('error', (error) => {
    console.error('Subscriber', error.message);
});
subscriber.on('connectionError', (error) => {
    console.error(error.message);
});
subscriber.on('connect', () => {
    console.info('Subscriber Successfully connected to redis');
});
client.on('fullReady', () => {
    console.info('Successfully connected to redis and ready');
});

module.exports            = nconf;
module.exports.redis      = client;
module.exports.subscriber = subscriber;
module.exports.watcher    = watcher;