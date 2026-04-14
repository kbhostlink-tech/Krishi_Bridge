/**
 * Standalone Socket.io server for real-time auction bidding.
 * Runs as a separate Node.js process (PM2 managed on production).
 *
 * Events:
 *   Client → Server:
 *     - join-auction(lotId)     — join an auction room
 *     - leave-auction(lotId)    — leave an auction room
 *
 *   Server → Client:
 *     - new-bid(bid)            — a new bid was placed
 *     - outbid(data)            — user was outbid
 *     - proxy-bid(bid)          — proxy auto-bid was triggered
 *     - auction-ending(data)    — auction extended (anti-sniping)
 *     - auction-ended(data)     — auction has concluded
 *     - viewer-count(count)     — current # of viewers in room
 *     - error(message)          — error message
 *
 * Authentication: JWT token verified on connection.
 * CORS: Configured for allowed origins only.
 */

import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

const PORT = parseInt(process.env.SOCKET_PORT || "3001", 10);
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const ALLOWED_ORIGINS = (process.env.SOCKET_CORS_ORIGINS || "http://localhost:3000").split(",");

const httpServer = createServer((req, res) => {
  // Health check endpoint
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", uptime: process.uptime() }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ─── JWT Authentication Middleware ────────────
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error("Authentication required"));
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (typeof payload === "object" && payload !== null) {
      socket.data.userId = payload.userId;
      socket.data.role = payload.role;
      socket.data.country = payload.country;
      socket.data.kycStatus = payload.kycStatus;
    }
    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
});

// ─── Connection Handler ──────────────────────
io.on("connection", (socket) => {
  console.log(`[WS] Connected: ${socket.data.userId} (${socket.id})`);

  // Join auction room
  socket.on("join-auction", (lotId) => {
    if (typeof lotId !== "string" || lotId.length > 100) {
      socket.emit("error", "Invalid lot ID");
      return;
    }
    const room = `auction:${lotId}`;
    socket.join(room);

    // Broadcast updated viewer count
    const viewerCount = io.sockets.adapter.rooms.get(room)?.size || 0;
    io.to(room).emit("viewer-count", { lotId, count: viewerCount });

    console.log(`[WS] ${socket.data.userId} joined ${room} (${viewerCount} viewers)`);
  });

  // Leave auction room
  socket.on("leave-auction", (lotId) => {
    if (typeof lotId !== "string") return;
    const room = `auction:${lotId}`;
    socket.leave(room);

    const viewerCount = io.sockets.adapter.rooms.get(room)?.size || 0;
    io.to(room).emit("viewer-count", { lotId, count: viewerCount });

    console.log(`[WS] ${socket.data.userId} left ${room} (${viewerCount} viewers)`);
  });

  socket.on("disconnect", () => {
    console.log(`[WS] Disconnected: ${socket.data.userId}`);
  });
});

// ─── API for Next.js to broadcast events ─────
// Called via HTTP POST from Next.js API routes
httpServer.on("request", (req, res) => {
  if (req.method === "POST" && req.url === "/broadcast") {
    const authHeader = req.headers["authorization"];
    const broadcastSecret = process.env.SOCKET_BROADCAST_SECRET || "dev-broadcast-secret";

    if (authHeader !== `Bearer ${broadcastSecret}`) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }

    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      try {
        const { event, room, data } = JSON.parse(body);
        if (!event || !room) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "event and room required" }));
          return;
        }

        io.to(room).emit(event, data);

        // For outbid events, also send directly to the specific user
        if (event === "outbid" && data?.userId) {
          // Find sockets for that user and emit directly
          for (const [, socket] of io.sockets.sockets) {
            if (socket.data.userId === data.userId) {
              socket.emit("outbid", data);
            }
          }
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return;
  }
});

httpServer.listen(PORT, () => {
  console.log(`[Socket.io] Server listening on port ${PORT}`);
  console.log(`[Socket.io] CORS origins: ${ALLOWED_ORIGINS.join(", ")}`);
});
