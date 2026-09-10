"use client";

import {
  Check,
  Plus,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

type Season = {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

function dataInput(value: string) {
  return new Date(value)
    .toISOString()
    .slice(0, 10);
}

export function SeasonsSettings() {
  const router = useRouter();

  const [seasons, setSeasons] =
    useState<Season[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [form, setForm] = useState({
    name: "2026/27",
    startsAt: "2026-07-01",
    endsAt: "2027-06-30",
    isActive: true,
  });

  async function loadSeasons() {
    try {
      const response = await fetch(
        "/api/seasons",
        {
          cache: "no-store",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Sezonet nuk mund të ngarkoheshin."
        );
      }

      setSeasons(
        Array.isArray(data.seasons)
          ? data.seasons
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ndodhi një gabim."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSeasons();
  }, []);

  async function krijoSezonin(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "/api/seasons",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name: form.name,
            startsAt:
              `${form.startsAt}T00:00:00.000Z`,
            endsAt:
              `${form.endsAt}T23:59:59.999Z`,
            isActive:
              form.isActive,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Sezoni nuk mund të krijohej."
        );
      }

      setSuccess(
        "Sezoni u krijua me sukses."
      );

      await loadSeasons();

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ndodhi një gabim."
      );
    } finally {
      setSaving(false);
    }
  }

  async function aktivizoSezonin(
    seasonId: string
  ) {
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/seasons/${seasonId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            isActive: true,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Sezoni nuk mund të aktivizohej."
        );
      }

      setSuccess(
        "Sezoni aktiv u ndryshua."
      );

      await loadSeasons();

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ndodhi një gabim."
      );
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-slate-900">
            Sezonet e akademisë
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Krijo sezonet dhe cakto sezonin aktiv.
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <Plus size={17} />
        </div>
      </div>

      <form
        onSubmit={krijoSezonin}
        className="mt-5 grid gap-4 sm:grid-cols-2"
      >
        <label className="block text-xs font-semibold text-slate-500 sm:col-span-2">
          Emri i sezonit
          <input
            value={form.name}
            onChange={(event) =>
              setForm({
                ...form,
                name:
                  event.target.value,
              })
            }
            placeholder="2026/27"
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
            required
          />
        </label>

        <label className="block text-xs font-semibold text-slate-500">
          Data e fillimit
          <input
            type="date"
            value={form.startsAt}
            onChange={(event) =>
              setForm({
                ...form,
                startsAt:
                  event.target.value,
              })
            }
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
            required
          />
        </label>

        <label className="block text-xs font-semibold text-slate-500">
          Data e përfundimit
          <input
            type="date"
            value={form.endsAt}
            onChange={(event) =>
              setForm({
                ...form,
                endsAt:
                  event.target.value,
              })
            }
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
            required
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) =>
              setForm({
                ...form,
                isActive:
                  event.target.checked,
              })
            }
          />
          Bëje sezon aktiv
        </label>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving
              ? "Duke ruajtur..."
              : "Krijo sezonin"}
          </button>
        </div>
      </form>

      {error ? (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </p>
      ) : null}

      <div className="mt-6 border-t border-slate-100 pt-5">
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">
          Sezonet ekzistuese
        </h3>

        {loading ? (
          <p className="mt-3 text-sm text-slate-500">
            Duke ngarkuar...
          </p>
        ) : seasons.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Nuk ka ende sezone.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {seasons.map((season) => (
              <div
                key={season.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">
                      {season.name}
                    </p>

                    {season.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        <Check size={11} />
                        Aktiv
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    {dataInput(
                      season.startsAt
                    )}{" "}
                    –{" "}
                    {dataInput(
                      season.endsAt
                    )}
                  </p>
                </div>

                {!season.isActive ? (
                  <button
                    type="button"
                    onClick={() =>
                      aktivizoSezonin(
                        season.id
                      )
                    }
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Bëje aktiv
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}