/**
 * Copyright (c) 2020 All Right Reserved, BWS
 */

const debug       = require("debug")("api:inherents"),
      express     = require("express"),
      {promisify} = require("util");

const config = require("../../config");

const router = express.Router();

const get = promisify(config.redis.get).bind(config.redis);

const INHERENT_ID_PATTERN = RegExp('^[0-9]*-[0-9]*$');

router.get('/:inherentid', async (req, res) => {
    let inherentid = req.params.inherentid;
    debug(`GET - /inherents/${inherentid}`);

    if(!INHERENT_ID_PATTERN.test(inherentid)) {
        return res.status(404).send({msg: `Invalid inherent id`}).end();
    }

    let inherent = await get(`inh:${inherentid}`);
    inherent     = JSON.parse(inherent);

    let blockNumber = inherent.id.split("-")[0];
    let block       = await get(`block:${blockNumber}`);
    block           = JSON.parse(block);

    if(block) {
        return res.status(200).send({
            ...inherent,
            blockNumber: blockNumber,
            timestamp: block.timestamp,
        }).end();
    } else {
        return res.status(404).send({msg: `Inherent ID ${inherentid} not found`}).end();
    }
});

module.exports = router;