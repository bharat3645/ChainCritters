# ChainCritters

An on-chain trading card game: mint TCG-style creature NFTs, browse them in a marketplace, and propose/accept/reject peer-to-peer trades with live updates. Built as four independent subsystems in one repo.

## Subsystems

| Folder | Stack | Purpose |
|---|---|---|
| `BlockChain/` | Foundry (Solidity ^0.8.13, OpenZeppelin ERC721URIStorage) | The `Nft` contract: minting, on-chain trade proposals/approvals, NFT transfer/approval. Deploy script + tests included. |
| `Backend/db/` | TypeScript, Prisma, PostgreSQL | Schema and generated Prisma client for `User`/`Offer` records (off-chain trade offer bookkeeping). |
| `Backend/http/` | TypeScript, Express, Zod | REST API for the trade-offer lifecycle (create, list, accept/reject) with request validation, rate limiting, centralized error handling, and a test suite. |
| `Backend/WebSockets/` | TypeScript, `ws` | Live event feed: broadcasts `OFFER_CREATED`/`OFFER_UPDATED` pushed internally by `Backend/http`, plus relays client chat messages. |
| `chaincritters-web/` | Next.js 15, React 19, wagmi/viem/ethers, RainbowKit, Tailwind | The web app: shop, profile, card details, and trade pages. Talks to the deployed contract via `ethers`, to `Backend/http` for off-chain offer data, and to `Backend/WebSockets` for live offer updates. |
| `ChainCritters-TokenURI/` | static JSON | ERC-721 metadata files (pinned to IPFS/Pinata) referenced by the deploy script and rendered by the frontend. |

## Quickest start: Docker Compose

Spins up Postgres, runs migrations, and starts all three backend/frontend services:

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- REST API: http://localhost:3001 (health check at `/health`)
- WebSockets: ws://localhost:8080 (health check at `/health`)

Override defaults (DB credentials, the internal shared secret between `http` and `websockets`) via a `.env` file — see `.env.example`.

## Getting started

### Smart contracts (`BlockChain/`)
```bash
cd BlockChain
forge build
forge test
# Deploy (requires PRIVATE_KEY env var and an RPC target):
forge script script/DeployNfts.s.sol --rpc-url <RPC_URL> --broadcast
```
The contract currently referenced by the frontend is deployed on Sepolia at
`0x14c03AE4342aa2ed24235B3ABFDd0C0aAc118815`. That deployment predates the
ChainCritters rebrand, so its on-chain ERC-721 name/symbol and the metadata
it points to on IPFS still reflect the old naming — redeploy with the
renamed `ChainCritters-TokenURI/` set (re-pinned to IPFS/Pinata first) to
get a fully rebranded contract.

### Backend (`Backend/db`, `Backend/http`, `Backend/WebSockets`) — running natively
```bash
cd Backend/db
cp .env.example .env   # set DATABASE_URL to a real Postgres instance
npm install
npx prisma generate
npx prisma migrate deploy
npm run build

cd ../http
npm install
npm test                # runs the Vitest + Supertest API suite (Prisma mocked, no DB needed)
npm run dev              # builds db, then starts the API on :3001

cd ../WebSockets
npm install
npx tsc -b && node dist/index.js   # starts the live-update socket + internal broadcast hook on :8080
```

### Frontend (`chaincritters-web/`)
```bash
cd chaincritters-web
cp .env.example .env.local   # optional: override NEXT_PUBLIC_API_URL / NEXT_PUBLIC_WS_URL
npm install
npm run dev              # http://localhost:3000
```
The frontend expects the HTTP API on `http://localhost:3001`, the WebSocket feed on
`ws://localhost:8080`, and a browser wallet (MetaMask or any injected/WalletConnect-compatible
wallet) connected to Sepolia.

## API reference (`Backend/http`)

All request bodies/query params/route params are validated with Zod; failures return `400`
with a field-level `errors` array. Mutating routes are rate-limited (60 req / 15 min / IP).

| Method | Route | Body / Query | Notes |
|---|---|---|---|
| `GET` | `/health` | — | Liveness check. |
| `POST` | `/users` | `{ address }` | Idempotent — returns the existing user (`200`) instead of erroring if already registered. |
| `POST` | `/offer` | `{ senderAddress, intrestedNFT, offeredNFT, personAaddress, personBaddress }` | Creates a `PENDING` offer and pushes `OFFER_CREATED` to `Backend/WebSockets`. |
| `GET` | `/offer?address=` | — | Offers sent by `address`. |
| `GET` | `/request?address=` | — | Offers received by `address`. |
| `PATCH` | `/offer/:id/status` | `{ status: "ACCEPTED" \| "REJECTED" }` | Atomically resolves a `PENDING` offer (`409` if already resolved, `404` if missing) and pushes `OFFER_UPDATED`. |

`Backend/WebSockets` exposes `GET /health` and an internal `POST /broadcast` (guarded by the
`x-internal-key` header / `INTERNAL_API_KEY` env var) that `Backend/http` uses to push those
live events to every connected browser client.

## CI

`.github/workflows/ci.yml` builds/tests all four subsystems on every push and PR: Foundry
(`forge build` + `forge test`), `Backend/db` (Prisma generate + build), `Backend/http`
(build + the Vitest suite), `Backend/WebSockets` (build), and the Next.js frontend (lint +
build). Note: `BlockChain/.github/workflows/*.yml` also exist but are inert — GitHub Actions
only reads workflows from the repository root, and `BlockChain/` is a plain subdirectory of
this repo, not its own — so the root workflow is what actually runs.

## Notes
- `BlockChain/lib/forge-std` and `BlockChain/lib/openzeppelin-contracts` are git submodules; run `git submodule update --init --recursive` after cloning.
- The frontend reads the contract address as a hardcoded per-page constant (not yet an env var). All pages now point at the same deployed contract (see above).
- The `image` field in `ChainCritters-TokenURI/*.json` still points at placeholder third-party card art left over from prototyping. Swap these for original ChainCritters artwork before any public/production use.
