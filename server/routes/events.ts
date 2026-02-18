/**
 * Copyright (c) 2026 All Right Reserved, BWS
 */
import {Request, Response, Router} from "express";

import {dataStore} from "../../config";

import Debug from "debug";
import path from "path";
import {EventRow} from "be-datastore/lib/dbTypes";

const filename = path.basename(__filename, '.ts');
const debug = Debug(`be-api:${filename}`);

const router: Router = Router();
const EVENT_ID_PATTERN: RegExp = /^[0-9]*-[0-9]*$/;

router.get('/:eventid', async (req: Request, res: Response) => {
  const {eventid} = req.params;
  debug(`GET - /events/${eventid}`);

  if (!EVENT_ID_PATTERN.test(eventid)) {
    return res.status(404).send({msg: `Invalid event id`}).end();
  }

  try {
    const store = await dataStore.getStore();
    const event: EventRow | null = await store.event.get(eventid);

    if (!event) {
      return res.status(404).send({msg: `Event ID ${eventid} not found`}).end();
    }

    return res.status(200).send(event).end();
  } catch (e: any) {
    debug(e);
    return res.status(500).send({
      err: e.message || e,
      msg: "Internal Server Error"
    }).end();
  }
});

export default router;