/**
 * Copyright (c) 2020 All Right Reserved, BWS
 */
const debug       = require("debug")("api:search"),
      express     = require("express"),
      {promisify} = require("util");

const router = express.Router();

const config = require("../../config");
const get   = promisify(config.redis.get).bind(config.redis);
const _keys = promisify(config.redis.keys).bind(config.redis);

let blocks = require("./blocks"),
    transactions =require("./transactions"),
    leases = require("./leases");

router.get('/', async (req, res) => {
    let searchCriteria = req.query.searchCriteria;
    debug(`GET - /search?searchCriteria=${searchCriteria}`);

    const [block, txn, lease] = await Promise.all([
        blocks.getBlock(searchCriteria.trim()),
        transactions.getTransaction(searchCriteria.trim()),
        leases.getLease(searchCriteria.trim())
    ]);

    const searchResult = {
        blocks: block?[block]:[],
        txns: txn?[txn]:[],
        leases: lease?[lease]:[]
    };

    //debug('Search Result %j ;', searchResult);

    return res.status(200).send(searchResult).end();
});

module.exports = router;