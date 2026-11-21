import test from "node:test";
import assert from "node:assert/strict";
import {
  verifyStudent,
  verifyTutor,
  verifyAdmin,
} from "../src/middleware/auth";

type Guard = (req: any, res: any, next: () => void) => void;

function run(guard: Guard, role?: string) {
  let status = 0;
  let body: unknown = null;
  let nextCalled = false;

  const req = { user: role ? { role } : undefined };
  const res = {
    status(code: number) {
      status = code;
      return this;
    },
    json(payload: unknown) {
      body = payload;
      return this;
    },
  };
  const next = () => {
    nextCalled = true;
  };

  guard(req, res, next);
  return { status, body, nextCalled };
}

const guards: Array<{
  name: string;
  guard: Guard;
  allowed: string;
  message: string;
}> = [
  {
    name: "verifyStudent",
    guard: verifyStudent,
    allowed: "student",
    message: "Forbidden: students only",
  },
  {
    name: "verifyTutor",
    guard: verifyTutor,
    allowed: "tutor",
    message: "Forbidden: tutors only",
  },
  {
    name: "verifyAdmin",
    guard: verifyAdmin,
    allowed: "admin",
    message: "Forbidden: admins only",
  },
];

for (const { name, guard, allowed, message } of guards) {
  test(`${name} allows the matching role`, () => {
    const result = run(guard, allowed);
    assert.equal(result.nextCalled, true);
    assert.equal(result.status, 0);
  });

  for (const denied of ["student", "tutor", "admin"].filter((r) => r !== allowed)) {
    test(`${name} rejects ${denied}`, () => {
      const result = run(guard, denied);
      assert.equal(result.nextCalled, false);
      assert.equal(result.status, 403);
      assert.deepEqual(result.body, { message });
    });
  }

  test(`${name} rejects a missing user`, () => {
    const result = run(guard);
    assert.equal(result.nextCalled, false);
    assert.equal(result.status, 403);
  });
}
