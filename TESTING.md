# Testing Guide

This document outlines testing conventions, patterns, and guidelines for the Giens-CH project.

## Quick Start

Run all tests:
```bash
npm run test:run
```

Run tests in watch mode (for active development):
```bash
npm run test
```

Run E2E tests:
```bash
npm run test:e2e
```

Run E2E tests with UI:
```bash
npm run test:e2e:ui
```

## Test Structure

### Integration Tests (`tests/integration/`)
- Located in `tests/integration/*.test.ts`
- Test page rendering and component behavior
- Mock server endpoints using `registerEndpoint()`
- Test user interactions and data fetching
- Current coverage: Home page, news, articles, filters, basic UI components

### E2E Tests (`tests/e2e/`)
- Located in `tests/e2e/*.spec.ts`
- Full browser automation with Playwright
- Test critical user journeys across the application
- Test responsive design and layout integrity
- Current coverage: Home page, navigation, mobile viewport

## Testing Patterns

### Integration Tests

#### Mocking Firebase
Firebase is mocked in `tests/setup.ts` for consistent test behavior:
```typescript
vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn((auth, cb) => {
    cb((global as any).__FIREBASE_MOCK__.user);
    return vi.fn();
  }),
  // ... more mocks
}));
```

#### Registering API Endpoints
Mock API responses to test specific scenarios:
```typescript
import { registerEndpoint } from "@nuxt/test-utils/runtime";

registerEndpoint("/api/news", {
  method: "POST",
  handler: () => [
    {
      id: "1",
      title: "Test News",
      intro: "Test Intro",
      // ... other fields
    },
  ],
});
```

#### Testing Async Operations
Use `setTimeout` to await lazy loaded data:
```typescript
const component = await mountSuspended(NewsPage);
await new Promise(resolve => setTimeout(resolve, 200)); // Wait for fetch
expect(component.text()).toContain("News 1");
```

#### Testing User Interactions
For interactive components, use Playwright-like patterns:
```typescript
const searchInput = component.find('input[placeholder*="Titel"]');
await searchInput.setValue("test");
await new Promise(resolve => setTimeout(resolve, 600)); // Wait for debounce
expect(component.text()).toContain("Test");
```

### E2E Tests

#### Testing Navigation
```typescript
test("should navigate to travel page", async ({ page, isMobile }) => {
  await page.goto("/travel");
  const header = page.locator("h1");
  await expect(header).toContainText("Anreise nach Giens");
});
```

#### Testing Responsive Design
```typescript
test("should have no horizontal scrollbar on mobile", async ({ page, isMobile }) => {
  if (!isMobile) return;
  await page.goto("/");
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  expect(scrollWidth).toBe(clientWidth);
});
```

## Testing Checklist

Before committing code:
- [ ] All existing tests pass (`npm run test:run`)
- [ ] New features include tests
- [ ] Error paths are tested (not just happy paths)
- [ ] Edge cases are covered
- [ ] Tests are deterministic (no random failures)

## Coverage Goals

Target minimum coverage: **80%**

Current status: **Estimated 60-70%** (needs measurement)

Priority areas for test coverage:
1. Admin workflows (0%)
2. Authentication flows (0%)
3. Server API endpoints (0%)
4. CRUD operations for news (10%)
5. User profile management (0%)
6. Error handling (20%)
7. Responsive design (5%)

## Common Test Patterns

### Testing Pages with Loading States
```typescript
it("renders skeletons while loading", async () => {
  const component = await mountSuspended(NewsPage);
  expect(component.find('[data-testid="skeletons"]').exists()).toBe(true);
});

it("renders content after loading", async () => {
  registerEndpoint("/api/news", { method: "POST", handler: () => [mockData] });
  const component = await mountSuspended(NewsPage);
  await new Promise(resolve => setTimeout(resolve, 200));
  expect(component.text()).toContain("News Title");
});
```

### Testing Error States
```typescript
it("shows error message on failure", async () => {
  registerEndpoint("/api/news", {
    method: "POST",
    handler: () => { throw createError({ statusCode: 500 }); }
  });
  const component = await mountSuspended(NewsPage);
  expect(component.text()).toContain("Error loading");
});
```

### Testing Empty States
```typescript
it("shows 'no results' message when empty", async () => {
  registerEndpoint("/api/news", { method: "POST", handler: () => [] });
  const component = await mountSuspended(NewsPage);
  expect(component.text()).toContain("Keine Neuigkeiten");
});
```

## Running Tests Safely

### Isolate Test Failures
Run a specific test file:
```bash
npx vitest run tests/integration/home.test.ts
```

Run a specific test:
```bash
npx vitest run tests/integration/home.test.ts -t "renders the welcome title"
```

Debug Tests
```bash
# Run tests in watch mode with verbose output
npm run test -- --reporter=verbose

# Coverage report
vitest run --coverage
```

## Writing New Tests

 When adding a new feature:

1. **Write tests first** (when feasible) or alongside implementation
2. Use descriptive test names that explain what's being tested
3. Keep tests focused on one behavior
4. Mock external dependencies (Firebase, APIs)
5. Test both happy paths and error states
6. Use consistent naming: `tests/integration/[feature-name].test.ts`
7. For admin features, add to `tests/integration/admin/[feature].test.ts`
8. For authentication, create `tests/integration/auth/` directory

## Testing Admin Features (TODO)

Critical admin features that need tests:
- User management (create, delete, update roles)
- Label management (create, update privacy, delete)
- Article CRUD operations
- Maintenance toggle
- Permission-based access control

Example admin test pattern:
```typescript
import { describe, it, expect } from "vitest";
import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";

describe("Admin: User Management", () => {
  it("should list users with admin access", async () => {
    const { checkAdminAccess } = useNuxtApp();
    await checkAdminAccess();
    
    registerEndpoint("/api/users", {
      method: "GET",
      handler: () => [
        { uid: "1", email: "test@example.com", displayName: "Test User" }
      ],
    });
    
    const component = await mountSuspended(AdminUsers);
    expect(component.text()).toContain("Test User");
  });
  
  it("should prevent access when not admin", async () => {
    // Mock non-admin user
    const component = await mountSuspended(AdminUsers);
    expect(component.text()).toContain("Zugriff verweigert");
  });
});
```

## Testing Authentication Flow (TODO)

### Login Flow Tests
```typescript
describe("Authentication", () => {
  it("should login with valid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/");
  });
  
  it("should show error with invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "wrong");
    await page.click('button[type="submit"]');
    await expect(page.locator(".error-message")).toBeVisible();
  });
});
```

## Performance Testing (TODO)

Add performance benchmarks to new E2E tests:
```typescript
test("should load home page under 2s", async ({ page }) => {
  const startTime = Date.now();
  await page.goto("/");
  const loadTime = Date.now() - startTime;
  expect(loadTime).toBeLessThan(2000);
});
```

## Resources

- [Vitest Documentation](https://vitest.dev)
- [Nuxt Test Utils](https://test-utils.nuxt.com)
- [Playwright Documentation](https://playwright.dev)
- [Testing Best Practices](https://vue-test-utils.vuejs.org)

## Next Steps

1. Expand test coverage to 80%
2. Add unit tests for utilities and composables
3. Add visual regression tests
4. Test server API endpoints
5. Add performance benchmarks
6. Create test data fixtures for common scenarios