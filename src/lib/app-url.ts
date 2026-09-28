/** Absolute base URL used in emails and WhatsApp messages. */
export function appUrl(path = "") {
  // On Vercel the production domain is known automatically, so NEXTAUTH_URL is optional there.
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  const base = (process.env.NEXTAUTH_URL || (vercel ? `https://${vercel}` : "http://localhost:3000")).replace(/\/$/, "");
  return `${base}${path}`;
}
