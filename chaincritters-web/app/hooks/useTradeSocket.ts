'use client';

import { useEffect, useRef } from 'react';
import { WS_URL } from '../../lib/api';

export type TradeSocketEvent =
  | { type: 'CONNECTED' }
  | { type: 'OFFER_CREATED'; offer: Record<string, unknown> }
  | { type: 'OFFER_UPDATED'; offer: Record<string, unknown> };

/**
 * Subscribes to the live trade-offer feed pushed by the WebSockets service
 * so pages can react to offers being created/accepted/rejected in real time
 * instead of only finding out on the next manual refresh. Reconnects with a
 * fixed backoff if the socket drops or the service isn't up yet.
 */
export function useTradeSocket(onEvent: (event: TradeSocketEvent) => void) {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    let socket: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      try {
        socket = new WebSocket(WS_URL);
      } catch {
        retryTimer = setTimeout(connect, 3000);
        return;
      }

      socket.onmessage = (event) => {
        try {
          handlerRef.current(JSON.parse(event.data));
        } catch {
          // ignore non-JSON / unrelated frames
        }
      };
      socket.onclose = () => {
        if (!cancelled) retryTimer = setTimeout(connect, 3000);
      };
      socket.onerror = () => socket?.close();
    };

    connect();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      socket?.close();
    };
  }, []);
}
