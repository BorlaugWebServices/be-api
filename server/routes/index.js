/**
 * Copyright (c) 2018 All Right Reserved, AcreCX
 */
const _       = require('lodash'),
      express = require('express');

const pkg  = require("../../package");

const router = express.Router();

/**
 * Version
 */
router.get('/', function(req, res) {
    return res.status(200).send({version: pkg.version}).end();
});

router.get('/health', function(req, res) {
    return res.status(200).send("Ok").end();
});

module.exports = router;