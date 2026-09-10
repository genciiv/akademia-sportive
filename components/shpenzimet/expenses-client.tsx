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
import { PageHeader } from "@/components/page-header";

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
      <PageHeader
        title="Shpenzimet"
        description="Menaxhimi real i shpenzimeve të akademisë në Lek."
      />

      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Shpenzime gjithsej
            </p>

            <p className="mt-3 text-2xl font-bold text-slate-950">
              {lek(
                data?.summary.totalLek ?? 0
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Regjistrime
            </p>

            <p className="mt-3 text-2xl font-bold text-slate-950">
              {data?.summary.count ?? 0}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
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
                className="h-11 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm outline-none"
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
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"
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
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white"
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
          <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <Loader2 className="h-7 w-7 animate-spin text-slate-500" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
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
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-950">
                          {expense.title}
                        </h3>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
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
                        className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
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
                        className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
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
        <span className="text-sm font-semibold text-slate-700">
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
          className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
        />
      </label>

      <label className="mt-4 block space-y-2">
        <span className="text-sm font-semibold text-slate-700">
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
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
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

      <label className="mt-4 block space-y-2">
        <span className="text-sm font-semibold text-slate-700">
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
          className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
        />
      </label>

      <label className="mt-4 block space-y-2">
        <span className="text-sm font-semibold text-slate-700">
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
          className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
        />
      </label>

      <label className="mt-4 block space-y-2">
        <span className="text-sm font-semibold text-slate-700">
          Përshkrimi
        </span>

        <input
          value={description}
          onChange={(event) =>
            setDescription(
              event.target.value
            )
          }
          className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
        />
      </label>

      <label className="mt-4 block space-y-2">
        <span className="text-sm font-semibold text-slate-700">
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
          className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
        />
      </label>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700"
        >
          Anulo
        </button>

        <button
          type="button"
          onClick={ruaj}
          disabled={saving}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white disabled:opacity-60"
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
      <p className="text-sm leading-6 text-slate-600">
        A je i sigurt që dëshiron ta fshish këtë shpenzim?
      </p>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700"
        >
          Anulo
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white disabled:opacity-60"
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
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <h2 className="text-xl font-bold text-slate-950">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
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