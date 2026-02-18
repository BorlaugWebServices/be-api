/**
 * Copyright (c) 2026 All Right Reserved, BWS
 */
import {Request, Response, Router} from "express";
import {dataStore, harvester} from "../../config";

import Debug from "debug";
import path from "path";
import {handleActivities} from "./transactions";
import {GroupRow} from "be-datastore/lib/dbTypes";

const filename = path.basename(__filename, '.ts');
const debug = Debug(`be-api:${filename}`);

const router: Router = Router();
const GROUP_ID_PATTERN: RegExp = /^[0-9]*$/;


router.get('/:groupid', async (req: Request, res: Response) => {
  const groupid: string = req.params.groupid;
  debug(`GET - /groups/${groupid}`);

  if (!GROUP_ID_PATTERN.test(groupid)) {
    return res.status(404).send({msg: `Invalid group id`}).end();
  }

  try {
    const store = await dataStore.getStore();
    const group_from_db: GroupRow | null = await store.group.get(groupid);
    const groupResponse = await harvester.request('getGroup', {group_id: groupid});

    debug("Group", groupResponse);

    if (groupResponse.result && group_from_db) {
      groupResponse.result['blockNumber'] = group_from_db.blockNumber;
      groupResponse.result['blockHash'] = group_from_db.blockHash;
      groupResponse.result['extrinsicHash'] = group_from_db.extrinsicHash;
      groupResponse.result['timestamp'] = group_from_db.timestamp;
    }

    return res.status(200).send(groupResponse.result).end();
  } catch (e: any) {
    debug(e);
    return res.status(500).send({
      err: e.message || e,
      msg: "Internal Server Error"
    }).end();
  }
});

router.get('/:groupid/activities', async (req: Request, res: Response) => {
  const groupid: string = req.params.groupid;
  debug(`GET - /groups/${groupid}/activities`);
  if (!GROUP_ID_PATTERN.test(groupid)) {
    return res.status(404).send({msg: `Invalid group id`}).end();
  }
  const store = await dataStore.getStore();
  return handleActivities(res, () => store.group.getActivities(groupid ?? ''));
});

export default router;