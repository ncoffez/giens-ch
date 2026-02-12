import { auth } from "../useFirebaseAdmin";
import { H3Event, getHeader } from "h3";

export async function getUserClaims(event: H3Event) {
	const authHeader = getHeader(event, "Authorization");
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return null;
	}

	const token = authHeader.split(" ")[1];
	if (!token) return null;
	try {
		const decodedToken = await auth.verifyIdToken(token);
		const { admin, publisher, owner, reader, sub, email } = decodedToken;
		return { admin, publisher, owner, reader, uid: sub, email };
	} catch (error) {
		console.error("Error verifying ID token:", error);
		return null;
	}
}

export async function getUserPermission(event: H3Event): Promise<"public" | "private"> {
	const claims = await getUserClaims(event);
	if (!claims) return "public";

	const isReader = !!(claims.admin || claims.publisher || claims.owner || claims.reader);
	return isReader ? "private" : "public";
}
