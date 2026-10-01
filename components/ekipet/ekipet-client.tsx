"use client";

import { type DragEvent, FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Plus,
  RefreshCw,
  ShieldCheck,
  UsersRound,
  MapPin,
  X,
  UserPlus,
  UserMinus,
  Pencil,
  Trash2,
  ArrowRight,
  GripVertical,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";

type Branch = {
  id: string;
  name: string;
  city: string | null;
};

type Team = {
  id: string;
  name: string;
  sport: string;
  ageGroup: string | null;
  description: string | null;
  status: string;

  branch: {
    id: string;
    name: string;
  } | null;

  _count: {
    players: number;
  };
};

type TeamPlayer = {
  id: string;
  firstName: string;
  lastName: string;
  position: string | null;
  jerseyNumber: number | null;
  status: string;
  isInTeam: boolean;
};

const sportet = [
  { value: "FOOTBALL", label: "Futboll" },
  { value: "BASKETBALL", label: "Basketboll" },
  { value: "VOLLEYBALL", label: "Volejboll" },
  { value: "TENNIS", label: "Tenis" },
  { value: "SWIMMING", label: "Not" },
  { value: "HANDBALL", label: "Hendboll" },
  { value: "MARTIAL_ARTS", label: "Arte marciale" },
  { value: "ATHLETICS", label: "Atletikë" },
  { value: "OTHER", label: "Tjetër" },
];

function perkthimSporti(sport: string) {
  return sportet.find((item) => item.value === sport)?.label || sport;
}

function perkthimStatusi(status: string) {
  const statuset: Record<string, string> = {
    ACTIVE: "Aktiv",
    INACTIVE: "Joaktiv",
    ARCHIVED: "Arkivuar",
  };

  return statuset[status] || status;
}

function klasaStatusit(status: string) {
  if (status === "ACTIVE") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "INACTIVE") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-slate-100 text-slate-600";
}

