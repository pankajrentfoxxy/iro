import http from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { getRedis } from "./config/redis.js";
import { createSocketServer } from "./config/socket.js";
import { logger } from "./lib/logger.js";

const app = createApp();
const server = http.createServer(app);
const redis = getRedis();
export const io = createSocketServer(server, redis);

app.get('/', (_, res) => {
  res.json({
    success: true,
    message: 'IRO API Running 🚀',
  });
});

server.listen(env.PORT, () => {
  logger.info(`iro-server listening on ${env.PORT}`, { env: env.NODE_ENV });
});

process.on("unhandledRejection", (reason) => {
  logger.error("unhandledRejection", reason);
});
