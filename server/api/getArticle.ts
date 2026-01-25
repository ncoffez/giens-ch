
import { db } from "../useFirebaseAdmin";
import { Article } from "../utils/article";

export default defineEventHandler(async (event) => {
	try {
		const body = await readBody(event);
		const id = body.id;
		const label = body.label || "public";

		const doc = await db.collection("articles").doc(id).get();
		if (!doc.exists) throw new Error("Article not found.");

		const article = { id: doc.id, ...doc.data() } as any;

		const labels = await $fetch("/api/labels");
		const isPrivate = article.tags.some((tag: string) => {
			const labelDoc = labels.find((l: any) => l.id === tag.toLowerCase());
			return labelDoc?.private;
		});

		if (isPrivate && label != "private") throw new Error(`Article with id ${id} is private.`);

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

