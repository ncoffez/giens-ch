# Testing

## Commands

```bash
npm run test:fast          # Vitest (default gate)
npm run test               # Vitest watch
npm run test:e2e           # Playwright Chromium smoke
npm run test:e2e:full      # all Playwright projects
npx vitest run tests/integration/file-access.test.ts
```

UI, routing, auth, and share-link changes need `test:fast` and `test:e2e`.
Release / deploy candidates also need `test:e2e:full`.

## Layout

- `tests/integration/` — Vitest + `@nuxt/test-utils`. Mock Firebase in
  `tests/setup.ts`. Prefer testing server utils and source contracts over
  mounting whole pages.
- `tests/e2e/` — Playwright. Console and broken-resource checks run on public
  routes in the smoke suite.

## Conventions

- Mock Firebase; do not talk to the production project.
- Security tests should call the real helper (`requireAdmin`,
  `canManageHomeFiles`, `pickGlobalSettingsPatch`), not a copy of the
  predicate.
- E2E must not introduce new `console.error` on any route.

Coverage thresholds live in `vitest.config.ts`. Global 80% is not met on Vue
pages; restore coverage when you change a well-tested util.

## Resources

- [Vitest](https://vitest.dev)
- [Nuxt Test Utils](https://test-utils.nuxt.com)
- [Playwright](https://playwright.dev)
