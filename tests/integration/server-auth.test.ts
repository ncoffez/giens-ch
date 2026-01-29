import { describe, it, expect, vi } from "vitest";
const { getUserClaims } = await import('../../server/utils/auth');

vi.mock('h3', () => ({
  getHeader: vi.fn((event, name) => event.node?.req?.headers?.[name] || null)
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
    expect(claims).toEqual({ admin: true });
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
