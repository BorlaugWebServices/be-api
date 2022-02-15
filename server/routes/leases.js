/**
 * Copyright (c) 2020 All Right Reserved, BWS
 */
const debug = require("debug")("be-api:leases"),
    _ = require("lodash"),
    express = require("express");

const config = require("../../config");
const transaction = require("./transactions");
const router = express.Router();
const ASSET_REISTRY_ID_PATTERN = RegExp('^[0-9]*$');

router.get('/registries/:registryid', async (req, res) => {
    let registryid = req.params.registryid;
    debug(`GET - assetregistry/registries/${registryid}`);

    if (!ASSET_REISTRY_ID_PATTERN.test(registryid)) {
        return res.status(404).send({msg: `Invalid registry id`}).end();
    }

    try {
        const store = await config.dataStore.getStore();
        let registry = await store.lease.getRegistry(registryid);

        return res.status(200).send(registry).end();
    } catch (e) {
        debug(e);
        return res.status(200).send({
            err: e,
            msg: "Internal Server Error"
        }).end();
    }
});

router.get('/registries/:registryid/activities', async (req, res) => {
    let registryid = req.params.registryid;
    debug(`GET - assetregistry/registries/${registryid}/activities`);

    if (!ASSET_REISTRY_ID_PATTERN.test(registryid)) {
        return res.status(404).send({msg: `Invalid registry id`}).end();
    }

    try {
        const store = await config.dataStore.getStore();

        let activityKeys = await store.lease.getRegistryActivities(registryid);
        let activities = activityKeys.length > 0 ? await store.transaction.getList(activityKeys) : [];

        /**** TEST ****/
        let calls = [];
        activities.forEach(act => {
            calls.push(transaction.getTransactionStatus(act));
        });
        let statuses = await Promise.all(calls);
        activities.forEach((e, i, a) => {
            a[i]["isSuccess"] = statuses[i];
        });
        /************/

        return res.status(200).send(activities).end();
    } catch (e) {
        debug(e);
        return res.status(500).send({
            err: e.message,
            msg: "Internal Server Error"
        }).end();
    }
});

router.get('/assets/:assetid', async (req, res) => {
    let assetid = req.params.assetid;
    debug(`GET - assetregistry/assets/${assetid}`);

    if (!ASSET_REISTRY_ID_PATTERN.test(assetid)) {
        return res.status(404).send({msg: `Invalid asset id`}).end();
    }

    try {
        const store = await config.dataStore.getStore();
        let asset = await store.lease.getAsset(assetid);
        let asset_rpc = await config.harvester.request('getAsset', {
            registry_id: asset.registry_id,
            asset_id: asset.id
        });
        console.log(asset_rpc);


        return res.status(200).send({
            ...asset,
            ...asset_rpc.result
        }).end();
    } catch (e) {
        debug(e);
        return res.status(200).send({
            err: e,
            msg: "Internal Server Error"
        }).end();
    }
});

router.get('/assets/:assetid/activities', async (req, res) => {
    let assetid = req.params.assetid;
    debug(`GET - assetregistry/assets/${assetid}/activities`);

    if (!ASSET_REISTRY_ID_PATTERN.test(assetid)) {
        return res.status(404).send({msg: `Invalid asset id`}).end();
    }

    try {
        const store = await config.dataStore.getStore();

        let activityKeys = await store.lease.getAssetActivities(assetid);
        let activities = activityKeys.length > 0 ? await store.transaction.getList(activityKeys) : [];

        /**** TEST ****/
        let calls = [];
        activities.forEach(act => {
            calls.push(transaction.getTransactionStatus(act));
        });
        let statuses = await Promise.all(calls);
        activities.forEach((e, i, a) => {
            a[i]["isSuccess"] = statuses[i];
        });
        /************/

        return res.status(200).send(activities).end();
    } catch (e) {
        debug(e);
        return res.status(500).send({
            err: e.message,
            msg: "Internal Server Error"
        }).end();
    }
});

router.get('/leases/:leaseid', async (req, res) => {
    let leaseid = req.params.leaseid;
    debug(`GET - assetregistry/leases/${leaseid}`);

    if (!ASSET_REISTRY_ID_PATTERN.test(leaseid)) {
        return res.status(404).send({msg: `Invalid lease id`}).end();
    }

    try {
        const store = await config.dataStore.getStore();
        let lease = await store.lease.getLease(leaseid);
        let lease_rpc = await config.harvester.request('getLease', {
            lessor: lease.lessor,
            lease_id: leaseid
        });
        console.log(lease_rpc);

        return res.status(200).send({
            ...lease_rpc.result,
            ...lease
        }).end();
    } catch (e) {
        debug(e);
        return res.status(200).send({
            err: e,
            msg: "Internal Server Error"
        }).end();
    }
});

router.get('/leases/:leaseid/activities', async (req, res) => {
    let leaseid = req.params.leaseid;
    debug(`GET - /leases/${leaseid}/activities`);

    if (!ASSET_REISTRY_ID_PATTERN.test(leaseid)) {
        return res.status(404).send({msg: `Invalid lease id`}).end();
    }

    try {
        const store = await config.dataStore.getStore();

        let activityKeys = await store.lease.getLeaseActivities(leaseid);
        let activities = activityKeys.length > 0 ? await store.transaction.getList(activityKeys) : [];

        /**** TEST ****/
        let calls = [];
        activities.forEach(act => {
            calls.push(transaction.getTransactionStatus(act));
        });
        let statuses = await Promise.all(calls);
        activities.forEach((e, i, a) => {
            a[i]["isSuccess"] = statuses[i];
        });
        /************/

        return res.status(200).send(activities).end();
    } catch (e) {
        debug(e);
        return res.status(500).send({
            err: e.message,
            msg: "Internal Server Error"
        }).end();
    }
});

module.exports = router;
