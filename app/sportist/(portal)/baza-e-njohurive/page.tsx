import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  LibraryBig,
  Sparkles,
  Tag,
} from "lucide-react";

import { requireAthleteAccess } from "@/lib/athlete-access";
import { prisma } from "@/lib/prisma";

function formatDate(value: Date | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("sq-AL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Tirane",
  }).format(value);
}

function categoryLabel(value: string) {
  switch (value) {
    case "METHODOLOGY":
      return "Metodologji";
    case "POLICY":
      return "Politika";
    case "PROCEDURE":
      return "Procedura";
    case "COMMUNICATION":
      return "Komunikim";
    case "DEVELOPMENT":
      return "Zhvillim";
    case "SAFEGUARDING":
      return "Siguri";
    case "RESOURCE":
      return "Material";
    case "OTHER":
      return "Tjetër";
    default:
      return value;
  }
}

function categoryClass(value: string) {
  switch (value) {
    case "METHODOLOGY":
      return "bg-blue-100 text-blue-700";
    case "DEVELOPMENT":
      return "bg-emerald-100 text-emerald-700";
    case "SAFEGUARDING":
      return "bg-rose-100 text-rose-700";
    case "COMMUNICATION":
      return "bg-violet-100 text-violet-700";
    case "RESOURCE":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default async function AthleteKnowledgeBasePage() {
  const access =
    await requireAthleteAccess();

  if (!access.ok) {
    if (
      access.response.status === 401
    ) {
      redirect(
        "/hyrje?next=/sportist/baza-e-njohurive"
      );
    }

    redirect("/");
  }

  const articles =
    await prisma.knowledgeArticle.findMany({
      where: {
        academyId:
          access.academyId,

        status:
          "PUBLISHED",

        audience: {
          in: [
            "ALL",
            "PLAYERS",
          ],
        },
      },

      orderBy: [
        {
          isPinned: "desc",
        },
        {
          publishedAt: "desc",
        },
        {
          createdAt: "desc",
        },
      ],

      select: {
        id: true,
        title: true,
        summary: true,
        category: true,
        audience: true,
        tags: true,
        isPinned: true,
        publishedAt: true,
        createdAt: true,
      },
    });

  const pinnedArticles =
    articles.filter(
      (article) =>
        article.isPinned
    );

  const regularArticles =
    articles.filter(
      (article) =>
        !article.isPinned
    );

  const categories =
    new Set(
      articles.map(
        (article) =>
          article.category
      )
    );

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[26px] border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-blue-50 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-amber-700">
              <Sparkles size={13} />
              Materiale për zhvillimin tënd
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950">
              Baza e njohurive
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Lexo materiale, udhëzime dhe artikuj që akademia ka publikuar për sportistët.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                {articles.length} artikuj
              </span>

              <span className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                {categories.size} kategori
              </span>

              <span className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700">
                {pinnedArticles.length} të rekomanduara
              </span>
            </div>
          </div>

          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm">
            <LibraryBig size={28} />
          </div>
        </div>
      </section>

      {articles.length === 0 ? (
        <section className="rounded-[22px] border border-slate-200 bg-white p-10 text-center shadow-sm">
          <BookOpen
            size={32}
            className="mx-auto text-slate-300"
          />

          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Nuk ka materiale të publikuara
          </h2>

          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
            Materialet e publikuara nga akademia për sportistët do të shfaqen këtu.
          </p>
        </section>
      ) : (
        <>
          {pinnedArticles.length > 0 ? (
            <section className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-amber-600">
                  Të rekomanduara
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-950">
                  Materiale të zgjedhura
                </h2>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {pinnedArticles.map(
                  (article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      featured
                    />
                  )
                )}
              </div>
            </section>
          ) : null}

          <section className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-blue-600">
                Biblioteka
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-950">
                Të gjitha materialet
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Artikujt e publikuar për sportistët e akademisë.
              </p>
            </div>

            {regularArticles.length === 0 ? (
              <div className="mt-6 rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                Të gjitha materialet aktuale janë të rekomanduara.
              </div>
            ) : (
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {regularArticles.map(
                  (article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                    />
                  )
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

type Article = {
  id: string;
  title: string;
  summary: string | null;
  category: string;
  audience: string;
  tags: string[];
  isPinned: boolean;
  publishedAt: Date | null;
  createdAt: Date;
};

function ArticleCard({
  article,
  featured = false,
}: {
  article: Article;
  featured?: boolean;
}) {
  return (
    <Link
      href={`/sportist/baza-e-njohurive/${article.id}`}
      className={[
        "group rounded-2xl border p-5 transition",
        featured
          ? "border-amber-200 bg-amber-50/60 hover:border-amber-300"
          : "border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-blue-50/30",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={[
                "rounded-full px-2.5 py-1 text-[10px] font-bold",
                categoryClass(
                  article.category
                ),
              ].join(" ")}
            >
              {categoryLabel(
                article.category
              )}
            </span>

            {article.isPinned ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                <Bookmark size={11} />
                Rekomanduar
              </span>
            ) : null}
          </div>

          <h3 className="mt-3 text-lg font-bold text-slate-950 transition group-hover:text-blue-700">
            {article.title}
          </h3>

          {article.summary ? (
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
              {article.summary}
            </p>
          ) : null}
        </div>

        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
          <BookOpen size={18} />
        </span>
      </div>

      {article.tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {article.tags
            .slice(0, 4)
            .map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[10px] font-medium text-slate-500"
              >
                <Tag size={10} />
                {tag}
              </span>
            ))}
        </div>
      ) : null}

      <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-200/70 pt-4">
        <span className="text-[11px] text-slate-400">
          {formatDate(
            article.publishedAt ??
              article.createdAt
          )}
        </span>

        <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600">
          Lexo artikullin
          <ArrowRight size={13} />
        </span>
      </div>
    </Link>
  );
}