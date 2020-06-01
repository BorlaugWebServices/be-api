/**
 * Copyright (c) 2020 All Right Reserved, BWS
 */
const debug   = require("debug")("be-api:search"),
      express = require("express");

const config = require("../../config");

const router = express.Router();

router.get('/', async (req, res) => {
    let searchCriteria = req.query.searchCriteria;
    debug(`GET - /search?searchCriteria=${searchCriteria}`);

    const store = await config.dataStore.getStore();

    let calls = [];

    if(isNaN(searchCriteria.trim())){
        calls.push(store.block.get(-1));
        calls.push(store.lease.get(-1));
    } else {
        calls.push(store.block.get(searchCriteria.trim()));
        calls.push(store.lease.get(searchCriteria.trim()));
    }

    calls.push(store.transaction.get(searchCriteria.trim()));

    const [block, lease, txn ] = await Promise.all(calls);

    const searchResult = {
        blocks: block ? [block] : [],
        txns: txn ? [txn] : [],
        leases: lease ? [lease] : []
    };

    //debug('Search Result %j ;', searchResult);

    return res.status(200).send(searchResult).end();
});

module.exports = router;