export default function EkipetClient() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const teamsRef = useRef<Team[]>([]);
  const renditjaParaTerheqjesRef = useRef<Team[] | null>(null);
  const ekipiNeTerheqjeRef = useRef<string | null>(null);

  const [ekipiNeTerheqje, setEkipiNeTerheqje] =
    useState<string | null>(null);
  const [dukeRuajturRenditjen, setDukeRuajturRenditjen] =
    useState(false);

  const [loading, setLoading] = useState(true);
  const [dukeRuajtur, setDukeRuajtur] = useState(false);
  const [shfaqFormularin, setShfaqFormularin] = useState(false);
  const [gabimi, setGabimi] = useState("");

  const [ekipiNeEditim, setEkipiNeEditim] = useState<Team | null>(null);
  const [ekipiPerFshirje, setEkipiPerFshirje] = useState<Team | null>(null);
  const [dukeFshire, setDukeFshire] = useState(false);

  const [name, setName] = useState("");
  const [sport, setSport] = useState("FOOTBALL");
  const [ageGroup, setAgeGroup] = useState("");
  const [branchId, setBranchId] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  const [ekipiAktiv, setEkipiAktiv] = useState<Team | null>(null);
  const [sportistet, setSportistet] = useState<TeamPlayer[]>([]);
  const [dukeNgarkuarSportistet, setDukeNgarkuarSportistet] =
    useState(false);
  const [gabimiSportisteve, setGabimiSportisteve] = useState("");
  const [sportistiNeProces, setSportistiNeProces] =
    useState<string | null>(null);

  async function merrEkipet() {
    setLoading(true);
    setGabimi("");

    try {
      const response = await fetch("/api/teams", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        setGabimi(data.error || "Ekipet nuk mund të ngarkoheshin.");
        return;
      }

      const ekipet = data.teams || [];

      teamsRef.current = ekipet;
      setTeams(ekipet);
      setBranches(data.branches || []);
    } catch {
      setGabimi("Ndodhi një problem gjatë ngarkimit të ekipeve.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    merrEkipet();
  }, []);


  function nisTerheqjen(
    event: DragEvent<HTMLButtonElement>,
    teamId: string
  ) {
    if (dukeRuajturRenditjen) {
      event.preventDefault();
      return;
    }

    renditjaParaTerheqjesRef.current = [
      ...teamsRef.current,
    ];

    ekipiNeTerheqjeRef.current = teamId;
    setEkipiNeTerheqje(teamId);

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(
      "text/plain",
      teamId
    );
  }

  function levizEkipin(
    targetTeamId: string
  ) {
    const draggedTeamId =
      ekipiNeTerheqjeRef.current;

    if (
      !draggedTeamId ||
      draggedTeamId === targetTeamId
    ) {
      return;
    }

    const currentTeams = [
      ...teamsRef.current,
    ];

    const fromIndex =
      currentTeams.findIndex(
        (team) =>
          team.id === draggedTeamId
      );

    const toIndex =
      currentTeams.findIndex(
        (team) =>
          team.id === targetTeamId
      );

    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex === toIndex
    ) {
      return;
    }

    const [movedTeam] =
      currentTeams.splice(
        fromIndex,
        1
      );

    currentTeams.splice(
      toIndex,
      0,
      movedTeam
    );

    teamsRef.current =
      currentTeams;

    setTeams(currentTeams);
  }

  async function perfundoTerheqjen() {
    const draggedTeamId =
      ekipiNeTerheqjeRef.current;

    if (!draggedTeamId) {
      return;
    }

    ekipiNeTerheqjeRef.current = null;
    setEkipiNeTerheqje(null);

    const previousTeams =
      renditjaParaTerheqjesRef.current;

    const orderedTeams = [
      ...teamsRef.current,
    ];

    const previousIds =
      previousTeams?.map(
        (team) => team.id
      ) || [];

    const orderedIds =
      orderedTeams.map(
        (team) => team.id
      );

    renditjaParaTerheqjesRef.current =
      null;

    if (
      previousIds.length ===
        orderedIds.length &&
      previousIds.every(
        (id, index) =>
          id === orderedIds[index]
      )
    ) {
      return;
    }

    setDukeRuajturRenditjen(true);
    setGabimi("");

    try {
      const response =
        await fetch(
          "/api/teams/reorder",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              teamIds: orderedIds,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        if (previousTeams) {
          teamsRef.current =
            previousTeams;

          setTeams(previousTeams);
        }

        setGabimi(
          data.error ||
            "Renditja e ekipeve nuk mund të ruhej."
        );
      }
    } catch {
      if (previousTeams) {
        teamsRef.current =
          previousTeams;

        setTeams(previousTeams);
      }

      setGabimi(
        "Ndodhi një problem gjatë ruajtjes së renditjes."
      );
    } finally {
      setDukeRuajturRenditjen(false);
    }
  }

  function pastroFormularin() {
    setName("");
    setSport("FOOTBALL");
    setAgeGroup("");
    setBranchId("");
    setDescription("");
    setStatus("ACTIVE");
    setEkipiNeEditim(null);
  }

  function hapShtimin() {
    pastroFormularin();
    setShfaqFormularin(true);
  }

  function hapEditimin(team: Team) {
    setEkipiNeEditim(team);
    setName(team.name);
    setSport(team.sport);
    setAgeGroup(team.ageGroup || "");
    setBranchId(team.branch?.id || "");
    setDescription(team.description || "");
    setStatus(team.status);
    setShfaqFormularin(true);
  }

  async function ruajEkipin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setGabimi("");
    setDukeRuajtur(true);

    try {
      const url = ekipiNeEditim
        ? `/api/teams/${ekipiNeEditim.id}`
        : "/api/teams";

      const response = await fetch(url, {
        method: ekipiNeEditim ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          sport,
          ageGroup,
          branchId,
          description,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setGabimi(data.error || "Ekipi nuk mund të ruhej.");
        return;
      }

      setShfaqFormularin(false);
      pastroFormularin();

      await merrEkipet();
    } catch {
      setGabimi("Ndodhi një problem gjatë ruajtjes së ekipit.");
    } finally {
      setDukeRuajtur(false);
    }
  }

  async function fshiEkipin() {
    if (!ekipiPerFshirje) return;

    setDukeFshire(true);
    setGabimi("");

    try {
      const response = await fetch(
        `/api/teams/${ekipiPerFshirje.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setGabimi(data.error || "Ekipi nuk mund të fshihej.");
        return;
      }

      setEkipiPerFshirje(null);

      if (ekipiAktiv?.id === ekipiPerFshirje.id) {
        setEkipiAktiv(null);
      }

      await merrEkipet();
    } catch {
      setGabimi("Ndodhi një problem gjatë fshirjes së ekipit.");
    } finally {
      setDukeFshire(false);
    }
  }

  async function hapMenaxhimin(team: Team) {
    setEkipiAktiv(team);
    setSportistet([]);
    setGabimiSportisteve("");
    setDukeNgarkuarSportistet(true);

    try {
      const response = await fetch(
        `/api/teams/${team.id}/players`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setGabimiSportisteve(
          data.error || "Sportistët nuk mund të ngarkoheshin."
        );
        return;
      }

      setSportistet(data.players || []);
    } catch {
      setGabimiSportisteve(
        "Ndodhi një problem gjatë ngarkimit të sportistëve."
      );
    } finally {
      setDukeNgarkuarSportistet(false);
    }
  }

  async function rifreskoSportistet(teamId: string) {
    const response = await fetch(
      `/api/teams/${teamId}/players`,
      {
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (response.ok) {
      setSportistet(data.players || []);
    }
  }

  async function ndryshoSportistin(player: TeamPlayer) {
    if (!ekipiAktiv) return;

    setSportistiNeProces(player.id);
    setGabimiSportisteve("");

    try {
      const response = await fetch(
        `/api/teams/${ekipiAktiv.id}/players`,
        {
          method: player.isInTeam ? "DELETE" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            playerId: player.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setGabimiSportisteve(
          data.error || "Ndryshimi nuk mund të përfundohej."
        );
        return;
      }

      await rifreskoSportistet(ekipiAktiv.id);
      await merrEkipet();
    } catch {
      setGabimiSportisteve(
        "Ndodhi një problem gjatë ndryshimit të ekipit."
      );
    } finally {
      setSportistiNeProces(null);
    }
  }

  return (
    <AppShell>
      <section className="mb-6 overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-violet-50 shadow-sm">
        <div className="flex flex-col gap-6 px-5 py-6 sm:px-7 sm:py-7 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-blue-700 shadow-sm">
              <ShieldCheck className="h-4 w-4" />
              Menaxhimi sportiv
            </div>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Ekipet
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Menaxho ekipet, grupmoshat, degët dhe sportistët e akademisë aktive.
            </p>
          </div>

          <button
            onClick={hapShtimin}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md"
          >
            <Plus size={18} />
            Shto ekip
          </button>
        </div>
      </section>

      {gabimi && (
        <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {gabimi}
        </div>
      )}

      {shfaqFormularin && (
        <div className="mb-6 overflow-hidden rounded-[26px] border border-blue-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-blue-100 bg-gradient-to-r from-blue-50 via-white to-violet-50 px-5 py-4 sm:px-6">
            <h2 className="text-lg font-bold tracking-tight text-slate-950">
              {ekipiNeEditim ? "Edito ekipin" : "Ekip i ri"}
            </h2>

            <button
              onClick={() => {
                setShfaqFormularin(false);
                pastroFormularin();
              }}
              className="rounded-xl border border-blue-100 bg-white p-2 text-slate-500 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              aria-label="Mbyll"
            >
              <X size={19} />
            </button>
          </div>

          <form
            onSubmit={ruajEkipin}
            className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3"
          >
            <label className="text-xs font-semibold text-slate-600">
              Emri i ekipit
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="U17"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Sporti
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
              >
                {sportet.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Grupmosha
              <input
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                placeholder="U17"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Dega
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
              >
                <option value="">Pa degë të përcaktuar</option>

                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Statusi
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
              >
                <option value="ACTIVE">Aktiv</option>
                <option value="INACTIVE">Joaktiv</option>
                <option value="ARCHIVED">Arkivuar</option>
              </select>
            </label>

            <label className="text-xs font-semibold text-slate-600 sm:col-span-2 xl:col-span-3">
              Përshkrimi
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Përshkrim i shkurtër"
                rows={3}
                className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </label>

            <div className="flex justify-end sm:col-span-2 xl:col-span-3">
              <button
                type="submit"
                disabled={dukeRuajtur}
                className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {dukeRuajtur
                  ? "Duke ruajtur..."
                  : ekipiNeEditim
                    ? "Ruaj ndryshimet"
                    : "Ruaj ekipin"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-[24px] border border-blue-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-blue-100 bg-gradient-to-r from-blue-50/70 via-white to-violet-50/60 px-5 py-4">
          <div>
            <h2 className="font-bold text-slate-950">
              Lista e ekipeve
            </h2>

            <p className="mt-0.5 text-xs text-slate-400">
              {teams.length} ekipe
            </p>
          </div>

          <button
            onClick={merrEkipet}
            className="rounded-xl border border-blue-100 bg-white p-2 text-slate-500 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            aria-label="Rifresko"
          >
            <RefreshCw size={17} />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Duke ngarkuar ekipet...
          </div>
        ) : teams.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <ShieldCheck size={40} className="text-slate-300" />

            <p className="mt-3 font-semibold text-slate-700">
              Nuk ka ende ekipe
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Krijo ekipin e parë të akademisë.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
            {teams.map((team) => (
              <div
                key={team.id}
                onDragEnter={() =>
                  levizEkipin(team.id)
                }
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                }}
                className={`flex h-full flex-col rounded-[20px] border bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md ${ekipiNeTerheqje === team.id ? "border-blue-300 opacity-70 ring-2 ring-blue-100" : "border-slate-200/80"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-bold text-slate-950">
                      {team.name}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-blue-700">
                      {perkthimSporti(team.sport)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      draggable={!dukeRuajturRenditjen}
                      onDragStart={(event) =>
                        nisTerheqjen(
                          event,
                          team.id
                        )
                      }
                      onDragEnd={
                        perfundoTerheqjen
                      }
                      disabled={dukeRuajturRenditjen}
                      className="cursor-grab rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-slate-400 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Rendit ${team.name}`}
                      title="Tërhiq për të ndryshuar renditjen"
                    >
                      <GripVertical size={15} />
                    </button>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ring-current/10 ${klasaStatusit(
                      team.status
                    )}`}
                  >
                    {perkthimStatusi(team.status)}
                  </span>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-500">
                  <div className="flex items-center justify-between">
                    <span>Grupmosha</span>
                    <span className="font-semibold text-slate-800">
                      {team.ageGroup || "—"}
                    </span>
                  </div>


                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <UsersRound size={15} />
                      Sportistë
                    </span>

                    <span className="font-semibold text-slate-800">
                      {team._count.players}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <MapPin size={15} />
                      Dega
                    </span>

                    <span className="font-semibold text-slate-800">
                      {team.branch?.name || "—"}
                    </span>
                  </div>
                </div>

                {team.description && (
                  <p className="mt-4 line-clamp-2 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-400">
                    {team.description}
                  </p>
                )}

                <Link
                  href={`/ekipet/${team.id}`}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  Hap profilin e ekipit
                  <ArrowRight size={16} />
                </Link>

                <button
                  onClick={() => hapMenaxhimin(team)}
                  className="mt-2 w-full rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-2.5 text-xs font-semibold text-blue-700 transition hover:border-blue-200 hover:bg-blue-100"
                >
                  Menaxho sportistët
                </button>

                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => hapEditimin(team)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <Pencil size={15} />
                    Edito
                  </button>

                  <button
                    onClick={() => setEkipiPerFshirje(team)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-100 bg-white px-3 py-2 text-xs font-semibold text-rose-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                  >
                    <Trash2 size={15} />
                    Fshi
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {ekipiAktiv && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-[30px] border border-blue-100 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-blue-100 bg-gradient-to-r from-blue-50 via-white to-violet-50 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Menaxho sportistët
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Ekipi: {ekipiAktiv.name}
                </p>
              </div>

              <button
                onClick={() => setEkipiAktiv(null)}
                className="rounded-xl border border-blue-100 bg-white p-2 text-slate-500 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                aria-label="Mbyll"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto bg-slate-50/40 p-5 sm:p-6">
              {gabimiSportisteve && (
                <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {gabimiSportisteve}
                </div>
              )}

              {dukeNgarkuarSportistet ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  Duke ngarkuar sportistët...
                </p>
              ) : sportistet.length === 0 ? (
                <div className="py-10 text-center">
                  <UsersRound
                    size={38}
                    className="mx-auto text-slate-300"
                  />

                  <p className="mt-3 font-semibold text-slate-700">
                    Nuk ka sportistë të regjistruar
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    Shto më parë sportistë nga menuja Sportistët.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sportistet.map((player) => (
                    <div
                      key={player.id}
                      className="flex flex-col gap-3 rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-slate-950">
                          {player.firstName} {player.lastName}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {player.position || "Pa pozicion"}
                          {player.jerseyNumber !== null
                            ? ` · Fanella ${player.jerseyNumber}`
                            : ""}
                        </p>
                      </div>

                      <button
                        disabled={sportistiNeProces === player.id}
                        onClick={() => ndryshoSportistin(player)}
                        className={
                          player.isInTeam
                            ? "inline-flex items-center justify-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:border-rose-200 hover:bg-rose-100 disabled:opacity-50"
                            : "inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:border-emerald-200 hover:bg-emerald-100 disabled:opacity-50"
                        }
                      >
                        {player.isInTeam ? (
                          <>
                            <UserMinus size={15} />
                            Hiq nga ekipi
                          </>
                        ) : (
                          <>
                            <UserPlus size={15} />
                            Shto në ekip
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {ekipiPerFshirje && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-rose-100 bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold tracking-tight text-slate-950">
              Fshi ekipin?
            </h2>

            <p className="mt-3 rounded-2xl border border-rose-100 bg-rose-50/60 p-4 text-sm leading-6 text-slate-600">
              Je i sigurt që dëshiron të fshish{" "}
              <strong className="text-slate-800">
                {ekipiPerFshirje.name}
              </strong>
              ? Sportistët nuk do të fshihen, por lidhjet e tyre me këtë ekip
              do të hiqen.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setEkipiPerFshirje(null)}
                disabled={dukeFshire}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Anulo
              </button>

              <button
                onClick={fshiEkipin}
                disabled={dukeFshire}
                className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {dukeFshire ? "Duke fshirë..." : "Po, fshi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
