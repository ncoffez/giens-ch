import { db } from "../useFirebaseAdmin";
import {
	createGithubIssueLabels,
	createIssueCommentBody,
	createIssueTitle,
	createIssueBody,
} from "../../app/utils/errorReporting";
import { addGithubIssueLabels, createGithubIssue, createGithubIssueComment } from "../utils/githubIssues";

export default defineEventHandler(async (event) => {
	const config = useRuntimeConfig(event);
	const token = config.GITHUB_ISSUES_TOKEN;
	const repo = config.public.GITHUB_REPO;

	if (!token || !repo) {
		throw createError({
			statusCode: 503,
			message: "Fehlermeldungen sind derzeit nicht konfiguriert.",
		});
	}

	const body = await readBody(event);
	const report = body?.report;
	const submission = body?.submission;

	if (!report || !submission || (submission.userNotes !== undefined && typeof submission.userNotes !== "string")) {
		throw createError({
			statusCode: 400,
			message: "Unvollstaendige Fehlermeldung.",
		});
	}

	const githubConfig = {
		token,
		repo,
	};

	let existingIssueNumber = report.githubIssueNumber;
	let existingIssueUrl = report.githubIssueUrl;

	if (report?.eventId) {
		const snapshot = await db.collection("errorEvents").doc(report.eventId).get();
		if (snapshot.exists) {
			const data = snapshot.data() || {};
			existingIssueNumber = existingIssueNumber || data.githubIssueNumber;
			existingIssueUrl = existingIssueUrl || data.githubIssueUrl;
		}
	}

	let issueNumber: number;
	let issueUrl: string;
	let action: "created" | "commented";
	const labels = createGithubIssueLabels(report, {
		hasUserNotes: Boolean(submission.userNotes?.trim()),
	});

	if (existingIssueNumber) {
		await createGithubIssueComment(githubConfig, {
			issueNumber: existingIssueNumber,
			body: createIssueCommentBody(report, submission),
		});
		await addGithubIssueLabels(githubConfig, {
			issueNumber: existingIssueNumber,
			labels,
		});
		issueNumber = existingIssueNumber;
		issueUrl = existingIssueUrl || `https://github.com/${repo}/issues/${existingIssueNumber}`;
		action = "commented";
	} else {
		const issue = await createGithubIssue(githubConfig, {
			title: createIssueTitle(report),
			body: createIssueBody(report, submission),
			labels,
		});
		issueNumber = issue.number;
		issueUrl = issue.url;
		action = "created";
	}

	if (report?.eventId) {
		await db.collection("errorEvents").doc(report.eventId).set({
			githubIssueNumber: issueNumber,
			githubIssueUrl: issueUrl,
			githubIssueLabels: labels,
			userNotes: submission.userNotes || "",
			lastUserCommentAt: new Date().toISOString(),
			status: "needs-triage",
			updatedAt: new Date().toISOString(),
		}, { merge: true });
	}

	return {
		number: issueNumber,
		url: issueUrl,
		action,
	};
});
