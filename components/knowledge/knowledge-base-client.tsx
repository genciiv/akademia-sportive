"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Archive,
  BookOpen,
  Clock3,
  Edit3,
  ExternalLink,
  FileText,
  Filter,
  Pin,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";

type KnowledgeCategory =
  | "METHODOLOGY"
  | "POLICY"
  | "PROCEDURE"
  | "COMMUNICATION"
  | "DEVELOPMENT"
  | "SAFEGUARDING"
  | "RESOURCE"
  | "OTHER";

type KnowledgeAudience =
  | "ALL"
  | "COACHES"
  | "STAFF"
  | "PLAYERS"
  | "PARENTS";

type KnowledgeStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "ARCHIVED";

type ArticleAuthor = {
  id: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
};

type KnowledgeArticle = {
  id: string;
  title: string;
  summary: string | null;
  content: string;
  category: KnowledgeCategory;
  audience: KnowledgeAudience;
  status: KnowledgeStatus;
  tags: string[];
  sourceUrl: string | null;
  isPinned: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  authorId: string | null;
  author: ArticleAuthor | null;
};

type FormState = {
  title: string;
  summary: string;
  content: string;
  category: KnowledgeCategory;
  audience: KnowledgeAudience;
  status: KnowledgeStatus;
  tags: string;
  sourceUrl: string;
  isPinned: boolean;
};

const EMPTY_FORM: FormState = {
  title: "",
  summary: "",
  content: "",
  category: "OTHER",
  audience: "ALL",
  status: "DRAFT",
  tags: "",
  sourceUrl: "",
  isPinned: false,
};

const CATEGORY_LABELS:
  Record<KnowledgeCategory, string> = {
    METHODOLOGY: "Metodologji",
    POLICY: "Rregullore",
    PROCEDURE: "Procedurë",
    COMMUNICATION: "Komunikim",
    DEVELOPMENT: "Zhvillim",
    SAFEGUARDING: "Siguri & mbrojtje",
    RESOURCE: "Material burimor",
    OTHER: "Tjetër",
  };

const AUDIENCE_LABELS:
  Record<KnowledgeAudience, string> = {
    ALL: "Të gjithë",
    COACHES: "Trajnerët",
    STAFF: "Stafi",
    PLAYERS: "Sportistët",
    PARENTS: "Prindërit",
  };

const STATUS_LABELS:
  Record<KnowledgeStatus, string> = {
    DRAFT: "Draft",
    PUBLISHED: "Publikuar",
    ARCHIVED: "Arkivuar",
  };

const CATEGORIES =
  Object.keys(
    CATEGORY_LABELS
  ) as KnowledgeCategory[];

const AUDIENCES =
  Object.keys(
    AUDIENCE_LABELS
  ) as KnowledgeAudience[];

const STATUSES =
  Object.keys(
    STATUS_LABELS
  ) as KnowledgeStatus[];

function statusClass(
  status: KnowledgeStatus
) {
  if (status === "PUBLISHED") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (status === "DRAFT") {
    return "bg-amber-50 text-amber-700 ring-amber-100";
  }

  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function categoryClass(
  category: KnowledgeCategory
) {
  if (
    category === "METHODOLOGY" ||
    category === "DEVELOPMENT"
  ) {
    return "bg-blue-50 text-blue-700";
  }

  if (
    category === "POLICY" ||
    category === "PROCEDURE"
  ) {
    return "bg-violet-50 text-violet-700";
  }

  if (
    category === "SAFEGUARDING"
  ) {
    return "bg-rose-50 text-rose-700";
  }

  if (
    category === "COMMUNICATION"
  ) {
    return "bg-cyan-50 text-cyan-700";
  }

  return "bg-slate-100 text-slate-700";
}

function formatDate(
  value: string | null
) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "sq-AL",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(new Date(value));
}

