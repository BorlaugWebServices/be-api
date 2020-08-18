/**
 * Copyright (c) 2020 All Right Reserved, BWS
 */
const debug   = require("debug")("be-api:audits"),
      _       = require("lodash"),
      express = require("express");

const config           = require("../../config");
const transaction      = require("./transactions");
const router           = express.Router();
const AUDIT_ID_PATTERN = RegExp('^[0-9]*$');

router.get('/:auditid', async (req, res) => {
    let auditid = req.params.auditid;
    debug(`GET - /audits/${auditid}`);

    if(!AUDIT_ID_PATTERN.test(auditid)) {
        return res.status(404).send({msg: `Invalid audit id`}).end();
    }

    try {
        const store = await config.dataStore.getStore();
        let audit   = await store.audit.get(auditid);

        return res.status(200).send(audit).end();
    } catch(e) {
        debug(e);
        return res.status(200).send({
            err: e,
            msg: "Internal Server Error"
        }).end();
    }
});

router.get('/:auditid/activities', async (req, res) => {
    let auditid = req.params.auditid;
    debug(`GET - /audits/${auditid}/activities`);

    if(!AUDIT_ID_PATTERN.test(auditid)) {
        return res.status(404).send({msg: `Invalid audit id`}).end();
    }

    try {
        const store = await config.dataStore.getStore();

        let activityKeys = await store.audit.getActivities(auditid);
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