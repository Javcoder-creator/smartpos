import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface TokenUserPayload {
  id: string;
  businessId?: string;
  role: string;
  email: string;
}

export const generateAccessToken = (payload: TokenUserPayload): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRY as any,
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
};

export const generateRefreshToken = (payload: { id: string }): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRY as any,
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
};

export const verifyAccessToken = (token: string): TokenUserPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenUserPayload;
};

export const verifyRefreshToken = (token: string): { id: string } => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { id: string };
};

export const generateResetToken = (payload: { id: string; email: string }): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
};

export const verifyResetToken = (token: string): { id: string; email: string } => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as { id: string; email: string };
};
