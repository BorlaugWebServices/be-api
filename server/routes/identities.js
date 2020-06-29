require('lodash');
/**
 * Copyright (c) 2020 All Right Reserved, BWS
 */
const debug   = require("debug")("be-api:identities"),
      express = require("express");

const config      = require("../../config");
const router      = express.Router();
const DID_PATTERN = RegExp('^(\w*did:bws:\w*[A-Fa-f0-9]{64})$');

router.get('/:did', async (req, res) => {
    let did = req.params.did;
    debug(`GET - /identities/${did}`);

    if(!DID_PATTERN.test(did)) {
        return res.status(404).send({msg: `Invalid did`}).end();
    }

    try {
        const store  = await config.dataStore.getStore();
        let identity = await store.identity.get(`0x${did.split(':')[2]}`);
        // identity     = {
        //     ...identity,
        //     properties: JSON.parse(identity.properties),
        //     claims: JSON.parse(identity.claims),
        //     attestations: JSON.parse(identity.attestations)
        // }
        return res.status(200).send(identity).end();
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