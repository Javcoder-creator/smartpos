/* eslint-disable @typescript-eslint/no-namespace */

declare namespace Express {
  interface Request {
    user?: {
      id: string;
      businessId?: string;
      role: string;
      email: string;
    };
    businessId?: string;
  }
}
