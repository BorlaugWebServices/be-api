/**
 * Copyright (c) 2020 All Right Reserved, BWS
 */
const debug = require("debug")("be-api:groups"),
    _ = require("lodash"),
    express = require("express");

const config = require("../../config");
const transaction      = require("./transactions");
const router = express.Router();
const GROUP_ID_PATTERN = RegExp('^[0-9]*$');

router.get('/:groupid', async (req, res) => {
    let groupid = req.params.groupid;
    debug(`GET - /groups/${groupid}`);

    if (!GROUP_ID_PATTERN.test(groupid)) {
        return res.status(404).send({msg: `Invalid group id`}).end();
    }

    try {
        const store = await config.dataStore.getStore();
        let group_from_db   = await store.group.get(groupid);
        let group = await config.harvester.request('getGroup', {group_id: groupid});
        debug("Group", group);
        if (group.result && group_from_db) {
            group.result['blockNumber'] = group_from_db.blockNumber;
            group.result['blockHash'] = group_from_db.blockHash;
            group.result['extrinsicHash'] = group_from_db.extrinsicHash;
            group.result['timestamp'] = group_from_db.timestamp;
        }
        return res.status(200).send(group.result).end();
    } catch (e) {
        debug(e);
        return res.status(200).send({
            err: e,
            msg: "Internal Server Error"
        }).end();
    }
});

router.get('/:groupid/activities', async (req, res) => {
    let groupid = req.params.groupid;
    debug(`GET - /groups/${groupid}/activities`);

    if(!GROUP_ID_PATTERN.test(groupid)) {
        return res.status(404).send({msg: `Invalid group id`}).end();
    }

    try {
        const store = await config.dataStore.getStore();

        let activityKeys = await store.group.getActivities(groupid);
        let activities   = activityKeys.length > 0 ? await store.transaction.getList(activityKeys) : [];

        /**** TEST ****/
        let calls = [];
        activities.forEach(act => {
            calls.push(transaction.getTransactionStatus(act));
        });
        let statuses = await Promise.all(calls);
        activities.forEach((e, i, a) => {
            a[i]["isSuccess"] = statuses[i];
        });
        /************/

        return res.status(200).send(activities).end();
    } catch(e) {
        debug(e);
        return res.status(500).send({
            err: e.message,
            msg: "Internal Server Error"
        }).end();
    }
});

module.exports = router;
