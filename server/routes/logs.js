/**
 * Copyright (c) 2020 All Right Reserved, BWS
 */

const debug   = require("debug")("be-api:logs"),
      express = require("express");

const config           = require("../../config");
const router           = express.Router();
const LOG_ID_PATTERN = RegExp('^[0-9]*-[0-9]*$');

router.get('/:logid', async (req, res) => {
    let logid = req.params.logid;
    debug(`GET - /logs/${logid}`);

    if(!LOG_ID_PATTERN.test(logid)) {
        return res.status(404).send({msg: `Invalid log id`}).end();
    }

    const store = await config.dataStore.getStore();
    let log   = await store.log.get(logid);
    if(!log) {
        return res.status(404).send({msg: `Event ID ${logid} not found`}).end();
    }

    return res.status(200).send(log).end();
});

module.exports = router;