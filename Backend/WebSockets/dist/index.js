"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const ws_1 = require("ws");
const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
// Shared secret so only the trusted http/db service can push server-side
// events (offer created/accepted/rejected) — regular browser clients only
// ever read from the socket, never hit this endpoint.
const INTERNAL_API_KEY = (_a = process.env.INTERNAL_API_KEY) !== null && _a !== void 0 ? _a : 'dev-internal-key';
function broadcast(payload) {
    const data = JSON.stringify(payload);
    wss.clients.forEach((client) => {
        if (client.readyState === ws_1.WebSocket.OPEN) {
            client.send(data);
        }
    });
}
// A plain http server fronts the ws server so we can also expose a small
// internal REST hook (`POST /broadcast`) that the Backend/http service uses
// to push live trade-offer events out to every connected client, and a
// `/health` check for container orchestration.
const server = http_1.default.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', clients: wss.clients.size }));
        return;
    }
    if (req.method === 'POST' && req.url === '/broadcast') {
        if (req.headers['x-internal-key'] !== INTERNAL_API_KEY) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Unauthorized' }));
            return;
        }
        let body = '';
        req.on('data', (chunk) => {
            body += chunk;
            if (body.length > 1000000)
                req.destroy(); // guard against runaway payloads
        });
        req.on('end', () => {
            try {
                const event = JSON.parse(body || '{}');
                broadcast(event);
                res.writeHead(202, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'broadcast queued' }));
            }
            catch (_a) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Invalid JSON body' }));
            }
        });
        return;
    }
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Not found' }));
});
const wss = new ws_1.WebSocketServer({ server });
wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.send(JSON.stringify({ type: 'CONNECTED' }));
    ws.on('message', (message) => {
        // Client-to-client chat/ping messages (e.g. the trade discussion box)
        // are relayed as-is to every other connected client.
        let parsed = message.toString();
        try {
            parsed = JSON.parse(message.toString());
        }
        catch (_a) {
            // not JSON — forward as a plain chat message
            parsed = { type: 'MESSAGE', text: message.toString() };
        }
        broadcast(parsed);
    });
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});
server.listen(PORT, () => {
    console.log(`WebSocket server listening on port ${PORT}`);
});
