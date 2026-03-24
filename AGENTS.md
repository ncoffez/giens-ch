# AGENTS.md - Developer Guide for Giens-CH

This document serves as a guide for agentic coding agents operating in this repository. It outlines project conventions, build commands, and coding styles.

## 1. Environment & Commands

### Build and Development
- **Install dependencies:** `npm install`
- **Start development server:** `npm run dev`
- **Build for production:** `npm run build`
- **Deploy to Firebase:** `npm run deploy`. This script now uses `firebase deploy` with `predeploy` hooks in `firebase.json` that automatically handle `npm run build` and dependency staging in `.output/server/node_modules`.

### Testing & Linting
- **Framework:**
  - Integration Tests: Vitest with `@nuxt/test-utils`
  - E2E Tests: Playwright
- **Run all tests:**
  - Fast integration suite: `npm run test:fast`
  - Smoke E2E: `npm run test:e2e` or `npm run test:e2e:smoke`
  - Full cross-browser E2E: `npm run test:e2e:full`
- **Run a single test:**
  - Integration: `npx vitest run tests/integration/home.test.ts`
  - E2E: `npx playwright test tests/e2e/critical-flows.spec.ts`
- **Console Error Detection:** E2E tests automatically detect browser console errors on all routes. Never commit changes that cause console errors.
- **STRICT MANDATE:** Run the appropriate tier for the change you made, and run the full cross-browser suite before release, deployment, or major UI refactors.
- **Current Status:**
  - Integration: A minimal regression suite exists in `tests/integration/`
  - E2E: Console error detection on all routes (32 pages)
- **Guideline:** Mock Firebase and Nuxt App as demonstrated in `tests/setup.ts` and existing tests.

### Coverage Requirements
- **Run coverage report:** `npm run test:coverage`
- **Coverage thresholds (from vitest.config.ts):**
  - **Statements:** 80%
  - **Lines:** 80%
  - **Functions:** 80%
  - **Branches:** 75%
- **STRICT MANDATE:** **Always** verify coverage after completing any task. Coverage must meet/expect thresholds before declaring work complete.
  - If coverage decreases for any area, add tests to restore coverage
  - Coverage reports available at `coverage/lcov-report/index.html`
  - Some code types (auth plugins, navigation handlers) are inherently hard to test - focus on components and utilities first
- **Test types and impact:**
  - **Unit/Logic tests:** Validate patterns but may not execute actual code (no coverage impact)
  - **Integration tests:** Mount components and verify they work well together (helps coverage)
  - **E2E tests:** Validate real workflows through Playwright (helps quality but not Vitest coverage)

---

## 2. Project Architecture

### Frontend (Nuxt 4) - `/app`
- **Framework:** Nuxt 4 with Vue 3.
- **UI Framework:** `@nuxt/ui` (v3). Use components prefixed with `U` (e.g., `<UButton>`, `<UInput>`).
- **Icons:** Use the `<UIcon>` component with Lucide icons (e.g., `name="i-lucide-home"`).
- **State Management:** Uses Nuxt Composables (`app/composables`) and Plugins (`app/plugins`).
- **Styling:** Tailwind CSS (integrated via Nuxt UI). Custom styles in `app/assets/`.

### Backend (Nitro) - `/server`
- **API Routes:** Defined in `server/api/`. Uses `defineEventHandler`.
- **Firebase Admin:** Centralized in `server/useFirebaseAdmin.ts`.
- **Utilities:** Shared server logic in `server/utils/`.

---

## 3. Coding Style Guidelines

### Formatting
- **Indentation:** Use **Tabs** (hard tabs).
- **Semicolons:** **Always** use semicolons at the end of statements.
- **Quotes:** Use **Double Quotes** (`"`) for strings in TypeScript and template attributes. Use single quotes (`'`) only when necessary or within template literals.
- **Line Length:** Aim for readable line lengths (max ~100-120 characters).

### Naming Conventions
- **Files:**
    - Vue Components: `PascalCase.vue` (e.g., `TravelCard.vue`).
    - Pages: `kebab-case.vue` or `[id].vue` for dynamic routes.
    - Composables/Utils: `camelCase.ts`.
