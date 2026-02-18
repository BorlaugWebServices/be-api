/**
 * Copyright (c) 2026 All Right Reserved, BWS
 */
import express, {Request, Response, Router} from "express";
import {dataStore, harvester} from "../../config";
import Debug from "debug";
import path from "path";

const filename = path.basename(__filename, '.ts');
const debug = Debug(`be-api:${filename}`);

const router: Router = express.Router();

const NUMBER_PATTERN: RegExp = /^[0-9]*$/;
const HASH_PATTERN: RegExp = /^0x([A-Fa-f0-9]{64})$/;

interface SearchQuery {
  searchCriteria?: string;
}

router.get('/', async (req: Request<{}, {}, {}, SearchQuery>, res: Response) => {
  const searchCriteria = req.query.searchCriteria?.trim() || "";
  debug(`GET - /search?searchCriteria=${searchCriteria}`);

  const store = await dataStore.getStore();

  const [
    blockRaw, address, audit, txn, inherent, event, log,
    identity, sequence, group, proposal, catalog,
    asset_registry, asset, lease, registry, definition
  ] = await Promise.all([
    store.block.get(searchCriteria),
    store.transaction.getTxnByAddress(0, 1, searchCriteria),
    store.audit.get(searchCriteria),
    store.transaction.get(searchCriteria),
    store.inherent.get(searchCriteria),
    store.event.get(searchCriteria),
    store.log.get(searchCriteria),
    store.identity.get(searchCriteria),
    store.provenance.get(searchCriteria),
    store.group.get(searchCriteria),
    store.proposal.get(searchCriteria),
    store.identity.get_catalog(searchCriteria),
    store.lease.getRegistry(searchCriteria),
    store.lease.getAsset(searchCriteria),
    store.lease.getLease(searchCriteria),
    store.provenance.getRegistry(searchCriteria),
    store.provenance.getDefinition(searchCriteria)
  ]);

  let block = blockRaw;
  if (!block && (NUMBER_PATTERN.test(searchCriteria) || HASH_PATTERN.test(searchCriteria))) {
    const reply = await harvester.request('syncBlock', {numberOrHash: searchCriteria});
    if (reply.result) {
      block = JSON.parse(reply.result);
    }
  }

  const searchResult = {
    blocks: block ? [block] : [],
    address: address && address.total > 0 ? address.slice : [],
    txns: txn ? [txn] : [],
    leases: lease ? [lease] : [],
    audits: audit ? [audit] : [],
    inherents: inherent ? [inherent] : [],
    events: event ? [event] : [],
    logs: log ? [log] : [],
    identities: identity ? [identity] : [],
    sequences: sequence ? [sequence] : [],
    groups: group ? [group] : [],
    proposals: proposal ? [proposal] : [],
    catalogs: catalog ? [catalog] : [],
    asset_registries: asset_registry ? [asset_registry] : [],
    assets: asset ? [asset] : [],
    registries: registry ? [registry] : [],
    definitions: definition ? [definition] : [],
  };

  return res.status(200).send(searchResult);
});

export default router;