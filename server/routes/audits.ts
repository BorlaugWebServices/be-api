/**
 * Copyright (c) 2026 All Right Reserved, BWS
 */

import Debug from "debug";
import path from "path";
import express from "express";

import {dataStore} from "../../config";
import {handleActivities} from "./transactions";

const filename = path.basename(__filename, '.ts');
const debug = Debug(`be-api:${filename}`);

const router = express.Router();
const AUDIT_ID_PATTERN = RegExp('^[0-9]*$');

router.get('/:auditid', async (req, res) => {
  const auditid = req.params.auditid;
  debug(`GET - /audits/${auditid}`);

  if (!AUDIT_ID_PATTERN.test(auditid)) {
    return res.status(404).send({msg: `Invalid audit id`}).end();
  }

  try {
    const store = await dataStore.getStore();
    const audit = await store.audit.get(auditid);

    return res.status(200).send(audit).end();
  } catch (e) {
    debug(e);
    return res.status(200).send({
      err: e, msg: "Internal Server Error"
    }).end();
  }
});

router.get('/:auditid/activities', async (req, res) => {
  const auditid = req.params.auditid;
  debug(`GET - /audits/${auditid}/activities`);

  if (!AUDIT_ID_PATTERN.test(auditid)) {
    return res.status(404).send({msg: `Invalid audit id`}).end();
  }
  const store = await dataStore.getStore();
  return handleActivities(res, () => store.audit.getActivities(auditid));
});

export default router;