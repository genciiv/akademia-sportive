"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  Loader2,
  Plus,
  Pencil,
  Search,
  Trash2,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";

type Fee = {
  id: string;
  amountLek: number;
  description: string | null;
  validFrom: string;
  validUntil: string | null;
};

type Payment = {
  id: string;
  amountLek: number;
  paidAt: string;
  notes: string | null;
  chargeId: string;
};

type Charge = {
  id: string;
  title: string;
  amountLek: number;
  dueDate: string | null;
  periodMonth: number | null;
  periodYear: number | null;
  status:
    | "UNPAID"
    | "PARTIALLY_PAID"
    | "PAID"
    | "OVERDUE"
    | "CANCELLED";
  notes: string | null;
  paidLek: number;
  remainingLek: number;
  payments: Payment[];
};

type PlayerPayment = {
  player: {
    id: string;
    firstName: string;
    lastName: string;
    photo: string | null;
    position: string | null;
    jerseyNumber: number | null;
  };
  fee: Fee | null;
  summary: {
    totalCharges: number;
    totalPaid: number;
    totalRemaining: number;
  };
  charges: Charge[];
  payments: Payment[];
};

type ApiResponse = {
  summary: {
    players: number;
    playersWithFee: number;
    totalCharges: number;
    totalPaid: number;
    totalRemaining: number;
  };
  players: PlayerPayment[];
};

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
  return `${new Intl.NumberFormat("sq-AL").format(value)} Lek`;
}

