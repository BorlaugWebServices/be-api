#!/usr/bin/env node
const debug    = require("debug")("be-api:server"),
      http     = require("http"),
      {format} = require("util"),
      sockio   = require("socket.io");

const config = require("../config"),
      server = require("../server"),
      pjson  = require("../package.json");

const host = config.host;
const port = config.port;
const app  = http.createServer(server);

app.listen(port, host, () => {
    process.title = pjson.name + " " + pjson.version;
    process.title = format("%s %s listening on %s:%s", pjson.name, pjson.version, host, port);
    debug("Borlaug API service started on %s:%s", host, port);
});

let io = sockio.listen(app, {log: false});
debug("be-api Socket started");

const clients = {};

io.on('connection', async function(socket) {
    const remoteAddress = socket.client.conn.remoteAddress
    const sessionID     = socket.id;

    debug('a user connected');

    if(!clients[remoteAddress]) {
        clients[remoteAddress] = [];
    }
    clients[remoteAddress].push(sessionID);

    debug('connected users', clients);

    const blocksChannel = "blockUpdated";
    const txnsChannel = "transactionUpdated";

    config.subscriber.on('message', (channel, message) => {
        // console.log(`Received the following message from ${blocksChannel}: ${message}`);
        if(channel === blocksChannel) {
            let blockWithTime = {
                latestBlockTime: new Date(),
                block: JSON.parse(message)
            };
            io.emit('block updated', blockWithTime);
        }

        if(channel === txnsChannel) {
            io.emit('txn updated', JSON.parse(message));
        }
    });

    config.subscriber.subscribe(blocksChannel, txnsChannel, (error, count) => {
        if(error) {
            throw new Error(error);
        }
        // console.log(`Subscribed to ${count} channel. Listening for updates on the ${blocksChannel} channel.`);
    });

    socket.on('disconnect', function(client) {
        let i = clients[remoteAddress].indexOf(sessionID);
        clients[remoteAddress].splice(i);
        if(clients[remoteAddress].length === 0) {
            delete clients[remoteAddress];
        }
        debug('User disconnected', socket.id, '; Current clients: ', clients);
    });
});

/**
 * Start http server and attach signal handlers.
 */
let stop = async function(msg) {
    process.exit();
};

process.on("uncaughtException", function(err) {
    debug(err.stack);
    debug("uncaughtException", err);
}).on("SIGINT", function() {
    stop("Received SIGINT Ctrl+C signal. Borlaug API service shutdown.");
}).on("SIGTERM", function() {
    stop("Received SIGTERM signal. Borlaug API service shutdown.");
}).on("exit", function() {
    stop("Borlaug API service shutdown.");
});