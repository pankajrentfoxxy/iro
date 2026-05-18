import type { Server as HttpServer } from "node:http";
import type { Redis } from "ioredis";
import { Server as SocketIOServer } from "socket.io";
import { prisma } from "./db.js";

export function createSocketServer(httpServer: HttpServer, redis: Redis): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: { origin: true, methods: ["GET", "POST"] },
  });

  io.on("connection", async (socket) => {
    try {
      const count = await prisma.user.count({ where: { status: "ACTIVE" } });
      socket.emit("total_reformers", { count });
      socket.emit("stats:live_reformers", { count });
    } catch {
      socket.emit("total_reformers", { count: 0 });
      socket.emit("stats:live_reformers", { count: 0 });
    }
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
