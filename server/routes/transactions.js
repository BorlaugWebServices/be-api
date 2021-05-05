/**
 * Copyright (c) 2020 All Right Reserved, BWS
 */

const debug   = require("debug")("be-api:transactions"),
      _       = require("lodash"),
      express = require("express"),
      numeral = require("numeral");

const config          = require("../../config");
const router          = express.Router();
const TX_HASH_PATTERN = RegExp('^0x([A-Fa-f0-9]{64})$');

router.route('/')
.get(async (req, res) => {
    debug("GET - /transactions");
    let page    = numeral(req.query.page || 0).value();
    let perPage = numeral(req.query.perPage || 10).value();

    let total = 0;

    try {
        const store = await config.dataStore.getStore();

        let txns = await store.transaction.getPage(page, perPage);

        return res.status(200).send(txns).end();
    } catch(e) {
        debug(e);
        return res.status(200).send({
            err: e,
            msg: "Internal Server Error"
        }).end();
    }
});

router.get('/:txhash', async (req, res) => {
    let txhash = req.params.txhash;
    debug(`GET - /transactions/${txhash}`);

    if(!TX_HASH_PATTERN.test(txhash)) {
        return res.status(404).send({msg: `Invalid tx hash`}).end();
    }

    const store     = await config.dataStore.getStore();
    let transaction = await store.transaction.get(txhash);
    if(!transaction) {
        return res.status(404).send({msg: `Tx hash ${txhash} not found`}).end();
    }

    transaction["events"] = await store.event.getList(transaction["events"]);

    return res.status(200).send(transaction).end();
});

router.get('/:blockhash/:txhash', async (req, res) => {
    let blockhash = req.params.blockhash;
    let txhash = req.params.txhash;
    debug(`GET - /transactions/${txhash}`);

    if(!TX_HASH_PATTERN.test(txhash)) {
        return res.status(404).send({msg: `Invalid tx hash`}).end();
    }

    const store     = await config.dataStore.getStore();
    let transaction = await store.transaction.get(txhash);
    if(!transaction) {
        transaction = await syncTx(blockhash, txhash)
        // return res.status(404).send({msg: `Tx hash ${txhash} not found`}).end();
    }

    if(transaction) {
        transaction["events"] = await store.event.getList(transaction["events"]);
        return res.status(200).send(transaction).end();
    }else{
        return res.status(404).send({msg: `Tx hash ${txhash} not found`}).end();
    }
});

async function getTransactionStatus(transaction) {
    const store = await config.dataStore.getStore();

    let events = await store.event.getList(transaction["events"]);

    let successEvents = _.filter(events, (event) => {
        return event.meta.name === 'ExtrinsicSuccess'
    });

    return successEvents.length > 0;
}

async function syncTx(blockHash, txHash) {
    let block = null;
    let reply = await config.harvester.request('syncBlock', {numberOrHash: numberOrHash});
    if(reply.result) {
        block = JSON.parse(reply.result);
    }
    return block;
}

module.exports                      = router;
module.exports.getTransactionStatus = getTransactionStatus;
