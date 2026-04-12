if (!process.env.COOKIE_DOMAIN) throw new Error('COOKIE_DOMAIN is required');

export const cookieDomain = process.env.COOKIE_DOMAIN;
