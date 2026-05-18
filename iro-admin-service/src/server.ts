import { createServer } from "node:http";
import { env } from "./config/env.js";
import { createAdminApp } from "./app.js";
import { attachAdminSocket } from "./config/socket.js";
import { logger } from "./lib/logger.js";

const app = createAdminApp();
const httpServer = createServer(app);

attachAdminSocket(httpServer);

httpServer.listen(env.PORT, () => {
  logger.info(`iro-admin-service listening on :${env.PORT}`);
});
