interface GithubIssueResult {
	number: number;
	url: string;
	title: string;
}

interface GithubIssueConfig {
	token: string;
	repo: string;
}

interface GithubRequestOptions {
	method: "POST" | "PATCH";
	path: string;
	body: Record<string, unknown>;
}

async function githubRequest(config: GithubIssueConfig, options: GithubRequestOptions) {
	const response = await fetch(`https://api.github.com/repos/${config.repo}${options.path}`, {
		method: options.method,
		headers: {
			"Accept": "application/vnd.github+json",
			"Authorization": `Bearer ${config.token}`,
			"Content-Type": "application/json",
			"X-GitHub-Api-Version": "2022-11-28",
		},
		body: JSON.stringify(options.body),
	});

	if (!response.ok) {
		const errorBody = await response.text();
		throw createError({
			statusCode: 502,
			message: `GitHub-Anfrage fehlgeschlagen: ${errorBody}`,
		});
	}

	return response.json();
}

export async function createGithubIssue(
	config: GithubIssueConfig,
	input: {
		title: string;
		body: string;
		labels?: string[];
	},
): Promise<GithubIssueResult> {
	const issue = await githubRequest(config, {
		method: "POST",
		path: "/issues",
		body: {
			title: input.title,
			body: input.body,
			...(input.labels?.length ? { labels: input.labels } : {}),
		},
	});

	return {
		number: issue.number,
		url: issue.html_url,
		title: issue.title,
	};
}

export async function createGithubIssueComment(
	config: GithubIssueConfig,
	input: {
		issueNumber: number;
		body: string;
	},
) {
	return githubRequest(config, {
		method: "POST",
		path: `/issues/${input.issueNumber}/comments`,
		body: {
			body: input.body,
		},
	});
}

export async function addGithubIssueLabels(
	config: GithubIssueConfig,
	input: {
		issueNumber: number;
		labels: string[];
	},
) {
	if (!input.labels.length) {
		return null;
	}

	return githubRequest(config, {
		method: "POST",
		path: `/issues/${input.issueNumber}/labels`,
		body: {
			labels: input.labels,
		},
	});
}
