import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHmac,
} from "node:crypto";
export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function verifyPassword(password, stored) {
  try {
    const [salt, hash] = stored.split(":");
    return timingSafeEqual(
      Buffer.from(hash, "hex"),
      scryptSync(password, salt, 64),
    );
  } catch {
    return false;
  }
}
export function signSession(id, secret, now = Date.now()) {
  const payload = Buffer.from(
    JSON.stringify({ id, exp: now + 86400000 }),
  ).toString("base64url");
  return `${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`;
}
export function readSession(token, secret, now = Date.now()) {
  try {
    const [payload, signature] = token.split(".");
    const expected = createHmac("sha256", secret).update(payload).digest();
    if (!timingSafeEqual(expected, Buffer.from(signature, "base64url")))
      return null;
    const value = JSON.parse(Buffer.from(payload, "base64url").toString());
    return value.exp > now && Number.isInteger(value.id) ? value.id : null;
  } catch {
    return null;
  }
}
