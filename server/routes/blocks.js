/**
 * Copyright (c) 2020 All Right Reserved, BWS
 */

const debug   = require("debug")("be-api:blocks"),
      express = require("express"),
      numeral = require("numeral");

const config = require("../../config");
const router = express.Router();

const NUMBER_PATTERN = RegExp('^[0-9]*$');
const HASH_PATTERN   = RegExp('^0x([A-Fa-f0-9]{64})$');

/**
 * Get blocks paginated.
 */
router.route('/')
.get(async (req, res) => {
    debug("GET - /blocks");
    let page    = numeral(req.query.page || 1).value();
    let perPage = numeral(req.query.perPage || 10).value();

    let start = (page - 1) * perPage;
    let end   = start + perPage - 1;

    let total = 0;

    try {
        const store = await config.dataStore.getStore();
        total       = await store.block.latestBlockNumber();
        let numbers = [];
        for(let i = start; i <= end; i++) {
            numbers.push(total - i);
        }

        let blocks = await store.block.getList(numbers);

        return res.status(200).send({
            total: total,
            slice: blocks
        }).end();
    } catch(e) {
        debug(e);
        return res.status(200).send({
            err: e,
            msg: "Internal Server Error"
        }).end();
    }
})
.delete(async (req, res) => {
    debug(`DELETE - /blocks ; secret=${req.body.secret}`);

    if(config.cacheCleanupSecret === req.body.secret) {
        let reply = await config.harvester.request('cleanup', {});
        debug(reply);
        return res.status(200).send({count: reply.result}).end();
    } else {
        return res.status(403).end();
    }
});

/**
 * Get a specific block
 */
router.get('/:numberOrHash', async (req, res) => {
    debug(`GET - /blocks/${req.params.numberOrHash}`);
    let numberOrHash = req.params.numberOrHash;

    if(!NUMBER_PATTERN.test(numberOrHash) && !HASH_PATTERN.test(numberOrHash)) {
        return res.status(404).send({msg: `Invalid block number or hash`}).end();
    }

    const store = await config.dataStore.getStore();
    let block   = await store.block.get(numberOrHash);

    if(!block) {
        let reply = await config.harvester.request('syncBlock', {numberOrHash: numberOrHash});
        if(reply.result) {
            block = JSON.parse(reply.result);
        }
    }

    if(block) {
        const [inherents, events, logs] = await Promise.all([
            store.inherent.getList(block.inherents),
            store.event.getList(block.events),
            store.log.getList(block.logs)
        ]);

        block["transactions"] = await store.transaction.getList(block.transactions);
        block["inherents"]    = inherents;
        block["events"]       = events;
        block["logs"]         = logs;
        return res.status(200).send(block).end();
    } else {
        return res.status(404).send({msg: `Block #${numberOrHash} not found`}).end();
    }
});

module.exports = router;