/**
 * Copyright (c) 2020 All Right Reserved, BWS
 */

const debug   = require("debug")("be-api:transactions"),
      express = require("express");

const config          = require("../../config");
const router          = express.Router();
const TX_HASH_PATTERN = RegExp('^0x([A-Fa-f0-9]{64})$');

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

module.exports = router;