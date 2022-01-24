/**
 * Copyright (c) 2020 All Right Reserved, BWS
 */
const debug   = require("debug")("be-api:proposals"),
    _       = require("lodash"),
    express = require("express");

const config           = require("../../config");
const transaction      = require("./transactions");
const router           = express.Router();
const AUDIT_ID_PATTERN = RegExp('^[0-9]*$');

router.get('/:proposalid', async (req, res) => {
    let proposalid = req.params.proposalid;
    debug(`GET - /proposals/${proposalid}`);

    if(!AUDIT_ID_PATTERN.test(proposalid)) {
        return res.status(404).send({msg: `Invalid proposal id`}).end();
    }

    try {
        const store = await config.dataStore.getStore();
        let proposal   = await store.proposal.get(proposalid);

        return res.status(200).send(proposal).end();
    } catch(e) {
        debug(e);
        return res.status(200).send({
            err: e,
            msg: "Internal Server Error"
        }).end();
    }
});

router.get('/:proposalid/activities', async (req, res) => {
    let proposalid = req.params.proposalid;
    debug(`GET - /proposals/${proposalid}/activities`);

    if(!AUDIT_ID_PATTERN.test(proposalid)) {
        return res.status(404).send({msg: `Invalid proposal id`}).end();
    }

    try {
        const store = await config.dataStore.getStore();

        let activityKeys = await store.proposal.getActivities(proposalid);
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
