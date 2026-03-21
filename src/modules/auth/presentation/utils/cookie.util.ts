import { CookieOptions } from 'express';

export const getCookieOptions = (maxAge: number): CookieOptions => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge,
  path: '/', // Required for __Host- prefix!
});