function dataShqip(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const ditet = [
    "Die",
    "Hën",
    "Mar",
    "Mër",
    "Enj",
    "Pre",
    "Sht",
  ];

  return `${ditet[date.getDay()]}, ${date.getDate()} ${
    MUAJT[date.getMonth()]
  } ${date.getFullYear()} · ${String(
    date.getHours()
  ).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}
function statusi(status: Charge["status"]) {
  const labels: Record<Charge["status"], string> = {
    UNPAID: "Papaguar",
    PARTIALLY_PAID: "Pjesërisht",
    PAID: "Paguar",
    OVERDUE: "Me vonesë",
    CANCELLED: "Anuluar",
  };

  return labels[status];
}

function statusClasses(status: Charge["status"]) {
  if (status === "PAID") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "PARTIALLY_PAID") {
    return "bg-amber-50 text-amber-700";
  }

  if (status === "OVERDUE") {
    return "bg-red-50 text-red-700";
  }

  if (status === "CANCELLED") {
    return "bg-slate-100 text-slate-600";
  }

  return "bg-blue-50 text-blue-700";
}

export default function PaymentsClient() {
  const [data, setData] =
    useState<ApiResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [playerAktiv, setPlayerAktiv] =
    useState<PlayerPayment | null>(null);

  const [modalTarife, setModalTarife] =
    useState<PlayerPayment | null>(null);

  const [modalDetyrim, setModalDetyrim] =
    useState<PlayerPayment | null>(null);

  const [modalPagese, setModalPagese] =
    useState<{
      player: PlayerPayment;
      charge: Charge;
    } | null>(null);

  const [modalNdryshoPagese, setModalNdryshoPagese] =
    useState<{
      player: PlayerPayment;
      charge: Charge;
      payment: Payment;
    } | null>(null);

  const [pagesePerFshirje, setPagesePerFshirje] =
    useState<{
      charge: Charge;
      payment: Payment;
    } | null>(null);

  const [modalNdryshoDetyrim, setModalNdryshoDetyrim] =
    useState<{
      player: PlayerPayment;
      charge: Charge;
    } | null>(null);

  const [detyrimPerFshirje, setDetyrimPerFshirje] =
    useState<Charge | null>(null);

  const [dukeFshire, setDukeFshire] =
    useState(false);

  async function ngarko() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/payments",
        {
          cache: "no-store",
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Pagesat nuk u ngarkuan."
        );
      }

      setData(result);

      if (playerAktiv) {
        const next =
          result.players.find(
            (item: PlayerPayment) =>
              item.player.id ===
              playerAktiv.player.id
          ) ?? null;

        setPlayerAktiv(next);
      }
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

  const players = useMemo(() => {
    if (!data) {
      return [];
    }

    const query =
      search.trim().toLowerCase();

    if (!query) {
      return data.players;
    }

    return data.players.filter(
      (item) =>
        `${item.player.firstName} ${item.player.lastName}`
          .toLowerCase()
          .includes(query)
    );
  }, [data, search]);

  return (
    <AppShell>
      <PageHeader
        title="Pagesat"
        description="Menaxhimi manual i tarifave dhe pagesave në dorë, në Lek."
      />

      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Sportistë"
            value={String(
              data?.summary.players ?? 0
            )}
            icon={
              <UserRound className="h-5 w-5" />
            }
          />

          <StatCard
            title="Me tarifë"
            value={String(
              data?.summary.playersWithFee ??
                0
            )}
            icon={
              <WalletCards className="h-5 w-5" />
            }
          />

          <StatCard
            title="Të arkëtuara"
            value={lek(
              data?.summary.totalPaid ?? 0
            )}
            icon={
              <Banknote className="h-5 w-5" />
            }
          />

          <StatCard
            title="Të mbetura"
            value={lek(
              data?.summary.totalRemaining ??
                0
            )}
            icon={
              <CircleDollarSign className="h-5 w-5" />
            }
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Kërko sportistin..."
              className="h-11 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-slate-400"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <Loader2 className="h-7 w-7 animate-spin text-slate-500" />
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {players.map((item) => (
              <button
                key={item.player.id}
                type="button"
                onClick={() =>
                  setPlayerAktiv(item)
                }
                className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-950">
                      {item.player.firstName}{" "}
                      {item.player.lastName}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {item.player.position ||
                        "Pa pozicion"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-500">
                      Tarifa
                    </p>

                    <p className="mt-1 font-bold text-slate-950">
                      {item.fee
                        ? lek(
                            item.fee
                              .amountLek
                          )
                        : "Pa tarifë"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <MiniStat
                    label="Detyrime"
                    value={lek(
                      item.summary
                        .totalCharges
                    )}
                  />

                  <MiniStat
                    label="Paguar"
                    value={lek(
                      item.summary
                        .totalPaid
                    )}
                  />

                  <MiniStat
                    label="Mbetur"
                    value={lek(
                      item.summary
                        .totalRemaining
                    )}
                  />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {playerAktiv && (
        <PlayerDetails
          item={playerAktiv}
          onClose={() =>
            setPlayerAktiv(null)
          }
          onFee={() =>
            setModalTarife(
              playerAktiv
            )
          }
          onCharge={() =>
            setModalDetyrim(
              playerAktiv
            )
          }
          onPayment={(charge) =>
            setModalPagese({
              player:
                playerAktiv,
              charge,
            })
          }
          onEditPayment={(charge, payment) =>
            setModalNdryshoPagese({
              player: playerAktiv,
              charge,
              payment,
            })
          }
          onDeletePayment={(charge, payment) =>
            setPagesePerFshirje({
              charge,
              payment,
            })
          }
          onEditCharge={(charge) =>
            setModalNdryshoDetyrim({
              player: playerAktiv,
              charge,
            })
          }
          onDeleteCharge={(charge) =>
            setDetyrimPerFshirje(charge)
          }
        />
      )}

      {modalTarife && (
        <FeeModal
          player={modalTarife}
          onClose={() =>
            setModalTarife(null)
          }
          onSaved={() => {
            setModalTarife(null);
            ngarko();
          }}
        />
      )}

      {modalDetyrim && (
        <ChargeModal
          player={modalDetyrim}
          onClose={() =>
            setModalDetyrim(null)
          }
          onSaved={() => {
            setModalDetyrim(null);
            ngarko();
          }}
        />
      )}

      {modalPagese && (
        <CashModal
          player={modalPagese.player}
          charge={modalPagese.charge}
          onClose={() =>
            setModalPagese(null)
          }
          onSaved={() => {
            setModalPagese(null);
            ngarko();
          }}
        />
      )}

      {modalNdryshoPagese && (
        <EditPaymentModal
          charge={modalNdryshoPagese.charge}
          payment={modalNdryshoPagese.payment}
          onClose={() =>
            setModalNdryshoPagese(null)
          }
          onSaved={() => {
            setModalNdryshoPagese(null);
            ngarko();
          }}
        />
      )}

      {modalNdryshoDetyrim && (
        <EditChargeModal
          charge={modalNdryshoDetyrim.charge}
          onClose={() =>
            setModalNdryshoDetyrim(null)
          }
          onSaved={() => {
            setModalNdryshoDetyrim(null);
            ngarko();
          }}
        />
      )}

      {detyrimPerFshirje && (
        <ConfirmModal
          title="Fshi detyrimin"
          description={
            detyrimPerFshirje.payments.length > 0
              ? "Ky detyrim ka pagesa të lidhura. Fshi fillimisht pagesat e regjistruara."
              : `A je i sigurt që dëshiron të fshish detyrimin "${detyrimPerFshirje.title}"?`
          }
          confirmLabel="Fshi detyrimin"
          loading={dukeFshire}
          onClose={() =>
            setDetyrimPerFshirje(null)
          }
          onConfirm={async () => {
            if (
              detyrimPerFshirje.payments.length > 0
            ) {
              setError(
                "Fshi fillimisht pagesat e lidhura me këtë detyrim."
              );
              setDetyrimPerFshirje(null);
              return;
            }

            setDukeFshire(true);

            try {
              const response = await fetch(
                `/api/payments/charges/${detyrimPerFshirje.id}`,
                {
                  method: "DELETE",
                }
              );

              const result =
                await response.json();

              if (!response.ok) {
                throw new Error(
                  result.error ||
                    "Detyrimi nuk u fshi."
                );
              }

              setDetyrimPerFshirje(null);
              await ngarko();
            } catch (error) {
              setError(
                error instanceof Error
                  ? error.message
                  : "Ndodhi një gabim."
              );
            } finally {
              setDukeFshire(false);
            }
          }}
        />
      )}
      {pagesePerFshirje && (
        <ConfirmModal
          title="Fshi pagesën"
          description={`A je i sigurt që dëshiron të fshish pagesën prej ${lek(
            pagesePerFshirje.payment.amountLek
          )}? Totali dhe statusi i detyrimit do të rillogariten automatikisht.`}
          confirmLabel="Fshi pagesën"
          loading={dukeFshire}
          onClose={() =>
            setPagesePerFshirje(null)
          }
          onConfirm={async () => {
            setDukeFshire(true);

            try {
              const response = await fetch(
                `/api/payments/cash/${pagesePerFshirje.payment.id}`,
                {
                  method: "DELETE",
                }
              );

              const result = await response.json();

              if (!response.ok) {
                throw new Error(
                  result.error ||
                    "Pagesa nuk u fshi."
                );
              }

              setPagesePerFshirje(null);
              await ngarko();
            } catch (error) {
              setError(
                error instanceof Error
                  ? error.message
                  : "Ndodhi një gabim."
              );
            } finally {
              setDukeFshire(false);
            }
          }}
        />
      )}
    </AppShell>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-500">
          {title}
        </p>

        <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
          {icon}
        </div>
      </div>

      <p className="mt-3 text-2xl font-bold text-slate-950">
        {value}
      </p>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs font-semibold text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function PlayerDetails({
  item,
  onClose,
  onFee,
  onCharge,
  onPayment,
  onEditPayment,
  onDeletePayment,
  onEditCharge,
  onDeleteCharge,
}: {
  item: PlayerPayment;
  onClose: () => void;
  onFee: () => void;
  onCharge: () => void;
  onPayment: (
    charge: Charge
  ) => void;
  onEditPayment: (
    charge: Charge,
    payment: Payment
  ) => void;
  onDeletePayment: (
    charge: Charge,
    payment: Payment
  ) => void;
  onEditCharge: (
    charge: Charge
  ) => void;
  onDeleteCharge: (
    charge: Charge
  ) => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-slate-950/30 backdrop-blur-sm">
      <div className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              {item.player.firstName}{" "}
              {item.player.lastName}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Menaxhimi i pagesave
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Mbyll"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="grid grid-cols-3 gap-3">
            <MiniStat
              label="Detyrime"
              value={lek(
                item.summary
                  .totalCharges
              )}
            />

            <MiniStat
              label="Paguar"
              value={lek(
                item.summary.totalPaid
              )}
            />

            <MiniStat
              label="Mbetur"
              value={lek(
                item.summary
                  .totalRemaining
              )}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-500">
              Tarifa aktuale
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-950">
              {item.fee
                ? lek(
                    item.fee.amountLek
                  )
                : "Nuk është caktuar"}
            </p>

            {item.fee?.description && (
              <p className="mt-2 text-sm text-slate-600">
                {
                  item.fee
                    .description
                }
              </p>
            )}

            <button
              type="button"
              onClick={onFee}
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" />
              Cakto tarifën
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-950">
                Detyrimet
              </h3>

              <button
                type="button"
                onClick={onCharge}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                Shto detyrim
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {item.charges.length ===
                0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500">
                  Nuk ka detyrime të regjistruara.
                </div>
              )}

              {item.charges.map(
                (charge) => (
                  <div
                    key={charge.id}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-950">
                          {
                            charge.title
                          }
                        </p>

                        {charge.periodMonth &&
                          charge.periodYear && (
                            <p className="mt-1 text-xs text-slate-500">
                              {
                                MUAJT[
                                  charge.periodMonth -
                                    1
                                ]
                              }{" "}
                              {
                                charge.periodYear
                              }
                            </p>
                          )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClasses(
                            charge.status
                          )}`}
                        >
                          {statusi(
                            charge.status
                          )}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            onEditCharge(charge)
                          }
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                          aria-label="Ndrysho detyrimin"
                          title="Ndrysho detyrimin"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onDeleteCharge(charge)
                          }
                          className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                          aria-label="Fshi detyrimin"
                          title="Fshi detyrimin"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <MiniStat
                        label="Shuma"
                        value={lek(
                          charge.amountLek
                        )}
                      />

                      <MiniStat
                        label="Paguar"
                        value={lek(
                          charge.paidLek
                        )}
                      />

                      <MiniStat
                        label="Mbetur"
                        value={lek(
                          charge.remainingLek
                        )}
                      />
                    </div>

                    {charge.remainingLek >
                      0 &&
                      charge.status !==
                        "CANCELLED" && (
                        <button
                          type="button"
                          onClick={() =>
                            onPayment(
                              charge
                            )
                          }
                          className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                          <Banknote className="h-4 w-4" />
                          Regjistro pagesë në dorë
                        </button>
                      )}

                    {charge.status ===
                      "PAID" && (
                      <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Paguar plotësisht
                      </div>
                    )}

                    {charge.payments.length > 0 && (
                      <div className="mt-4 border-t border-slate-100 pt-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Pagesat e regjistruara
                        </p>

                        <div className="mt-3 space-y-2">
                          {[...charge.payments]
                            .sort(
                              (a, b) =>
                                new Date(b.paidAt).getTime() -
                                new Date(a.paidAt).getTime()
                            )
                            .map((payment) => (
                              <div
                                key={payment.id}
                                className="rounded-xl bg-emerald-50/60 p-3"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-bold text-emerald-900">
                                      {lek(payment.amountLek)}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                      {dataShqip(payment.paidAt)}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                                      Në dorë
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        onEditPayment(
                                          charge,
                                          payment
                                        )
                                      }
                                      className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
                                      aria-label="Ndrysho pagesën"
                                      title="Ndrysho pagesën"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        onDeletePayment(
                                          charge,
                                          payment
                                        )
                                      }
                                      className="rounded-lg border border-red-200 bg-white p-2 text-red-600 hover:bg-red-50"
                                      aria-label="Fshi pagesën"
                                      title="Fshi pagesën"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {payment.notes && (
                                  <p className="mt-2 text-xs leading-5 text-slate-600">
                                    {payment.notes}
                                  </p>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-950">
                  Historiku i pagesave
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Të gjitha pagesat në dorë të regjistruara për sportistin.
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {item.payments.length} pagesa
              </span>
            </div>

            {item.payments.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500">
                Nuk ka pagesa të regjistruara.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {[...item.payments]
                  .sort(
                    (a, b) =>
                      new Date(b.paidAt).getTime() -
                      new Date(a.paidAt).getTime()
                  )
                  .map((payment) => {
                    const charge = item.charges.find(
                      (itemCharge) =>
                        itemCharge.id === payment.chargeId
                    );

                    return (
                      <div
                        key={payment.id}
                        className="rounded-2xl border border-slate-200 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-lg font-bold text-slate-950">
                              {lek(payment.amountLek)}
                            </p>

                            <p className="mt-1 text-sm font-semibold text-slate-700">
                              {charge?.title || "Detyrim"}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {dataShqip(payment.paidAt)}
                            </p>
                          </div>

                          <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
                            <Banknote className="h-5 w-5" />
                          </div>
                        </div>

                        {payment.notes && (
                          <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2">
                            <p className="text-xs font-semibold text-slate-500">
                              Shënime
                            </p>

                            <p className="mt-1 text-sm text-slate-700">
                              {payment.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeeModal({
  player,
  onClose,
  onSaved,
}: {
  player: PlayerPayment;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] =
    useState(
      player.fee
        ? String(
            player.fee.amountLek
          )
        : ""
    );

  const [description, setDescription] =
    useState(
      player.fee?.description ?? ""
    );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  async function ruaj() {
    const amountLek = Number(amount);

    if (
      !Number.isInteger(amountLek) ||
      amountLek <= 0
    ) {
      setError(
        "Vendos një shumë të vlefshme në Lek."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        "/api/payments/fees",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            playerId:
              player.player.id,
            amountLek,
            description,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Tarifa nuk u ruajt."
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
      title="Cakto tarifën"
      onClose={onClose}
    >
      <p className="mb-4 text-sm text-slate-500">
        {player.player.firstName}{" "}
        {player.player.lastName}
      </p>

      {error && (
        <ErrorBox text={error} />
      )}

      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-700">
          Tarifa në Lek
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
          className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
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
          placeholder="P.sh. Tarifa mujore"
          className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
        />
      </label>

      <ModalActions
        saving={saving}
        onClose={onClose}
        onSave={ruaj}
        saveLabel="Ruaj tarifën"
      />
    </Modal>
  );
}

function ChargeModal({
  player,
  onClose,
  onSaved,
}: {
  player: PlayerPayment;
  onClose: () => void;
  onSaved: () => void;
}) {
  const now = new Date();

  const [title, setTitle] =
    useState(
      `Pagesa ${
        MUAJT[now.getMonth()]
      } ${now.getFullYear()}`
    );

  const [amount, setAmount] =
    useState(
      player.fee
        ? String(
            player.fee.amountLek
          )
        : ""
    );

  const [month, setMonth] =
    useState(
      String(now.getMonth() + 1)
    );

  const [year, setYear] =
    useState(
      String(now.getFullYear())
    );

  const [dueDate, setDueDate] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  async function ruaj() {
    const amountLek = Number(amount);

    if (
      !Number.isInteger(amountLek) ||
      amountLek <= 0
    ) {
      setError(
        "Vendos një shumë të vlefshme në Lek."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        "/api/payments/charges",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            playerId:
              player.player.id,
            title,
            amountLek,
            periodMonth:
              Number(month),
            periodYear:
              Number(year),
            dueDate: dueDate
              ? new Date(
                  `${dueDate}T12:00:00`
                ).toISOString()
              : null,
            notes,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Detyrimi nuk u ruajt."
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
      title="Shto detyrim"
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
          className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
        />
      </label>

      <label className="mt-4 block space-y-2">
        <span className="text-sm font-semibold text-slate-700">
          Shuma në Lek
        </span>

        <input
          type="number"
          min="1"
          value={amount}
          onChange={(event) =>
            setAmount(
              event.target.value
            )
          }
          className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
        />
      </label>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">
            Muaji
          </span>

          <select
            value={month}
            onChange={(event) =>
              setMonth(
                event.target.value
              )
            }
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
          >
            {MUAJT.map(
              (muaj, index) => (
                <option
                  key={muaj}
                  value={index + 1}
                >
                  {muaj}
                </option>
              )
            )}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">
            Viti
          </span>

          <input
            type="number"
            value={year}
            onChange={(event) =>
              setYear(
                event.target.value
              )
            }
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
          />
        </label>
      </div>

      <label className="mt-4 block space-y-2">
        <span className="text-sm font-semibold text-slate-700">
          Afati i pagesës
        </span>

        <input
          type="date"
          value={dueDate}
          onChange={(event) =>
            setDueDate(
              event.target.value
            )
          }
          className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
        />
      </label>

      <ModalActions
        saving={saving}
        onClose={onClose}
        onSave={ruaj}
        saveLabel="Ruaj detyrimin"
      />
    </Modal>
  );
}

function CashModal({
  player,
  charge,
  onClose,
  onSaved,
}: {
  player: PlayerPayment;
  charge: Charge;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] =
    useState(
      String(charge.remainingLek)
    );

  const [notes, setNotes] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  async function ruaj() {
    const amountLek = Number(amount);

    if (
      !Number.isInteger(amountLek) ||
      amountLek <= 0
    ) {
      setError(
        "Vendos një shumë të vlefshme në Lek."
      );
      return;
    }

    if (
      amountLek >
      charge.remainingLek
    ) {
      setError(
        `Mund të regjistrosh maksimumi ${lek(
          charge.remainingLek
        )}.`
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        "/api/payments/cash",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            chargeId: charge.id,
            amountLek,
            notes,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Pagesa nuk u regjistrua."
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
      title="Regjistro pagesë në dorë"
      onClose={onClose}
    >
      <p className="text-sm text-slate-500">
        {player.player.firstName}{" "}
        {player.player.lastName}
      </p>

      <p className="mt-1 font-semibold text-slate-950">
        {charge.title}
      </p>

      <div className="mt-4 rounded-xl bg-slate-50 p-3">
        <p className="text-xs font-semibold text-slate-500">
          Shuma e mbetur
        </p>

        <p className="mt-1 text-lg font-bold text-slate-950">
          {lek(
            charge.remainingLek
          )}
        </p>
      </div>

      {error && (
        <div className="mt-4">
          <ErrorBox text={error} />
        </div>
      )}

      <label className="mt-4 block space-y-2">
        <span className="text-sm font-semibold text-slate-700">
          Shuma e marrë në dorë
        </span>

        <input
          type="number"
          min="1"
          max={
            charge.remainingLek
          }
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

      <ModalActions
        saving={saving}
        onClose={onClose}
        onSave={ruaj}
        saveLabel="Regjistro pagesën"
      />
    </Modal>
  );
}

function EditChargeModal({
  charge,
  onClose,
  onSaved,
}: {
  charge: Charge;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] =
    useState(charge.title);

  const [amount, setAmount] =
    useState(
      String(charge.amountLek)
    );

  const [month, setMonth] =
    useState(
      charge.periodMonth
        ? String(charge.periodMonth)
        : ""
    );

  const [year, setYear] =
    useState(
      charge.periodYear
        ? String(charge.periodYear)
        : ""
    );

  const [notes, setNotes] =
    useState(
      charge.notes ?? ""
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

    if (
      amountLek <
      charge.paidLek
    ) {
      setError(
        `Shuma nuk mund të jetë më e vogël se ${lek(
          charge.paidLek
        )} që janë paguar tashmë.`
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `/api/payments/charges/${charge.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            amountLek,
            periodMonth:
              month
                ? Number(month)
                : null,
            periodYear:
              year
                ? Number(year)
                : null,
            notes,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Detyrimi nuk u ndryshua."
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
      title="Ndrysho detyrimin"
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
          className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
        />
      </label>

      <label className="mt-4 block space-y-2">
        <span className="text-sm font-semibold text-slate-700">
          Shuma në Lek
        </span>

        <input
          type="number"
          min={charge.paidLek || 1}
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

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">
            Muaji
          </span>

          <select
            value={month}
            onChange={(event) =>
              setMonth(
                event.target.value
              )
            }
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="">
              Pa muaj
            </option>

            {MUAJT.map(
              (muaj, index) => (
                <option
                  key={muaj}
                  value={index + 1}
                >
                  {muaj}
                </option>
              )
            )}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">
            Viti
          </span>

          <input
            type="number"
            value={year}
            onChange={(event) =>
              setYear(
                event.target.value
              )
            }
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
          />
        </label>
      </div>

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

      <ModalActions
        saving={saving}
        onClose={onClose}
        onSave={ruaj}
        saveLabel="Ruaj ndryshimet"
      />
    </Modal>
  );
}
function EditPaymentModal({
  charge,
  payment,
  onClose,
  onSaved,
}: {
  charge: Charge;
  payment: Payment;
  onClose: () => void;
  onSaved: () => void;
}) {
  const otherPaidLek =
    charge.payments
      .filter(
        (item) =>
          item.id !== payment.id
      )
      .reduce(
        (sum, item) =>
          sum + item.amountLek,
        0
      );

  const maksimumi =
    charge.amountLek -
    otherPaidLek;

  const [amount, setAmount] =
    useState(
      String(payment.amountLek)
    );

  const [notes, setNotes] =
    useState(
      payment.notes ?? ""
    );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  async function ruaj() {
    const amountLek =
      Number(amount);

    if (
      !Number.isInteger(amountLek) ||
      amountLek <= 0
    ) {
      setError(
        "Vendos një shumë të vlefshme në Lek."
      );
      return;
    }

    if (amountLek > maksimumi) {
      setError(
        `Shuma mund të jetë maksimumi ${lek(
          maksimumi
        )}.`
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `/api/payments/cash/${payment.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            amountLek,
            notes,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Pagesa nuk u ndryshua."
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
      title="Ndrysho pagesën"
      onClose={onClose}
    >
      <div className="rounded-xl bg-slate-50 p-3">
        <p className="text-xs font-semibold text-slate-500">
          Detyrimi
        </p>

        <p className="mt-1 font-bold text-slate-950">
          {charge.title}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          Maksimumi i lejuar:{" "}
          {lek(maksimumi)}
        </p>
      </div>

      {error && (
        <div className="mt-4">
          <ErrorBox text={error} />
        </div>
      )}

      <label className="mt-4 block space-y-2">
        <span className="text-sm font-semibold text-slate-700">
          Shuma në Lek
        </span>

        <input
          type="number"
          min="1"
          max={maksimumi}
          step="1"
          value={amount}
          onChange={(event) =>
            setAmount(
              event.target.value
            )
          }
          className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
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
          className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none"
        />
      </label>

      <ModalActions
        saving={saving}
        onClose={onClose}
        onSave={ruaj}
        saveLabel="Ruaj ndryshimet"
      />
    </Modal>
  );
}

function ConfirmModal({
  title,
  description,
  confirmLabel,
  loading,
  onClose,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      title={title}
      onClose={onClose}
    >
      <p className="text-sm leading-6 text-slate-600">
        {description}
      </p>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Anulo
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}

          {confirmLabel}
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

function ModalActions({
  saving,
  onClose,
  onSave,
  saveLabel,
}: {
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  saveLabel: string;
}) {
  return (
    <div className="mt-6 flex justify-end gap-3">
      <button
        type="button"
        onClick={onClose}
        disabled={saving}
        className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        Anulo
      </button>

      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {saving && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}

        {saveLabel}
      </button>
    </div>
  );
}

function ErrorBox({
  text,
}: {
  text: string;
}) {
  return (
    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
      {text}
    </div>
  );
}