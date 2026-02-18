/**
 * Copyright (c) 2026 All Right Reserved, BWS
 */
import express, {Request, Response, Router} from "express";
import {dataStore} from "../../config";
import Debug from "debug";
import path from "path";
import {handleActivities} from "./transactions";

const filename = path.basename(__filename, '.ts');
const debug = Debug(`be-api:${filename}`);

const router: Router = express.Router();
const AUDIT_ID_PATTERN: RegExp = /^[0-9]*$/;

interface ProposalParams {
  proposalid: string;
}

router.get('/:proposalid', async (req: Request<ProposalParams>, res: Response) => {
  const {proposalid} = req.params;
  debug(`GET - /proposals/${proposalid}`);

  if (!AUDIT_ID_PATTERN.test(proposalid)) {
    return res.status(404).send({msg: `Invalid proposal id`});
  }

  try {
    const store = await dataStore.getStore();
    const proposal = await store.proposal.get(proposalid);

    return res.status(200).send(proposal);
  } catch (e: any) {
    debug(e);
    return res.status(500).send({
      err: e,
      msg: "Internal Server Error"
    });
  }
});

router.get('/:proposalid/activities', async (req: Request<ProposalParams>, res: Response) => {
  const {proposalid} = req.params;
  debug(`GET - /proposals/${proposalid}/activities`);

  if (!AUDIT_ID_PATTERN.test(proposalid)) {
    return res.status(404).send({msg: `Invalid proposal id`});
  }
  const store = await dataStore.getStore();
  return handleActivities(res, () => store.proposal.getActivities(proposalid));
});

export default router;