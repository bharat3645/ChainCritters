// Centralizes the backend endpoints so they're configurable per environment
// (local dev, Docker Compose, a deployed host) instead of hardcoded across
// every page. Defaults match the ports the services listen on locally.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8080';
