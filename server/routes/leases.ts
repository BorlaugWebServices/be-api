/**
 * Copyright (c) 2026 All Right Reserved, BWS
 */
import {Request, Response, Router} from "express";
import {dataStore, harvester} from "../../config";
import Debug from "debug";
import path from "path";
import {handleActivities} from "./transactions";

const filename = path.basename(__filename, '.ts');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const debug = Debug(`be-api:${filename}`);

const router: Router = Router();
const ASSET_REGISTRY_ID_PATTERN: RegExp = /^[0-9]*$/;


router.get('/registries/:registryid', async (req: Request, res: Response) => {
  const {registryid} = req.params;
  if (!ASSET_REGISTRY_ID_PATTERN.test(registryid)) return res.status(404).send({msg: "Invalid registry id"}).end();

  try {
    const store = await dataStore.getStore();
    const registry = await store.lease.getRegistry(registryid);
    return res.status(200).send(registry).end();
  } catch (e: any) {
    return res.status(500).send({err: e.message || e, msg: "Internal Server Error"}).end();
  }
});

router.get('/assets/:assetid', async (req: Request, res: Response) => {
  const {assetid} = req.params;
  if (!ASSET_REGISTRY_ID_PATTERN.test(assetid)) return res.status(404).send({msg: "Invalid asset id"}).end();

  try {
    const store = await dataStore.getStore();
    const asset = await store.lease.getAsset(assetid);
    const asset_rpc = await harvester.request('getAsset', {
      registry_id: asset.registry_id,
      asset_id: asset.id
    });
    return res.status(200).send({...asset, ...asset_rpc.result}).end();
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    debug(e);
    return res.status(500).send({
      err: errorMessage, msg: "Internal Server Error"
    }).end();
  }
});


router.get('/leases/:leaseid/activities', async (req: Request, res: Response) => {

  const store = await dataStore.getStore();
  return handleActivities(res, () => store.lease.getLeaseActivities(req.params.leaseid));
});

export default router;