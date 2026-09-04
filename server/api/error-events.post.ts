import { FieldValue } from "firebase-admin/firestore";
import { db } from "../useFirebaseAdmin";
import {
	createAutomaticIssueBody,
	createGithubIssueLabels,
	createIssueTitle,
	createReportSignature,
	shouldSkipAutomaticGithubIssue,
} from "../../app/utils/errorReporting";
import { createGithubIssue } from "../utils/githubIssues";
import { getUserClaims } from "../utils/auth";

export default defineEventHandler(async (event) => {
	const config = useRuntimeConfig(event);
	const claims = await getUserClaims(event);
	const body = await readBody(event);
	const report = body?.report;

	if (!report?.message || !report?.source || !report?.routePath) {
		throw createError({
			statusCode: 400,
			message: "Unvollstaendiger Fehlerreport.",
		});
	}

	const occurredAt = report.occurredAt || new Date().toISOString();
	const signature = createReportSignature(report);
	const docRef = db.collection("errorEvents").doc(signature);
	const snapshot = await docRef.get();
	const githubConfig = config.GITHUB_ISSUES_TOKEN && config.public.GITHUB_REPO
		? {
			token: config.GITHUB_ISSUES_TOKEN,
			repo: config.public.GITHUB_REPO,
		}
		: null;

	if (!snapshot.exists) {
		const shouldSkipGithub = shouldSkipAutomaticGithubIssue(report);
		let githubIssueNumber: number | undefined;
		let githubIssueUrl: string | undefined;
		let status = shouldSkipGithub ? "ignored" : "captured";
		let githubIssueError: string | null = null;

		if (!shouldSkipGithub && githubConfig && claims) {
			try {
				const labels = createGithubIssueLabels(report);
				const issue = await createGithubIssue(githubConfig, {
					title: createIssueTitle(report),
					body: createAutomaticIssueBody(report),
					labels,
				});
				githubIssueNumber = issue.number;
				githubIssueUrl = issue.url;
				status = "needs-triage";
			} catch (error: unknown) {
				githubIssueError = error instanceof Error ? error.message : "GitHub-Issue konnte nicht erstellt werden.";
			}
		}

		await docRef.set({
			signature,
			status,
			count: 1,
			firstSeenAt: occurredAt,
			lastSeenAt: occurredAt,
			latestReport: report,
			githubIssueNumber: githubIssueNumber || null,
			githubIssueUrl: githubIssueUrl || null,
			githubIssueCreatedAt: githubIssueNumber ? new Date().toISOString() : null,
			githubIssueSkipped: shouldSkipGithub,
			githubIssueLabels: shouldSkipGithub ? [] : createGithubIssueLabels(report),
			githubIssueError,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});

		return {
			id: signature,
			count: 1,
			githubIssueNumber,
			githubIssueUrl,
		};
	}

	const snapshotData = snapshot.data() || {};
	const currentCount = Number(snapshotData.count || 0);
	await docRef.set({
		lastSeenAt: occurredAt,
		latestReport: report,
		updatedAt: new Date().toISOString(),
		count: FieldValue.increment(1),
	}, { merge: true });

	return {
		id: signature,
		count: currentCount + 1,
		githubIssueNumber: snapshotData.githubIssueNumber || undefined,
		githubIssueUrl: snapshotData.githubIssueUrl || undefined,
	};
});