function authorName(
  author: ArticleAuthor | null
) {
  if (!author) {
    return "Autor i panjohur";
  }

  const fullName = [
    author.firstName,
    author.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || author.name;
}

export default function KnowledgeBaseClient() {
  const [
    articles,
    setArticles,
  ] = useState<KnowledgeArticle[]>([]);

  const [
    canManage,
    setCanManage,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState<
    KnowledgeCategory | "ALL"
  >("ALL");

  const [
    audienceFilter,
    setAudienceFilter,
  ] = useState<
    KnowledgeAudience | "ALL_FILTER"
  >("ALL_FILTER");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    KnowledgeStatus | "ALL"
  >("ALL");

  const [
    formOpen,
    setFormOpen,
  ] = useState(false);

  const [
    readingArticle,
    setReadingArticle,
  ] =
    useState<KnowledgeArticle | null>(
      null
    );

  const [
    editingArticle,
    setEditingArticle,
  ] =
    useState<KnowledgeArticle | null>(
      null
    );

  const [
    form,
    setForm,
  ] =
    useState<FormState>(
      EMPTY_FORM
    );

  async function loadArticles() {
    setLoading(true);
    setError(null);

    try {
      const response =
        await fetch(
          "/api/knowledge",
          {
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Materialet nuk mund të ngarkoheshin."
        );
      }

      setArticles(
        Array.isArray(data.articles)
          ? data.articles
          : []
      );

      setCanManage(
        data.canManage === true
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Ndodhi një gabim gjatë ngarkimit."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadArticles();
  }, []);

  const filteredArticles =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return articles.filter(
        (article) => {
          if (
            categoryFilter !==
              "ALL" &&
            article.category !==
              categoryFilter
          ) {
            return false;
          }

          if (
            audienceFilter !==
              "ALL_FILTER" &&
            article.audience !==
              audienceFilter
          ) {
            return false;
          }

          if (
            statusFilter !==
              "ALL" &&
            article.status !==
              statusFilter
          ) {
            return false;
          }

          if (!normalizedSearch) {
            return true;
          }

          const searchable = [
            article.title,
            article.summary ?? "",
            article.content,
            CATEGORY_LABELS[
              article.category
            ],
            AUDIENCE_LABELS[
              article.audience
            ],
            ...article.tags,
          ]
            .join(" ")
            .toLowerCase();

          return searchable.includes(
            normalizedSearch
          );
        }
      );
    }, [
      articles,
      search,
      categoryFilter,
      audienceFilter,
      statusFilter,
    ]);

  const publishedCount =
    articles.filter(
      (article) =>
        article.status === "PUBLISHED"
    ).length;

  const draftCount =
    articles.filter(
      (article) =>
        article.status === "DRAFT"
    ).length;

  const pinnedCount =
    articles.filter(
      (article) =>
        article.isPinned
    ).length;

  function openCreate() {
    setEditingArticle(null);
    setForm(EMPTY_FORM);
    setError(null);
    setFormOpen(true);
  }

  function openEdit(
    article: KnowledgeArticle
  ) {
    setEditingArticle(article);

    setForm({
      title: article.title,
      summary:
        article.summary ?? "",
      content: article.content,
      category: article.category,
      audience: article.audience,
      status: article.status,
      tags:
        article.tags.join(", "),
      sourceUrl:
        article.sourceUrl ?? "",
      isPinned:
        article.isPinned,
    });

    setError(null);
    setReadingArticle(null);
    setFormOpen(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setFormOpen(false);
    setEditingArticle(null);
    setForm(EMPTY_FORM);
  }

  async function submitForm(
    event: FormEvent
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setSaving(true);
    setError(null);

    const tags =
      form.tags
        .split(",")
        .map((tag) =>
          tag.trim()
        )
        .filter(Boolean);

    try {
      const response =
        await fetch(
          editingArticle
            ? `/api/knowledge/${editingArticle.id}`
            : "/api/knowledge",
          {
            method:
              editingArticle
                ? "PATCH"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              title:
                form.title,
              summary:
                form.summary,
              content:
                form.content,
              category:
                form.category,
              audience:
                form.audience,
              status:
                form.status,
              tags,
              sourceUrl:
                form.sourceUrl,
              isPinned:
                form.isPinned,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Materiali nuk mund të ruhej."
        );
      }

      setFormOpen(false);
      setEditingArticle(null);
      setForm(EMPTY_FORM);

      await loadArticles();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Ndodhi një gabim gjatë ruajtjes."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteArticle(
    article: KnowledgeArticle
  ) {
    const confirmed =
      window.confirm(
        `Je i sigurt që dëshiron të fshish "${article.title}"?`
      );

    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      const response =
        await fetch(
          `/api/knowledge/${article.id}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Materiali nuk mund të fshihej."
        );
      }

      if (
        readingArticle?.id ===
        article.id
      ) {
        setReadingArticle(null);
      }

      await loadArticles();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Ndodhi një gabim gjatë fshirjes."
      );
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-600">
              <BookOpen className="h-4 w-4" />
              Qendra e materialeve
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Baza e njohurive
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Metodologji, rregullore,
              procedura dhe materiale
              udhëzuese të akademisë në
              një vend të vetëm.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                void loadArticles()
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Rifresko
            </button>

            {canManage ? (
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                Shto material
              </button>
            ) : null}
          </div>
        </section>

        {error ? (
          <div className="flex items-start justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() =>
                setError(null)
              }
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Gjithsej"
            value={articles.length}
            icon={
              <BookOpen className="h-5 w-5" />
            }
          />

          <StatCard
            label="Publikuar"
            value={publishedCount}
            icon={
              <FileText className="h-5 w-5" />
            }
          />

          <StatCard
            label="Draft"
            value={
              canManage
                ? draftCount
                : 0
            }
            icon={
              <Clock3 className="h-5 w-5" />
            }
          />

          <StatCard
            label="Të fiksuara"
            value={pinnedCount}
            icon={
              <Pin className="h-5 w-5" />
            }
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_180px]">
            <label className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Kërko sipas titullit, përmbajtjes ose etiketave..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </label>

            <FilterSelect
              value={categoryFilter}
              onChange={(value) =>
                setCategoryFilter(
                  value as
                    | KnowledgeCategory
                    | "ALL"
                )
              }
            >
              <option value="ALL">
                Të gjitha kategoritë
              </option>

              {CATEGORIES.map(
                (category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {
                      CATEGORY_LABELS[
                        category
                      ]
                    }
                  </option>
                )
              )}
            </FilterSelect>

            <FilterSelect
              value={audienceFilter}
              onChange={(value) =>
                setAudienceFilter(
                  value as
                    | KnowledgeAudience
                    | "ALL_FILTER"
                )
              }
            >
              <option value="ALL_FILTER">
                Të gjitha audiencat
              </option>

              {AUDIENCES.map(
                (audience) => (
                  <option
                    key={audience}
                    value={audience}
                  >
                    {
                      AUDIENCE_LABELS[
                        audience
                      ]
                    }
                  </option>
                )
              )}
            </FilterSelect>

            {canManage ? (
              <FilterSelect
                value={statusFilter}
                onChange={(value) =>
                  setStatusFilter(
                    value as
                      | KnowledgeStatus
                      | "ALL"
                  )
                }
              >
                <option value="ALL">
                  Të gjitha statuset
                </option>

                {STATUSES.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {
                        STATUS_LABELS[
                          status
                        ]
                      }
                    </option>
                  )
                )}
              </FilterSelect>
            ) : (
              <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
                <Filter className="h-4 w-4" />
                Vetëm të publikuara
              </div>
            )}
          </div>
        </section>

        {loading ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(
              (item) => (
                <div
                  key={item}
                  className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white"
                />
              )
            )}
          </section>
        ) : filteredArticles.length ===
          0 ? (
          <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-slate-300" />

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Nuk u gjet asnjë material
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Ndrysho filtrat ose krijo
              materialin e parë të bazës së
              njohurive.
            </p>

            {canManage ? (
              <button
                type="button"
                onClick={openCreate}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                Shto material
              </button>
            ) : null}
          </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredArticles.map(
              (article) => (
                <article
                  key={article.id}
                  className="group flex min-h-[290px] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${categoryClass(
                          article.category
                        )}`}
                      >
                        {
                          CATEGORY_LABELS[
                            article
                              .category
                          ]
                        }
                      </span>

                      {canManage ? (
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${statusClass(
                            article.status
                          )}`}
                        >
                          {
                            STATUS_LABELS[
                              article.status
                            ]
                          }
                        </span>
                      ) : null}
                    </div>

                    {article.isPinned ? (
                      <span
                        title="Material i fiksuar"
                        className="rounded-lg bg-amber-50 p-2 text-amber-600"
                      >
                        <Pin className="h-4 w-4" />
                      </span>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setReadingArticle(
                        article
                      )
                    }
                    className="mt-5 text-left"
                  >
                    <h2 className="text-lg font-bold leading-6 text-slate-950 transition group-hover:text-blue-700">
                      {article.title}
                    </h2>
                  </button>

                  <p className="mt-3 flex-1 text-sm leading-6 text-slate-500">
                    {article.summary ||
                      "Ky material nuk ka një përmbledhje të shkurtër."}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {article.tags
                      .slice(0, 4)
                      .map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600"
                        >
                          <Tag className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                      <span className="inline-flex min-w-0 items-center gap-1.5">
                        <UsersRound className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {
                            AUDIENCE_LABELS[
                              article.audience
                            ]
                          }
                        </span>
                      </span>

                      <span>
                        {formatDate(
                          article.publishedAt ||
                            article.updatedAt
                        )}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setReadingArticle(
                            article
                          )
                        }
                        className="flex-1 rounded-xl bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        Lexo materialin
                      </button>

                      {canManage ? (
                        <>
                          <button
                            type="button"
                            title="Edito"
                            onClick={() =>
                              openEdit(
                                article
                              )
                            }
                            className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50 hover:text-blue-700"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            title="Fshi"
                            onClick={() =>
                              void deleteArticle(
                                article
                              )
                            }
                            className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </article>
              )
            )}
          </section>
        )}
      </div>

      {readingArticle ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-5 py-4 sm:px-7">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${categoryClass(
                      readingArticle.category
                    )}`}
                  >
                    {
                      CATEGORY_LABELS[
                        readingArticle
                          .category
                      ]
                    }
                  </span>

                  {canManage ? (
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusClass(
                        readingArticle.status
                      )}`}
                    >
                      {
                        STATUS_LABELS[
                          readingArticle
                            .status
                        ]
                      }
                    </span>
                  ) : null}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setReadingArticle(null)
                }
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 py-6 sm:px-7">
              <h2 className="text-2xl font-bold leading-tight text-slate-950">
                {readingArticle.title}
              </h2>

              {readingArticle.summary ? (
                <p className="mt-3 text-base leading-7 text-slate-500">
                  {
                    readingArticle.summary
                  }
                </p>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                <span>
                  Autor:{" "}
                  <strong className="font-semibold text-slate-700">
                    {authorName(
                      readingArticle.author
                    )}
                  </strong>
                </span>

                <span>
                  Audienca:{" "}
                  <strong className="font-semibold text-slate-700">
                    {
                      AUDIENCE_LABELS[
                        readingArticle
                          .audience
                      ]
                    }
                  </strong>
                </span>

                <span>
                  Përditësuar:{" "}
                  <strong className="font-semibold text-slate-700">
                    {formatDate(
                      readingArticle.updatedAt
                    )}
                  </strong>
                </span>
              </div>

              <div className="mt-6 whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                {
                  readingArticle.content
                }
              </div>

              {readingArticle.tags.length >
              0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {readingArticle.tags.map(
                    (tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs text-slate-600"
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                      </span>
                    )
                  )}
                </div>
              ) : null}

              <div className="mt-7 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
                {readingArticle.sourceUrl ? (
                  <a
                    href={
                      readingArticle.sourceUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Hap burimin
                  </a>
                ) : null}

                {canManage ? (
                  <button
                    type="button"
                    onClick={() =>
                      openEdit(
                        readingArticle
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edito
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {formOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-4">
          <form
            onSubmit={submitForm}
            className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4 sm:px-7">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  {editingArticle
                    ? "Edito materialin"
                    : "Shto material"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Plotëso informacionin e
                  materialit të bazës së
                  njohurive.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-5 px-5 py-6 sm:px-7">
              <Field
                label="Titulli"
                required
              >
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        title:
                          event.target
                            .value,
                      })
                    )
                  }
                  maxLength={160}
                  required
                  className="field-input"
                  placeholder="p.sh. Metodologjia e stërvitjes U13"
                />
              </Field>

              <div className="grid gap-5 md:grid-cols-3">
                <Field label="Kategoria">
                  <select
                    value={
                      form.category
                    }
                    onChange={(event) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          category:
                            event
                              .target
                              .value as KnowledgeCategory,
                        })
                      )
                    }
                    className="field-input"
                  >
                    {CATEGORIES.map(
                      (category) => (
                        <option
                          key={
                            category
                          }
                          value={
                            category
                          }
                        >
                          {
                            CATEGORY_LABELS[
                              category
                            ]
                          }
                        </option>
                      )
                    )}
                  </select>
                </Field>

                <Field label="Audienca">
                  <select
                    value={
                      form.audience
                    }
                    onChange={(event) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          audience:
                            event
                              .target
                              .value as KnowledgeAudience,
                        })
                      )
                    }
                    className="field-input"
                  >
                    {AUDIENCES.map(
                      (audience) => (
                        <option
                          key={
                            audience
                          }
                          value={
                            audience
                          }
                        >
                          {
                            AUDIENCE_LABELS[
                              audience
                            ]
                          }
                        </option>
                      )
                    )}
                  </select>
                </Field>

                <Field label="Statusi">
                  <select
                    value={
                      form.status
                    }
                    onChange={(event) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          status:
                            event
                              .target
                              .value as KnowledgeStatus,
                        })
                      )
                    }
                    className="field-input"
                  >
                    {STATUSES.map(
                      (status) => (
                        <option
                          key={status}
                          value={status}
                        >
                          {
                            STATUS_LABELS[
                              status
                            ]
                          }
                        </option>
                      )
                    )}
                  </select>
                </Field>
              </div>

              <Field label="Përmbledhja">
                <textarea
                  value={
                    form.summary
                  }
                  onChange={(event) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        summary:
                          event.target
                            .value,
                      })
                    )
                  }
                  maxLength={600}
                  rows={3}
                  className="field-input min-h-[90px] resize-y"
                  placeholder="Një përmbledhje e shkurtër..."
                />
              </Field>

              <Field
                label="Përmbajtja"
                required
              >
                <textarea
                  value={
                    form.content
                  }
                  onChange={(event) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        content:
                          event.target
                            .value,
                      })
                    )
                  }
                  maxLength={50000}
                  rows={12}
                  required
                  className="field-input min-h-[260px] resize-y"
                  placeholder="Shkruaj përmbajtjen e plotë të materialit..."
                />
              </Field>

              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Etiketat">
                  <input
                    value={form.tags}
                    onChange={(event) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          tags:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className="field-input"
                    placeholder="stërvitje, U13, metodologji"
                  />

                  <p className="mt-1.5 text-xs text-slate-400">
                    Ndaji etiketat me
                    presje.
                  </p>
                </Field>

                <Field label="Linku i burimit">
                  <input
                    type="url"
                    value={
                      form.sourceUrl
                    }
                    onChange={(event) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          sourceUrl:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className="field-input"
                    placeholder="https://..."
                  />
                </Field>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <input
                  type="checkbox"
                  checked={
                    form.isPinned
                  }
                  onChange={(event) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        isPinned:
                          event.target
                            .checked,
                      })
                    )
                  }
                  className="h-4 w-4 rounded border-slate-300"
                />

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Fikso materialin
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Materialet e fiksuara
                    shfaqen të parat.
                  </p>
                </div>
              </label>
            </div>

            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:px-7">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Anulo
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-w-[130px] items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {saving
                  ? "Duke ruajtur..."
                  : editingArticle
                    ? "Ruaj ndryshimet"
                    : "Krijo materialin"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <style jsx global>{`
        .field-input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          padding: 0.7rem 0.8rem;
          font-size: 0.875rem;
          color: rgb(15 23 42);
          outline: none;
          transition: 150ms;
        }

        .field-input:focus {
          border-color: rgb(96 165 250);
          box-shadow: 0 0 0 4px
            rgb(239 246 255);
        }
      `}</style>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-950">
            {value}
          </p>
        </div>

        <div className="rounded-xl bg-slate-100 p-3 text-slate-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (
    value: string
  ) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(event) =>
        onChange(
          event.target.value
        )
      }
      className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
    >
      {children}
    </select>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        {required ? (
          <span className="text-rose-500">
            {" "}
            *
          </span>
        ) : null}
      </span>

      {children}
    </label>
  );
}