/**
 * Copyright (c) 2026 All Right Reserved, BWS
 */
import express, {Request, Response} from "express";
import numeral from "numeral";
import {dataStore, harvester} from "../../config";
import Debug from "debug";
import path from "path";
import {Activity} from "./types";

const filename = path.basename(__filename, '.ts');
const debug = Debug(`be-api:${filename}`);

const router = express.Router();
const TX_HASH_PATTERN = /^0x([A-Fa-f0-9]{64})$/;

interface TxParams {
  txhash?: string;
  blockhash?: string;
}

router.get('/', async (req: Request, res: Response) => {
  debug("GET - /transactions");
  const page = numeral(req.query.page || 0).value() || 0;
  const perPage = numeral(req.query.perPage || 10).value() || 10;

  try {
    const store = await dataStore.getStore();
    const txns = await store.transaction.getPage(page, perPage);

    for (const item of txns.slice) {
      const transaction = await store.transaction.get(item.hash);
      if (transaction?.events?.length > 0) {
        const events = await store.event.getList(transaction.events);

        // The datastore types here are JsonValue-ish, so we need runtime-safe access.
        const hasMetaName = (e: unknown, name: string) =>
          !!e && typeof (e as any)?.meta?.name === "string" && (e as any).meta.name === name;

        const depositEvent = events.find(e => hasMetaName(e, "Deposit"));
        const successEvent = events.find(e => hasMetaName(e, "ExtrinsicSuccess"));

        item.tx_fee = Number((depositEvent as any)?.event?.event?.data?.amount ?? 0);
        item.weight = Number((successEvent as any)?.event?.event?.data?.dispatchInfo?.weight ?? 0);
      } else {
        item.tx_fee = 0;
        item.weight = 0;
      }
    }
    return res.status(200).send(txns);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    debug(e);
    return res.status(500).send({
      err: errorMessage, msg: "Internal Server Error"
    }).end();
  }
});

router.get('/:txhash', async (req: Request<TxParams>, res: Response) => {
  const {txhash} = req.params;
  if (!txhash || !TX_HASH_PATTERN.test(txhash)) {
    return res.status(404).send({msg: "Invalid tx hash"});
  }

  const store = await dataStore.getStore();
  const transaction = await store.transaction.get(txhash);
  if (!transaction) {
    return res.status(404).send({msg: `Tx hash ${txhash} not found`});
  }

  transaction["events"] = await store.event.getList(transaction["events"]);
  return res.status(200).send(transaction);
});

async function getTransactionStatus(transaction: Activity) {
  const store = await dataStore.getStore();
  const transaction_from_db = await store.transaction.get(transaction.hash);
  const events = await store.event.getList(transaction_from_db["events"]);
  return events.some((e) => (e?.meta as any)?.name === 'ExtrinsicSuccess');
}

export const handleActivities = async (res: Response, fetchKeys: () => Promise<string[]>) => {
  try {
    const activityKeys = await fetchKeys();
    const activities = await fetchActivitiesWithStatus(activityKeys);
    return res.status(200).send(activities);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    debug(e);
    return res.status(500).send({
      err: errorMessage, msg: "Internal Server Error"
    }).end();
  }
};

async function fetchActivitiesWithStatus(activityKeys: string[]) {
  const store = await dataStore.getStore();
  const activities: (Activity | null)[] = await store.transaction.getList(activityKeys);
  const statuses = await Promise.all(activities.map(act => getTransactionStatus(act!)));
  activities.forEach((act, i) => act!.isSuccess = statuses[i]);
  return activities;
};

async function syncTx(blockHash: string, txHash: string) {
  let block = null;
  const reply = await harvester.request('syncTransaction', {blockHash, txHash});
  if (reply.result) {
    block = JSON.parse(reply.result);
  }
  return block;
}

export default router;