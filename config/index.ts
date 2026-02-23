import debugModule from "debug";
import {DataStore} from "be-datastore";
import jayson from "jayson/promise";
import redis from "redis";

import dotenv from 'dotenv';
import http from 'http';

dotenv.config();

const REDIS_SERVER = (process.env.REDIS_SERVER || ":").split(":");
export const REDIS_HOST = REDIS_SERVER[0];
export const REDIS_PORT = parseInt(REDIS_SERVER[1]);
export const TTL_MIN = Number(process.env.TTL_MIN) || 3600;
export const TTL_MAX = Number(process.env.TTL_MAX) || 31556952;
export const DB_TYPE = process.env.DATABASE_TYPE;
export const DB_URL = `${process.env.DATABASE_SERVER}/${process.env.DATABASE}`;
export const HARVESTER = `${process.env.HARVESTER}`;
export const host = `${process.env.HOST}`;
export const port = Number(process.env.PORT);

const debug = debugModule("be-api:config");

const client = redis.createClient(REDIS_PORT, REDIS_HOST);
client.on('error', (error: any) => {
    debug(error.message);
});
client.on('ready', (error: any) => {
    debug('Redis client Ready');
});

const subscriber = redis.createClient(REDIS_PORT, REDIS_HOST);
subscriber.on('error', (error: any) => {
    debug(error.message);
});
subscriber.on('ready', (error: any) => {
    debug('Redis subscriber Ready');
});

export {client as redis};
export {subscriber};

const harvesterUrl = new URL(process.env.HARVESTER || 'http://localhost:5000');

const keepAliveAgent = new http.Agent({
    keepAlive: true,
    maxSockets: 100,      // Max concurrent sockets to the server
    maxFreeSockets: 10,  // How many to keep open while idle
    timeout: 60000       // 1 minute timeout
});

export const harvester = jayson.client.http({
    host: harvesterUrl.hostname,
    port: Number(harvesterUrl.port) || 80,
    path: harvesterUrl.pathname,
    agent: keepAliveAgent
});

// export const harvester = jayson.client.http(HARVESTER as any);

export const cacheCleanupSecret = process.env.CACHE_CLEANUP_SECRET;
export const dataStore = {
    store: null as DataStore | null,
    getStore: async function () {
        if (!this.store) {
            this.store = new DataStore(DB_TYPE || 'pg', DB_URL, REDIS_HOST, REDIS_PORT, TTL_MIN, TTL_MAX);
            await this.store.connect();
        }
        return this.store;
    }
};
