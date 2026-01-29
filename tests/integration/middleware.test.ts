import { describe, it, expect, vi, beforeEach } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import * as middleware from "../../app/middleware/is-admin.ts";
import { ref } from "vue";
import * as middlewareOwner from "../../app/middleware/is-owner.ts";
import * as middlewarePublisher from "../../app/middleware/is-publisher.ts";
import * as middlewareLoggedIn from "../../app/middleware/is-logged-in.ts";
import * as middlewareNotLoggedIn from "../../app/middleware/is-not-logged-in.ts";

const mockNavigateTo = vi.fn(() => '/');
vi.mock('nuxt/app', () => ({
  navigateTo: mockNavigateTo
}));

describe("Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is-admin: allows admin, redirects non-admin", async () => {
    const nuxtAppAdmin = { $authInitialized: ref(true), $isAdmin: ref(true) };
const nuxtAppAdminTrue = { $authInitialized: ref(true), $isAdmin: ref(true) };
    const resultAdminTrue = middleware.default.call(null, nuxtAppAdminTrue);
    expect(resultAdminTrue).toBe(true);
    expect(mockNavigateTo).not.toHaveBeenCalled();
    const nuxtAppAdminFalse = { $authInitialized: ref(true), $isAdmin: ref(false) };
    const resultAdminFalse = middleware.default.call(null, nuxtAppAdminFalse);
    expect(resultAdminFalse).toBe('/');
    expect(mockNavigateTo).toHaveBeenCalledWith('/'); 
  });

  it("is-owner: allows owner, redirects non-owner", async () => {
    const nuxtAppOwnerTrue = { $isOwner: ref(true) };
    const resultOwnerTrue = middlewareOwner.default.call(null, nuxtAppOwnerTrue);
    expect(resultOwnerTrue).toBe(true);
    expect(mockNavigateTo).not.toHaveBeenCalled();
    const nuxtAppOwnerFalse = { $isOwner: ref(false) };
    const resultOwnerFalse = middlewareOwner.default.call(null, nuxtAppOwnerFalse);
    expect(resultOwnerFalse).toBe('/');
    expect(mockNavigateTo).toHaveBeenCalledWith('/'); 
  });

  it("is-publisher: allows publisher, redirects non-publisher", async () => {
    const nuxtAppPublisherTrue = { $isPublisher: ref(true) };
    const resultPublisherTrue = middlewarePublisher.default.call(null, nuxtAppPublisherTrue);
    expect(resultPublisherTrue).toBe(true);
    expect(mockNavigateTo).not.toHaveBeenCalled();
    const nuxtAppPublisherFalse = { $isPublisher: ref(false) };
    const resultPublisherFalse = middlewarePublisher.default.call(null, nuxtAppPublisherFalse);
    expect(resultPublisherFalse).toBe('/');
    expect(mockNavigateTo).toHaveBeenCalledWith('/'); 
  });

  it("is-logged-in: allows logged in, redirects not logged in", async () => {
    const nuxtAppLoggedTrue = { $currentUser: ref({ uid: 'test' }) };
    const resultLoggedTrue = middlewareLoggedIn.default.call(null, nuxtAppLoggedTrue);
    expect(resultLoggedTrue).toBe(true);
    expect(mockNavigateTo).not.toHaveBeenCalled();
    const nuxtAppLoggedFalse = { $currentUser: ref(null) };
    const resultLoggedFalse = middlewareLoggedIn.default.call(null, nuxtAppLoggedFalse);
    expect(resultLoggedFalse).toBe('/login');
    expect(mockNavigateTo).toHaveBeenCalledWith('/login');  // navigateTo
    expect(mockNavigateTo).toHaveBeenCalledWith('/login');
  });

  it("is-not-logged-in: allows not logged in, redirects logged in", async () => {
    const nuxtAppNotLoggedTrue = { $currentUser: ref(null) };
    const resultNotLoggedTrue = middlewareNotLoggedIn.default.call(null, nuxtAppNotLoggedTrue);
    expect(resultNotLoggedTrue).toBe(true);
    expect(mockNavigateTo).not.toHaveBeenCalled();
    const nuxtAppNotLoggedFalse = { $currentUser: ref({ uid: 'test' }) };
    const resultNotLoggedFalse = middlewareNotLoggedIn.default.call(null, nuxtAppNotLoggedFalse);
    expect(resultNotLoggedFalse).toBe('/profile/me');
    expect(mockNavigateTo).toHaveBeenCalledWith('/profile/me');  // navigateTo
    expect(mockNavigateTo).toHaveBeenCalledWith('/profile/me');
  });
});
