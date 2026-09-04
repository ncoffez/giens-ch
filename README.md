# giens-ch

Source for [giens.ch](https://giens.ch) — the site of Résidence Beausoleil on
the Giens peninsula (Hyères, France). German and French. Owners sign in for
house documents, guests use public pages and share links.

**Public code ≠ public data.** Firestore, Cloud Storage, Auth accounts, and
share-link tokens live in the Firebase project `giens-ch` and stay private
regardless of this repository's visibility.

## Stack

- Nuxt 4 / Vue 3, Nitro on Cloud Functions (Firebase)
- `@nuxt/ui` + Tailwind, Lucide icons
- Firebase Auth, Firestore, Storage
- Vitest + Playwright

## Setup

```bash
npm install
cp .env.example .env
```

Fill `.env` from the Firebase console and a password manager. `.env` is
gitignored and is **not** recoverable from a clone. Required keys are
documented in `.env.example`.

```bash
npm run dev
```

The app listens on `http://localhost:3000`.

```bash
npm run test:fast          # Vitest
npm run test:e2e           # Playwright smoke (Chromium)
npm run build              # production bundle
```

Deploy is `npm run deploy` (Firebase Hosting + Functions + Firestore indexes
and rules). Production credentials come from GitHub Actions secrets, not from
files in git.

## Scope

This is a working production codebase, not a generic starter. Forks should
point `FIREBASE_*` and `GITHUB_REPO` at their own project. The default GitHub
issues target is unset unless `GITHUB_REPO` is provided at build time.

## License

[PolyForm Noncommercial 1.0.0](LICENSE). Private and other noncommercial
use is allowed. Commercial use is not.
