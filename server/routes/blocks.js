/**
 * Copyright (c) 2020 All Right Reserved, BWS
 */

const debug       = require("debug")("api:blocks"),
      express     = require("express"),
      _           = require("lodash"),
      {promisify} = require("util"),
      numeral     = require("numeral");

const config = require("../../config");

const router = express.Router();

const zrevrange = promisify(config.redis.zrevrange).bind(config.redis);
const get       = promisify(config.redis.get).bind(config.redis);
const mget      = promisify(config.redis.mget).bind(config.redis);

/**
 * Get blocks paginated.
 */
router.route('/')
.get(async (req, res) => {
    debug("GET - /blocks");
    let page    = numeral(req.query.page || 1).value();
    let perPage = numeral(req.query.perPage || 10).value();

    let start = (page - 1) * perPage;
    let end   = start + perPage - 1;

    let calls = [];
    let total = 0;

    try {
        total = await get('latestBlockNumber');
        for(let i=start; i<=end;i++){
            calls.push(getBlock(total-i));
        }

        let blocks = await Promise.all(calls);

        return res.status(200).send({
            total: total,
            slice: blocks
        }).end();
    } catch(e) {
        debug(e);
        return res.status(200).send({
            err: e,
            msg: "Internal Server Error"
        }).end();
    }
})
.delete(async (req, res) => {
    debug(`DELETE - /blocks ; secret=${req.body.secret}`);

    if(config.get("cacheCleanupSecret") === req.body.secret) {
        let reply = await config.watcher.request('cleanup', {});
        debug(reply);
        return res.status(200).send({count: reply.result}).end();
    } else {
        return res.status(403).end();
    }
});

/**
 * Get a specific block
 */
router.get('/:number', async (req, res) => {
    debug(`GET - /blocks/${req.params.number}`);
    let number = req.params.number;
    if(isNaN(number)) {
        return res.status(400).end();
    }

    let block = await getBlock(number);

    if(block) {
        return res.status(200).send(block).end();
    } else {
        return res.status(404).send({msg: `Block #${number} not found`}).end();
    }
});

getBlock = async function(number) {
    let block = await get(`block:${number}`);

    if(!block) {
        let reply = await config.watcher.request('syncBlock', {blockNumber: number});
        block     = reply.result;
    }

    if(block) {
        block = JSON.parse(block);

        const [transactions, inherents, events, logs] = await Promise.all([
            mget(block.transactions),
            mget(block.inherents),
            mget(block.events),
            mget(block.logs)
        ]);

        block["transactions"] = _.map(transactions, JSON.parse);
        block["inherents"]    = _.map(inherents, JSON.parse);
        block["events"]       = _.map(events, JSON.parse);
        block["logs"]         = _.map(logs, JSON.parse);
    }

    return block;
};

module.exports.getBlock = getBlock;
module.exports.router   = router;