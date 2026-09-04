"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import {
  Plus,
  Pencil,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";

type CoachStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED"
  | "LEFT";

type CoachTeam = {
  id: string;
  isHeadCoach: boolean;
  team: {
    id: string;
    name: string;
  };
};

type Coach = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  specialization: string | null;
  license: string | null;
  notes: string | null;
  status: CoachStatus;
  teams: CoachTeam[];
};

type TeamOption = {
  id: string;
  name: string;
  sport: string;
  status: string;
  isAssigned: boolean;
  isHeadCoach: boolean;
};

const STATUS_LABELS: Record<CoachStatus, string> = {
  ACTIVE: "Aktiv",
  INACTIVE: "Joaktiv",
  SUSPENDED: "Pezulluar",
  LEFT: "Larguar",
};

export default function TrajneretClient() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingCoach, setEditingCoach] = useState<Coach | null>(null);
  const [deletingCoach, setDeletingCoach] = useState<Coach | null>(null);

  const [managingCoach, setManagingCoach] = useState<Coach | null>(null);
  const [teamOptions, setTeamOptions] = useState<TeamOption[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [license, setLicense] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<CoachStatus>("ACTIVE");

  async function loadCoaches() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/coaches");

      if (!response.ok) {
        throw new Error("Nuk u ngarkuan trajnerët.");
      }

      const data = await response.json();
      setCoaches(data.coaches || []);
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
    loadCoaches();
  }, []);

  function resetForm() {
    setEditingCoach(null);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setDateOfBirth("");
    setSpecialization("");
    setLicense("");
    setNotes("");
    setStatus("ACTIVE");
  }

  function openAdd() {
    resetForm();
    setShowForm(true);
  }

  function openEdit(coach: Coach) {
    setEditingCoach(coach);
    setFirstName(coach.firstName);
    setLastName(coach.lastName);
    setEmail(coach.email || "");
    setPhone(coach.phone || "");
    setDateOfBirth(
      coach.dateOfBirth
        ? coach.dateOfBirth.slice(0, 10)
        : ""
    );
    setSpecialization(coach.specialization || "");
    setLicense(coach.license || "");
    setNotes(coach.notes || "");
    setStatus(coach.status);
    setShowForm(true);
  }

  async function saveCoach(event: React.FormEvent) {
    event.preventDefault();

    const url = editingCoach
      ? `/api/coaches/${editingCoach.id}`
      : "/api/coaches";

    const method = editingCoach ? "PATCH" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth,
        specialization,
        license,
        notes,
        status,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "Veprimi dështoi.");
      return;
    }

    setShowForm(false);
    resetForm();
    await loadCoaches();
  }

  async function deleteCoach() {
    if (!deletingCoach) return;

    const response = await fetch(
      `/api/coaches/${deletingCoach.id}`,
      {
        method: "DELETE",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "Fshirja dështoi.");
      return;
    }

    setDeletingCoach(null);
    await loadCoaches();
  }

  async function openTeamManagement(coach: Coach) {
    setManagingCoach(coach);
    setLoadingTeams(true);

    try {
      const response = await fetch(
        `/api/coaches/${coach.id}/teams`
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Ekipet nuk u ngarkuan.");
        return;
      }

      setTeamOptions(data.teams || []);
    } finally {
      setLoadingTeams(false);
    }
  }

  async function addToTeam(
    teamId: string,
    isHeadCoach: boolean
  ) {
    if (!managingCoach) return;

    const response = await fetch(
      `/api/coaches/${managingCoach.id}/teams`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamId,
          isHeadCoach,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "Lidhja me ekipin dështoi.");
      return;
    }

    await openTeamManagement(managingCoach);
    await loadCoaches();
  }

  async function removeFromTeam(teamId: string) {
    if (!managingCoach) return;

    const response = await fetch(
      `/api/coaches/${managingCoach.id}/teams`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamId,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "Heqja nga ekipi dështoi.");
      return;
    }

    await openTeamManagement(managingCoach);
    await loadCoaches();
  }

  return (
    <AppShell>
      <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">
            Trajnerët
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Menaxho trajnerët dhe lidhjen e tyre me ekipet.
          </p>
        </div>

        <button
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <Plus size={18} />
          Shto trajner
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Duke ngarkuar trajnerët...
        </div>
      ) : coaches.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="font-semibold text-slate-900">
            Nuk ka trajnerë të regjistruar.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Shto trajnerin e parë të akademisë.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {coaches.map((coach) => (
            <div
              key={coach.id}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">
                    {coach.firstName} {coach.lastName}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {coach.specialization ||
                      "Pa specializim të përcaktuar"}
                  </p>
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {STATUS_LABELS[coach.status]}
                </span>
              </div>

              <div className="mt-4 space-y-1 text-sm text-slate-600">
                <p>
                  Telefon: {coach.phone || "-"}
                </p>
                <p>
                  Adresa elektronike: {coach.email || "-"}
                </p>
                <p>
                  Licenca: {coach.license || "-"}
                </p>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Ekipet
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {coach.teams.length === 0 ? (
                    <span className="text-sm text-slate-500">
                      Nuk është lidhur me ekip.
                    </span>
                  ) : (
                    coach.teams.map((assignment) => (
                      <span
                        key={assignment.id}
                        className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                      >
                        {assignment.team.name}
                        {assignment.isHeadCoach
                          ? " · Trajner kryesor"
                          : ""}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    openTeamManagement(coach)
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <UsersRound size={16} />
                  Menaxho ekipet
                </button>

                <button
                  onClick={() => openEdit(coach)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Pencil size={16} />
                  Edito
                </button>

                <button
                  onClick={() =>
                    setDeletingCoach(coach)
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={16} />
                  Fshi
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-950">
                {editingCoach
                  ? "Edito trajnerin"
                  : "Shto trajner"}
              </h2>

              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Mbyll"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={saveCoach}
              className="mt-6 grid gap-4 sm:grid-cols-2"
            >
              <input
                value={firstName}
                onChange={(e) =>
                  setFirstName(e.target.value)
                }
                placeholder="Emri"
                required
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              />

              <input
                value={lastName}
                onChange={(e) =>
                  setLastName(e.target.value)
                }
                placeholder="Mbiemri"
                required
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              />

              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) =>
                  setDateOfBirth(e.target.value)
                }
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              />

              <input
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                placeholder="Telefoni"
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              />

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="Adresa elektronike"
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              />

              <input
                value={specialization}
                onChange={(e) =>
                  setSpecialization(e.target.value)
                }
                placeholder="Specializimi"
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              />

              <input
                value={license}
                onChange={(e) =>
                  setLicense(e.target.value)
                }
                placeholder="Licenca"
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              />

              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as CoachStatus)
                }
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              >
                <option value="ACTIVE">Aktiv</option>
                <option value="INACTIVE">Joaktiv</option>
                <option value="SUSPENDED">
                  Pezulluar
                </option>
                <option value="LEFT">Larguar</option>
              </select>

              <textarea
                value={notes}
                onChange={(e) =>
                  setNotes(e.target.value)
                }
                placeholder="Shënime"
                rows={4}
                className="sm:col-span-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              />

              <div className="sm:col-span-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700"
                >
                  Anulo
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Ruaj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingCoach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-950">
              Fshi trajnerin
            </h2>

            <p className="mt-3 text-sm text-slate-600">
              Je i sigurt që dëshiron të fshish{" "}
              <strong>
                {deletingCoach.firstName}{" "}
                {deletingCoach.lastName}
              </strong>
              ?
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() =>
                  setDeletingCoach(null)
                }
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium"
              >
                Anulo
              </button>

              <button
                onClick={deleteCoach}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Po, fshi
              </button>
            </div>
          </div>
        </div>
      )}

      {managingCoach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Menaxho ekipet
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {managingCoach.firstName}{" "}
                  {managingCoach.lastName}
                </p>
              </div>

              <button
                onClick={() => {
                  setManagingCoach(null);
                  setTeamOptions([]);
                }}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Mbyll"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {loadingTeams ? (
                <p className="text-sm text-slate-500">
                  Duke ngarkuar ekipet...
                </p>
              ) : teamOptions.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Nuk ka ekipe të regjistruara.
                </p>
              ) : (
                teamOptions.map((team) => (
                  <div
                    key={team.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {team.name}
                      </p>

                      <p className="text-xs text-slate-500">
                        {team.isHeadCoach
                          ? "Trajner kryesor"
                          : team.isAssigned
                            ? "I lidhur me ekipin"
                            : "Nuk është i lidhur"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {!team.isAssigned ? (
                        <>
                          <button
                            onClick={() =>
                              addToTeam(team.id, false)
                            }
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium"
                          >
                            Shto
                          </button>

                          <button
                            onClick={() =>
                              addToTeam(team.id, true)
                            }
                            className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white"
                          >
                            Shto si trajner kryesor
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() =>
                            removeFromTeam(team.id)
                          }
                          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600"
                        >
                          Hiq nga ekipi
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </AppShell>
  );
}