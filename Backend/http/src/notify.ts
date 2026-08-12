// Best-effort push of trade events to the WebSockets service so connected
// clients (the frontend) get live updates instead of having to poll the REST
// API. This is intentionally fire-and-forget: the WebSockets service being
// down must never fail the underlying REST request, it just means clients
// won't get a live push until they next refetch.

const WS_HTTP_URL = process.env.WS_HTTP_URL ?? 'http://localhost:8080';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY ?? 'dev-internal-key';

export type TradeEvent =
  | { type: 'OFFER_CREATED'; offer: unknown }
  | { type: 'OFFER_UPDATED'; offer: unknown };

export async function publishTradeEvent(event: TradeEvent): Promise<void> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    await fetch(`${WS_HTTP_URL}/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': INTERNAL_API_KEY,
      },
      body: JSON.stringify(event),
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch (error) {
    console.warn(`[notify] failed to publish ${event.type} to WebSockets service:`, (error as Error).message);
  }
}
