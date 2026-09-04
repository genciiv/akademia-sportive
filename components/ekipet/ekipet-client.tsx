"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Plus,
  RefreshCw,
  ShieldCheck,
  UsersRound,
  MapPin,
  X,
  UserPlus,
  UserMinus,
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
  season: string | null;
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
  return (
    sportet.find((item) => item.value === sport)?.label ||
    sport
  );
}

export default function EkipetClient() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [loading, setLoading] = useState(true);
  const [dukeRuajtur, setDukeRuajtur] = useState(false);
  const [shfaqFormularin, setShfaqFormularin] = useState(false);
  const [gabimi, setGabimi] = useState("");

  const [name, setName] = useState("");
  const [sport, setSport] = useState("FOOTBALL");
  const [ageGroup, setAgeGroup] = useState("");
  const [season, setSeason] = useState("2026/27");
  const [branchId, setBranchId] = useState("");
  const [description, setDescription] = useState("");

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
        setGabimi(
          data.error || "Ekipet nuk mund të ngarkoheshin."
        );
        return;
      }

      setTeams(data.teams || []);
      setBranches(data.branches || []);
    } catch {
      setGabimi(
        "Ndodhi një problem gjatë ngarkimit të ekipeve."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    merrEkipet();
  }, []);

  async function shtoEkip(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setGabimi("");
    setDukeRuajtur(true);

    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          sport,
          ageGroup,
          season,
          branchId,
          description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setGabimi(
          data.error || "Ekipi nuk mund të krijohej."
        );
        return;
      }

      setName("");
      setSport("FOOTBALL");
      setAgeGroup("");
      setSeason("2026/27");
      setBranchId("");
      setDescription("");
      setShfaqFormularin(false);

      await merrEkipet();
    } catch {
      setGabimi(
        "Ndodhi një problem gjatë krijimit të ekipit."
      );
    } finally {
      setDukeRuajtur(false);
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
          data.error ||
            "Sportistët nuk mund të ngarkoheshin."
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

  async function ndryshoSportistin(
    player: TeamPlayer
  ) {
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
          data.error ||
            "Ndryshimi nuk mund të përfundohej."
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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">
            Ekipet
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Menaxho ekipet dhe grupmoshat e akademisë aktive.
          </p>
        </div>

        <button
          onClick={() =>
            setShfaqFormularin((vlera) => !vlera)
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          <Plus size={18} />
          Shto ekip
        </button>
      </div>

      {shfaqFormularin && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">
            Ekip i ri
          </h2>

          <form
            onSubmit={shtoEkip}
            className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            <label className="text-xs font-semibold text-slate-600">
              Emri i ekipit
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="U17"
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
              />
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Sporti
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
              >
                {sportet.map((item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Grupmosha
              <input
                value={ageGroup}
                onChange={(e) =>
                  setAgeGroup(e.target.value)
                }
                placeholder="U17"
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
              />
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Sezoni
              <input
                value={season}
                onChange={(e) =>
                  setSeason(e.target.value)
                }
                placeholder="2026/27"
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
              />
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Dega
              <select
                value={branchId}
                onChange={(e) =>
                  setBranchId(e.target.value)
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
              >
                <option value="">
                  Pa degë të përcaktuar
                </option>

                {branches.map((branch) => (
                  <option
                    key={branch.id}
                    value={branch.id}
                  >
                    {branch.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Përshkrimi
              <input
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                placeholder="Përshkrim i shkurtër"
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
              />
            </label>

            <div className="flex justify-end sm:col-span-2 xl:col-span-3">
              <button
                type="submit"
                disabled={dukeRuajtur}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {dukeRuajtur
                  ? "Duke ruajtur..."
                  : "Ruaj ekipin"}
              </button>
            </div>
          </form>
        </div>
      )}

      {gabimi && (
        <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {gabimi}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
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
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
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
            <ShieldCheck
              size={40}
              className="text-slate-300"
            />

            <p className="mt-3 font-semibold text-slate-700">
              Nuk ka ende ekipe
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Krijo ekipin e parë të akademisë.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {teams.map((team) => (
              <div
                key={team.id}
                className="rounded-2xl border border-slate-200 p-5 transition hover:border-blue-200 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold text-slate-950">
                      {team.name}
                    </p>

                    <p className="mt-1 text-sm font-medium text-blue-700">
                      {perkthimSporti(team.sport)}
                    </p>
                  </div>

                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    Aktiv
                  </span>
                </div>

                <div className="mt-5 space-y-2 text-sm text-slate-500">
                  <div className="flex items-center justify-between">
                    <span>Grupmosha</span>
                    <span className="font-semibold text-slate-800">
                      {team.ageGroup || "—"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Sezoni</span>
                    <span className="font-semibold text-slate-800">
                      {team.season || "—"}
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
                  <p className="mt-4 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-400">
                    {team.description}
                  </p>
                )}

                <button
                  onClick={() => hapMenaxhimin(team)}
                  className="mt-5 w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                >
                  Menaxho sportistët
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {ekipiAktiv && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
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
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Mbyll"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-5">
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
                      className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
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
                        onClick={() =>
                          ndryshoSportistin(player)
                        }
                        className={
                          player.isInTeam
                            ? "inline-flex items-center justify-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                            : "inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
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
    </AppShell>
  );
}