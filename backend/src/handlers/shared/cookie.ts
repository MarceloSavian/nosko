export const CUSTOMER_COOKIE_NAME = 'nosko_session';
export const ADMIN_COOKIE_NAME = 'nosko_admin_session';
const MAX_AGE = 3600;

export function makeAuthCookie(token: string, cookieName: string, domain: string): string {
  return `${cookieName}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Domain=${domain}; Max-Age=${MAX_AGE}`;
}

export function clearAuthCookie(cookieName: string, domain: string): string {
  return `${cookieName}=; HttpOnly; Secure; SameSite=Lax; Path=/; Domain=${domain}; Max-Age=0`;
}

export function extractTokenFromCookies(
  cookies: string[] | undefined,
  cookieName: string,
): string | undefined {
  if (!cookies) return undefined;
  const prefix = `${cookieName}=`;
  const match = cookies.find((c) => c.startsWith(prefix));
  if (!match) return undefined;
  const value = match.slice(prefix.length);
  return value || undefined;
}
