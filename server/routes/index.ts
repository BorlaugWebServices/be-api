/**
 * Copyright (c) 2018 All Right Reserved, AcreCX
 */
import express from 'express';

import pkg from '../../package.json';

const router = express.Router();

/**
 * Version
 */
router.get('/', function (req, res) {
  return res.status(200).send({version: pkg.version}).end();
});

router.get('/health', function (req, res) {
  return res.status(200).send("Ok").end();
});

export default router;
