/** Absolute base URL used in emails and WhatsApp messages. */
export function appUrl(path = "") {
  const base = (process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")).replace(/\/$/, "");
  return `${base}${path}`;
}
