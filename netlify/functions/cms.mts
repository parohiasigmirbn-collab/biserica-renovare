import { getUser } from "@netlify/identity";
import { and, asc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { pages, type ContentBlock } from "../../db/schema.js";

const jsonHeaders = { "content-type": "application/json; charset=utf-8" };

const initialContent: ContentBlock[] = [
  {
    id: "bun-venit",
    type: "hero",
    title: "Parohia Ortodoxă Sfântul Nicolae din Sigmir",
    subtitle: "O comunitate unită, în curs de restaurare pentru generațiile viitoare.",
    body: "Biserica este locul în care istoria, credința și oamenii satului se întâlnesc.",
    imageUrl: "/assets/biserica-hero.jpeg",
    imageAlt: "Biserica Sfântul Nicolae din Sigmir",
    buttonLabel: "Susține renovarea",
    buttonUrl: "#sustine-renovarea",
    tone: "dark",
  },
  {
    id: "istoria-noastra",
    type: "text",
    title: "Istoria noastră",
    subtitle: "Credință păstrată din generație în generație",
    body: "Între anii 1933–1942, cele 22 de familii de români ortodocși din Sigmir și-au construit o biserică din lemn din fonduri proprii. Actuala comunitate continuă această moștenire prin grija pentru biserică și prin lucrările de restaurare.",
    tone: "light",
  },
  {
    id: "renovarea",
    type: "image",
    title: "Renovarea bisericii",
    subtitle: "Lucrări pentru siguranță, frumusețe și continuitate",
    body: "Renovarea urmărește consolidarea clădirii, refacerea acoperișului și restaurarea finisajelor. Fiecare contribuție ne apropie de redeschiderea completă a bisericii.",
    imageUrl: "/assets/renovare.jpg",
    imageAlt: "Lucrări de renovare la biserică",
    tone: "sand",
  },
  {
    id: "sustine-renovarea",
    type: "quote",
    title: "Împreună ducem lucrarea mai departe",
    body: "Poți sprijini renovarea prin donații, materiale, voluntariat sau distribuirea proiectului în comunitate.",
    buttonLabel: "Contactează parohia",
    buttonUrl: "#contact",
    tone: "dark",
  },
  {
    id: "noutati",
    type: "text",
    title: "Noutăți din comunitate",
    subtitle: "Progresul renovării și viața parohiei",
    body: "Aici publicăm cele mai recente informații despre șantier, evenimente, slujbe și inițiativele comunității.",
    tone: "light",
  },
  {
    id: "contact",
    type: "contact",
    title: "Contact",
    subtitle: "Suntem aici pentru tine",
    body: "Parohia Ortodoxă Sfântul Nicolae\nSigmir, Bistrița-Năsăud, România\nTelefon: +40 787 867 540\nEmail: parohiasigmirbn@gmail.com\nPreot paroh: Daniel Dascălu",
    tone: "sand",
  },
];

function response(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
}

function normalizeSlug(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function isAdmin(user: Awaited<ReturnType<typeof getUser>>) {
  return Boolean(user?.roles?.includes("admin"));
}

async function ensureHomePage() {
  const [existing] = await db.select().from(pages).where(eq(pages.slug, "acasa")).limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(pages)
    .values({
      slug: "acasa",
      title: "Parohia Sfântul Nicolae din Sigmir",
      navigationLabel: "Acasă",
      metaDescription: "Parohia Ortodoxă Sfântul Nicolae din Sigmir și proiectul de renovare al bisericii.",
      content: initialContent,
      published: true,
      showInNavigation: true,
      sortOrder: 0,
    })
    .onConflictDoNothing()
    .returning();

  if (created) return created;
  const [page] = await db.select().from(pages).where(eq(pages.slug, "acasa")).limit(1);
  return page;
}

function validatePage(input: Record<string, unknown>) {
  const slug = normalizeSlug(input.slug);
  const title = String(input.title ?? "").trim();
  const navigationLabel = String(input.navigationLabel ?? title).trim();
  const content = Array.isArray(input.content) ? input.content : [];

  if (!slug || !title || !navigationLabel) throw new Error("Titlul, eticheta din meniu și adresa paginii sunt obligatorii.");
  if (content.length > 80) throw new Error("O pagină poate conține cel mult 80 de blocuri.");

  return {
    slug,
    title: title.slice(0, 160),
    navigationLabel: navigationLabel.slice(0, 80),
    metaDescription: String(input.metaDescription ?? "").trim().slice(0, 320),
    content: content as ContentBlock[],
    published: Boolean(input.published),
    showInNavigation: Boolean(input.showInNavigation),
    sortOrder: Number.isFinite(Number(input.sortOrder)) ? Number(input.sortOrder) : 0,
    updatedAt: new Date(),
  };
}

export default async (request: Request) => {
  try {
    const url = new URL(request.url);

    if (request.method === "GET" && url.searchParams.get("admin") !== "1") {
      await ensureHomePage();
      if (url.searchParams.get("navigation") === "1") {
        const navigation = await db
          .select({ slug: pages.slug, label: pages.navigationLabel })
          .from(pages)
          .where(and(eq(pages.published, true), eq(pages.showInNavigation, true)))
          .orderBy(asc(pages.sortOrder), asc(pages.id));
        return response(navigation);
      }

      const slug = normalizeSlug(url.searchParams.get("slug") || "acasa");
      const [page] = await db.select().from(pages).where(and(eq(pages.slug, slug), eq(pages.published, true))).limit(1);
      return page ? response(page) : response({ message: "Pagina nu a fost găsită." }, 404);
    }

    const user = await getUser();
    if (!user) return response({ message: "Autentificarea este necesară." }, 401);
    if (!isAdmin(user)) return response({ message: "Contul nu are rolul admin." }, 403);

    if (request.method === "GET") {
      await ensureHomePage();
      const result = await db.select().from(pages).orderBy(asc(pages.sortOrder), asc(pages.id));
      return response({ pages: result, user: { email: user.email } });
    }

    if (request.method === "POST") {
      const payload = validatePage(await request.json());
      const [created] = await db.insert(pages).values({ ...payload, createdAt: new Date() }).returning();
      return response(created, 201);
    }

    if (request.method === "PUT") {
      const body = (await request.json()) as Record<string, unknown>;
      const id = Number(body.id);
      if (!Number.isInteger(id)) return response({ message: "Pagina este invalidă." }, 400);
      const payload = validatePage(body);
      const [updated] = await db.update(pages).set(payload).where(eq(pages.id, id)).returning();
      return updated ? response(updated) : response({ message: "Pagina nu a fost găsită." }, 404);
    }

    if (request.method === "DELETE") {
      const id = Number(url.searchParams.get("id"));
      const [target] = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
      if (!target) return response({ message: "Pagina nu a fost găsită." }, 404);
      if (target.slug === "acasa") return response({ message: "Pagina principală nu poate fi ștearsă." }, 400);
      await db.delete(pages).where(eq(pages.id, id));
      return response({ ok: true });
    }

    return response({ message: "Metodă neacceptată." }, 405);
  } catch (error) {
    const message = error instanceof Error ? error.message : "A apărut o eroare neașteptată.";
    const status = message.includes("unique") || message.includes("duplicate") ? 409 : 400;
    return response({ message: status === 409 ? "Adresa paginii este deja folosită." : message }, status);
  }
};
