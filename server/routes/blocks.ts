/**
 * Copyright (c) 2026 All Right Reserved, BWS
 */
import {Request, Response, Router} from "express";
import numeral from "numeral";
import {cacheCleanupSecret, dataStore, harvester} from "../../config";
import Debug from "debug";
import path from "path";
import {BlockExpanded} from "be-datastore/dist/lib/types";

const filename = path.basename(__filename, '.ts');
const debug = Debug(`be-api:${filename}`);

const router: Router = Router();

const NUMBER_PATTERN: RegExp = /^[0-9]*$/;
const HASH_PATTERN: RegExp = /^0x([A-Fa-f0-9]{64})$/;


/**
 * Get blocks paginated.
 */
router.route('/')
  .get(async (req: Request, res: Response) => {
    debug("GET - /blocks");
    const page: number = numeral(req.query.page || 1).value() || 1;
    const perPage: number = numeral(req.query.perPage || 10).value() || 10;

    const start: number = (page - 1) * perPage;
    const end: number = start + perPage - 1;
    let total: number = 0;

    try {
      const store = await dataStore.getStore();
      total = await store.block.latestBlockNumber();

      const numbers: number[] = [];
      const calls: Promise<BlockExpanded | null>[] = [];

      for (let i = start; i <= end; i++) {
        numbers.push(total - i);
      }

      let blocks = await store.block.getList(numbers.map(n => n.toString()));

      // Identify missing blocks to sync
      for (let i = 0; i < blocks.length; i++) {
        if (!blocks[i]) {
          calls.push(syncBlock(numbers[i]));
        }
      }

      // Sync missing blocks
      const syncedBlocks = await Promise.all(calls);

      // Map synced blocks back into the main list
      let syncIdx = 0;
      blocks = blocks.map((block) => {
        if (!block) {
          return syncedBlocks[syncIdx++];
        }
        return block;
      });

      // Filter out any that failed to sync
      const finalBlocks = blocks.filter((block): block is BlockExpanded => block !== null);

      return res.status(200).send({
        total: total,
        slice: finalBlocks
      }).end();
    } catch (e: any) {
      debug(e);
      return res.status(500).send({
        err: e.message || e,
        msg: "Internal Server Error"
      }).end();
    }
  })
  .delete(async (req: Request, res: Response) => {
    debug(`DELETE - /blocks ; secret=${req.body.secret}`);

    if (cacheCleanupSecret === req.body.secret) {
      const reply = await harvester.request('cleanup', {});
      debug(reply);
      return res.status(200).send({count: reply.result}).end();
    } else {
      return res.status(403).end();
    }
  });

/**
 * Get a specific block
 */
router.get('/:numberOrHash', async (req: Request, res: Response) => {
  debug(`GET - /blocks/${req.params.numberOrHash}`);
  const {numberOrHash} = req.params;

  if (!NUMBER_PATTERN.test(numberOrHash) && !HASH_PATTERN.test(numberOrHash)) {
    return res.status(404).send({msg: `Invalid block number or hash`}).end();
  }

  try {
    const store = await dataStore.getStore();
    let block = await store.block.get(numberOrHash);
    if (!block) {
      try {
        block = await syncBlock(numberOrHash);
      } catch (e) {
        debug(e);
        return res.status(500).send({
          err: "Harvester not running", msg: "Internal Server Error"
        }).end();
      }
    }

    if (block) {
      return res.status(200).send(block).end();
    } else {
      return res.status(404).send({msg: `Block #${numberOrHash} not found`}).end();
    }
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    debug(e);
    return res.status(500).send({
      err: errorMessage, msg: "Internal Server Error"
    }).end();
  }
});

/**
 * Get a specific block from chain
 */
router.get('/:numberOrHash/sync', async (req: Request, res: Response) => {
  debug(`GET - /:numberOrHash/${req.params.numberOrHash}/sync`);
  const {numberOrHash} = req.params;

  if (!NUMBER_PATTERN.test(numberOrHash) && !HASH_PATTERN.test(numberOrHash)) {
    return res.status(404).send({msg: `Invalid block number or hash`}).end();
  }

  try {
    const block = await syncBlock(numberOrHash);
    if (block) {
      return res.status(200).send(block).end();
    } else {
      return res.status(404).send({msg: `Block #${numberOrHash} not found`}).end();
    }
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    debug(e);
    return res.status(500).send({
      err: errorMessage, msg: "Internal Server Error"
    }).end();
  }
});

async function syncBlock(numberOrHash: string | number) {
  let block: BlockExpanded | null = null;
  const reply = await harvester.request('syncBlock', {numberOrHash: numberOrHash});
  if (reply && reply.result) {
    try {
      block = typeof reply.result === 'string' ? JSON.parse(reply.result) : reply.result;
    } catch (e) {
      debug("Failed to parse synced block", e);
    }
  }
  return block;
}

export default router;