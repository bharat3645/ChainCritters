import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodTypeAny } from 'zod';

/** Wraps an async route handler so rejected promises reach the error middleware
 *  instead of crashing the process / hanging the request. */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

type Source = 'body' | 'query' | 'params';

/** Validates req[source] against a zod schema, replacing it with the parsed
 *  (and coerced/trimmed) value on success, or short-circuiting with a 400 and
 *  field-level error messages on failure. */
export const validate =
  (schema: ZodTypeAny, source: Source = 'body'): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: result.error.issues.map((issue) => ({
          path: issue.path.join('.') || source,
          message: issue.message,
        })),
      });
      return;
    }
    // Express 5 makes req.query/req.params read-only getters; body stays writable.
    Object.assign(req[source] as object, result.data);
    next();
  };

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({ message: `No route for ${req.method} ${req.path}` });
};

// Must be declared with 4 params so Express recognizes it as an error handler.
export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message });
    return;
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
};
