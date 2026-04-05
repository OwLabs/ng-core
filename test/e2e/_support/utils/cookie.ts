export function parseCookieValue(
  setCookieHeaders: string[] | undefined,
  cookieName: string,
): string | undefined {
  if (!setCookieHeaders) return undefined;

  const cookie = setCookieHeaders.find((c) => c.startsWith(`${cookieName}=`));
  if (!cookie) return undefined;

  return cookie.split('=')[1].split(';')[0];
}
