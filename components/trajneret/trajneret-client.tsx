"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserRoundCheck,
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

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<CoachStatus | "ALL">("ALL");

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

  const filteredCoaches = coaches.filter((coach) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      !query ||
      `${coach.firstName} ${coach.lastName}`
        .toLowerCase()
        .includes(query) ||
      (coach.email ?? "")
        .toLowerCase()
        .includes(query) ||
      (coach.phone ?? "")
        .toLowerCase()
        .includes(query) ||
      coach.teams.some((assignment) =>
        assignment.team.name
          .toLowerCase()
          .includes(query)
      );

    const matchesStatus =
      statusFilter === "ALL" ||
      coach.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeCoaches = coaches.filter(
    (coach) => coach.status === "ACTIVE"
  ).length;

  const assignedCoaches = coaches.filter(
    (coach) => coach.teams.length > 0
  ).length;

  const headCoaches = coaches.filter((coach) =>
    coach.teams.some(
      (assignment) => assignment.isHeadCoach
    )
  ).length;

  return (
    <AppShell>
      <div className="space-y-5">
        <section className="relative overflow-hidden rounded-[28px] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-violet-50/60 to-blue-50 p-5 shadow-sm sm:p-6">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-200/30 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100">
                <UserRoundCheck className="h-6 w-6" />
              </div>

              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  Trajnerët
                </h1>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                  Menaxho stafin teknik, informacionin profesional dhe lidhjet e trajnerëve me ekipet.
                </p>
              </div>
            </div>

            <button
              onClick={openAdd}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
            >
              <Plus size={18} />
              Shto trajner
            </button>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <CoachStat
            label="Trajnerë gjithsej"
            value={coaches.length}
            description="Profile të regjistruara"
            icon={UsersRound}
            tone="indigo"
          />

          <CoachStat
            label="Aktivë"
            value={activeCoaches}
            description="Trajnerë aktivë"
            icon={BadgeCheck}
            tone="emerald"
          />

          <CoachStat
            label="Me ekip"
            value={assignedCoaches}
            description="Kanë të paktën një ekip"
            icon={BriefcaseBusiness}
            tone="blue"
          />

          <CoachStat
            label="Trajnerë kryesorë"
            value={headCoaches}
            description="Udhëheqin të paktën një ekip"
            icon={ShieldCheck}
            tone="amber"
          />
        </div>

        <div className="flex flex-col gap-3 rounded-[22px] border border-slate-200 bg-white p-3 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Kërko trajnerin..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | CoachStatus
                    | "ALL"
                )
              }
              className="h-11 rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
            >
              <option value="ALL">
                Të gjithë statuset
              </option>
              <option value="ACTIVE">Aktiv</option>
              <option value="INACTIVE">
                Joaktiv
              </option>
              <option value="SUSPENDED">
                Pezulluar
              </option>
              <option value="LEFT">Larguar</option>
            </select>
          </div>

          <p className="px-2 text-xs font-semibold text-slate-500">
            {filteredCoaches.length} nga{" "}
            {coaches.length} trajnerë
          </p>
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
      ) : filteredCoaches.length === 0 ? (
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
          {filteredCoaches.map((coach) => (
            <div
              key={coach.id}
              className="group overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50/70 via-white to-blue-50/50 p-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">
                    {coach.firstName} {coach.lastName}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {coach.specialization ||
                      "Pa specializim të përcaktuar"}
                  </p>
                </div>

                <span className={`rounded-full px-3 py-1 text-xs font-bold ${coach.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : coach.status === "SUSPENDED" ? "bg-amber-100 text-amber-700" : coach.status === "LEFT" ? "bg-slate-200 text-slate-600" : "bg-blue-100 text-blue-700"}`}>
                  {STATUS_LABELS[coach.status]}
                </span>
              </div>

              <div className="grid gap-3 p-5 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3.5">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Telefoni
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {coach.phone || "-"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3.5">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Email
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-700">
                      {coach.email || "-"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3.5 sm:col-span-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Licenca
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {coach.license || "Pa licencë të regjistruar"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mx-5 mb-5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
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
                        className="rounded-xl bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100"
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

              <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50/40 px-5 py-4">
                <button
                  onClick={() =>
                    openTeamManagement(coach)
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <UsersRound size={16} />
                  Menaxho ekipet
                </button>

                <button
                  onClick={() => openEdit(coach)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <Pencil size={16} />
                  Edito
                </button>

                <button
                  onClick={() =>
                    setDeletingCoach(coach)
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50"
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
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-slate-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-blue-50 px-6 py-5">
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
                className="rounded-xl bg-white p-2 text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
                aria-label="Mbyll"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={saveCoach}
              className="grid gap-4 p-6 sm:grid-cols-2"
            >
              <input
                value={firstName}
                onChange={(e) =>
                  setFirstName(e.target.value)
                }
                placeholder="Emri"
                required
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
              />

              <input
                value={lastName}
                onChange={(e) =>
                  setLastName(e.target.value)
                }
                placeholder="Mbiemri"
                required
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
              />

              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) =>
                  setDateOfBirth(e.target.value)
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
              />

              <input
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                placeholder="Telefoni"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
              />

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="Adresa elektronike"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
              />

              <input
                value={specialization}
                onChange={(e) =>
                  setSpecialization(e.target.value)
                }
                placeholder="Specializimi"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
              />

              <input
                value={license}
                onChange={(e) =>
                  setLicense(e.target.value)
                }
                placeholder="Licenca"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
              />

              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as CoachStatus)
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
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
                className="sm:col-span-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
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
                  className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
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
          <div className="w-full max-w-md rounded-[24px] border border-slate-200 bg-white p-6 shadow-2xl">
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
          <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-blue-50 px-6 py-5">
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

            <div className="space-y-3 p-6">
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
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/40 sm:flex-row sm:items-center sm:justify-between"
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
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50"
                          >
                            Shto
                          </button>

                          <button
                            onClick={() =>
                              addToTeam(team.id, true)
                            }
                            className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700"
                          >
                            Shto si trajner kryesor
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() =>
                            removeFromTeam(team.id)
                          }
                          className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 shadow-sm transition hover:bg-red-50"
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

function CoachStat({
  label,
  value,
  description,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  description: string;
  icon: React.ElementType;
  tone:
    | "indigo"
    | "emerald"
    | "blue"
    | "amber";
}) {
  const styles = {
    indigo: {
      card: "border-indigo-100 bg-indigo-50/70",
      icon: "text-indigo-600 ring-indigo-100",
    },
    emerald: {
      card: "border-emerald-100 bg-emerald-50/70",
      icon: "text-emerald-600 ring-emerald-100",
    },
    blue: {
      card: "border-blue-100 bg-blue-50/70",
      icon: "text-blue-600 ring-blue-100",
    },
    amber: {
      card: "border-amber-100 bg-amber-50/70",
      icon: "text-amber-600 ring-amber-100",
    },
  } as const;

  const style = styles[tone];

  return (
    <div
      className={`rounded-[22px] border p-4 shadow-sm sm:p-5 ${style.card}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
            {label}
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
