import { createHash, randomBytes } from "node:crypto";
import type { PKCEPair } from "./types.js";

const PKCE_CHARSET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

/**
 * Convert a buffer to a URL-safe base64 string.
 */
function base64Url(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function createVerifier(length: number): string {
  const random = randomBytes(length);
  let result = "";

  for (let index = 0; index < length; index += 1) {
    result += PKCE_CHARSET[random[index] % PKCE_CHARSET.length];
  }

  return result;
}

/**
 * Create a PKCE verifier/challenge pair for the OAuth code flow.
 */
export function generatePkcePair(length = 96): PKCEPair {
  if (length < 43 || length > 128)
    throw new RangeError("PKCE verifier length must be between 43 and 128.");

  const verifier = createVerifier(length);
  const challenge = base64Url(createHash("sha256").update(verifier).digest());

  return { verifier, challenge, method: "S256" };
}
