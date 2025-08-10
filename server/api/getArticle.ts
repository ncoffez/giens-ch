
import { news } from '../news'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const id = body.id
    const label = body.label || "public"

    const article = news.find(article => article.id === id)
    if (!article) throw new Error("This article is private.")
    if (article.label.includes("private") && label != "private") throw new Error(`Article with id ${id} is private.`);

    return article
  } catch (error: any) {
    return {
      data: null,
      error: true,
      message: error?.message || 'Unknown error',
      statusCode: 500
    };
  }
})

