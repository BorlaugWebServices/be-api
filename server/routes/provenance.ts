/**
 * Copyright (c) 2026 All Right Reserved, BWS
 */
import express, {Request, Response, Router} from "express";
import {dataStore, harvester} from "../../config";
import Debug from "debug";
import path from "path";
import {handleActivities} from "./transactions";

const filename = path.basename(__filename, '.ts');
const debug = Debug(`be-api:${filename}`);

const router: Router = express.Router();
const SEQUENCE_ID_PATTERN: RegExp = /^[0-9]*$/;

interface ProvenanceParams {
  sequenceid?: string;
  registryid?: string;
  definitionid?: string;
}

router.get('/:sequenceid', async (req: Request<ProvenanceParams>, res: Response) => {
  const {sequenceid} = req.params;
  debug(`GET - /sequences/${sequenceid}`);

  if (!sequenceid || !SEQUENCE_ID_PATTERN.test(sequenceid)) {
    return res.status(404).send({msg: "Invalid sequence id"});
  }

  try {
    const store = await dataStore.getStore();
    const sequence = await store.provenance.get(sequenceid);

    const template_steps_raw = await harvester.request('getTemplateSteps', {
      registryid: sequence.registry,
      templateid: sequence.template
    });
    const sequence_steps_raw = await harvester.request('getSequenceSteps', {
      registryid: sequence.registry,
      templateid: sequence.template,
      sequenceid: sequence.id
    });

    const template_steps = template_steps_raw.result;
    const sequence_steps = sequence_steps_raw.result;

    let previousStatus: string | null = null;
    const steps = template_steps.map((tmp: any, i: number) => {
      let status = 'IN_PROGRESS';
      if (sequence_steps[i]) {
        status = 'ATTESTED';
        previousStatus = 'ATTESTED';
      } else {
        if (previousStatus === 'ATTESTED' || previousStatus === null) {
          status = 'IN_PROGRESS';
          previousStatus = 'IN_PROGRESS';
        } else {
          status = 'PENDING';
          previousStatus = 'PENDING';
        }
      }
      return {...tmp, ...sequence_steps[i], status};
    });

    sequence.steps = steps;
    return res.status(200).send(sequence);
  } catch (e) {
    debug(e);
    return res.status(500).send({err: e, msg: "Internal Server Error"});
  }
});

// Helper for repetitive activity routes


router.get('/:sequenceid/activities', async (req: Request<ProvenanceParams>, res: Response) => {
  if (!req.params.sequenceid || !SEQUENCE_ID_PATTERN.test(req.params.sequenceid)) {
    return res.status(404).send({msg: "Invalid sequence id"});
  }
  const store = await dataStore.getStore();
  return handleActivities(res, () => store.provenance.getActivities(req.params.sequenceid ?? ''));
});

router.get('/registries/:registryid', async (req: Request<ProvenanceParams>, res: Response) => {
  try {
    const store = await dataStore.getStore();
    const registry = await store.provenance.getRegistry(req.params.registryid ?? '');
    return res.status(200).send(registry);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    debug(e);
    return res.status(500).send({
      err: errorMessage, msg: "Internal Server Error"
    }).end();
  }
});

router.get('/registries/:registryid/activities', async (req: Request<ProvenanceParams>, res: Response) => {
  const store = await dataStore.getStore();
  return handleActivities(res, () => store.provenance.getRegistryActivities(req.params.registryid ?? ''));
});

router.get('/definitions/:definitionid', async (req: Request<ProvenanceParams>, res: Response) => {
  try {
    const store = await dataStore.getStore();
    const definition = await store.provenance.getDefinition(req.params.definitionid ?? '');
    return res.status(200).send(definition);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    debug(e);
    return res.status(500).send({
      err: errorMessage, msg: "Internal Server Error"
    }).end();
  }
});

router.get('/definitions/:definitionid/activities', async (req: Request<ProvenanceParams>, res: Response) => {
  const store = await dataStore.getStore();
  return handleActivities(res, () => store.provenance.getDefinitionActivities(req.params.definitionid ?? ''));
});

export default router;