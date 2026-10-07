import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Bookmark,
  ExternalLink,
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
    month: "long",
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

export default async function AthleteKnowledgeArticlePage({
  params,
}: {
  params: Promise<{
    articleId: string;
  }>;
}) {
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

  const {
    articleId,
  } = await params;

  const article =
    await prisma.knowledgeArticle.findFirst({
      where: {
        id: articleId,

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

      select: {
        id: true,
        title: true,
        summary: true,
        content: true,
        category: true,
        tags: true,
        sourceUrl: true,
        isPinned: true,
        publishedAt: true,
        createdAt: true,
      },
    });

  if (!article) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/sportist/baza-e-njohurive"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-blue-700"
      >
        <ArrowLeft size={16} />
        Kthehu te baza e njohurive
      </Link>

      <article className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-100 bg-gradient-to-br from-amber-50 via-white to-blue-50 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-[10px] font-bold text-blue-700">
              {categoryLabel(
                article.category
              )}
            </span>

            {article.isPinned ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold text-amber-700">
                <Bookmark size={11} />
                Rekomanduar
              </span>
            ) : null}
          </div>

          <div className="mt-5 flex items-start gap-4">
            <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm sm:flex">
              <BookOpen size={21} />
            </span>

            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950">
                {article.title}
              </h1>

              {article.summary ? (
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  {article.summary}
                </p>
              ) : null}

              <p className="mt-4 text-xs text-slate-400">
                Publikuar më{" "}
                {formatDate(
                  article.publishedAt ??
                    article.createdAt
                )}
              </p>
            </div>
          </div>
        </header>

        <div className="p-6 sm:p-8">
          <div className="whitespace-pre-wrap text-[15px] leading-7 text-slate-700">
            {article.content}
          </div>

          {article.tags.length > 0 ? (
            <div className="mt-8 border-t border-slate-100 pt-6">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
                Etiketat
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {article.tags.map(
                  (tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600"
                    >
                      <Tag size={11} />
                      {tag}
                    </span>
                  )
                )}
              </div>
            </div>
          ) : null}

          {article.sourceUrl ? (
            <div className="mt-6">
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
              >
                Hap burimin
                <ExternalLink size={15} />
              </a>
            </div>
          ) : null}
        </div>
      </article>
    </div>
  );
}