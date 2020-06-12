/**
 * Copyright (c) 2020 All Right Reserved, BWS
 */

const debug   = require("debug")("be-api:events"),
      express = require("express");

const config           = require("../../config");
const router           = express.Router();
const EVENT_ID_PATTERN = RegExp('^[0-9]*-[0-9]*$');

router.get('/:eventid', async (req, res) => {
    let eventid = req.params.eventid;
    debug(`GET - /events/${eventid}`);

    if(!EVENT_ID_PATTERN.test(eventid)) {
        return res.status(404).send({msg: `Invalid event id`}).end();
    }

    const store = await config.dataStore.getStore();
    let event   = await store.event.get(eventid);
    if(!event) {
        return res.status(404).send({msg: `Event ID ${eventid} not found`}).end();
    }

    return res.status(200).send(event).end();
});

module.exports = router;