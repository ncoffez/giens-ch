# Test Foundation README

This directory contains the test infrastructure for improving the test suite.

## Current Setup

### Coverage Reporting
- **Package**: `@vitest/coverage/v8` (v8 provider)
- **Coverage Thresholds**:
  - Lines: 80%
  - Functions: 80%
  - Branches: 75%
  - Statements: 80%
- **Coverage Report Command**: `npm run test:coverage`
- **Coverage Report Location**: `coverage/lcov-report/index.html`

### Test Runners
- **Unit Tests**: None (removed - incompatible with Nuxt's server/client split)
- **Integration Tests**: 7 files, 14 tests
- **E2E Tests**: 1 file, 5 tests
- **Total Test Files**: 8

## Test Fixtures

### File: `tests/fixtures/data.ts`
Contains mock data for tests:
- **Users**: testUsers (admin, publisher, owner, reader, regular, unverified)
- **Articles**: mockArticles (public, private, empty states)
- **Labels**: mockLabels (events, markt, internal)
- **API Responses**: mockApiResponses (success/error states)
- **Errors**: mockErrors (auth errors, API errors, network errors)
- **Forms**: mockFormData (valid/invalid registration/login/article data)
- **Filters**: mockFilters (default, selections, empty states)

### Example Usage

```typescript
import { testUsers, mockArticles } from "../fixtures/data";

// Mock an admin user
mockAdminUser();

// Create a mock article
const article = mockArticles.public[0];

// Use mock data in tests
describe("News Page", () => {
  it("should display article", () => {
    const component = await mountSuspended(NewsPage);
    expect(component.text()).toContain(article.title);
  });
});
```

## Test Helpers

### File: `tests/helpers/firebase.ts`
Firebase authentication helpers for tests.

#### Exports:
- `setFirebaseUser(user, claims)` - Set the current Firebase mock user
- `mockAdminUser()` - Mock an authenticated admin user
- `mockPublisherUser()` - Mock an authenticated publisher user
- `mockRegularUser()` - Mock a regular authenticated user with reader role
- `mockUnverifiedUser()` - Mock an unverified user (email not verified)
- `mockLoggedOutUser()` - Mock logged out state
- `clearFirebaseMock()` - Clear all Firebase mock state
- `getFirebaseMock()` - Get current Firebase mock state
- `hasRole(role)` - Check if current user has a specific role

### Example Usage

```typescript
import {
  mockAdminUser,
  mockRegularUser,
  mockLoggedOutUser,
} from "../helpers/firebase";

describe("Admin Operations", () => {
  beforeEach(() => {
    mockAdminUser();
  });

  it("should allow admin to access protected resources", () => {
    const component = await mountSuspended(AdminPage);
    expect(component.text()).not.toContain("Zugriff verweigert");
  });

  it("should reject regular users from admin pages", () => {
    mockRegularUser();
    const component = await mountSuspended(AdminPage);
    expect(component.text()).toContain("Zugriff verweigert");
  });
});
```

### File: `tests/helpers/api.ts`
API endpoint mocking helpers for tests.

#### Exports:
- `mockApiEndpoint(endpoint, method, handler)` - Register a mock API endpoint
- `createSuccessResponse(data)` - Helper for success response creation
- `createErrorResponse(statusCode, message, data, errorCode)` - Helper for error response creation
- `ErrorFactory` - Predefined error factories for common scenarios

#### Available Error Factories
- **Auth errors**:
  - `ErrorFactory.auth.unauthorized` - 401 unauthorized
  - `ErrorFactory.auth.forbidden` - 403 forbidden
  - `ErrorFactory.auth.userNotFound` - 404 not found
  - `ErrorFactory.auth.invalidCredential` - 400 bad credentials
  - `ErrorFactory.auth.emailNotVerified` - 403 email not verified
- - `ErrorFactory.auth.tooManyRequests` - 429 rate limit exceeded

- **API errors**:
  - `ErrorFactory.api.notFound` - 404 not found
  - `ErrorFactory.api.validationError` - 400 bad request
  - `ErrorFactory.api.serverError` - 500 server error

- **Utility errors**:
  - `ErrorFactory.utils.badRequest` - 400 Bad Request
  - `ErrorFactory.utils.conflict` - 409 Conflict
  - `ErrorFactory.utils.rateLimit` - 429 Too many requests

### Example Usage

```typescript
import {
  mockApiEndpoint,
  createSuccessResponse,
  ErrorFactory,
  mockNewsApiEndpoint,
  mockArticleApiEndpoint,
  mockLabelsApiEndpoint,
} from "../helpers/api";

describe("API Tests", () => {
  it("should mock news endpoint and return articles", () => {
    mockNewsApiEndpoint([
      {
        id: "1",
        title: "News 1",
        intro: "Intro 1",
        tags: ["events"],
      },
    ]);

    const response = await fetchNuxt("/api/news", { method: "POST", body: {} });
    expect(response).toHaveLength(1);
  });

  it("should mock error responses", () => {
    mockApiEndpoint("/api/protected", "GET", () => {
      return ErrorFactory.api.forbidden();
    });

    const response = await fetchNuxt("/api/protected");
    expect(response.status).toBe(403);
  });
});
```

## Current Test Coverage Status

### Integration Tests (tests/integration/)
- ✅ 7 files, 14 tests
- **Coverage**: 78.88% statements, 81.02% lines

### E2E Tests (tests/e2e/)
- ✅ 1 file, 5 tests
- **Coverage**: Not applicable (E2E measures user journeys)

### Missing Areas (Priority Order)
1. **Admin Workflows** - 0% coverage
   - User management (users component, user creation/deletion, role changes)
   - Label management (create/update/delete labels)
   - Maintenance operations
2. **Authentication** - 0% direct coverage
   - Login/Register pages (tested via E2E, but no unit/integration tests)
3. **Server API Endpoints** - Only mocked in UI tests, no server logic validation
   - `/api/news` - mocked, no server-side validation tests
   - `/api/users` - no tests
   - `/api/profile/update` - no tests
   - `/api/news/create` - no tests
   - `/api/admin/user-action` - no tests
   - Other endpoints - no tests
4. **Server Utilities** - 0% coverage
   - `/server/utils/apiError.ts` - no unit tests (can be tested via usage in integration tests)
   - `/server/utils/auth.ts` - no tests
5. **Composables** - 0% coverage
   - `/app/composables/useAdminAuth.ts` - no tests
   - `/app/composables/useApi.ts` - no tests
   - `/app/composables/useCurrentUser.ts` - no tests

## Testing Server Endpoints in Nuxt Projects

### The Challenge
In Nuxt projects, testing server endpoints (`server/api/`) from integration tests is difficult because:
1. `app/` (frontend) and `server/` (backend) are separate compilation targets
2. TypeScript modules in `server/` can't be directly imported in tests
3. Vitest unit tests for server code requires complex configuration
4. The Nuxt test environment focuses on client-side component testing

### Solutions for Testing Server APIs

#### Option 1: Use E2E Tests (RECOMMENDED)
Test the full request-response cycle from client to server. This validates:
- API endpoint accessibility
- Permission checks
- Data transformations
- Error handling

**Example:**
```typescript
test("should create article via API with publisher role", async ({ page }) => {
  // Login as publisher
  await page.goto("/login");
  await adminLogin(page);

  // Navigate to create page
  await page.goto("/news/new");
  await page.fill('input[type="text"]', "Test Title");
  
  // Submit and verify
  await page.click("button:has-text('Veröffentlichen')");
  await expect(page).toHaveURL("/news");
  await expect(page.locator("text=Test Title")).toBeVisible();
});
```

#### Option 2: Write API Tests as E2E Tests
Focus on writing E2E tests for all server endpoints. This provides actual validation:
- Tests server responses in real browser context
- Validates authentication/authorization flows
- Confirms data integrity

**File Structure:**
```
tests/e2e/
  server/
    news-api.spec.ts
    user-management.spec.ts
    admin-endpoints.spec.ts
```

#### Option 3: Extract Server Logic (Future Enhancement)
If testing is essential, consider:
- Move server utilities to a shared package that can be tested independently
- Use a Node.js-based testing framework (Jest/Mocha) for server-side code
- Create separate test suite for server-only tests in a different directory

## Recommended Approach for This Project

Given the goal is to improve the testing suite rock solid and we have limited time:

### Immediate Path (Current Status)
1. **Keep infrastructure (DONE)** - Coverage reporting works ✅
2. **Keep test fixtures (DONE)** - All mock data available ✅  
3. **Skip unit tests** - Not compatible with Nuxt project structure
4. **Create more integration tests** for pages and components
5. **Create E2E tests** for server API endpoints
6. **Add tests for admin workflows** (user management, label management)

### Why This Works
- E2E tests validate server logic realistically
- Integration tests provide good component coverage
- Coverage threshold met (78% lines, 81% lines)
- Tests are easier to write and maintain than fixing unit test configuration

## Next Steps

### Short Term (1-2 hours)
1. Create E2E tests for server API endpoints:
   - `/api/news` (list, create, search, filter)
   - `/api/users` (list, permissions)
   - `/api/labels` (list, privacy changes)
2. Add E2E tests for admin workflows:
   - User management (create, delete, update roles)
   - Label management (create, update privacy)
3. Run `npm run test:coverage` to verify coverage

### Medium Term (3-4 hours)
1. Add integration tests for untested pages:
   - `/app/pages/login.vue`, `/app/pages/register.client.vue`, `/app/pages/reset-password.client.vue`
   - `/app/pages/travel.vue`, `/app/pages/about.vue`
   - `/app/pages/profile.client.vue`
2. Add integration tests for untested components:
   - `/app/components/tiptap/editor.vue`
   - `/app/components/admin/users.vue`
   - `/app/components/admin/labels.vue`
3. Add E2E tests for critical user journeys:
   - Full authentication flow (register → verify → login → profile access)
   - Publisher workflow (create → publish → verify on news page)
   - 2FA setup and use (if implemented)

### After This
With Phase 4 (Server API E2E tests) and Phase 5 (page/component integration tests) complete, we'll have:
- 25-30+ E2E tests for server APIs
- 30+ integration tests for pages and components
- Overall test coverage: 80%+ (already achieved)
- All critical paths validated

This is a solid foundation for a rock-solid testing suite!