- **Variables/Functions:** `camelCase`.
- **Interfaces/Types:** `PascalCase`.
- **Components in Templates:** `PascalCase` (e.g., `<UiTitle />`).

### TypeScript Usage
- **Strictness:** Use explicit types where possible, especially for API responses and complex props.
- **Interfaces:** Prefer `interface` over `type` for object structures.
- **Script Setup:** Always use `<script setup lang="ts">` in Vue files.

### Imports
- **Aliases:** Use `@/` or `~/` to refer to the root directory.
- **Order:**
    1. Built-in/Framework (Nuxt, Vue)
    2. External libraries (Firebase, Tiptap)
    3. Composables/Utils
    4. Components (if not auto-imported)
    5. Types/Interfaces

---

## 4. Feature-Specific Patterns

### Firebase Integration
- **Client-side:** Access via the injected `$auth`, `$db`, and `$currentUser` from the plugin.
- **Permissions:** Use the `useNuxtApp()` properties:
    - `$isAdmin`: True if the user has admin claims.
    - `$isPublisher`: True if admin or publisher.
    - `$isOwner`: True if admin or owner.
    - `$isReader`: True if any private access role is assigned.
- **Server-side:** 
    - Verify authentication using the `Authorization: Bearer <idToken>` header.
    - Check for specific claims (`admin`, `owner`, etc.) before proceeding with sensitive operations.
    - Use `auth.verifyIdToken(idToken)` from `server/useFirebaseAdmin.ts`.

### Rich Text (Tiptap)
- Custom editor components are located in `app/components/tiptap/`.
- Use the provided `Editor` and `Viewer` components for consistent rich-text handling.
- Tiptap extensions used: `StarterKit`, `Highlight`, `TextAlign`, `Image`, `TaskList`.

### UI Components (@nuxt/ui)
- Use `@nuxt/ui` (v3) components wherever possible for consistency.
- **Component Names:**
    - Use `<UFormField>` instead of the deprecated `<UFormGroup>`.
    - Use `<UButton>` icon prop (e.g., `icon="i-lucide-home"`) instead of nesting `<UIcon>` inside.
- **Prop Types:**
    - Ensure props like `rows` on `<UTextarea>` are numeric: `:rows="4"` (correct) vs `rows="4"` (warning).
- Common components: `<UButton>`, `<UInput>`, `<UCard>`, `<UIcon>`, `<UModal>`.
- Custom UI wrappers are in `app/components/ui/` (e.g., `<UiTitle>`, `<UiSummary>`). Always check here before creating a new basic UI component.

### Icon System
- **Format:** Use `i-lucide-icon` with Lucide icons (e.g., `name="i-lucide-home"`, `name="i-lucide-handshake"`).
- **Provider:** Uses `provider: 'server'` in production with `clientBundle` optimization for frequently used icons.
- **Package:** Nuxt UI auto-registers `@nuxt/icon` module.
- **Icon Collections:** Installs `@iconify-json/lucide` for local icon data (installed globally via devDependencies).
- **Troubleshooting:** If icons fail to load:
   1. Check configuration uses `provider: 'server'` (not `none`)
   2. Clean Nuxt cache: `rm -rf .nuxt`
   3. Clean node cache: `rm -rf node_modules/.cache`
   4. Verify startup shows: `✔ Nuxt Icon discovered local-installed 1 collections: lucide`
   5. Restart dev server: `npm run dev`

### Error Handling
- **Server:** Use `throw createError({ statusCode: ..., message: "..." })`. Never return raw error objects.
- **Client:** Use `@nuxt/ui` notifications (`useToast()`) to display errors to users.

---

## 5. Specific Patterns & Pitfalls

### Client-Only Logic
- Use `<ClientOnly>` tags for components that depend on browser-only APIs (like Firebase Auth state or Tiptap).
- For files ending in `.client.vue`, Nuxt will automatically handle client-side only rendering.
- **Environment Checks:** Use `import.meta.client` instead of the deprecated `process.client`.

