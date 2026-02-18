/**
 * Copyright (c) 2026 All Right Reserved, BWS
 */
import {Request, Response, Router} from "express";
import {dataStore} from "../../config";
import Debug from "debug";
import path from "path";

const filename = path.basename(__filename, '.ts');
const debug = Debug(`be-api:${filename}`);

const router: Router = Router();
const INHERENT_ID_PATTERN: RegExp = /^[0-9]*-[0-9]*$/;


router.get('/:inherentid', async (req: Request, res: Response) => {
  const {inherentid} = req.params;
  debug(`GET - /inherents/${inherentid}`);

  // Validate the inherent ID format
  if (!INHERENT_ID_PATTERN.test(inherentid)) {
    return res.status(404).send({msg: `Invalid inherent id`}).end();
  }

  try {
    const store = await dataStore.getStore();
    const inherent = await store.inherent.get(inherentid);
    if (!inherent) {
      return res.status(404).send({msg: `Inherent id ${inherentid} not found`}).end();
    }
    return res.status(200).send(inherent).end();
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    debug(e);
    return res.status(500).send({
      err: errorMessage, msg: "Internal Server Error"
    }).end();
  }
});

export default router;