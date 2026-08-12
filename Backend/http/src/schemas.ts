import { z } from 'zod';

// Ethereum addresses are 0x + 40 hex chars. Validating this up front stops
// obviously-malformed addresses (typos, truncated copy/paste, non-hex input)
// from ever reaching Prisma / the chain.
export const ethAddress = z
  .string({ error: 'Address is required' })
  .trim()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid 0x-prefixed 40-hex-char Ethereum address');

// tokenId comes in from JSON (number) or query strings (string); coerce covers both.
const tokenId = z.coerce.number().int().nonnegative();

export const createUserSchema = z.object({
  address: ethAddress,
});

export const createOfferSchema = z.object({
  senderAddress: ethAddress,
  intrestedNFT: tokenId,
  offeredNFT: tokenId,
  personAaddress: ethAddress,
  personBaddress: ethAddress,
});

export const addressQuerySchema = z.object({
  address: ethAddress,
});

export const offerIdParamSchema = z.object({
  id: z.coerce.number().int().positive('Offer id must be a positive integer'),
});

export const OfferStatusEnum = z.enum(['ACCEPTED', 'REJECTED']);

export const updateOfferStatusSchema = z.object({
  status: OfferStatusEnum,
});