### Middleware
- Route protection is handled in `app/middleware/`.
- Available: `is-admin.ts`, `is-logged-in.ts`, `is-not-logged-in.ts`, `is-owner.ts`, `is-publisher.ts`.
- Apply in pages via `definePageMeta({ middleware: ["is-admin"] })`.

### Static Assets
- Store images in `/public/giens/` or similar.
- Access via absolute paths like `/giens/image.jpg`.

## 6. Security Mandates
- **Secrets:** Never commit `.env` files or hardcode API keys. Access secrets via `useRuntimeConfig()`.
- **Admin Access:** Always verify `decodedToken.admin` in server routes that modify global state or access user data.
- **Client Validation:** Don't rely solely on client-side middleware; always verify permissions on the server.

## 7. Development Workflow for Agents

### Required Testing Workflow After Every Change

1. **Understand:** Read the relevant `.vue` or `.ts` files first.
2. **Plan:** Identify which part of the Nuxt lifecycle your change affects (Client vs. Server vs. Plugin).
3. **Implement:** Follow the Tab-indentation and Double-quote rules strictly.
4. **Verify:** Use `npm run dev` to verify changes if a preview environment is available.
5. **Fast default gate:** Run `npm run test:fast`.
6. **UI/routing/browser changes:** Run `npm run test:e2e` for the Chromium smoke suite.
7. **Release/major refactor gate:** Run `npm run build && npm run test:e2e:full`.
8. **Coverage:** Run `npm run test:coverage` for explicit coverage work, release prep, or when touching under-tested critical flows.
9. **Structure:** If creating a new UI component, place it in `app/components/ui/`. If it's a page, place it in `app/pages/`.
10. **Git/Push:** DO NOT push to GitHub preemptively. Always ask for permission or wait for an explicit request to push changes to the remote repository.

### Test tier guide

| Change type | Minimum verification |
| --- | --- |
| Pure utility/server logic without UI impact | `npm run test:fast` |
| UI copy/layout/component behavior | `npm run test:fast && npm run test:e2e` |
| Routing, auth, middleware, file access, share links | `npm run test:fast && npm run test:e2e` |
| Major UI refactor, deployment, release candidate | `npm run build && npm run test:e2e:full && npm run test:coverage` |

### Console Error Detection

The E2E test suite automatically monitors browser console for errors on all routes:

**Test Files:**
- `tests/e2e/console-errors-public.test.ts` - Public routes only
- `tests/e2e/console-errors-all-routes.test.ts` - All 32 routes including auth routes
- `tests/e2e/console-errors-critical-flows.test.ts` - Critical user flows with console checking

**Console Monitor Helper (`tests/helpers/console-monitor.ts`):**
- Captures `console.error` and `console.warn` messages
- Captures uncaught exceptions
- Filters无害 warnings (hydration mismatches)
- Attaches console logs to test report on failure
- Provides clear error summaries

**Example Console Error Output:**
```
Console errors found on /profile/me:
  - [Icon] failed to load icon 'lucide:arrow-left'
  - Error: Cannot read properties of undefined (reading 'value')
```

### Resource Error Detection

The E2E test suite now detects broken resources (images, CSS, fonts, scripts):

**Test Files:**
- `tests/e2e/resource-errors-all-routes.test.ts` - Checks all 30 routes for broken resources

**Resource Monitor Helper (`tests/helpers/resource-monitor.ts`):**
- Monitors HTTP response failures (404, 403, 500, etc.)
- Monitors request failures (aborted, failed)
- Catches network-level resource loading errors
- Monitors console errors related to resources
- Types: Image, CSS, Font, Script, Stylesheet
- Attaches detailed failure reports to test outputs

**Example Resource Error Output:**
```
Resource Failures Summary:
  Images: 3
  CSS: 0
  Fonts: 1
  Scripts: 0
  Other: 0
  Total: 4

Failures:
  - [IMAGE] http://localhost:3000/broken-image.jpg
    Status: 404
    Error: HTTP 404
```

**After Every Code Change:**
1. Run `npm run test:e2e` to check for console errors
2. Run `npm run test:e2e` to check for broken resources
3. Verify no broken resources in any route
4. Fix all errors before declaring work complete

---

*This file is updated as the project evolves. When in doubt, mirror the style of the closest existing file.*
