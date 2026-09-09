import { getStore } from "@netlify/blobs";
import { getUser } from "@netlify/identity";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { media } from "../../db/schema.js";

const store = getStore("cms-media");
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

async function requireAdmin() {
  const user = await getUser();
  if (!user) return { error: json({ message: "Autentificarea este necesară." }, 401) };
  if (!user.roles?.includes("admin")) return { error: json({ message: "Contul nu are rolul admin." }, 403) };
  return { user };
}

export default async (request: Request) => {
  try {
    const url = new URL(request.url);
    const id = Number(url.searchParams.get("id"));

    if (request.method === "GET" && Number.isInteger(id)) {
      const [item] = await db.select().from(media).where(eq(media.id, id)).limit(1);
      if (!item) return new Response("Imaginea nu a fost găsită.", { status: 404 });
      const file = await store.get(item.blobKey, { type: "arrayBuffer" });
      if (!file) return new Response("Fișierul nu a fost găsit.", { status: 404 });
      return new Response(file as ArrayBuffer, {
        headers: {
          "content-type": item.mimeType,
          "cache-control": "public, max-age=31536000, immutable",
        },
      });
    }

    const auth = await requireAdmin();
    if ("error" in auth) return auth.error;

    if (request.method === "GET") {
      const items = await db.select().from(media).orderBy(media.id);
      return json(items);
    }

    if (request.method === "POST") {
      const form = await request.formData();
      const file = form.get("file");
      const altText = String(form.get("altText") ?? "").trim().slice(0, 240);
      if (!(file instanceof File)) return json({ message: "Selectează o imagine." }, 400);
      if (!allowedTypes.has(file.type)) return json({ message: "Formatul imaginii nu este acceptat." }, 400);
      if (file.size > 8 * 1024 * 1024) return json({ message: "Imaginea trebuie să fie mai mică de 8 MB." }, 400);

      const extension = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "").toLowerCase() || "img";
      const blobKey = `images/${crypto.randomUUID()}.${extension}`;
      await store.set(blobKey, await file.arrayBuffer());
      const [created] = await db
        .insert(media)
        .values({ blobKey, filename: file.name.slice(0, 240), altText, mimeType: file.type, size: file.size })
        .returning();
      return json(created, 201);
    }

    if (request.method === "DELETE") {
      if (!Number.isInteger(id)) return json({ message: "Imagine invalidă." }, 400);
      const [item] = await db.select().from(media).where(eq(media.id, id)).limit(1);
      if (!item) return json({ message: "Imaginea nu a fost găsită." }, 404);
      await store.delete(item.blobKey);
      await db.delete(media).where(eq(media.id, id));
      return json({ ok: true });
    }

    return json({ message: "Metodă neacceptată." }, 405);
  } catch (error) {
    return json({ message: error instanceof Error ? error.message : "A apărut o eroare neașteptată." }, 400);
  }
};
