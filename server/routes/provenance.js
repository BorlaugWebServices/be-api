/**
 * Copyright (c) 2020 All Right Reserved, BWS
 */
const debug   = require("debug")("be-api:provenance"),
      _       = require("lodash"),
      express = require("express");

const config              = require("../../config");
const transaction         = require("./transactions");
const router              = express.Router();
const SEQUENCE_ID_PATTERN = RegExp('^[0-9]*$');

router.get('/:sequenceid', async (req, res) => {
    let sequenceid = req.params.sequenceid;
    debug(`GET - /sequences/${sequenceid}`);

    if(!SEQUENCE_ID_PATTERN.test(sequenceid)) {
        return res.status(404).send({msg: `Invalid sequence id`}).end();
    }

    try {
        console.log('================================================');
        const store                          = await config.dataStore.getStore();
        let sequence                         = await store.provenance.get(sequenceid);
        console.log('Sequence', sequence);
        let [template_steps, sequence_steps] = await Promise.all([
            config.harvester.request('getTemplateSteps', {registryid: sequence.registry, templateid: sequence.template}),
            config.harvester.request('getSequenceSteps', {registryid: sequence.registry, templateid: sequence.template, sequenceid: sequence.id})
        ]);
        console.log('template_steps and sequence_steps', template_steps, sequence_steps);
        template_steps                       = template_steps.result;
        sequence_steps                       = sequence_steps.result;
        
        let steps = [];
        let previousStatus = null;
        template_steps.forEach((tmp, i, arr) => {
            let status = 'IN_PROGRESS';
            if(sequence_steps[i]) {
                status         = 'ATTESTED';
                previousStatus = 'ATTESTED';
            } else {
                if(previousStatus === 'ATTESTED' || previousStatus === null) {
                    status         = 'IN_PROGRESS';
                    previousStatus = 'IN_PROGRESS';
                } else {
                    status         = 'PENDING';
                    previousStatus = 'PENDING';
                }
            }
            steps.push({
                ...tmp,
                ...sequence_steps[i],
                status
            })
        });

        sequence.steps = steps;

        return res.status(200).send(sequence).end();
    } catch(e) {
        debug(e);
        return res.status(500).send({
            err: e,
            msg: "Internal Server Error"
        }).end();
    }
});

router.get('/:sequenceid/activities', async (req, res) => {
    let sequenceid = req.params.sequenceid;
    debug(`GET - /sequences/${sequenceid}/activities`);

    if(!SEQUENCE_ID_PATTERN.test(sequenceid)) {
        return res.status(404).send({msg: `Invalid sequence id`}).end();
    }

    try {
        const store = await config.dataStore.getStore();

        let activityKeys = await store.provenance.getActivities(sequenceid);
        let activities   = activityKeys.length > 0 ? await store.transaction.getList(activityKeys) : [];

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
    } catch(e) {
        debug(e);
        return res.status(500).send({
            err: e.message,
            msg: "Internal Server Error"
        }).end();
    }
});

module.exports = router;
