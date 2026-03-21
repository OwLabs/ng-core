const IS_PROD = process.env.NODE_ENV === 'production';
const COOKIE_PREFIX = IS_PROD ? '__Host-' : '';

export const AUTH_COOKIE_NAMES = {
  ACCESS_TOKEN: `${COOKIE_PREFIX}access_token`,
  REFRESH_TOKEN: `${COOKIE_PREFIX}refresh_token`,
} as const;
