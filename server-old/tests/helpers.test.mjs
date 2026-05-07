import assert from "node:assert/strict";
import test from "node:test";

// ─── JWT Helpers ─────────────────────────────────────────────────────────────

process.env.SECRET_JWT = "test-secret-key-for-helpers-test-suite";

const { AuthToken, VerifyToken, serializeUser } = await import("../src/Helpers/JWT.mjs");

test("AuthToken generates a Bearer token", async () => {
    const token = await AuthToken({ id: "user-1" }, 1);
    assert.ok(typeof token === "string");
    assert.ok(token.startsWith("Bearer "));
    const jwtPart = token.replace("Bearer ", "");
    assert.ok(jwtPart.split(".").length === 3, "JWT should have 3 dot-separated parts");
});

test("VerifyToken decodes a token signed by AuthToken", async () => {
    const token = await AuthToken({ id: "user-42", email: "test@example.com" }, 1);
    const jwt = token.replace("Bearer ", "");
    const decoded = await VerifyToken(jwt);

    assert.ok(decoded !== null);
    assert.equal(decoded.id, "user-42");
    assert.equal(decoded.email, "test@example.com");
});

test("VerifyToken returns null for a tampered token", async () => {
    const result = await VerifyToken("invalid.token.string");
    assert.equal(result, null);
});

test("VerifyToken returns null for an empty string", async () => {
    const result = await VerifyToken("");
    assert.equal(result, null);
});

test("serializeUser picks only the allowed fields", () => {
    const full = {
        id: "u1",
        email: "a@b.com",
        role: "3",
        activation: true,
        email_verify: false,
        password: "secret",
        refresh_token_id: "tok-id",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        id_person: "p1",
        extraField: "should be omitted"
    };

    const serialized = serializeUser(full);
    assert.equal(serialized.id, "u1");
    assert.equal(serialized.email, "a@b.com");
    assert.equal(serialized.role, "3");
    assert.equal("password" in serialized, false);
    assert.equal("extraField" in serialized, false);
    assert.equal("refresh_token_id" in serialized, false);
});

// ─── Password Helpers ─────────────────────────────────────────────────────────

const { hashPassword, comparePassword } = await import("../src/Helpers/Password.mjs");

test("hashPassword creates a bcrypt hash different from plain text", async () => {
    const plain = "MySecurePassword!99";
    const hashed = await hashPassword(plain);
    assert.ok(typeof hashed === "string");
    assert.notEqual(hashed, plain);
    assert.ok(hashed.startsWith("$2"), "bcrypt hash should start with $2");
});

test("comparePassword returns true for the correct password", async () => {
    const plain = "CorrectHorseBatteryStaple";
    const hashed = await hashPassword(plain);
    const match = await comparePassword(plain, hashed);
    assert.equal(match, true);
});

test("comparePassword returns false for a wrong password", async () => {
    const hashed = await hashPassword("original");
    const match = await comparePassword("wrong", hashed);
    assert.equal(match, false);
});

test("two calls to hashPassword produce different salts", async () => {
    const plain = "SamePassword";
    const h1 = await hashPassword(plain);
    const h2 = await hashPassword(plain);
    assert.notEqual(h1, h2);
});

// ─── Authorization helpers (pure logic, no DB) ────────────────────────────────

const { isSuperAdmin } = await import("../src/Helpers/Authorization.mjs");

test("isSuperAdmin returns true for numeric role '1'", () => {
    assert.equal(isSuperAdmin({ role: "1" }), true);
});

test("isSuperAdmin returns true for string roles admin/super-admin/superadmin", () => {
    assert.equal(isSuperAdmin({ role: "admin" }), true);
    assert.equal(isSuperAdmin({ role: "super-admin" }), true);
    assert.equal(isSuperAdmin({ role: "super_admin" }), true);
    assert.equal(isSuperAdmin({ role: "superadmin" }), true);
});

test("isSuperAdmin returns false for club/team admin roles", () => {
    assert.equal(isSuperAdmin({ role: "2" }), false);
    assert.equal(isSuperAdmin({ role: "3" }), false);
    assert.equal(isSuperAdmin({ role: "employee" }), false);
    assert.equal(isSuperAdmin({ role: "supervisor" }), false);
});

test("isSuperAdmin returns false for regular user role", () => {
    assert.equal(isSuperAdmin({ role: "4" }), false);
    assert.equal(isSuperAdmin({ role: "customer" }), false);
});

test("isSuperAdmin handles null/undefined user gracefully", () => {
    assert.equal(isSuperAdmin(null), false);
    assert.equal(isSuperAdmin(undefined), false);
    assert.equal(isSuperAdmin({}), false);
});
