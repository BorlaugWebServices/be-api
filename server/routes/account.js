const debug = require("debug")("be-api:transactions"),
    _ = require("lodash"),
    express = require("express"),
    numeral = require("numeral");

const config = require("../../config");
const router = express.Router();

router.route('')
    .get(async (req, res) => {
        debug(`GET - /accounts`);
        let page = numeral(req.query.page || 0).value();
        let perPage = numeral(req.query.perPage || 10).value();

        let total = 0;

        try {
            const store = await config.dataStore.getStore();

            let signers = await store.transaction.getSigners(page, perPage);
            for (let i = 0; i < signers.slice.length; i++) {
                let signer = signers.slice[i].signer;
                let balance = await config.harvester.request('getBalance', {address: signer});
                signers.slice[i]['balance'] = balance ? balance.result : 0;
            }

            return res.status(200).send(signers).end();
        } catch (e) {
            debug(e);
            return res.status(200).send({
                err: e,
                msg: "Internal Server Error"
            }).end();
        }
    });

router.route('/:address')
    .get(async (req, res) => {
        debug(`GET - /accounts/${req.params.address}`);
        let page = numeral(req.query.page || 0).value();
        let perPage = numeral(req.query.perPage || 10).value();

        let total = 0;

        try {
            const store = await config.dataStore.getStore();

            let txns = await store.transaction.getTxnByAddress(page, perPage, req.params.address);
            for (let i = 0; i < txns.slice.length; i++) {
                let txhash = txns.slice[i].hash;
                let transaction = await store.transaction.get(txhash);
                let events = await store.event.getList(transaction["events"]);
                let depositEvent = _.find(events, (event) => {
                    return event.meta.name === "Deposit";
                });
                txns.slice[i]['tx_fee'] = depositEvent ? Number(depositEvent.event.data[0]) : 0;
            }

            return res.status(200).send(txns).end();
        } catch (e) {
            debug(e);
            return res.status(200).send({
                err: e,
                msg: "Internal Server Error"
            }).end();
        }
    });

router.route('/:address/balance')
    .get(async (req, res) => {
        debug(`GET - /accounts/${req.params.address}/balance`);

        try {
            let balance = await config.harvester.request('getBalance', {address: req.params.address});

            return res.status(200).send(balance.result).end();
        } catch (e) {
            debug(e);
            return res.status(200).send({
                err: e,
                msg: "Internal Server Error"
            }).end();
        }
    });

module.exports = router;
