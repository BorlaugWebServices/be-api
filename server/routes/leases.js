/**
 * Copyright (c) 2020 All Right Reserved, BWS
 */
const debug       = require("debug")("api:leases"),
      express     = require("express"),
      _           = require('lodash'),
      {promisify} = require("util");

const config       = require("../../config");
const transactions = require("./transactions");

const router = express.Router();

const get    = promisify(config.redis.get).bind(config.redis);
const lrange = promisify(config.redis.lrange).bind(config.redis);

const LEASE_ID_PATTERN = RegExp('^[0-9]*$');

router.get('/:leaseid', async (req, res) => {
    let leaseid = req.params.leaseid;
    debug(`GET - /leases/${leaseid}`);

    if(!LEASE_ID_PATTERN.test(leaseid)) {
        return res.status(404).send({msg: `Invalid lease id`}).end();
    }

    try {
        const store = await config.dataStore.getStore();
        let lease   = await store.lease.get(leaseid);

        return res.status(200).send(lease).end();
    } catch(e) {
        debug(e);
        return res.status(200).send({
            err: e,
            msg: "Internal Server Error"
        }).end();
    }
});

router.get('/:leaseid/activities', async (req, res) => {
    let leaseid = req.params.leaseid;
    debug(`GET - /leases/${leaseid}/activities`);

    if(!LEASE_ID_PATTERN.test(leaseid)) {
        return res.status(404).send({msg: `Invalid lease id`}).end();
    }

    try {
        const store = await config.dataStore.getStore();

        let activityKeys = await store.lease.getActivities(leaseid);
        let activities   = await store.transaction.getList(activityKeys);

        return res.status(200).send(activities).end();
    } catch(e) {
        debug(e);
        return res.status(200).send({
            err: e,
            msg: "Internal Server Error"
        }).end();
    }
});

module.exports = router;