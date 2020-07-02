/**
 * Copyright (c) 2020 All Right Reserved, BWS
 */
const debug   = require("debug")("be-api:leases"),
      _       = require("lodash"),
      express = require("express");

const config               = require("../../config");
const trx = require("./transactions");
const router               = express.Router();
const LEASE_ID_PATTERN     = RegExp('^[0-9]*$');

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

        /**** TEST ****/
        let calls = [];
        activities.forEach(act => {
            calls.push(trx.getTransactionStatus(act));
        });
        let [statuses] = await Promise.all(calls);
        activities.forEach((e, i, a) => {
            a["isSuccess"] = statuses [i];
        });
        /************/

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