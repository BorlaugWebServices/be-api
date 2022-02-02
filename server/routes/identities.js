/**
 * Copyright (c) 2020 All Right Reserved, BWS
 */
const debug   = require("debug")("be-api:identities"),
      _       = require("lodash"),
      express = require("express");

const config      = require("../../config");
const transaction = require("./transactions");
const router      = express.Router();
const DID_PATTERN = RegExp('^(\w*did:bws:\w*[A-Fa-f0-9]{64})$');

router.get('/:did', async (req, res) => {
    let did = req.params.did;
    debug(`GET - /identities/${did}`);

    if(!DID_PATTERN.test(did)) {
        return res.status(404).send({msg: `Invalid did`}).end();
    }

    try {
        const store       = await config.dataStore.getStore();
        let identity      = await store.identity.get(`0x${did.split(':')[2]}`);
        let document      = await config.harvester.request('getDIDState', {did: `0x${did.split(':')[2]}`});

        let payload = {
            ...identity,
            ...document.result
        }

        return res.status(200).send(payload).end();
    } catch(e) {
        debug(e);
        return res.status(200).send({
            err: e,
            msg: "Internal Server Error"
        }).end();
    }
});

router.get('/:did/activities', async (req, res) => {
    let did = req.params.did;
    debug(`GET - /identities/${did}/activities`);

    if(!DID_PATTERN.test(did)) {
        return res.status(404).send({msg: `Invalid did`}).end();
    }

    try {
        const store = await config.dataStore.getStore();

        let activityKeys = await store.identity.getActivities(`0x${did.split(':')[2]}`);
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
        return res.status(200).send({
            err: e,
            msg: "Internal Server Error"
        }).end();
    }
});

router.get('/catalogs/:catalogid', async (req, res) => {
    let catalogid = req.params.catalogid;
    debug(`GET - identities/catalogs/${catalogid}`);

    try {
        const store = await config.dataStore.getStore();
        let catalog   = await store.identity.get_catalog(catalogid);
        debug('Catalog: ', catalog);

        return res.status(200).send(catalog).end();
    } catch(e) {
        debug(e);
        return res.status(200).send({
            err: e,
            msg: "Internal Server Error"
        }).end();
    }
});

router.get('/catalogs/:catalogid/activities', async (req, res) => {
    let catalogid = req.params.catalogid;
    debug(`GET - identities/catalogs/${catalogid}/activities`);

    try {
        const store = await config.dataStore.getStore();

        let activityKeys = await store.identity.getCatalogActivities(catalogid);
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
