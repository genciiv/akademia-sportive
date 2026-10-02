"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ContactRound,
  HeartHandshake,
  Link2,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Star,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";

type Player = {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
};

type PlayerLink = {
  id: string;
  playerId: string;
  guardianId: string;
  relationship: string | null;
  isPrimary: boolean;
  player: Player;
};

type Guardian = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  players: PlayerLink[];
};

type ApiResponse = {
  guardians: Guardian[];
  players: Player[];
  summary: {
    guardians: number;
    linkedPlayers: number;
  };
};

type PlayerFormLink = {
  playerId: string;
  relationship: string;
  isPrimary: boolean;
};

const MARREDHENIET = [
  "Nënë",
  "Baba",
  "Prind",
  "Kujdestar",
  "Vëlla",
  "Motër",
  "Gjysh",
  "Gjyshe",
  "Tjetër",
];

export default function GuardiansClient() {
  const [data, setData] =
    useState<ApiResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [modalGuardian, setModalGuardian] =
    useState<Guardian | "NEW" | null>(
      null
    );

  const [
    guardianPerFshirje,
    setGuardianPerFshirje,
  ] = useState<Guardian | null>(null);

  const [deleting, setDeleting] =
    useState(false);

  async function ngarko() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/guardians",
        {
          cache: "no-store",
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Kujdestarët nuk u ngarkuan."
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

  const guardians = useMemo(() => {
    if (!data) {
      return [];
    }

    const query =
      search.trim().toLowerCase();

    if (!query) {
      return data.guardians;
    }

    return data.guardians.filter(
      (guardian) => {
        const guardianText = [
          guardian.firstName,
          guardian.lastName,
          guardian.phone ?? "",
          guardian.email ?? "",
        ]
          .join(" ")
          .toLowerCase();

        const playersText =
          guardian.players
            .map(
              (link) =>
                `${link.player.firstName} ${link.player.lastName}`
            )
            .join(" ")
            .toLowerCase();

        return (
          guardianText.includes(
            query
          ) ||
          playersText.includes(
            query
          )
        );
      }
    );
  }, [data, search]);

  const totalLinks =
    data?.guardians.reduce(
      (total, guardian) =>
        total + guardian.players.length,
      0
    ) ?? 0;

  const primaryLinks =
    data?.guardians.reduce(
      (total, guardian) =>
        total +
        guardian.players.filter(
          (link) => link.isPrimary
        ).length,
      0
    ) ?? 0;

  return (
    <AppShell>
      <section className="relative mb-5 overflow-hidden rounded-[28px] border border-violet-100 bg-gradient-to-br from-violet-50 via-fuchsia-50/60 to-blue-50 p-5 shadow-sm sm:p-6">
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-violet-200/30 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm ring-1 ring-violet-100">
              <HeartHandshake className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Kujdestarët
              </h1>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                Menaxho prindërit, kujdestarët dhe lidhjet e tyre me sportistët e akademisë.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setModalGuardian("NEW")
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700"
          >
            <Plus className="h-4 w-4" />
            Shto kujdestar
          </button>
        </div>
      </section>

      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Kujdestarë"
            value={String(
              data?.summary.guardians ?? 0
            )}
            description="Profile të regjistruara"
            icon={ContactRound}
            tone="violet"
          />

          <SummaryCard
            title="Sportistë të lidhur"
            value={String(
              data?.summary.linkedPlayers ?? 0
            )}
            description="Sportistë me kujdestar"
            icon={UsersRound}
            tone="blue"
          />

          <SummaryCard
            title="Lidhje totale"
            value={String(totalLinks)}
            description="Lidhje kujdestar–sportist"
            icon={Link2}
            tone="emerald"
          />

          <SummaryCard
            title="Kujdestarë kryesorë"
            value={String(primaryLinks)}
            description="Lidhje të shënuara kryesore"
            icon={Star}
            tone="amber"
          />
        </div>

        <div className="flex flex-col gap-3 rounded-[22px] border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Kërko kujdestarin ose sportistin..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-50"
            />
          </div>

          <div className="shrink-0 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
            {guardians.length} nga{" "}
            {data?.guardians.length ?? 0} kujdestarë
          </div>
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
        ) : guardians.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <ContactRound className="mx-auto h-8 w-8 text-slate-400" />

            <p className="mt-3 font-semibold text-slate-700">
              Nuk ka kujdestarë për t'u shfaqur.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {guardians.map(
              (guardian) => (
                <GuardianCard
                  key={guardian.id}
                  guardian={guardian}
                  onEdit={() =>
                    setModalGuardian(
                      guardian
                    )
                  }
                  onDelete={() =>
                    setGuardianPerFshirje(
                      guardian
                    )
                  }
                />
              )
            )}
          </div>
        )}
      </div>

      {modalGuardian && data && (
        <GuardianModal
          guardian={
            modalGuardian === "NEW"
              ? null
              : modalGuardian
          }
          players={data.players}
          onClose={() =>
            setModalGuardian(null)
          }
          onSaved={() => {
            setModalGuardian(null);
            ngarko();
          }}
        />
      )}

      {guardianPerFshirje && (
        <ConfirmModal
          loading={deleting}
          onClose={() =>
            setGuardianPerFshirje(
              null
            )
          }
          onConfirm={async () => {
            setDeleting(true);
            setError("");

            try {
              const response = await fetch(
                `/api/guardians/${guardianPerFshirje.id}`,
                {
                  method: "DELETE",
                }
              );

              const result =
                await response.json();

              if (!response.ok) {
                throw new Error(
                  result.error ||
                    "Kujdestari nuk u fshi."
                );
              }

              setGuardianPerFshirje(
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

function GuardianCard({
  guardian,
  onEdit,
  onDelete,
}: {
  guardian: Guardian;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="group overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-violet-50/70 via-white to-blue-50/50 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm ring-1 ring-violet-100">
            <ContactRound className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-bold text-slate-950">
              {guardian.firstName}{" "}
              {guardian.lastName}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {guardian.players.length}{" "}
              {guardian.players.length === 1
                ? "sportist i lidhur"
                : "sportistë të lidhur"}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
            aria-label="Ndrysho kujdestarin"
            title="Ndrysho kujdestarin"
          >
            <Pencil className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
            aria-label="Fshi kujdestarin"
            title="Fshi kujdestarin"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-2">
        <InfoBox
          label="Telefoni"
          value={
            guardian.phone || "-"
          }
        />

        <InfoBox
          label="Posta elektronike"
          value={
            guardian.email || "-"
          }
        />
      </div>

      {guardian.address && (
        <p className="mx-5 mb-1 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
          <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="font-semibold">
            Adresa:
          </span>{" "}
          {guardian.address}
        </p>
      )}

      {guardian.players.length >
        0 && (
        <div className="mx-5 mb-5 mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Sportistët
          </p>

          <div className="mt-3 space-y-2">
            {guardian.players.map(
              (link) => (
                <div
                  key={link.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100"
                >
                  <div className="flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-slate-500" />

                    <span className="text-sm font-semibold text-slate-800">
                      {
                        link.player
                          .firstName
                      }{" "}
                      {
                        link.player
                          .lastName
                      }
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {link.relationship && (
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {
                          link.relationship
                        }
                      </span>
                    )}

                    {link.isPrimary && (
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        Kujdestar kryesor
                      </span>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {guardian.notes && (
        <p className="mx-5 mb-5 rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2.5 text-xs leading-5 text-slate-600">
          Shënim: {guardian.notes}
        </p>
      )}
    </article>
  );
}

function GuardianModal({
  guardian,
  players,
  onClose,
  onSaved,
}: {
  guardian: Guardian | null;
  players: Player[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [firstName, setFirstName] =
    useState(
      guardian?.firstName ?? ""
    );

  const [lastName, setLastName] =
    useState(
      guardian?.lastName ?? ""
    );

  const [phone, setPhone] =
    useState(
      guardian?.phone ?? ""
    );

  const [email, setEmail] =
    useState(
      guardian?.email ?? ""
    );

  const [address, setAddress] =
    useState(
      guardian?.address ?? ""
    );

  const [notes, setNotes] =
    useState(
      guardian?.notes ?? ""
    );

  const [
    selectedPlayers,
    setSelectedPlayers,
  ] = useState<PlayerFormLink[]>(
    guardian?.players.map(
      (link) => ({
        playerId:
          link.playerId,
        relationship:
          link.relationship ?? "",
        isPrimary:
          link.isPrimary,
      })
    ) ?? []
  );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  function togglePlayer(
    playerId: string
  ) {
    setSelectedPlayers(
      (current) => {
        const exists =
          current.some(
            (item) =>
              item.playerId ===
              playerId
          );

        if (exists) {
          return current.filter(
            (item) =>
              item.playerId !==
              playerId
          );
        }

        return [
          ...current,
          {
            playerId,
            relationship: "",
            isPrimary: false,
          },
        ];
      }
    );
  }

  function updatePlayer(
    playerId: string,
    patch: Partial<PlayerFormLink>
  ) {
    setSelectedPlayers(
      (current) =>
        current.map(
          (item) =>
            item.playerId ===
            playerId
              ? {
                  ...item,
                  ...patch,
                }
              : item
        )
    );
  }

  async function ruaj() {
    if (!firstName.trim()) {
      setError(
        "Emri është i detyrueshëm."
      );
      return;
    }

    if (!lastName.trim()) {
      setError(
        "Mbiemri është i detyrueshëm."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        guardian
          ? `/api/guardians/${guardian.id}`
          : "/api/guardians",
        {
          method: guardian
            ? "PATCH"
            : "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            firstName:
              firstName.trim(),
            lastName:
              lastName.trim(),
            phone,
            email,
            address,
            notes,
            players:
              selectedPlayers,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Kujdestari nuk u ruajt."
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
        guardian
          ? "Ndrysho kujdestarin"
          : "Shto kujdestar"
      }
      onClose={onClose}
    >
      {error && (
        <ErrorBox text={error} />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Emri"
          value={firstName}
          onChange={setFirstName}
        />

        <Field
          label="Mbiemri"
          value={lastName}
          onChange={setLastName}
        />

        <Field
          label="Telefoni"
          value={phone}
          onChange={setPhone}
        />

        <Field
          label="Posta elektronike"
          value={email}
          onChange={setEmail}
          type="email"
        />
      </div>

      <label className="mt-4 block space-y-2">
        <span className="text-sm font-semibold text-slate-700">
          Adresa
        </span>

        <input
          value={address}
          onChange={(event) =>
            setAddress(
              event.target.value
            )
          }
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-50"
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
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-50"
        />
      </label>

      <div className="mt-6 border-t border-slate-200 pt-5">
        <h3 className="font-bold text-slate-950">
          Lidhja me sportistët
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Zgjidh një ose disa sportistë që lidhen me këtë kujdestar.
        </p>

        {players.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
            Nuk ka sportistë të regjistruar.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {players.map(
              (player) => {
                const selected =
                  selectedPlayers.find(
                    (item) =>
                      item.playerId ===
                      player.id
                  );

                return (
                  <div
                    key={player.id}
                    className={`rounded-2xl border p-4 transition ${selected ? "border-violet-200 bg-violet-50/50 ring-2 ring-violet-100" : "border-slate-200 bg-white hover:border-violet-200"}`}
                  >
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={
                          Boolean(
                            selected
                          )
                        }
                        onChange={() =>
                          togglePlayer(
                            player.id
                          )
                        }
                        className="h-4 w-4"
                      />

                      <span className="font-semibold text-slate-800">
                        {
                          player.firstName
                        }{" "}
                        {
                          player.lastName
                        }
                      </span>
                    </label>

                    {selected && (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <label className="space-y-2">
                          <span className="text-xs font-semibold text-slate-600">
                            Lidhja familjare
                          </span>

                          <select
                            value={
                              selected.relationship
                            }
                            onChange={(
                              event
                            ) =>
                              updatePlayer(
                                player.id,
                                {
                                  relationship:
                                    event
                                      .target
                                      .value,
                                }
                              )
                            }
                            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                          >
                            <option value="">
                              Pa përcaktuar
                            </option>

                            {MARREDHENIET.map(
                              (
                                item
                              ) => (
                                <option
                                  key={
                                    item
                                  }
                                  value={
                                    item
                                  }
                                >
                                  {item}
                                </option>
                              )
                            )}
                          </select>
                        </label>

                        <label className="flex items-end gap-2 pb-2">
                          <input
                            type="checkbox"
                            checked={
                              selected.isPrimary
                            }
                            onChange={(
                              event
                            ) =>
                              updatePlayer(
                                player.id,
                                {
                                  isPrimary:
                                    event
                                      .target
                                      .checked,
                                }
                              )
                            }
                            className="h-4 w-4"
                          />

                          <span className="text-sm font-semibold text-slate-700">
                            Kujdestar kryesor
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

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
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-60"
        >
          {saving && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}

          {guardian
            ? "Ruaj ndryshimet"
            : "Ruaj kujdestarin"}
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
      title="Fshi kujdestarin"
      onClose={onClose}
    >
      <p className="text-sm leading-6 text-slate-600">
        A je i sigurt që dëshiron ta fshish këtë kujdestar? Lidhjet me sportistët do të hiqen gjithashtu.
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

          Fshi kujdestarin
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
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-violet-100 bg-gradient-to-r from-violet-50 via-white to-blue-50 px-6 py-5">
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

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  tone:
    | "violet"
    | "blue"
    | "emerald"
    | "amber";
}) {
  const styles = {
    violet: {
      card: "border-violet-100 bg-violet-50/70",
      icon: "text-violet-600 ring-violet-100",
    },
    blue: {
      card: "border-blue-100 bg-blue-50/70",
      icon: "text-blue-600 ring-blue-100",
    },
    emerald: {
      card: "border-emerald-100 bg-emerald-50/70",
      icon: "text-emerald-600 ring-emerald-100",
    },
    amber: {
      card: "border-amber-100 bg-amber-50/70",
      icon: "text-amber-600 ring-amber-100",
    },
  } as const;

  const style =
    styles[tone];

  return (
    <div
      className={`rounded-[22px] border p-4 shadow-sm sm:p-5 ${style.card}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-2xl font-black text-slate-950">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ${style.icon}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const Icon =
    label === "Telefoni"
      ? Phone
      : Mail;

  return (
    <div className="rounded-2xl bg-slate-50 p-3.5">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon className="h-3.5 w-3.5" />

        <p className="text-[11px] font-bold uppercase tracking-wide">
          {label}
        </p>
      </div>

      <p className="mt-2 break-words text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-50"
      />
    </label>
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
