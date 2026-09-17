"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Activity,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

type PhysicalMeasurement = {
  id: string;
  measuredAt: string;
  heightCm: number | null;
  weightKg: number | null;
  bodyFatPercent: number | null;
  muscleMassKg: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type PhysicalProfilePlayer = {
  id: string;
  firstName: string;
  lastName: string;
};

type PlayerPhysicalProfileProps = {
  player: PhysicalProfilePlayer;
  canUpdatePlayers: boolean;
  onClose: () => void;
  onChanged: () => Promise<void>;
};

function formatDateForInput(
  value: string | null
) {
  if (!value) return "";

  return new Date(value)
    .toISOString()
    .split("T")[0];
}

function sotPerInput() {
  const date = new Date();

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(
  value: string
) {
  return new Date(value).toLocaleDateString(
    "sq-AL",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );
}

function formatNumber(
  value: number | null,
  suffix = ""
) {
  if (value === null) {
    return "—";
  }

  const formatted =
    new Intl.NumberFormat(
      "sq-AL",
      {
        maximumFractionDigits: 1,
      }
    ).format(value);

  return suffix
    ? `${formatted} ${suffix}`
    : formatted;
}

function calculateBmi(
  heightCm: number | null,
  weightKg: number | null
) {
  if (
    heightCm === null ||
    weightKg === null ||
    heightCm <= 0 ||
    weightKg <= 0
  ) {
    return null;
  }

  const heightMeters =
    heightCm / 100;

  return (
    weightKg /
    (heightMeters * heightMeters)
  );
}

export default function PlayerPhysicalProfile({
  player,
  canUpdatePlayers,
  onClose,
  onChanged,
}: PlayerPhysicalProfileProps) {
  const [
    measurements,
    setMeasurements,
  ] = useState<PhysicalMeasurement[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    showForm,
    setShowForm,
  ] = useState(false);

  const [
    editingMeasurement,
    setEditingMeasurement,
  ] = useState<PhysicalMeasurement | null>(
    null
  );

  const [saving, setSaving] =
    useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState<string | null>(null);

  const [
    measuredAt,
    setMeasuredAt,
  ] = useState("");

  const [
    heightCm,
    setHeightCm,
  ] = useState("");

  const [
    weightKg,
    setWeightKg,
  ] = useState("");

  const [
    bodyFatPercent,
    setBodyFatPercent,
  ] = useState("");

  const [
    muscleMassKg,
    setMuscleMassKg,
  ] = useState("");

  const [notes, setNotes] =
    useState("");

  const loadMeasurements =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/players/${player.id}/physical-measurements`,
          {
            cache: "no-store",
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          setError(
            data.error ||
              "Matjet fizike nuk mund të ngarkoheshin."
          );
          return;
        }

        setMeasurements(
          data.measurements || []
        );
      } catch {
        setError(
          "Ndodhi një problem gjatë ngarkimit të matjeve fizike."
        );
      } finally {
        setLoading(false);
      }
    }, [player.id]);

  useEffect(() => {
    void loadMeasurements();
  }, [loadMeasurements]);

  function clearForm() {
    setMeasuredAt(
      sotPerInput()
    );
    setHeightCm("");
    setWeightKg("");
    setBodyFatPercent("");
    setMuscleMassKg("");
    setNotes("");
    setEditingMeasurement(null);
  }

  function openAdd() {
    clearForm();
    setShowForm(true);
  }

  function openEdit(
    measurement: PhysicalMeasurement
  ) {
    setEditingMeasurement(
      measurement
    );

    setMeasuredAt(
      formatDateForInput(
        measurement.measuredAt
      )
    );

    setHeightCm(
      measurement.heightCm !== null
        ? String(
            measurement.heightCm
          )
        : ""
    );

    setWeightKg(
      measurement.weightKg !== null
        ? String(
            measurement.weightKg
          )
        : ""
    );

    setBodyFatPercent(
      measurement.bodyFatPercent !== null
        ? String(
            measurement.bodyFatPercent
          )
        : ""
    );

    setMuscleMassKg(
      measurement.muscleMassKg !== null
        ? String(
            measurement.muscleMassKg
          )
        : ""
    );

    setNotes(
      measurement.notes || ""
    );

    setShowForm(true);
  }

  async function saveMeasurement(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const url =
        editingMeasurement
          ? `/api/players/${player.id}/physical-measurements/${editingMeasurement.id}`
          : `/api/players/${player.id}/physical-measurements`;

      const response = await fetch(
        url,
        {
          method:
            editingMeasurement
              ? "PATCH"
              : "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            measuredAt,
            heightCm,
            weightKg,
            bodyFatPercent,
            muscleMassKg,
            notes,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Matja fizike nuk mund të ruhej."
        );
        return;
      }

      setShowForm(false);
      clearForm();

      await loadMeasurements();
      await onChanged();
    } catch {
      setError(
        "Ndodhi një problem gjatë ruajtjes së matjes fizike."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteMeasurement(
    measurement: PhysicalMeasurement
  ) {
    const confirmed =
      window.confirm(
        `Ta fshijmë matjen e datës ${formatDate(
          measurement.measuredAt
        )}?`
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(
      measurement.id
    );

    setError("");

    try {
      const response = await fetch(
        `/api/players/${player.id}/physical-measurements/${measurement.id}`,
        {
          method: "DELETE",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Matja fizike nuk mund të fshihej."
        );
        return;
      }

      await loadMeasurements();
      await onChanged();
    } catch {
      setError(
        "Ndodhi një problem gjatë fshirjes së matjes fizike."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const latest =
    measurements[0] || null;

  const latestBmi =
    latest
      ? calculateBmi(
          latest.heightCm,
          latest.weightKg
        )
      : null;

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto bg-slate-950/50 p-4">
      <div className="mx-auto my-6 w-full max-w-6xl rounded-3xl bg-slate-50 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <Activity
                size={21}
                className="text-blue-700"
              />

              <h2 className="text-xl font-bold text-slate-950">
                Profili fizik
              </h2>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {player.firstName}{" "}
              {player.lastName}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Mbyll"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              Duke ngarkuar profilin fizik...
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <SummaryCard
                  label="Gjatësia"
                  value={
                    latest
                      ? formatNumber(
                          latest.heightCm,
                          "cm"
                        )
                      : "—"
                  }
                />

                <SummaryCard
                  label="Pesha"
                  value={
                    latest
                      ? formatNumber(
                          latest.weightKg,
                          "kg"
                        )
                      : "—"
                  }
                />

                <SummaryCard
                  label="BMI"
                  value={
                    latestBmi !== null
                      ? formatNumber(
                          latestBmi
                        )
                      : "—"
                  }
                />

                <SummaryCard
                  label="Yndyra trupore"
                  value={
                    latest
                      ? formatNumber(
                          latest.bodyFatPercent,
                          "%"
                        )
                      : "—"
                  }
                />

                <SummaryCard
                  label="Masa muskulore"
                  value={
                    latest
                      ? formatNumber(
                          latest.muscleMassKg,
                          "kg"
                        )
                      : "—"
                  }
                />

                <SummaryCard
                  label="Matja e fundit"
                  value={
                    latest
                      ? formatDate(
                          latest.measuredAt
                        )
                      : "—"
                  }
                />
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-bold text-slate-950">
                    Historiku i matjeve
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {measurements.length}{" "}
                    {measurements.length === 1
                      ? "matje"
                      : "matje"}
                  </p>
                </div>

                {canUpdatePlayers && (
                  <button
                    type="button"
                    onClick={openAdd}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
                  >
                    <Plus size={17} />
                    Shto matje
                  </button>
                )}
              </div>

              {showForm && (
                <form
                  onSubmit={saveMeasurement}
                  className="mt-5 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-950">
                      {editingMeasurement
                        ? "Edito matjen"
                        : "Matje e re"}
                    </h3>

                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        clearForm();
                      }}
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                      aria-label="Mbyll formularin"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <label className="text-xs font-semibold text-slate-600">
                      Data e matjes
                      <input
                        required
                        type="date"
                        value={measuredAt}
                        onChange={(event) =>
                          setMeasuredAt(
                            event.target.value
                          )
                        }
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
                      />
                    </label>

                    <MeasurementInput
                      label="Gjatësia (cm)"
                      value={heightCm}
                      min="0.1"
                      max="300"
                      onChange={
                        setHeightCm
                      }
                    />

                    <MeasurementInput
                      label="Pesha (kg)"
                      value={weightKg}
                      min="0.1"
                      max="500"
                      onChange={
                        setWeightKg
                      }
                    />

                    <MeasurementInput
                      label="Yndyra trupore (%)"
                      value={bodyFatPercent}
                      min="0"
                      max="100"
                      onChange={
                        setBodyFatPercent
                      }
                    />

                    <MeasurementInput
                      label="Masa muskulore (kg)"
                      value={muscleMassKg}
                      min="0.1"
                      max="300"
                      onChange={
                        setMuscleMassKg
                      }
                    />

                    <label className="text-xs font-semibold text-slate-600 sm:col-span-2 lg:col-span-3">
                      Shënime
                      <textarea
                        value={notes}
                        onChange={(event) =>
                          setNotes(
                            event.target.value
                          )
                        }
                        maxLength={2000}
                        rows={3}
                        className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
                      />
                    </label>
                  </div>

                  <div className="mt-5 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        clearForm();
                      }}
                      disabled={saving}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
                    >
                      Anulo
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {saving
                        ? "Duke ruajtur..."
                        : editingMeasurement
                          ? "Ruaj ndryshimet"
                          : "Ruaj matjen"}
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {measurements.length === 0 ? (
                  <div className="p-10 text-center">
                    <Activity
                      size={36}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 font-semibold text-slate-700">
                      Nuk ka ende matje fizike
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      Shto matjen e parë për të filluar historikun.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left">
                      <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                        <tr>
                          <th className="px-4 py-3">
                            Data
                          </th>
                          <th className="px-4 py-3">
                            Gjatësia
                          </th>
                          <th className="px-4 py-3">
                            Pesha
                          </th>
                          <th className="px-4 py-3">
                            BMI
                          </th>
                          <th className="px-4 py-3">
                            Yndyra
                          </th>
                          <th className="px-4 py-3">
                            Masa muskulore
                          </th>
                          <th className="px-4 py-3">
                            Shënime
                          </th>

                          {canUpdatePlayers && (
                            <th className="px-4 py-3 text-right">
                              Veprime
                            </th>
                          )}
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {measurements.map(
                          (measurement) => {
                            const bmi =
                              calculateBmi(
                                measurement.heightCm,
                                measurement.weightKg
                              );

                            return (
                              <tr
                                key={
                                  measurement.id
                                }
                                className="text-sm"
                              >
                                <td className="px-4 py-4 font-medium text-slate-800">
                                  {formatDate(
                                    measurement.measuredAt
                                  )}
                                </td>

                                <td className="px-4 py-4 text-slate-600">
                                  {formatNumber(
                                    measurement.heightCm,
                                    "cm"
                                  )}
                                </td>

                                <td className="px-4 py-4 text-slate-600">
                                  {formatNumber(
                                    measurement.weightKg,
                                    "kg"
                                  )}
                                </td>

                                <td className="px-4 py-4 text-slate-600">
                                  {bmi !== null
                                    ? formatNumber(
                                        bmi
                                      )
                                    : "—"}
                                </td>

                                <td className="px-4 py-4 text-slate-600">
                                  {formatNumber(
                                    measurement.bodyFatPercent,
                                    "%"
                                  )}
                                </td>

                                <td className="px-4 py-4 text-slate-600">
                                  {formatNumber(
                                    measurement.muscleMassKg,
                                    "kg"
                                  )}
                                </td>

                                <td className="max-w-[240px] px-4 py-4 text-slate-500">
                                  {measurement.notes ||
                                    "—"}
                                </td>

                                {canUpdatePlayers && (
                                  <td className="px-4 py-4">
                                    <div className="flex justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          openEdit(
                                            measurement
                                          )
                                        }
                                        className="rounded-lg bg-blue-50 p-2 text-blue-700 hover:bg-blue-100"
                                        aria-label="Edito matjen"
                                      >
                                        <Pencil
                                          size={
                                            15
                                          }
                                        />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          void deleteMeasurement(
                                            measurement
                                          )
                                        }
                                        disabled={
                                          deletingId ===
                                          measurement.id
                                        }
                                        className="rounded-lg bg-red-50 p-2 text-red-700 hover:bg-red-100 disabled:opacity-50"
                                        aria-label="Fshi matjen"
                                      >
                                        <Trash2
                                          size={
                                            15
                                          }
                                        />
                                      </button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-lg font-bold text-slate-950">
        {value}
      </p>
    </div>
  );
}

function MeasurementInput({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: string;
  min: string;
  max: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-xs font-semibold text-slate-600">
      {label}

      <input
        type="number"
        step="0.1"
        min={min}
        max={max}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
      />
    </label>
  );
}
