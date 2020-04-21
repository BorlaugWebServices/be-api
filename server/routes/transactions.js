/**
 * Copyright (c) 2020 All Right Reserved, BWS
 */

const debug       = require("debug")("api:transactions"),
      express     = require("express"),
      _           = require("lodash"),
      {promisify} = require("util");

const config = require("../../config");

const router = express.Router();

const get  = promisify(config.redis.get).bind(config.redis);
const mget = promisify(config.redis.mget).bind(config.redis);

const TX_HASH_PATTERN = RegExp('^0x([A-Fa-f0-9]{64})$');

router.get('/:txhash', async (req, res) => {
    let txhash = req.params.txhash;
    debug(`GET - /transactions/${txhash}`);

    if(!TX_HASH_PATTERN.test(txhash)) {
        return res.status(404).send({msg: `Invalid tx hash`}).end();
    }

    let transaction = await getTransaction(txhash);
    if(!transaction) {
        return res.status(404).send({msg: `Tx hash ${txhash} not found`}).end();
    }

    return res.status(200).send(transaction).end();
});

const getTransaction = async function(txhash) {
    let transaction = await get(txhash);
    if(!transaction) {
        return null;
    }

    transaction           = JSON.parse(transaction);
    let events            = await mget(_.map(transaction.events, (e) => {
        return `evn:${e}`
    }));
    transaction["events"] = _.map(events, JSON.parse);

    let blockNumber = transaction.id.split("-")[0];
    let block       = await get(`block:${blockNumber}`);
    block           = JSON.parse(block);

    return {
        ...transaction,
        blockNumber: blockNumber,
        timestamp: block.timestamp,
    };
};

const getTransactions = async function(txhashs) {
    let calls = [];
    txhashs.forEach(txhash => calls.push(getTransaction(txhash)));
    return await Promise.all(calls);
};

module.exports.getTransaction  = getTransaction;
module.exports.getTransactions = getTransactions;
module.exports.router          = router;