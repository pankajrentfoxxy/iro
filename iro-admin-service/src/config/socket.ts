import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { verifyAdminAccessToken } from "../lib/jwt.js";

let io: Server | null = null;
export function attachAdminSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: true, credentials: true },
    path: "/socket.io",
  });

  io.use((socket, next) => {
    try {
      const raw =
        (socket.handshake.auth as { token?: string })?.token ??
        (typeof socket.handshake.headers.authorization === "string"
          ? socket.handshake.headers.authorization.replace(/^Bearer\s+/i, "")
          : undefined);
      if (!raw) return next(new Error("Unauthorized"));
      verifyAdminAccessToken(raw);
      void socket.join("admin-room");
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", () => undefined);

  return io;
}

export function emitAdminEvent(event: string, payload: unknown) {
  io?.to("admin-room").emit(event, payload);
}
