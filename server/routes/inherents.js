/**
 * Copyright (c) 2020 All Right Reserved, BWS
 */

const debug       = require("debug")("api:inherents"),
      express     = require("express");

const config = require("../../config");

const router = express.Router();

const INHERENT_ID_PATTERN = RegExp('^[0-9]*-[0-9]*$');

router.get('/:inherentid', async (req, res) => {
    let inherentid = req.params.inherentid;
    debug(`GET - /inherents/${inherentid}`);

    if(!INHERENT_ID_PATTERN.test(inherentid)) {
        return res.status(404).send({msg: `Invalid inherent id`}).end();
    }

    const store  = await config.dataStore.getStore();
    let inherent = await store.inherent.get(inherentid);

    if(!inherent) {
        return res.status(404).send({msg: `Inherent id ${inherentid} not found`}).end();
    }

    inherent["events"] = await store.event.getList(inherent["events"]);

    return res.status(200).send(inherent).end();
});

module.exports = router;