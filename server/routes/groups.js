/**
 * Copyright (c) 2020 All Right Reserved, BWS
 */
const debug = require("debug")("be-api:groups"),
    _ = require("lodash"),
    express = require("express");

const config = require("../../config");
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
        if (group.result && group_from_db) {
            group.result.group['blockNumber'] = group_from_db.blockNumber;
            group.result.group['blockHash'] = group_from_db.blockHash;
            group.result.group['extrinsicHash'] = group_from_db.extrinsicHash;
            group.result.group['timestamp'] = group_from_db.timestamp;
        }
        return res.status(200).send(group).end();
    } catch (e) {
        debug(e);
        return res.status(200).send({
            err: e,
            msg: "Internal Server Error"
        }).end();
    }
});

module.exports = router;
