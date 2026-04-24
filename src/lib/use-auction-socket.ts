"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/lib/auth-context";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

export interface AuctionBid {
  id: string;
  amountInr: number;
  currency: string;
  isProxy: boolean;
  createdAt: string;
  bidder: { id: string; name: string; country: string | null };
}

interface UseAuctionSocketOptions {
  lotId: string;
  onNewBid?: (bid: AuctionBid) => void;
  onOutbid?: (data: { lotId: string; newAmount: number; lotNumber: string }) => void;
  onProxyBid?: (bid: AuctionBid) => void;
  onAuctionEnding?: (data: { lotId: string; newEndsAt: string }) => void;
  onAuctionEnded?: (data: { lotId: string; outcome: string; winnerId?: string; winningAmount?: number }) => void;
}

export function useAuctionSocket({
  lotId,
  onNewBid,
  onOutbid,
  onProxyBid,
  onAuctionEnding,
  onAuctionEnded,
}: UseAuctionSocketOptions) {
  const { accessToken } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);

  // Keep callbacks in refs to avoid re-connecting on handler changes
  const callbacksRef = useRef({ onNewBid, onOutbid, onProxyBid, onAuctionEnding, onAuctionEnded });

  useEffect(() => {
    callbacksRef.current = { onNewBid, onOutbid, onProxyBid, onAuctionEnding, onAuctionEnded };
  }, [onAuctionEnded, onAuctionEnding, onNewBid, onOutbid, onProxyBid]);

  useEffect(() => {
    if (!accessToken || !lotId) return;

    const socket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join-auction", lotId);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("viewer-count", (data: { count: number }) => {
      setViewerCount(data.count);
    });

    socket.on("new-bid", (data: { bid: AuctionBid }) => {
      callbacksRef.current.onNewBid?.(data.bid);
    });

    socket.on("outbid", (data: { lotId: string; newAmount: number; lotNumber: string }) => {
      callbacksRef.current.onOutbid?.(data);
    });

    socket.on("proxy-bid", (data: { bid: AuctionBid }) => {
      callbacksRef.current.onProxyBid?.(data.bid);
    });

    socket.on("auction-ending", (data: { lotId: string; newEndsAt: string }) => {
      callbacksRef.current.onAuctionEnding?.(data);
    });

    socket.on("auction-ended", (data: { lotId: string; outcome: string; winnerId?: string; winningAmount?: number }) => {
      callbacksRef.current.onAuctionEnded?.(data);
    });

    socket.on("connect_error", (err) => {
      console.warn("[WS] Connection error:", err.message);
    });

    return () => {
      socket.emit("leave-auction", lotId);
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [accessToken, lotId]);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
  }, []);

  return { isConnected, viewerCount, disconnect };
}

