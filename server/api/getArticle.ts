
import { db } from "../useFirebaseAdmin";
import { Article } from "../../types";
import { getUserPermission } from "../utils/auth";

export default defineEventHandler(async (event) => {
	try {
		const body = await readBody(event);
		const id = body.id;
		const permission = await getUserPermission(event);

		const doc = await db.collection("articles").doc(id).get();
		if (!doc.exists) throw new Error("Article not found.");

		const article = { id: doc.id, ...doc.data() } as any;

		const labels = await $fetch("/api/labels");
		const isPrivate = article.tags.some((tag: string) => {
			const labelDoc = (labels as any[]).find((l: any) => l.id === tag.toLowerCase());
			return labelDoc?.private;
		});

		if (isPrivate && permission != "private") throw new Error(`Article with id ${id} is private.`);

		return article;
	} catch (error: any) {
    return {
      data: null,
      error: true,
      message: error?.message || 'Unknown error',
      statusCode: 500
    };
  }
})

