# giens-ch

Source for [giens.ch](https://giens.ch) — the site of Résidence Beausoleil on
the Giens peninsula (Hyères, France). German and French. Owners sign in for
house documents, guests use public pages and share links.

**Public code ≠ public data.** Firestore, Cloud Storage, Auth accounts, and
share-link tokens live in the Firebase project `giens-ch` and stay private
regardless of this repository's visibility. See [SECURITY.md](SECURITY.md).

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
npm run test:e2e:full      # all Playwright projects
npm run build              # production bundle
```

Testing conventions: [TESTING.md](TESTING.md).

## Deploy

Production deploys run on GitHub Actions when `main` is pushed. That path
validates secrets, probes deploy IAM, ships Firestore/Storage rules first,
then Functions and Hosting.

`npm run deploy` from a laptop **bakes local `.env` into Functions**. Use it
only for a throwaway or emergency deploy, never as the normal production path.

## Access model

- **Firestore:** the client SDK is deny-all. The app reads and writes through
  Nitro (`server/api/**`) with the Admin SDK.
- **Storage:** profile pictures are public-read. Everything else is
  server-only (signed URLs or share tokens).
- Never commit `.env`, service-account JSON, or Auth dumps (`Users.json`).

## Scope

This is a working production codebase, not a generic starter. Forks should
point `FIREBASE_*` and `GITHUB_REPO` at their own project. The default GitHub
issues target is unset unless `GITHUB_REPO` is provided at build time.

## License

[PolyForm Noncommercial 1.0.0](LICENSE). Private and other noncommercial
use is allowed. Commercial use is not.

Also see [SECURITY.md](SECURITY.md), [TESTING.md](TESTING.md), and
[AGENTS.md](AGENTS.md).
