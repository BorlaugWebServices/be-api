/**
 * Copyright (c) 2020 All Right Reserved, BWS
 */
const debug   = require("debug")("be-api:search"),
      express = require("express");

const config = require("../../config");
const router = express.Router();

const NUMBER_PATTERN = RegExp('^[0-9]*$');
const HASH_PATTERN   = RegExp('^0x([A-Fa-f0-9]{64})$');

router.get('/', async (req, res) => {
    let searchCriteria = req.query.searchCriteria;
    debug(`GET - /search?searchCriteria=${searchCriteria}`);

    const store = await config.dataStore.getStore();
    const calls = [];

    calls.push(store.block.get(searchCriteria.trim()));
    calls.push(store.lease.get(Number(searchCriteria.trim())));
    calls.push(store.transaction.get(searchCriteria.trim()));
    calls.push(store.inherent.get(searchCriteria.trim()));
    calls.push(store.event.get(searchCriteria.trim()));
    calls.push(store.log.get(searchCriteria.trim()));
    calls.push(store.identity.get(searchCriteria.trim()));

    let [block, lease, txn, inherent, event, log, identity] = await Promise.all(calls);

    if(!block && (NUMBER_PATTERN.test(searchCriteria.trim()) || HASH_PATTERN.test(searchCriteria.trim()))) {
        debug("block sync request");
        let reply = await config.harvester.request('syncBlock', {numberOrHash: searchCriteria.trim()});
        debug(block);
        if(reply.result) {
            block = JSON.parse(reply.result);
        }
    }

    const searchResult = {
        blocks: block ? [block] : [],
        txns: txn ? [txn] : [],
        leases: lease ? [lease] : [],
        inherents: inherent ? [inherent] : [],
        events: event ? [event] : [],
        logs: log ? [log] : [],
        identities: identity ? [identity] : []
    };

    return res.status(200).send(searchResult).end();
});

module.exports = router;