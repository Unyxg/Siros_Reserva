import { createHash } from "node:crypto";

/** Only this hash is stored; the raw token lives in the link sent to the neighbor. */
export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");
