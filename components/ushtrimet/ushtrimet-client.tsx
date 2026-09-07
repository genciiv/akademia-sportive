"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Clock3,
  Dumbbell,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  Trash2,
  X,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";

type DrillDifficulty = "EASY" | "MEDIUM" | "HARD";

type Drill = {
  id: string;
  name: string;
  category: string | null;
  sport: string | null;
  objective: string | null;
  durationMin: number | null;
  difficulty: DrillDifficulty;
  equipment: string | null;
  description: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

function veshtiresiaShqip(value: DrillDifficulty) {
  const labels: Record<DrillDifficulty, string> = {
    EASY: "E lehtë",
    MEDIUM: "Mesatare",
    HARD: "E vështirë",
  };

  return labels[value];
}

function klasaVeshtiresise(value: DrillDifficulty) {
  if (value === "EASY") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (value === "HARD") {
    return "bg-red-50 text-red-700 ring-red-100";
  }

  return "bg-amber-50 text-amber-700 ring-amber-100";
}

export default function UshtrimetClient() {
  const [drills, setDrills] = useState<Drill[]>([]);
  const [loading, setLoading] = useState(true);
  const [gabimi, setGabimi] = useState("");

  const [kerkimi, setKerkimi] = useState("");
  const [filtriStatusit, setFiltriStatusit] =
    useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const [shfaqFormularin, setShfaqFormularin] =
    useState(false);

  const [ushtrimiNeEditim, setUshtrimiNeEditim] =
    useState<Drill | null>(null);

  const [ushtrimiPerFshirje, setUshtrimiPerFshirje] =
    useState<Drill | null>(null);

  const [dukeRuajtur, setDukeRuajtur] = useState(false);
  const [dukeFshire, setDukeFshire] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [sport, setSport] = useState("");
  const [objective, setObjective] = useState("");
  const [durationMin, setDurationMin] = useState("");
  const [difficulty, setDifficulty] =
    useState<DrillDifficulty>("MEDIUM");
  const [equipment, setEquipment] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);

  async function merrUshtrimet() {
    setLoading(true);
    setGabimi("");

    try {
      const response = await fetch("/api/drills", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        setGabimi(
          data.error ||
            "Ushtrimet nuk mund të ngarkoheshin."
        );
        return;
      }

      setDrills(data.drills || []);
    } catch {
      setGabimi(
        "Ndodhi një problem gjatë ngarkimit të ushtrimeve."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    merrUshtrimet();
  }, []);

  const ushtrimetEFiltuara = useMemo(() => {
    const query = kerkimi.trim().toLowerCase();

    return drills.filter((drill) => {
      const perputhetMeKerkimin =
        !query ||
        drill.name.toLowerCase().includes(query) ||
        (drill.category || "").toLowerCase().includes(query) ||
        (drill.sport || "").toLowerCase().includes(query) ||
        (drill.objective || "").toLowerCase().includes(query);

      const perputhetMeStatusin =
        filtriStatusit === "ALL" ||
        (filtriStatusit === "ACTIVE" && drill.isActive) ||
        (filtriStatusit === "INACTIVE" && !drill.isActive);

      return perputhetMeKerkimin && perputhetMeStatusin;
    });
  }, [drills, kerkimi, filtriStatusit]);

  const aktive = drills.filter(
    (drill) => drill.isActive
  ).length;

  const joAktive = drills.filter(
    (drill) => !drill.isActive
  ).length;

  const kohezgjatjaMesatare = useMemo(() => {
    const meKohezgjatje = drills.filter(
      (drill) => drill.durationMin !== null
    );

    if (meKohezgjatje.length === 0) return 0;

    const total = meKohezgjatje.reduce(
      (sum, drill) => sum + (drill.durationMin || 0),
      0
    );

    return Math.round(total / meKohezgjatje.length);
  }, [drills]);

  function pastroFormularin() {
    setName("");
    setCategory("");
    setSport("");
    setObjective("");
    setDurationMin("");
    setDifficulty("MEDIUM");
    setEquipment("");
    setDescription("");
    setNotes("");
    setIsActive(true);
    setUshtrimiNeEditim(null);
  }

  function hapShtimin() {
    pastroFormularin();
    setShfaqFormularin(true);
  }

  function hapEditimin(drill: Drill) {
    setUshtrimiNeEditim(drill);
    setName(drill.name);
    setCategory(drill.category || "");
    setSport(drill.sport || "");
    setObjective(drill.objective || "");
    setDurationMin(
      drill.durationMin !== null
        ? String(drill.durationMin)
        : ""
    );
    setDifficulty(drill.difficulty);
    setEquipment(drill.equipment || "");
    setDescription(drill.description || "");
    setNotes(drill.notes || "");
    setIsActive(drill.isActive);
    setShfaqFormularin(true);
  }

  async function ruajUshtrimin(event: FormEvent) {
    event.preventDefault();

    setDukeRuajtur(true);
    setGabimi("");

    try {
      const url = ushtrimiNeEditim
        ? `/api/drills/${ushtrimiNeEditim.id}`
        : "/api/drills";

      const response = await fetch(url, {
        method: ushtrimiNeEditim ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          category,
          sport,
          objective,
          durationMin,
          difficulty,
          equipment,
          description,
          notes,
          isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setGabimi(
          data.error ||
            "Ushtrimi nuk mund të ruhej."
        );
        return;
      }

      setShfaqFormularin(false);
      pastroFormularin();
      await merrUshtrimet();
    } catch {
      setGabimi(
        "Ndodhi një problem gjatë ruajtjes së ushtrimit."
      );
    } finally {
      setDukeRuajtur(false);
    }
  }

  async function fshiUshtrimin() {
    if (!ushtrimiPerFshirje) return;

    setDukeFshire(true);
    setGabimi("");

    try {
      const response = await fetch(
        `/api/drills/${ushtrimiPerFshirje.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setGabimi(
          data.error ||
            "Ushtrimi nuk mund të fshihej."
        );
        return;
      }

      setUshtrimiPerFshirje(null);
      await merrUshtrimet();
    } catch {
      setGabimi(
        "Ndodhi një problem gjatë fshirjes së ushtrimit."
      );
    } finally {
      setDukeFshire(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">
                Ushtrimet
              </h1>

              <Sparkles
                size={20}
                className="text-blue-600"
              />
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Ndërto bibliotekën profesionale të ushtrimeve të akademisë.
            </p>
          </div>

          <button
            onClick={hapShtimin}
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
          >
            <Plus
              size={18}
              className="transition group-hover:rotate-90"
            />
            Shto ushtrim
          </button>
        </div>

        {gabimi && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {gabimi}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            title="Ushtrime aktive"
            value={aktive}
            subtitle="Gati për përdorim"
            icon={Activity}
          />

          <StatCard
            title="Jo aktive"
            value={joAktive}
            subtitle="Të çaktivizuara"
            icon={Dumbbell}
          />

          <StatCard
            title="Kohëzgjatja mesatare"
            value={`${kohezgjatjaMesatare} min`}
            subtitle="Mesatarja e ushtrimeve"
            icon={Clock3}
          />
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={kerkimi}
                onChange={(event) =>
                  setKerkimi(event.target.value)
                }
                placeholder="Kërko sipas emrit, kategorisë, sportit ose objektivit..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div className="flex gap-2">
              {[
                ["ALL", "Të gjitha"],
                ["ACTIVE", "Aktive"],
                ["INACTIVE", "Jo aktive"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() =>
                    setFiltriStatusit(
                      value as
                        | "ALL"
                        | "ACTIVE"
                        | "INACTIVE"
                    )
                  }
                  className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    filtriStatusit === value
                      ? "bg-slate-950 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {label}
                </button>
              ))}

              <button
                onClick={merrUshtrimet}
                className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:rotate-180 hover:bg-slate-50"
                aria-label="Rifresko"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Duke ngarkuar ushtrimet...
          </div>
        ) : ushtrimetEFiltuara.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Dumbbell size={26} />
            </div>

            <h3 className="mt-4 font-bold text-slate-900">
              Nuk u gjetën ushtrime
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Shto ushtrimin e parë në bibliotekën e akademisë.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {ushtrimetEFiltuara.map((drill) => (
              <article
                key={drill.id}
                className="group relative overflow-hidden rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
              >
                <div className="absolute left-0 top-0 h-full w-1 bg-blue-600 opacity-0 transition group-hover:opacity-100" />

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${klasaVeshtiresise(
                          drill.difficulty
                        )}`}
                      >
                        {veshtiresiaShqip(
                          drill.difficulty
                        )}
                      </span>

                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          drill.isActive
                            ? "bg-blue-50 text-blue-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {drill.isActive
                          ? "Aktiv"
                          : "Jo aktiv"}
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-bold text-slate-950">
                      {drill.name}
                    </h3>

                    {drill.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                        {drill.description}
                      </p>
                    )}
                  </div>

                  {drill.durationMin !== null && (
                    <div className="rounded-2xl bg-slate-950 px-3 py-2 text-center text-white">
                      <p className="text-[10px] uppercase text-slate-400">
                        Kohë
                      </p>
                      <p className="font-bold">
                        {drill.durationMin} min
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <MiniInfo
                    icon={Dumbbell}
                    label="Kategoria"
                    value={
                      drill.category ||
                      "Pa kategori"
                    }
                  />

                  <MiniInfo
                    icon={Activity}
                    label="Sporti"
                    value={
                      drill.sport ||
                      "Pa përcaktuar"
                    }
                  />

                  <MiniInfo
                    icon={Target}
                    label="Objektivi"
                    value={
                      drill.objective ||
                      "Pa përcaktuar"
                    }
                  />

                  <MiniInfo
                    icon={Dumbbell}
                    label="Pajisjet"
                    value={
                      drill.equipment ||
                      "Pa pajisje"
                    }
                  />
                </div>

                {drill.notes && (
                  <div className="mt-4 rounded-xl bg-slate-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Shënime
                    </p>

                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">
                      {drill.notes}
                    </p>
                  </div>
                )}

                <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
                  <button
                    onClick={() =>
                      hapEditimin(drill)
                    }
                    className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
                    aria-label="Edito"
                  >
                    <Pencil size={15} />
                  </button>

                  <button
                    onClick={() =>
                      setUshtrimiPerFshirje(drill)
                    }
                    className="rounded-lg border border-red-100 p-2 text-red-600 transition hover:bg-red-50"
                    aria-label="Fshi"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {shfaqFormularin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[26px] bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  {ushtrimiNeEditim
                    ? "Edito ushtrimin"
                    : "Shto ushtrim"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Plotëso të dhënat e ushtrimit.
                </p>
              </div>

              <button
                onClick={() => {
                  setShfaqFormularin(false);
                  pastroFormularin();
                }}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={ruajUshtrimin}
              className="grid gap-5 p-6 sm:grid-cols-2"
            >
              <Field label="Emri i ushtrimit">
                <input
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  required
                  placeholder="p.sh. Pasime në trekëndësh"
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </Field>

              <Field label="Kategoria">
                <input
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value)
                  }
                  placeholder="p.sh. Teknikë"
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </Field>

              <Field label="Sporti">
                <input
                  value={sport}
                  onChange={(event) =>
                    setSport(event.target.value)
                  }
                  placeholder="p.sh. Futboll"
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </Field>

              <Field label="Objektivi">
                <input
                  value={objective}
                  onChange={(event) =>
                    setObjective(event.target.value)
                  }
                  placeholder="p.sh. Përmirësimi i pasimeve"
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </Field>

              <Field label="Kohëzgjatja në minuta">
                <input
                  type="number"
                  min="1"
                  value={durationMin}
                  onChange={(event) =>
                    setDurationMin(event.target.value)
                  }
                  placeholder="15"
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </Field>

              <Field label="Vështirësia">
                <select
                  value={difficulty}
                  onChange={(event) =>
                    setDifficulty(
                      event.target.value as DrillDifficulty
                    )
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                >
                  <option value="EASY">
                    E lehtë
                  </option>
                  <option value="MEDIUM">
                    Mesatare
                  </option>
                  <option value="HARD">
                    E vështirë
                  </option>
                </select>
              </Field>

              <Field label="Pajisjet">
                <input
                  value={equipment}
                  onChange={(event) =>
                    setEquipment(event.target.value)
                  }
                  placeholder="p.sh. Topa, kone, jelekë"
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </Field>

              <Field label="Statusi">
                <select
                  value={
                    isActive ? "ACTIVE" : "INACTIVE"
                  }
                  onChange={(event) =>
                    setIsActive(
                      event.target.value === "ACTIVE"
                    )
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                >
                  <option value="ACTIVE">
                    Aktiv
                  </option>
                  <option value="INACTIVE">
                    Jo aktiv
                  </option>
                </select>
              </Field>

              <div className="sm:col-span-2">
                <Field label="Përshkrimi">
                  <textarea
                    value={description}
                    onChange={(event) =>
                      setDescription(event.target.value)
                    }
                    rows={3}
                    placeholder="Shpjego si realizohet ushtrimi..."
                    className="resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label="Shënime">
                  <textarea
                    value={notes}
                    onChange={(event) =>
                      setNotes(event.target.value)
                    }
                    rows={3}
                    placeholder="Shënime shtesë..."
                    className="resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  />
                </Field>
              </div>

              <div className="sm:col-span-2 flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => {
                    setShfaqFormularin(false);
                    pastroFormularin();
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Anulo
                </button>

                <button
                  disabled={dukeRuajtur}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {dukeRuajtur
                    ? "Duke ruajtur..."
                    : ushtrimiNeEditim
                      ? "Ruaj ndryshimet"
                      : "Shto ushtrimin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {ushtrimiPerFshirje && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <Trash2 size={22} />
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-950">
              Fshi ushtrimin
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Je i sigurt që dëshiron të fshish{" "}
              <strong>
                {ushtrimiPerFshirje.name}
              </strong>
              ?
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() =>
                  setUshtrimiPerFshirje(null)
                }
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium"
              >
                Anulo
              </button>

              <button
                onClick={fshiUshtrimin}
                disabled={dukeFshire}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {dukeFshire
                  ? "Duke fshirë..."
                  : "Po, fshi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ElementType;
}) {
  return (
    <div className="group rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition group-hover:bg-blue-600 group-hover:text-white">
          <Icon size={20} />
        </div>

        <span className="text-3xl font-bold text-slate-950">
          {value}
        </span>
      </div>

      <p className="mt-4 text-sm font-semibold text-slate-900">
        {title}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {subtitle}
      </p>
    </div>
  );
}

function MiniInfo({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon size={14} />
        <span className="text-[10px] font-semibold uppercase tracking-wide">
          {label}
        </span>
      </div>

      <p className="mt-1 truncate text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-slate-600">
        {label}
      </span>

      {children}
    </label>
  );
}