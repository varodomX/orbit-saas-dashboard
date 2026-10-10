import { test } from "node:test";
import assert from "node:assert/strict";
import {
  hashPassword,
  verifyPassword,
  signSession,
  readSession,
} from "../lib/security.mjs";
test("passwords are salted and reject incorrect credentials", () => {
  const a = hashPassword("OrbitDemo123!");
  assert.notEqual(a, hashPassword("OrbitDemo123!"));
  assert.ok(verifyPassword("OrbitDemo123!", a));
  assert.equal(verifyPassword("incorrect", a), false);
  assert.equal(verifyPassword("x", "corrupt"), false);
});
test("sessions reject forgery, expired tokens and different secrets", () => {
  const token = signSession(1, "test-secret", 1000);
  assert.equal(readSession(token, "test-secret", 2000), 1);
  assert.equal(readSession(token + "x", "test-secret", 2000), null);
  assert.equal(readSession(token, "other-secret", 2000), null);
  assert.equal(readSession(token, "test-secret", 86401000), null);
  assert.equal(readSession("invalid", "test-secret"), null);
});
