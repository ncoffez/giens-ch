#!/usr/bin/env node
/**
 * Treat a leaked Firebase Auth export as compromised:
 * revoke refresh tokens, rotate email/password hashes, write reset links.
 *
 * Usage:
 *   node --env-file=.env scripts/revoke-exported-auth.mjs .secrets/Users.json
 *
 * Does not print hashes. Reset links go to .secrets/password-reset-links.txt
 * (gitignored) so third-party users can be notified out of band.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomBytes } from "node:crypto";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const exportPath = process.argv[2];
if (!exportPath) {
	console.error("Usage: node --env-file=.env scripts/revoke-exported-auth.mjs <Users.json>");
	process.exit(1);
}

if (!process.env.FIREBASE_ADMIN_KEY) {
	console.error("FIREBASE_ADMIN_KEY is missing. Load it from .env via --env-file=.env");
	process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY);
if (!getApps().length) {
	initializeApp({ credential: cert(serviceAccount) });
}

const payload = JSON.parse(readFileSync(resolve(exportPath), "utf8"));
const users = Array.isArray(payload) ? payload : payload.users;
if (!Array.isArray(users) || users.length === 0) {
	console.error("No users[] in the export file.");
	process.exit(1);
}

const auth = getAuth();
const resetLinks = [];
let revoked = 0;
let rotated = 0;

for (const user of users) {
	const uid = user.localId || user.uid;
	const email = user.email || "(no email)";
	let resolvedUid = uid;
	if (resolvedUid) {
		try {
			await auth.getUser(resolvedUid);
		} catch (error) {
			if (error?.code !== "auth/user-not-found") {
				throw error;
			}
			resolvedUid = null;
		}
	}

	if (!resolvedUid && user.email) {
		try {
			resolvedUid = (await auth.getUserByEmail(user.email)).uid;
		} catch (error) {
			if (error?.code !== "auth/user-not-found") {
				throw error;
			}
		}
	}

	if (!resolvedUid) {
		console.log(`skip  ${email}  (no longer in Auth)`);
		continue;
	}

	await auth.revokeRefreshTokens(resolvedUid);
	revoked += 1;

	if (user.passwordHash) {
		const password = randomBytes(32).toString("base64url");
		await auth.updateUser(resolvedUid, { password });
		rotated += 1;

		if (user.email) {
			const link = await auth.generatePasswordResetLink(user.email);
			resetLinks.push(`${user.email}\t${link}`);
		}
	}

	console.log(`ok  ${email}  uid=${resolvedUid}  revoked${user.passwordHash ? "  password-rotated" : ""}`);
}

if (resetLinks.length) {
	const out = resolve(".secrets/password-reset-links.txt");
	mkdirSync(dirname(out), { recursive: true });
	writeFileSync(out, `${resetLinks.join("\n")}\n`, { mode: 0o600 });
	console.log(`wrote ${resetLinks.length} reset links to ${out}`);
}

console.log(`done  revoked=${revoked}  passwordsRotated=${rotated}`);
