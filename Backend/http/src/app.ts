import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { prisma } from '../../db/dist/index.js';
import {
  createUserSchema,
  createOfferSchema,
  addressQuerySchema,
  offerIdParamSchema,
  updateOfferStatusSchema,
} from './schemas.js';
import { asyncHandler, validate, HttpError, notFoundHandler, errorHandler } from './middleware.js';
import { publishTradeEvent } from './notify.js';

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Generous read-only limit; a tighter limit on the state-changing routes
// below stops a single client from spamming offer creation/status flips.
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please slow down.' },
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

app.post(
  '/users',
  writeLimiter,
  validate(createUserSchema, 'body'),
  asyncHandler(async (req, res) => {
    const { address } = req.body as { address: string };

    const existing = await prisma.user.findUnique({ where: { address } });
    if (existing) {
      res.status(200).json({ message: 'User already exists', user: existing });
      return;
    }

    const user = await prisma.user.create({ data: { address } });
    res.status(201).json({ message: 'User created successfully', user });
  }),
);

// Offers SENT by a user (sender)
app.get(
  '/offer',
  validate(addressQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const { address } = req.query as unknown as { address: string };
    const offers = await prisma.offer.findMany({
      where: { senderAddress: address },
      include: { personB: true },
      orderBy: { id: 'desc' },
    });
    res.status(200).json({ offers });
  }),
);

// Offers RECEIVED by a user (receiver)
app.get(
  '/request',
  validate(addressQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const { address } = req.query as unknown as { address: string };
    const requests = await prisma.offer.findMany({
      where: { personBId: address },
      include: { personA: true },
      orderBy: { id: 'desc' },
    });
    res.status(200).json({ requests });
  }),
);

app.post(
  '/offer',
  writeLimiter,
  validate(createOfferSchema, 'body'),
  asyncHandler(async (req, res) => {
    const { senderAddress, intrestedNFT, offeredNFT, personAaddress, personBaddress } = req.body as {
      senderAddress: string;
      intrestedNFT: number;
      offeredNFT: number;
      personAaddress: string;
      personBaddress: string;
    };

    // Ensure both parties exist so the FK relations in Offer don't 500.
    await prisma.user.upsert({ where: { address: personAaddress }, update: {}, create: { address: personAaddress } });
    await prisma.user.upsert({ where: { address: personBaddress }, update: {}, create: { address: personBaddress } });

    const offer = await prisma.offer.create({
      data: { senderAddress, intrestedNFT, offeredNFT, personAId: personAaddress, personBId: personBaddress },
    });

    publishTradeEvent({ type: 'OFFER_CREATED', offer });

    res.status(201).json({ message: 'Offer created successfully', offer });
  }),
);

// Accept or reject a pending offer, then push a live update to connected
// clients over the WebSockets service. This closes the loop that the
// OfferStatus enum (PENDING/ACCEPTED/REJECTED) already implied but no route
// ever exercised — offers could previously only ever be created, never
// resolved.
app.patch(
  '/offer/:id/status',
  writeLimiter,
  validate(offerIdParamSchema, 'params'),
  validate(updateOfferStatusSchema, 'body'),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as { id: number };
    const { status } = req.body as { status: 'ACCEPTED' | 'REJECTED' };

    const { count } = await prisma.offer.updateMany({
      where: { id, status: 'PENDING' },
      data: { status },
    });

    if (count === 0) {
      const existing = await prisma.offer.findUnique({ where: { id } });
      if (!existing) throw new HttpError(404, 'Offer not found');
      throw new HttpError(409, `Offer is already ${existing.status.toLowerCase()}`);
    }

    const offer = await prisma.offer.findUnique({
      where: { id },
      include: { personA: true, personB: true },
    });

    publishTradeEvent({ type: 'OFFER_UPDATED', offer });

    res.status(200).json({ message: `Offer ${status.toLowerCase()}`, offer });
  }),
);

app.use(notFoundHandler);
app.use(errorHandler);
