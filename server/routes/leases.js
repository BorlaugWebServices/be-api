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

    let lease = await getLease(leaseid);

    return res.status(200).send(lease).end();
});

router.get('/:leaseid/activities', async (req, res) => {
    let leaseid = req.params.leaseid;
    debug(`GET - /leases/${leaseid}/activities`);

    if(!LEASE_ID_PATTERN.test(leaseid)) {
        return res.status(404).send({msg: `Invalid lease id`}).end();
    }

    let activityKeys = await lrange(`lease:${leaseid}:activities`, 0, -1);
    let activities = await transactions.getTransactions(activityKeys);

    return res.status(200).send(activities).end();
});

const getLease = async function(leaseid) {
    let lease = await get(`lease:${leaseid}`);
    lease     = JSON.parse(lease);
    return lease;
};

module.exports.getLease = getLease;
module.exports.router   = router;