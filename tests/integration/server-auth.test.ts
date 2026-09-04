import { describe, it, expect, vi } from "vitest";
const { bootstrapSecretMatches, getUserClaims, requireAdmin, requireSignedIn } = await import('../../server/utils/auth');

vi.mock("h3", () => ({
	getHeader: vi.fn((event, name) => {
		const headers = event.node?.req?.headers || {};
		return headers[name] || headers[name.toLowerCase()] || null;
	}),
	createError: (input: { statusCode?: number; message?: string }) => {
		const error = new Error(input.message || "Error");
		Object.assign(error, input);
		return error;
	},
}));

vi.mock('../../server/useFirebaseAdmin', () => ({
  auth: {
    verifyIdToken: vi.fn()
  }
})); 

// Mock getHeader resolved by h3 mock

describe("getUserClaims", () => {
  it("returns claims for valid token", async () => {
    const mockAuth = vi.mocked((await import('../../server/useFirebaseAdmin')).auth).verifyIdToken;
    mockAuth.mockResolvedValue({ admin: true, sub: 'test', iat: 1, exp: 2, auth_time: 1, firebase: { identities: {} } } as any);
    const mockEvent = { node: { req: { headers: { authorization: 'Bearer valid' } } } } as any;
    const claims = await getUserClaims(mockEvent);
    expect(claims).toMatchObject({ admin: true, uid: 'test' });
  });

  it("returns null for invalid header", async () => {
    const mockEvent = { node: { req: { headers: { authorization: 'Invalid' } } } } as any;
    const claims = await getUserClaims(mockEvent);
    expect(claims).toBeNull();
  });

  it("returns null for no token", async () => {
    const mockEvent = { node: { req: { headers: {} } } } as any;
    const claims = await getUserClaims(mockEvent);
    expect(claims).toBeNull();
  });

  it("returns null for verify error", async () => {
    const mockAuth = vi.mocked((await import('../../server/useFirebaseAdmin')).auth).verifyIdToken;
    mockAuth.mockRejectedValue(new Error());
    const mockEvent = { node: { req: { headers: { authorization: 'Bearer invalid' } } } } as any;
    const claims = await getUserClaims(mockEvent);
    expect(claims).toBeNull();
  });
});

describe("requireSignedIn", () => {
  it("returns claims for a valid token", async () => {
    const mockAuth = vi.mocked((await import('../../server/useFirebaseAdmin')).auth).verifyIdToken;
    mockAuth.mockResolvedValue({ admin: true, sub: "test", iat: 1, exp: 2, auth_time: 1, firebase: { identities: {} } } as any);
    const mockEvent = { node: { req: { headers: { authorization: "Bearer valid" } } } } as any;
    const claims = await requireSignedIn(mockEvent);
    expect(claims).toMatchObject({ admin: true, uid: "test" });
  });

  it("throws 401 when there is no token", async () => {
    const mockEvent = { node: { req: { headers: {} } } } as any;
    await expect(requireSignedIn(mockEvent)).rejects.toMatchObject({ statusCode: 401 });
  });
});

describe("bootstrapSecretMatches", () => {
	it("rejects a missing or short secret so an unset env cannot bootstrap", () => {
		expect(bootstrapSecretMatches(undefined, undefined)).toBe(false);
		expect(bootstrapSecretMatches("", "")).toBe(false);
		expect(bootstrapSecretMatches("short", "short")).toBe(false);
	});

	it("accepts a matching secret of at least 16 characters", () => {
		expect(bootstrapSecretMatches("1234567890abcdef", "1234567890abcdef")).toBe(true);
		expect(bootstrapSecretMatches("1234567890abcdef", "other")).toBe(false);
	});
});

describe("requireAdmin", () => {
  it("returns claims for an admin token", async () => {
    const mockAuth = vi.mocked((await import("../../server/useFirebaseAdmin")).auth).verifyIdToken;
    mockAuth.mockResolvedValue({ admin: true, sub: "test", iat: 1, exp: 2, auth_time: 1, firebase: { identities: {} } } as any);
    const mockEvent = { node: { req: { headers: { authorization: "Bearer valid" } } } } as any;
    await expect(requireAdmin(mockEvent)).resolves.toMatchObject({ admin: true, uid: "test" });
  });

  it("throws 403 for a signed-in non-admin", async () => {
    const mockAuth = vi.mocked((await import("../../server/useFirebaseAdmin")).auth).verifyIdToken;
    mockAuth.mockResolvedValue({ admin: false, sub: "test", iat: 1, exp: 2, auth_time: 1, firebase: { identities: {} } } as any);
    const mockEvent = { node: { req: { headers: { authorization: "Bearer valid" } } } } as any;
    await expect(requireAdmin(mockEvent)).rejects.toMatchObject({ statusCode: 403 });
  });
});
