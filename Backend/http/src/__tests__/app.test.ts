import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

// Prisma is mocked so this suite exercises real routing, validation and
// error-handling logic without needing a live Postgres instance.
const prismaMock = vi.hoisted(() => ({
  user: {
    create: vi.fn(),
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
  offer: {
    create: vi.fn(),
    findMany: vi.fn(),
    updateMany: vi.fn(),
    findUnique: vi.fn(),
  },
}));

vi.mock('../../../db/dist/index.js', () => ({ prisma: prismaMock }));

const { app } = await import('../app.js');

const ADDR_A = `0x${'1'.repeat(40)}`;
const ADDR_B = `0x${'2'.repeat(40)}`;

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('GET /health', () => {
  it('reports ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('unknown routes', () => {
  it('404s with a structured body', async () => {
    const res = await request(app).get('/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/no route/i);
  });
});

describe('POST /users', () => {
  it('rejects a malformed address', async () => {
    const res = await request(app).post('/users').send({ address: 'not-an-address' });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].path).toBe('address');
  });

  it('rejects a missing address', async () => {
    const res = await request(app).post('/users').send({});
    expect(res.status).toBe(400);
  });

  it('creates a new user', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ address: ADDR_A });

    const res = await request(app).post('/users').send({ address: ADDR_A });

    expect(res.status).toBe(201);
    expect(prismaMock.user.create).toHaveBeenCalledWith({ data: { address: ADDR_A } });
    expect(res.body.user.address).toBe(ADDR_A);
  });

  it('returns the existing user idempotently instead of erroring', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ address: ADDR_A });

    const res = await request(app).post('/users').send({ address: ADDR_A });

    expect(res.status).toBe(200);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });
});

describe('GET /offer and /request', () => {
  it('requires an address query param', async () => {
    const res = await request(app).get('/offer');
    expect(res.status).toBe(400);
  });

  it('lists offers sent by the address', async () => {
    prismaMock.offer.findMany.mockResolvedValue([{ id: 1, senderAddress: ADDR_A }]);
    const res = await request(app).get(`/offer?address=${ADDR_A}`);
    expect(res.status).toBe(200);
    expect(res.body.offers).toHaveLength(1);
  });

  it('lists requests received by the address', async () => {
    prismaMock.offer.findMany.mockResolvedValue([{ id: 2, personBId: ADDR_B }]);
    const res = await request(app).get(`/request?address=${ADDR_B}`);
    expect(res.status).toBe(200);
    expect(res.body.requests).toHaveLength(1);
  });
});

describe('POST /offer', () => {
  const validBody = {
    senderAddress: ADDR_A,
    intrestedNFT: 1,
    offeredNFT: 2,
    personAaddress: ADDR_A,
    personBaddress: ADDR_B,
  };

  it('rejects an incomplete body', async () => {
    const res = await request(app).post('/offer').send({ senderAddress: ADDR_A });
    expect(res.status).toBe(400);
  });

  it('creates the offer, upserts both users, and pushes a live event', async () => {
    prismaMock.user.upsert.mockResolvedValue({});
    prismaMock.offer.create.mockResolvedValue({ id: 5, ...validBody, status: 'PENDING' });

    const res = await request(app).post('/offer').send(validBody);

    expect(res.status).toBe(201);
    expect(prismaMock.user.upsert).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/broadcast'),
      expect.objectContaining({ method: 'POST' }),
    );
  });
});

describe('PATCH /offer/:id/status', () => {
  it('rejects a non-numeric id', async () => {
    const res = await request(app).patch('/offer/not-a-number/status').send({ status: 'ACCEPTED' });
    expect(res.status).toBe(400);
  });

  it('rejects an invalid status value', async () => {
    const res = await request(app).patch('/offer/1/status').send({ status: 'MAYBE' });
    expect(res.status).toBe(400);
  });

  it('404s when the offer does not exist', async () => {
    prismaMock.offer.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.offer.findUnique.mockResolvedValue(null);

    const res = await request(app).patch('/offer/999/status').send({ status: 'ACCEPTED' });

    expect(res.status).toBe(404);
  });

  it('409s when the offer was already resolved', async () => {
    prismaMock.offer.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.offer.findUnique.mockResolvedValue({ id: 1, status: 'ACCEPTED' });

    const res = await request(app).patch('/offer/1/status').send({ status: 'REJECTED' });

    expect(res.status).toBe(409);
  });

  it('accepts a pending offer and broadcasts the update', async () => {
    prismaMock.offer.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.offer.findUnique.mockResolvedValue({ id: 1, status: 'ACCEPTED' });

    const res = await request(app).patch('/offer/1/status').send({ status: 'ACCEPTED' });

    expect(res.status).toBe(200);
    expect(prismaMock.offer.updateMany).toHaveBeenCalledWith({
      where: { id: 1, status: 'PENDING' },
      data: { status: 'ACCEPTED' },
    });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/broadcast'),
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
