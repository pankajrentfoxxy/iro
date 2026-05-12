import type { Server as HttpServer } from "node:http";
import type { Redis } from "ioredis";
import { Server as SocketIOServer } from "socket.io";
import { env } from "./env.js";

const corsOrigins =
  env.CORS_ORIGIN === "*"
    ? true
    : env.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean);

export function createSocketServer(httpServer: HttpServer, redis: Redis): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: { origin: corsOrigins, methods: ["GET", "POST"] },
  });

  let liveConnections = 0;

  io.on("connection", (socket) => {
    liveConnections += 1;
    redis
      .publish(
        "iro:stats",
        JSON.stringify({ type: "live_reformer_count", count: liveConnections }),
      )
      .catch(() => undefined);

    socket.emit("stats:live_reformers", { count: liveConnections });

    socket.on("disconnect", () => {
      liveConnections = Math.max(0, liveConnections - 1);
      redis
        .publish(
          "iro:stats",
          JSON.stringify({ type: "live_reformer_count", count: liveConnections }),
        )
        .catch(() => undefined);
    });
  });

  const sub = redis.duplicate();
  void sub
    .subscribe("iro:events")
    .catch((err) => console.error("socket redis subscribe error", err));
  sub.on("message", (_channel, message) => {
    try {
      const payload = JSON.parse(message) as { type?: string; data?: unknown };
      if (payload?.type) {
        io.emit(payload.type, payload.data ?? {});
      }
    } catch {
      /* ignore */
    }
  });

  return io;
}

export type SocketServer = SocketIOServer;
