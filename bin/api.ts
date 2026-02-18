import {createServer} from 'node:http';
import {format} from 'node:util';
import {Server, Socket} from 'socket.io';
import Debug from 'debug';
import {host, port, subscriber} from '../config';
import server from '../server';
import pjson from '../package.json';

const debug = Debug("be-api:server");

interface BlockMessage {
  latestBlockTime: Date;
  block: any;
}

interface ClientMap {
  [key: string]: string[];
}

const app = createServer(server as any);

/**
 * Socket.io v4 Initialization
 */
const io = new Server(app, {
  cors: {
    origin: "*", // Adjust this to your frontend URL in production
    methods: ["GET", "POST"]
  }
});

const clients: ClientMap = {};

app.listen(port as number, host as string, () => {
  process.title = format("%s %s listening on %s:%s", pjson.name, pjson.version, host, port);
  debug("Borlaug API service started on %s:%s", host, port);
});

debug("be-api Socket started");

const blocksChannel = "blockUpdated";
const txnsChannel = "transactionUpdated";

/**
 * Handle Redis Messages
 * Move this outside the connection handler so it only runs once,
 * not every time a user connects.
 */
subscriber.on('message', (channel: string, message: string) => {
  if (channel === blocksChannel) {
    try {
      const blockWithTime: BlockMessage = {
        latestBlockTime: new Date(),
        block: JSON.parse(message)
      };
      io.emit('block updated', blockWithTime);
    } catch (e) {
      debug("Error parsing block message", e);
    }
  }

  if (channel === txnsChannel) {
    try {
      io.emit('txn updated', JSON.parse(message));
    } catch (e) {
      debug("Error parsing txn message", e);
    }
  }
});

// FIX: Change 'number' to 'any' or 'string' to satisfy the Redis Overload
subscriber.subscribe(blocksChannel, txnsChannel, (error: Error | null, reply: any) => {
  if (error) {
    debug("Subscription error: %O", error);
    return;
  }
  debug("Subscribed to channels successfully.");
});

io.on('connection', (socket: Socket) => {
  const remoteAddress = socket.conn.remoteAddress || 'unknown';
  const sessionID = socket.id;

  debug('a user connected: %s', sessionID);

  if (!clients[remoteAddress]) {
    clients[remoteAddress] = [];
  }
  clients[remoteAddress].push(sessionID);

  socket.on('disconnect', () => {
    const userSessions = clients[remoteAddress];
    if (userSessions) {
      const i = userSessions.indexOf(sessionID);
      if (i !== -1) userSessions.splice(i, 1);
      if (userSessions.length === 0) delete clients[remoteAddress];
    }
    debug('User disconnected: %s', sessionID);
  });
});

const stop = (): void => {
  debug("Shutting down...");
  process.exit();
};

process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());