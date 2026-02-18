/**
 * Copyright (c) 2026 All Right Reserved, BWS
 */

import express, {Request, Response, Router} from "express";
// Note: You may need to create a type definition for your config file
import {dataStore} from "../../config";
import Debug from "debug";
import path from "path";

const filename = path.basename(__filename, '.ts');
const debug = Debug(`be-api:${filename}`);

const router: Router = express.Router();
const LOG_ID_PATTERN: RegExp = /^[0-9]*-[0-9]*$/;

interface LogParams {
  logid: string;
}

router.get('/:logid', async (req: Request<LogParams>, res: Response) => {
  const {logid} = req.params;
  debug(`GET - /logs/${logid}`);

  if (!LOG_ID_PATTERN.test(logid)) {
    return res.status(404).send({msg: "Invalid log id"});
  }

  try {
    const store = await dataStore.getStore();
    const log = await store.log.get(logid);
    if (!log) {
      return res.status(404).send({msg: `Event ID ${logid} not found`});
    }
    return res.status(200).send(log);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    debug(e);
    return res.status(500).send({
      err: errorMessage, msg: "Internal Server Error"
    }).end();
  }
});

export default router;