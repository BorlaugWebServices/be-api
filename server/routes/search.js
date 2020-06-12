/**
 * Copyright (c) 2020 All Right Reserved, BWS
 */
const debug   = require("debug")("be-api:search"),
      express = require("express");

const config         = require("../../config");
const router         = express.Router();

router.get('/', async (req, res) => {
    let searchCriteria = req.query.searchCriteria;
    debug(`GET - /search?searchCriteria=${searchCriteria}`);

    const store = await config.dataStore.getStore();
    const calls = [];

    calls.push(store.block.get(Number(searchCriteria.trim())));
    calls.push(store.lease.get(Number(searchCriteria.trim())));
    calls.push(store.transaction.get(searchCriteria.trim()));
    calls.push(store.inherent.get(searchCriteria.trim()));
    calls.push(store.event.get(searchCriteria.trim()));
    calls.push(store.log.get(searchCriteria.trim()));

    const [block, lease, txn, inherent, event, log] = await Promise.all(calls);

    const searchResult = {
        blocks: block ? [block] : [],
        txns: txn ? [txn] : [],
        leases: lease ? [lease] : [],
        inherents: inherent ? [inherent] : [],
        events: event ? [event] : [],
        logs: log? [log]: []
    };

    return res.status(200).send(searchResult).end();
});

module.exports = router;