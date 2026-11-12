import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type ValidationSource = 'body' | 'query' | 'params';

export const validate = (schema: ZodSchema, source: ValidationSource = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = schema.parse(req[source]);
      req[source] = data;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = (error.issues || []).map((e: any) => ({
          field: Array.isArray(e.path) ? e.path.join('.') : String(e.path),
          message: e.message,
        }));

        res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            statusCode: 400,
            details,
          },
        });
        return;
      }
      next(error);
    }
  };
};
