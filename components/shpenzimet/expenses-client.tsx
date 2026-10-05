"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";

type ExpenseCategory =
  | "SALARY"
  | "RENT"
  | "EQUIPMENT"
  | "TRANSPORT"
  | "MEDICAL"
  | "TOURNAMENT"
  | "UTILITIES"
  | "MARKETING"
  | "OTHER";

type Expense = {
  id: string;
  category: ExpenseCategory;
  title: string;
  amountLek: number;
  expenseDate: string;
  description: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type ApiResponse = {
  summary: {
    count: number;
    totalLek: number;
  };
  expenses: Expense[];
};

const KATEGORITE: {
  value: ExpenseCategory;
  label: string;
}[] = [
  {
    value: "SALARY",
    label: "Paga",
  },
  {
    value: "RENT",
    label: "Qira",
  },
  {
    value: "EQUIPMENT",
    label: "Pajisje",
  },
  {
    value: "TRANSPORT",
    label: "Transport",
  },
  {
    value: "MEDICAL",
    label: "Mjekësore",
  },
  {
    value: "TOURNAMENT",
    label: "Turne",
  },
  {
    value: "UTILITIES",
    label: "Shërbime",
  },
  {
    value: "MARKETING",
    label: "Marketing",
  },
  {
    value: "OTHER",
    label: "Të tjera",
  },
];

const MUAJT = [
  "Janar",
  "Shkurt",
  "Mars",
  "Prill",
  "Maj",
  "Qershor",
  "Korrik",
  "Gusht",
  "Shtator",
  "Tetor",
  "Nëntor",
  "Dhjetor",
];

function lek(value: number) {
  return `${new Intl.NumberFormat(
    "sq-AL"
  ).format(value)} Lek`;
}

function dataShqip(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return `${date.getDate()} ${
    MUAJT[date.getMonth()]
  } ${date.getFullYear()}`;
}

function kategoriShqip(
  category: ExpenseCategory
) {
  return (
    KATEGORITE.find(
      (item) =>
        item.value === category
    )?.label ?? "Të tjera"
  );
}

function kategoriTone(
  category: ExpenseCategory
) {
  const tones: Record<ExpenseCategory, string> = {
    SALARY: "bg-violet-100 text-violet-700",
    RENT: "bg-amber-100 text-amber-700",
    EQUIPMENT: "bg-sky-100 text-sky-700",
    TRANSPORT: "bg-cyan-100 text-cyan-700",
    MEDICAL: "bg-rose-100 text-rose-700",
    TOURNAMENT: "bg-indigo-100 text-indigo-700",
    UTILITIES: "bg-teal-100 text-teal-700",
    MARKETING: "bg-fuchsia-100 text-fuchsia-700",
    OTHER: "bg-slate-100 text-slate-700",
  };

  return tones[category];
}

export default function ExpensesClient() {
  const [data, setData] =
    useState<ApiResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [category, setCategory] =
    useState<
      ExpenseCategory | "ALL"
    >("ALL");

  const [modalExpense, setModalExpense] =
    useState<Expense | "NEW" | null>(
      null
    );

  const [expensePerFshirje, setExpensePerFshirje] =
    useState<Expense | null>(null);

  const [deleting, setDeleting] =
    useState(false);

  async function ngarko() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/expenses",
        {
          cache: "no-store",
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Shpenzimet nuk u ngarkuan."
        );
      }

      setData(result);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Ndodhi një gabim."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    ngarko();
  }, []);

  const expenses = useMemo(() => {
    if (!data) {
      return [];
    }

    const query =
      search.trim().toLowerCase();

    return data.expenses.filter(
      (expense) => {
        const matchesSearch =
          !query ||
          expense.title
            .toLowerCase()
            .includes(query) ||
          (
            expense.description ?? ""
          )
            .toLowerCase()
            .includes(query);

        const matchesCategory =
          category === "ALL" ||
          expense.category ===
            category;

        return (
          matchesSearch &&
          matchesCategory
        );
      }
    );
  }, [data, search, category]);

  return (
    <AppShell>
      <section className="relative mb-5 overflow-hidden rounded-[28px] border border-rose-100 bg-gradient-to-br from-rose-50 via-orange-50/60 to-amber-50/50 p-5 shadow-sm sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-rose-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-40 w-40 rounded-full bg-amber-200/30 blur-3xl" />

        <div className="relative flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-rose-700 shadow-sm ring-1 ring-rose-100">
            <WalletCards className="h-6 w-6" />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-600">
              Menaxhimi financiar
            </p>

            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Shpenzimet
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Regjistro dhe menaxho të gjitha shpenzimet reale të akademisë në Lek.
            </p>
          </div>
        </div>
      </section>

      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[22px] border border-rose-100 bg-gradient-to-br from-rose-50/80 to-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Shpenzime gjithsej
            </p>

            <p className="mt-3 text-2xl font-bold text-slate-950">
              {lek(
                data?.summary.totalLek ?? 0
              )}
            </p>
          </div>

          <div className="rounded-[22px] border border-amber-100 bg-gradient-to-br from-amber-50/80 to-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Regjistrime
            </p>

            <p className="mt-3 text-2xl font-bold text-slate-950">
              {data?.summary.count ?? 0}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-[22px] border border-slate-200/80 bg-white/90 p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-[260px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Kërko shpenzimin..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
              />
            </div>

            <select
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target.value as
                    | ExpenseCategory
                    | "ALL"
                )
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
            >
              <option value="ALL">
                Të gjitha kategoritë
              </option>

              {KATEGORITE.map(
                (item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>
                )
              )}
            </select>
          </div>

          <button
            type="button"
            onClick={() =>
              setModalExpense("NEW")
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-100"
          >
            <Plus className="h-4 w-4" />
            Shto shpenzim
          </button>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <Loader2 className="h-7 w-7 animate-spin text-slate-500" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-rose-200 bg-gradient-to-br from-rose-50/50 to-white p-10 text-center">
            <WalletCards className="mx-auto h-8 w-8 text-slate-400" />

            <p className="mt-3 font-semibold text-slate-700">
              Nuk ka shpenzime për t'u shfaqur.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map(
              (expense) => (
                <div
                  key={expense.id}
                  className="rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-950">
                          {expense.title}
                        </h3>

                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${kategoriTone(expense.category)}`}>
                          {kategoriShqip(
                            expense.category
                          )}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-slate-500">
                        {dataShqip(
                          expense.expenseDate
                        )}
                      </p>

                      {expense.description && (
                        <p className="mt-2 text-sm text-slate-600">
                          {
                            expense.description
                          }
                        </p>
                      )}

                      {expense.notes && (
                        <p className="mt-2 text-xs text-slate-500">
                          Shënim:{" "}
                          {expense.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-start gap-3">
                      <p className="mr-2 text-lg font-bold text-red-600">
                        {lek(
                          expense.amountLek
                        )}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          setModalExpense(
                            expense
                          )
                        }
                        className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                        aria-label="Ndrysho shpenzimin"
                        title="Ndrysho shpenzimin"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setExpensePerFshirje(
                            expense
                          )
                        }
                        className="rounded-xl border border-rose-200 bg-rose-50/40 p-2 text-rose-600 transition hover:bg-rose-100"
                        aria-label="Fshi shpenzimin"
                        title="Fshi shpenzimin"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {modalExpense && (
        <ExpenseModal
          expense={
            modalExpense === "NEW"
              ? null
              : modalExpense
          }
          onClose={() =>
            setModalExpense(null)
          }
          onSaved={() => {
            setModalExpense(null);
            ngarko();
          }}
        />
      )}

      {expensePerFshirje && (
        <ConfirmModal
          loading={deleting}
          onClose={() =>
            setExpensePerFshirje(null)
          }
          onConfirm={async () => {
            setDeleting(true);

            try {
              const response = await fetch(
                `/api/expenses/${expensePerFshirje.id}`,
                {
                  method: "DELETE",
                }
              );

              const result =
                await response.json();

              if (!response.ok) {
                throw new Error(
                  result.error ||
                    "Shpenzimi nuk u fshi."
                );
              }

              setExpensePerFshirje(
                null
              );

              await ngarko();
            } catch (error) {
              setError(
                error instanceof Error
                  ? error.message
                  : "Ndodhi një gabim."
              );
            } finally {
              setDeleting(false);
            }
          }}
        />
      )}
    </AppShell>
  );
}

function ExpenseModal({
  expense,
  onClose,
  onSaved,
}: {
  expense: Expense | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const now = new Date();

  const defaultDate =
    expense?.expenseDate
      ? new Date(
          expense.expenseDate
        )
          .toISOString()
          .slice(0, 10)
      : `${now.getFullYear()}-${String(
          now.getMonth() + 1
        ).padStart(2, "0")}-${String(
          now.getDate()
        ).padStart(2, "0")}`;

  const [title, setTitle] =
    useState(
      expense?.title ?? ""
    );

  const [category, setCategory] =
    useState<ExpenseCategory>(
      expense?.category ?? "OTHER"
    );

  const [amount, setAmount] =
    useState(
      expense
        ? String(expense.amountLek)
        : ""
    );

  const [expenseDate, setExpenseDate] =
    useState(defaultDate);

  const [description, setDescription] =
    useState(
      expense?.description ?? ""
    );

  const [notes, setNotes] =
    useState(
      expense?.notes ?? ""
    );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  async function ruaj() {
    const amountLek =
      Number(amount);

    if (!title.trim()) {
      setError(
        "Titulli është i detyrueshëm."
      );
      return;
    }

    if (
      !Number.isInteger(amountLek) ||
      amountLek <= 0
    ) {
      setError(
        "Vendos një shumë të vlefshme në Lek."
      );
      return;
    }

    const parsedDate =
      new Date(
        `${expenseDate}T12:00:00`
      );

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      setError(
        "Data e shpenzimit nuk është e vlefshme."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        expense
          ? `/api/expenses/${expense.id}`
          : "/api/expenses",
        {
          method: expense
            ? "PATCH"
            : "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            category,
            amountLek,
            expenseDate:
              parsedDate.toISOString(),
            description,
            notes,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Shpenzimi nuk u ruajt."
        );
      }

      onSaved();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Ndodhi një gabim."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={
        expense
          ? "Ndrysho shpenzimin"
          : "Shto shpenzim"
      }
      onClose={onClose}
    >
      {error && (
        <ErrorBox text={error} />
      )}

      <label className="space-y-2">
        <span className="text-sm font-bold text-slate-700">
          Titulli
        </span>

        <input
          value={title}
          onChange={(event) =>
            setTitle(
              event.target.value
            )
          }
          placeholder="P.sh. Pagesa e trajnerit"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
        />
      </label>

      <label className="mt-5 block space-y-2">
        <span className="text-sm font-bold text-slate-700">
          Kategoria
        </span>

        <select
          value={category}
          onChange={(event) =>
            setCategory(
              event.target
                .value as ExpenseCategory
            )
          }
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm outline-none transition focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100"
        >
          {KATEGORITE.map(
            (item) => (
              <option
                key={item.value}
                value={item.value}
              >
                {item.label}
              </option>
            )
          )}
        </select>
      </label>

      <label className="mt-5 block space-y-2">
        <span className="text-sm font-bold text-slate-700">
          Shuma në Lek
        </span>

        <input
          type="number"
          min="1"
          step="1"
          value={amount}
          onChange={(event) =>
            setAmount(
              event.target.value
            )
          }
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm outline-none transition focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100"
        />
      </label>

      <label className="mt-5 block space-y-2">
        <span className="text-sm font-bold text-slate-700">
          Data
        </span>

        <input
          type="date"
          value={expenseDate}
          onChange={(event) =>
            setExpenseDate(
              event.target.value
            )
          }
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm outline-none transition focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100"
        />
      </label>

      <label className="mt-5 block space-y-2">
        <span className="text-sm font-bold text-slate-700">
          Përshkrimi
        </span>

        <input
          value={description}
          onChange={(event) =>
            setDescription(
              event.target.value
            )
          }
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm outline-none transition focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100"
        />
      </label>

      <label className="mt-5 block space-y-2">
        <span className="text-sm font-bold text-slate-700">
          Shënime
        </span>

        <textarea
          rows={3}
          value={notes}
          onChange={(event) =>
            setNotes(
              event.target.value
            )
          }
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-3 text-sm outline-none transition focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100"
        />
      </label>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          Anulo
        </button>

        <button
          type="button"
          onClick={ruaj}
          disabled={saving}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-100 disabled:opacity-60"
        >
          {saving && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}

          {expense
            ? "Ruaj ndryshimet"
            : "Ruaj shpenzimin"}
        </button>
      </div>
    </Modal>
  );
}

function ConfirmModal({
  loading,
  onClose,
  onConfirm,
}: {
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      title="Fshi shpenzimin"
      onClose={onClose}
    >
      <p className="rounded-[18px] border border-rose-100 bg-rose-50/60 p-4 text-sm leading-6 text-slate-700">
        A je i sigurt që dëshiron ta fshish këtë shpenzim?
      </p>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          Anulo
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-60"
        >
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}

          Fshi shpenzimin
        </button>
      </div>
    </Modal>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[28px] border border-rose-100 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-rose-100 bg-gradient-to-r from-rose-50 via-orange-50/70 to-amber-50 px-6 py-5">
          <h2 className="text-xl font-black tracking-tight text-slate-950">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/80 bg-white/70 p-2 text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-800"
            aria-label="Mbyll"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

function ErrorBox({
  text,
}: {
  text: string;
}) {
  return (
    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
      {text}
    </div>
  );
}
