
const SITE = "https://www.lespetitspourquoi.fr";
const MODEL = "@cf/meta/llama-3.1-8b-instruct";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const question =
      typeof body.question === "string"
        ? body.question.trim().slice(0, 500)
        : "";

    if (!question) {
      return Response.json(
        { error: "Écris une question pour commencer." },
        { status: 400 }
      );
    }

    if (!env.AI) {
      return Response.json(
        { error: "Le service IA n'est pas configuré." },
        { status: 503 }
      );
    }

    // Récupérer les pages disponibles sur le site.
    const sitemapResponse = await fetch(`${SITE}/sitemap.xml`);

    if (!sitemapResponse.ok) {
      throw new Error("Sitemap indisponible");
    }

    const sitemap = await sitemapResponse.text();
    const urls = [
      ...sitemap.matchAll(/<loc>\s*(.*?)\s*<\/loc>/g)
    ]
      .map((match) => match[1].trim())
      .filter((url) => {
        try {
          return new URL(url).origin === SITE;
        } catch {
          return false;
        }
      })
      .slice(0, 60);

    const pages = urls.map((url) => {
      const path = new URL(url).pathname;
      const slug = path
        .split("/")
        .filter(Boolean)
        .pop() || "accueil";

      const title = decodeURIComponent(slug)
        .replace(/[-_]/g, " ");

      return { title, url };
    });

    const result = await env.AI.run(MODEL, {
      messages: [
        {
          role: "system",
          content: `Tu es l'assistant du site Les Petits Pourquoi.
Tu réponds en français, avec des explications claires,
pédagogiques et adaptées au grand public.
Réponds honnêtement. N'invente pas de faits ni d'articles.
Choisis au maximum 3 liens parmi la liste fournie.
Ne crée jamais d'URL.
Retourne uniquement un objet JSON de cette forme :
{"answer":"Ta réponse","links":[{"title":"Titre","url":"URL exacte"}]}
La liste des pages disponibles est :
${JSON.stringify(pages)}`
        },
        {
          role: "user",
          content: question
        }
      ],
      max_tokens: 700
    });

    const raw = result.response || "";
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "");

    let parsed;

    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        answer: raw,
        links: []
      };
    }

    const allowedUrls = new Set(urls);

    const links = Array.isArray(parsed.links)
      ? parsed.links
          .filter((link) =>
            link &&
            allowedUrls.has(link.url) &&
            typeof link.title === "string"
          )
          .slice(0, 3)
      : [];

    return Response.json(
      {
        answer:
          typeof parsed.answer === "string"
            ? parsed.answer
            : "Je n'ai pas réussi à formuler une réponse.",
        links
      },
      {
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    return Response.json(
      {
        error:
          "L'assistant rencontre un problème temporaire. Réessaie dans un instant."
      },
      { status: 500 }
    );
  }
                           }
