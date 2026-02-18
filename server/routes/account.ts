import {Request, Response, Router} from "express";
import numeral from "numeral";
import Debug from "debug";
import path from "path";

const filename = path.basename(__filename, '.ts');
const debug = Debug(`be-api:${filename}`);

const config = require("../../config");

const router: Router = Router();

interface Signer {
  signer: string;
  balance?: any;

  [key: string]: any;
}

interface Transaction {
  hash: string;
  tx_fee?: number;
  events: string[];

  [key: string]: any;
}

router.route('')
  .get(async (req: Request, res: Response) => {
    debug(`GET - /accounts`);
    const page = numeral(req.query.page || 0).value() || 0;
    const perPage = numeral(req.query.perPage || 10).value() || 10;

    try {
      const store = await config.dataStore.getStore();
      const signers = await store.transaction.getSigners(page, perPage);

      for (let i = 0; i < signers.slice.length; i++) {
        const signerAddress: string = signers.slice[i].signer;
        const balance = await config.harvester.request('getBalance', {address: signerAddress});
        signers.slice[i]['balance'] = balance ? balance.result : 0;
      }

      return res.status(200).send(signers).end();
    } catch (e: any) {
      debug(e);
      return res.status(500).send({
        err: e.message || e,
        msg: "Internal Server Error"
      }).end();
    }
  });

router.route('/:address')
  .get(async (req: Request, res: Response) => {
    debug(`GET - /accounts/${req.params.address}`);
    const page = numeral(req.query.page || 0).value() || 0;
    const perPage = numeral(req.query.perPage || 10).value() || 10;

    try {
      const store = await config.dataStore.getStore();
      const txns = await store.transaction.getTxnByAddress(page, perPage, req.params.address);

      for (let i = 0; i < txns.slice.length; i++) {
        const txhash: string = txns.slice[i].hash;
        const transaction = await store.transaction.get(txhash);
        const events = await store.event.getList(transaction["events"]);

        const depositEvent = events.find((event: any) => {
          return event.meta.name === "Deposit";
        });
        txns.slice[i]['tx_fee'] = depositEvent ? Number(depositEvent.event.data[0]) : 0;
      }

      return res.status(200).send(txns).end();
    } catch (e: any) {
      debug(e);
      return res.status(500).send({
        err: e.message || e,
        msg: "Internal Server Error"
      }).end();
    }
  });

router.route('/:address/balance')
  .get(async (req: Request, res: Response) => {
    debug(`GET - /accounts/${req.params.address}/balance`);
    try {
      const balance = await config.harvester.request('getBalance', {address: req.params.address});
      return res.status(200).send(balance.result).end();
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      debug(e);
      return res.status(500).send({
        err: errorMessage, msg: "Internal Server Error"
      }).end();
    }
  });

export default router;