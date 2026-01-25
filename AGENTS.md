# AGENTS.md - Developer Guide for Giens-CH

This document serves as a guide for agentic coding agents operating in this repository. It outlines project conventions, build commands, and coding styles.

## 1. Environment & Commands

### Build and Development
- **Install dependencies:** `npm install`
- **Start development server:** `npm run dev`
- **Build for production:** `npm run build`
- **Deploy to Firebase:** `npm run deploy` (requires `FIREBASE_ADMIN_KEY` and `FIREBASE_FRONTEND_KEY` in `.env`)

### Testing & Linting
- **Current Status:** There is no formal testing framework (e.g., Vitest, Jest) or linter (e.g., ESLint, Prettier) configured in `package.json`. 
- **Guideline:** Adhere strictly to existing code style to maintain consistency. When adding new features, prefer simple verification via manual testing or temporary `console.log` debugging in the dev environment.
- **Single Test:** If Vitest is added in the future, the command would likely be `npx vitest run path/to/file.test.ts`.

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
4. **Verify:** Use `npm run dev` to verify changes if a preview environment is available.
5. **Structure:** If creating a new UI component, place it in `app/components/ui/`. If it's a page, place it in `app/pages/`.

---

*This file is updated as the project evolves. When in doubt, mirror the style of the closest existing file.*
