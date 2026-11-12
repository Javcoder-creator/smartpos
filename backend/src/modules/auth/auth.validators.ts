import { z } from 'zod';

export const registerSchema = z.object({
  businessName: z.string().min(2, 'Biznes nomi kamida 2 ta belgidan iborat bo‘lishi kerak'),
  email: z.string().email('Noto‘g‘ri email formati'),
  password: z.string().min(6, 'Parol kamida 6 ta belgidan iborat bo‘lishi kerak'),
  firstName: z.string().min(1, 'Ism kiritilishi shart'),
  lastName: z.string().min(1, 'Familiya kiritilishi shart'),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Noto‘g‘ri email formati'),
  password: z.string().min(1, 'Parol kiritilishi shart'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Noto‘g‘ri email formati'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token kiritilishi shart'),
  password: z.string().min(6, 'Yangi parol kamida 6 ta belgidan iborat bo‘lishi kerak'),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  language: z.enum(['uz', 'ru']).optional(),
  avatarUrl: z.string().url().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Joriy parol kiritilishi shart'),
  newPassword: z.string().min(6, 'Yangi parol kamida 6 ta belgidan iborat bo‘lishi kerak'),
});
