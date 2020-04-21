/**
 * Copyright (c) 2020 All Right Reserved, BWS
 */

const debug       = require("debug")("api:events"),
      express     = require("express"),
      {promisify} = require("util");

const config = require("../../config");

const router = express.Router();

const get = promisify(config.redis.get).bind(config.redis);

const EVENT_ID_PATTERN = RegExp('^[0-9]*-[0-9]*$');

router.get('/:eventid', async (req, res) => {
    let eventid = req.params.eventid;
    debug(`GET - /events/${eventid}`);

    if(!EVENT_ID_PATTERN.test(eventid)) {
        return res.status(404).send({msg: `Invalid event id`}).end();
    }

    let event = await get(`evn:${eventid}`);
    if(!event) {
        return res.status(404).send({msg: `Event ID ${eventid} not found`}).end();
    }
    event = JSON.parse(event);

    let blockNumber = event.id.split("-")[0];
    let block       = await get(`block:${blockNumber}`);
    block           = JSON.parse(block);

    return res.status(200).send({
        ...event,
        blockNumber: blockNumber,
        timestamp: block.timestamp,
    }).end();
});

module.exports = router;