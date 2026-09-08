"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  Loader2,
  Save,
  X,
} from "lucide-react";

type Team = {
  id: string;
  name: string;
};

export type CalendarEventForEdit = {
  sourceId: string;
  source: "CALENDAR";
  type: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  description: string | null;
  notes: string | null;
  team: Team | null;
};

type Props = {
  teams: Team[];
  event?: CalendarEventForEdit | null;
  onClose: () => void;
  onSaved: () => void;
};

const LLOJET = [
  ["MEETING", "Mbledhje"],
  ["MEDICAL", "Mjekësore"],
  ["TRIAL", "Provë"],
  ["TOURNAMENT", "Turne"],
  ["ADMINISTRATIVE", "Administrative"],
  ["OTHER", "Tjetër"],
];

function dyShifra(value: number) {
  return String(value).padStart(2, "0");
}

function perInputDateTime(
  value: string | null | undefined
) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}-${dyShifra(
    date.getMonth() + 1
  )}-${dyShifra(
    date.getDate()
  )}T${dyShifra(
    date.getHours()
  )}:${dyShifra(
    date.getMinutes()
  )}`;
}

function krijoFormen(
  event?: CalendarEventForEdit | null
) {
  return {
    title: event?.title ?? "",
    type: event?.type ?? "OTHER",
    startsAt: perInputDateTime(
      event?.startsAt
    ),
    endsAt: perInputDateTime(
      event?.endsAt
    ),
    location: event?.location ?? "",
    description:
      event?.description ?? "",
    notes: event?.notes ?? "",
    teamId: event?.team?.id ?? "",
  };
}

export default function CalendarEventModal({
  teams,
  event = null,
  onClose,
  onSaved,
}: Props) {
  const [form, setForm] = useState(
    () => krijoFormen(event)
  );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const eshteEditim =
    Boolean(event?.sourceId);

  useEffect(() => {
    setForm(krijoFormen(event));
    setError("");
  }, [event]);

  function ndrysho(
    field: keyof typeof form,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function ruaj() {
    if (!form.title.trim()) {
      setError(
        "Titulli është i detyrueshëm."
      );
      return;
    }

    if (!form.startsAt) {
      setError(
        "Data dhe ora e fillimit janë të detyrueshme."
      );
      return;
    }

    const startsAt =
      new Date(form.startsAt);

    if (
      Number.isNaN(
        startsAt.getTime()
      )
    ) {
      setError(
        "Data e fillimit nuk është e vlefshme."
      );
      return;
    }

    let endsAt:
      | Date
      | null = null;

    if (form.endsAt) {
      endsAt =
        new Date(form.endsAt);

      if (
        Number.isNaN(
          endsAt.getTime()
        )
      ) {
        setError(
          "Data e përfundimit nuk është e vlefshme."
        );
        return;
      }

      if (
        endsAt.getTime() <
        startsAt.getTime()
      ) {
        setError(
          "Përfundimi nuk mund të jetë para fillimit."
        );
        return;
      }
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        eshteEditim
          ? `/api/calendar/${event!.sourceId}`
          : "/api/calendar",
        {
          method: eshteEditim
            ? "PATCH"
            : "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            title: form.title,
            type: form.type,
            startsAt:
              startsAt.toISOString(),
            endsAt: endsAt
              ? endsAt.toISOString()
              : null,
            location:
              form.location,
            description:
              form.description,
            notes: form.notes,
            teamId:
              form.teamId || null,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Aktiviteti nuk u ruajt."
        );
      }

      onSaved();
      onClose();
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
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              {eshteEditim
                ? "Edito aktivitetin"
                : "Shto aktivitet"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {eshteEditim
                ? "Përditëso të dhënat e aktivitetit."
                : "Regjistro një aktivitet të ri në kalendar."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
            aria-label="Mbyll"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Fusha
              label="Titulli"
              value={form.title}
              onChange={(value) =>
                ndrysho(
                  "title",
                  value
                )
              }
            />

            <Zgjedhje
              label="Lloji"
              value={form.type}
              options={LLOJET}
              onChange={(value) =>
                ndrysho(
                  "type",
                  value
                )
              }
            />

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Fillimi
              </span>

              <input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) =>
                  ndrysho(
                    "startsAt",
                    e.target.value
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Përfundimi
              </span>

              <input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) =>
                  ndrysho(
                    "endsAt",
                    e.target.value
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Ekipi
              </span>

              <select
                value={form.teamId}
                onChange={(e) =>
                  ndrysho(
                    "teamId",
                    e.target.value
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
              >
                <option value="">
                  Pa ekip të caktuar
                </option>

                {teams.map((team) => (
                  <option
                    key={team.id}
                    value={team.id}
                  >
                    {team.name}
                  </option>
                ))}
              </select>
            </label>

            <Fusha
              label="Vendndodhja"
              value={form.location}
              onChange={(value) =>
                ndrysho(
                  "location",
                  value
                )
              }
            />
          </div>

          <TekstIgjate
            label="Përshkrimi"
            value={form.description}
            onChange={(value) =>
              ndrysho(
                "description",
                value
              )
            }
          />

          <TekstIgjate
            label="Shënime"
            value={form.notes}
            onChange={(value) =>
              ndrysho(
                "notes",
                value
              )
            }
          />
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
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
            onClick={ruaj}
            disabled={saving}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}

            {eshteEditim
              ? "Ruaj ndryshimet"
              : "Ruaj aktivitetin"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Fusha({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>

      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
      />
    </label>
  );
}

function Zgjedhje({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[][];
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
      >
        {options.map(
          ([value, label]) => (
            <option
              key={value}
              value={value}
            >
              {label}
            </option>
          )
        )}
      </select>
    </label>
  );
}

function TekstIgjate({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>

      <textarea
        rows={4}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-400"
      />
    </label>
  );
}