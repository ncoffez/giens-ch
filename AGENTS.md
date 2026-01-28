# AGENTS.md - Developer Guide for Giens-CH

This document serves as a guide for agentic coding agents operating in this repository. It outlines project conventions, build commands, and coding styles.

## 1. Environment & Commands

### Build and Development
- **Install dependencies:** `npm install`
- **Start development server:** `npm run dev`
- **Build for production:** `npm run build`
- **Deploy to Firebase:** `npm run deploy`. This script now uses `firebase deploy` with `predeploy` hooks in `firebase.json` that automatically handle `npm run build` and dependency staging in `.output/server/node_modules`.

### Testing & Linting
- **Framework:** Vitest with `@nuxt/test-utils`.
- **Run all tests:** `npm run test:run`
- **Run a single test:** `npx vitest run tests/integration/home.test.ts`
- **STRICT MANDATE:** **Always** run the full test suite (`npm run test:run`) after any build step or significant refactor. Do not commit or declare a task complete unless all tests are green.
- **Current Status:** A minimal regression suite exists in `tests/integration/`.
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
- Use `@nuxt/ui` components wherever possible for consistency.
- Common components: `<UButton>`, `<UInput>`, `<UCard>`, `<UIcon>`, `<UModal>`.
- Custom UI wrappers are in `app/components/ui/` (e.g., `<UiTitle>`, `<UiSummary>`). Always check here before creating a new basic UI component.

### Icon System
- **Icon Format:** Use `i-lucide-icon` with Lucide icons (e.g., `name="i-lucide-home"`, `name="i-lucide-handshake"`).
- **Troubleshooting:** If icons fail to load and show `[Icon] failed to load icon 'lucide:icon-name'` in console:
  1. Check icon name is correct (spelling, lucide prefix)
  2. Clean Nuxt cache: `rm -rf .nuxt`
  3. Clean node cache: `rm -rf node_modules/.cache`
  4. Restart dev server: `npm run dev`

### Error Handling
- **Server:** Use `throw createError({ statusCode: ..., message: "..." })`. Never return raw error objects.
- **Client:** Use `@nuxt/ui` notifications (`useToast()`) to display errors to users.

---

## 5. Specific Patterns & Pitfalls

### Client-Only Logic
- Use `<ClientOnly>` tags for components that depend on browser-only APIs (like Firebase Auth state or Tiptap).
- For files ending in `.client.vue`, Nuxt will automatically handle client-side only rendering.

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
1. **Understand:** Read the relevant `.vue` or `.ts` files first.
2. **Plan:** Identify which part of the Nuxt lifecycle your change affects (Client vs. Server vs. Plugin).
3. **Implement:** Follow the Tab-indentation and Double-quote rules strictly.
4. **Verify:** Use `npm run dev` to verify changes if a prevtestiew environment is available.
5. **Test:** Run `npm run test:run` to ensure all tests pass. DO NOT continue if any test fails.
6. **Coverage:** Run `npm run test:coverage` and verify all thresholds (Statements 80%, Lines 80%, Functions 80%, Branches 75%) are met. If not, add tests to restore coverage.
7. **Structure:** If creating a new UI component, place it in `app/components/ui/`. If it's a page, place it in `app/pages/`.
8. **Git/Push:** DO NOT push to GitHub preemptively. Always ask for permission or wait for an explicit request to push changes to the remote repository.

---

*This file is updated as the project evolves. When in doubt, mirror the style of the closest existing file.*
