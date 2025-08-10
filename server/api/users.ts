import { auth } from "../useFirebaseAdmin";

export default defineEventHandler(async (event) => {
	const users = [];
	const listUsersResult = await auth.listUsers(10);
	users.push(...listUsersResult?.users);
	return users;
});
