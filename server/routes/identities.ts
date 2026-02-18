/**
 * Copyright (c) 2026 All Right Reserved, BWS
 */
import {Request, Response, Router} from "express";
import {dataStore, harvester} from "../../config";
import Debug from "debug";
import path from "path";
import {handleActivities} from "./transactions";

const filename = path.basename(__filename, '.ts');
const debug = Debug(`be-api:${filename}`);

const router: Router = Router();
// Note: Adjusted regex to correctly handle backslashes in TypeScript/JS
const DID_PATTERN: RegExp = /^(\w*did:bws:\w*[A-Fa-f0-9]{64})$/;


router.get('/:did', async (req: Request, res: Response) => {
  const {did} = req.params;
  debug(`GET - /identities/${did}`);

  if (!DID_PATTERN.test(did)) {
    return res.status(404).send({msg: `Invalid did`}).end();
  }

  try {
    const store = await dataStore.getStore();
    const addressHex = `0x${did.split(':')[2]}`;

    const identity = await store.identity.get(addressHex);
    const document = await harvester.request('getDIDState', {did: addressHex});

    const payload = {
      ...identity,
      ...document.result
    };

    return res.status(200).send(payload).end();
  } catch (e: any) {
    debug(e);
    return res.status(500).send({
      err: e.message || e,
      msg: "Internal Server Error"
    }).end();
  }
});

router.get('/:did/activities', async (req: Request, res: Response) => {
  const {did} = req.params;
  debug(`GET - /identities/${did}/activities`);

  if (!DID_PATTERN.test(did)) {
    return res.status(404).send({msg: `Invalid did`}).end();
  }
  const store = await dataStore.getStore();
  const addressHex = `0x${did.split(':')[2]}`;
  return handleActivities(res, () => store.identity.getActivities(addressHex));
});

router.get('/catalogs/:catalogid', async (req: Request, res: Response) => {
  const {catalogid} = req.params;
  debug(`GET - identities/catalogs/${catalogid}`);

  try {
    const store = await dataStore.getStore();
    const catalog = await store.identity.get_catalog(catalogid);
    debug('Catalog: ', catalog);

    return res.status(200).send(catalog).end();
  } catch (e: any) {
    debug(e);
    return res.status(500).send({
      err: e.message || e,
      msg: "Internal Server Error"
    }).end();
  }
});

router.get('/catalogs/:catalogid/activities', async (req: Request, res: Response) => {
  const {catalogid} = req.params;
  debug(`GET - identities/catalogs/${catalogid}/activities`);
  const store = await dataStore.getStore();
  return handleActivities(res, () => store.identity.getCatalogActivities(catalogid ?? ''));

});

export default router;