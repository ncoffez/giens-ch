# Security

## Public code is not public data

`giens-ch` is the source for [giens.ch](https://giens.ch), a production site for
a small residential community. Making the repository public does **not** make
Firestore documents, Storage objects, Auth accounts, or share-link tokens
public. Those live in the Firebase project and stay behind server APIs and
security rules.

## What must never be committed

- `.env`, service-account JSON, PEM keys
- Firebase Auth exports (`Users.json` and similar dumps)
- Customer briefs, office documents, internal status notes
- Real user identifiers, password hashes, or session tokens

`.gitignore` already covers `.env`, `.secrets/`, and `*firebase-adminsdk*.json`.
If an Auth export or a secret ever lands in git, deleting the file is not
enough: rewrite history (or publish a fresh repository) **before** changing
visibility, and treat the leaked credentials as compromised.

## Rules

- **Firestore:** client SDK access is denied except admin writes to `labels`.
  All other reads/writes go through Nitro (`server/api/**`) with the Admin SDK,
  which bypasses rules. Do not deploy `allow read, write: if true`.
- **Storage:** profile pictures are public-read / owner-write. Home and global
  files are server-only (signed URLs). Editor uploads require a signed-in user.
- **Firebase web API key:** expected to be in the client bundle. The rules
  above are what protect data, not hiding the key.

## Error reports → GitHub issues

`GITHUB_ISSUES_TOKEN` must be a **fine-grained PAT** limited to this repository
with **Issues: Read and write** only. Do not use a classic `repo` token. The
token is a GitHub Actions secret; it is not in the client bundle.

## Reporting a vulnerability

Please do not open a public issue for a security problem. Email the maintainer
listed in the git history, or use a private GitHub security advisory once the
repository is public.
