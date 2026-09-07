"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  TimerReset,
  Trash2,
  UserRound,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";

type SessionStatus =
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED";

type TeamOption = {
  id: string;
  name: string;
};

type CoachOption = {
  id: string;
  firstName: string;
  lastName: string;
};

type BranchOption = {
  id: string;
  name: string;
};

type AttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "LATE"
  | "EXCUSED";

type AttendancePlayer = {
  id: string;
  firstName: string;
  lastName: string;
  position: string | null;
  jerseyNumber: number | null;
  status: string;
  attendance: {
    id: string;
    status: AttendanceStatus;
    note: string | null;
  } | null;
};

type SessionDrill = {
  id: string;
  drillId: string;
  order: number;
  durationMin: number | null;
  notes: string | null;
  drill: {
    id: string;
    name: string;
    category: string | null;
    sport: string | null;
    objective: string | null;
    durationMin: number | null;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    equipment: string | null;
    description: string | null;
    isActive: boolean;
  };
};

type AvailableDrill = {
  id: string;
  name: string;
  category: string | null;
  sport: string | null;
  objective: string | null;
  durationMin: number | null;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  equipment: string | null;
};

type TrainingPlanStatistics = {
  totalDrills: number;
  totalDurationMin: number;
};

type AttendanceStatistics = {
  total: number;
  marked: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
};

type TrainingSession = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  description: string | null;
  notes: string | null;
  status: SessionStatus;

  team: {
    id: string;
    name: string;
  };

  coach: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;

  branch: {
    id: string;
    name: string;
  } | null;

  _count: {
    attendances: number;
  };
};

function statusiShqip(status: SessionStatus) {
  const labels: Record<SessionStatus, string> = {
    SCHEDULED: "Planifikuar",
    COMPLETED: "Përfunduar",
    CANCELLED: "Anuluar",
  };

  return labels[status];
}

function klasaStatusit(status: SessionStatus) {
  if (status === "COMPLETED") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (status === "CANCELLED") {
    return "bg-red-50 text-red-700 ring-red-100";
  }

  return "bg-blue-50 text-blue-700 ring-blue-100";
}

function ikonaStatusit(status: SessionStatus) {
  if (status === "COMPLETED") {
    return CheckCircle2;
  }

  if (status === "CANCELLED") {
    return XCircle;
  }

  return Clock3;
}

const DITET_SHQIP = [
  "Die",
  "Hën",
  "Mar",
  "Mër",
  "Enj",
  "Pre",
  "Sht",
];

const MUAJT_SHQIP = [
  "Jan",
  "Shk",
  "Mar",
  "Pri",
  "Maj",
  "Qer",
  "Kor",
  "Gus",
  "Sht",
  "Tet",
  "Nën",
  "Dhj",
];

function dyShifror(value: number) {
  return String(value).padStart(2, "0");
}

function dataShqip(value: string) {
  const date = new Date(value);

  return `${DITET_SHQIP[date.getDay()]}, ${dyShifror(
    date.getDate()
  )} ${MUAJT_SHQIP[date.getMonth()]} ${date.getFullYear()}`;
}

function vetemData(value: string) {
  const date = new Date(value);

  return `${dyShifror(date.getDate())} ${
    MUAJT_SHQIP[date.getMonth()]
  }`;
}

function ora(value: string) {
  const date = new Date(value);

  return `${dyShifror(date.getHours())}:${dyShifror(
    date.getMinutes()
  )}`;
}

function dateTimeLocal(value: string | null) {
  if (!value) return "";

  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);

  return local.toISOString().slice(0, 16);
}

export default function SeancatClient() {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [coaches, setCoaches] = useState<CoachOption[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [gabimi, setGabimi] = useState("");

  const [shfaqFormularin, setShfaqFormularin] =
    useState(false);

  const [seancaNeEditim, setSeancaNeEditim] =
    useState<TrainingSession | null>(null);

  const [seancaPerFshirje, setSeancaPerFshirje] =
    useState<TrainingSession | null>(null);

  const [seancaEDetajuar, setSeancaEDetajuar] =
    useState<TrainingSession | null>(null);

  const [sportistetPjesemarrjes, setSportistetPjesemarrjes] =
    useState<AttendancePlayer[]>([]);

  const [statistikatPjesemarrjes, setStatistikatPjesemarrjes] =
    useState<AttendanceStatistics | null>(null);

  const [dukeNgarkuarPjesemarrjen, setDukeNgarkuarPjesemarrjen] =
    useState(false);

  const [sportistiNeProces, setSportistiNeProces] =
    useState<string | null>(null);

  const [ushtrimetESeances, setUshtrimetESeances] =
    useState<SessionDrill[]>([]);

  const [ushtrimetEDisponueshme, setUshtrimetEDisponueshme] =
    useState<AvailableDrill[]>([]);

  const [statistikatPlanit, setStatistikatPlanit] =
    useState<TrainingPlanStatistics | null>(null);

  const [dukeNgarkuarPlanin, setDukeNgarkuarPlanin] =
    useState(false);

  const [dukeRuajturPlanin, setDukeRuajturPlanin] =
    useState(false);

  const [drillIdPerShtim, setDrillIdPerShtim] =
    useState("");

  const [kohezgjatjaDrill, setKohezgjatjaDrill] =
    useState("");

  const [shenimiDrill, setShenimiDrill] =
    useState("");


  const [ushtrimiNeEditim, setUshtrimiNeEditim] =
    useState<SessionDrill | null>(null);

  const [kohezgjatjaNeEditim, setKohezgjatjaNeEditim] =
    useState("");

  const [shenimiNeEditim, setShenimiNeEditim] =
    useState("");
const [dukeRuajtur, setDukeRuajtur] = useState(false);
  const [dukeFshire, setDukeFshire] = useState(false);

  const [title, setTitle] = useState("");
  const [teamId, setTeamId] = useState("");
  const [coachId, setCoachId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] =
    useState<SessionStatus>("SCHEDULED");

  async function merrSeancat() {
    setLoading(true);
    setGabimi("");

    try {
      const response = await fetch(
        "/api/training-sessions",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setGabimi(
          data.error ||
            "Seancat nuk mund të ngarkoheshin."
        );
        return;
      }

      setSessions(data.sessions || []);
      setTeams(data.teams || []);
      setCoaches(data.coaches || []);
      setBranches(data.branches || []);
    } catch {
      setGabimi(
        "Ndodhi një problem gjatë ngarkimit të seancave."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    merrSeancat();
  }, []);

  const tani = new Date();

  const upcomingSessions = useMemo(
    () =>
      sessions.filter(
        (session) =>
          session.status === "SCHEDULED" &&
          new Date(session.startsAt) >= tani
      ),
    [sessions]
  );

  const nextSession = upcomingSessions[0] || null;

  const completedCount = sessions.filter(
    (session) => session.status === "COMPLETED"
  ).length;

  const scheduledCount = sessions.filter(
    (session) => session.status === "SCHEDULED"
  ).length;

  const cancelledCount = sessions.filter(
    (session) => session.status === "CANCELLED"
  ).length;

  const ditet = useMemo(() => {
    const result = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + i);

      const count = sessions.filter((session) => {
        const sessionDate = new Date(session.startsAt);

        return (
          sessionDate.getFullYear() === date.getFullYear() &&
          sessionDate.getMonth() === date.getMonth() &&
          sessionDate.getDate() === date.getDate()
        );
      }).length;

      result.push({
        date,
        count,
      });
    }

    return result;
  }, [sessions]);

  function pastroFormularin() {
    setTitle("");
    setTeamId(teams[0]?.id || "");
    setCoachId("");
    setBranchId("");
    setStartsAt("");
    setEndsAt("");
    setLocation("");
    setDescription("");
    setNotes("");
    setStatus("SCHEDULED");
    setSeancaNeEditim(null);
  }

  function hapShtimin() {
    pastroFormularin();

    if (teams.length > 0) {
      setTeamId(teams[0].id);
    }

    setShfaqFormularin(true);
  }

  function hapEditimin(session: TrainingSession) {
    setSeancaNeEditim(session);
    setTitle(session.title);
    setTeamId(session.team.id);
    setCoachId(session.coach?.id || "");
    setBranchId(session.branch?.id || "");
    setStartsAt(dateTimeLocal(session.startsAt));
    setEndsAt(dateTimeLocal(session.endsAt));
    setLocation(session.location || "");
    setDescription(session.description || "");
    setNotes(session.notes || "");
    setStatus(session.status);
    setShfaqFormularin(true);
  }

  async function ruajSeancen(event: FormEvent) {
    event.preventDefault();
    setDukeRuajtur(true);
    setGabimi("");

    try {
      const url = seancaNeEditim
        ? `/api/training-sessions/${seancaNeEditim.id}`
        : "/api/training-sessions";

      const response = await fetch(url, {
        method: seancaNeEditim ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          teamId,
          coachId,
          branchId,
          startsAt,
          endsAt,
          location,
          description,
          notes,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setGabimi(
          data.error ||
            "Seanca nuk mund të ruhej."
        );
        return;
      }

      setShfaqFormularin(false);
      pastroFormularin();
      await merrSeancat();
    } catch {
      setGabimi(
        "Ndodhi një problem gjatë ruajtjes së seancës."
      );
    } finally {
      setDukeRuajtur(false);
    }
  }

  async function merrPjesemarrjen(sessionId: string) {
    setDukeNgarkuarPjesemarrjen(true);
    setGabimi("");

    try {
      const response = await fetch(
        `/api/training-sessions/${sessionId}/attendance`,
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok) {
        setGabimi(
          data.error ||
            "Pjesëmarrja nuk mund të ngarkohej."
        );
        return;
      }

      setSportistetPjesemarrjes(data.players || []);
      setStatistikatPjesemarrjes(data.statistics || null);
    } catch {
      setGabimi(
        "Ndodhi një problem gjatë ngarkimit të pjesëmarrjes."
      );
    } finally {
      setDukeNgarkuarPjesemarrjen(false);
    }
  }

  async function ndryshoPjesemarrjen(
    playerId: string,
    attendanceStatus: AttendanceStatus
  ) {
    if (!seancaEDetajuar) return;

    setSportistiNeProces(playerId);
    setGabimi("");

    try {
      const response = await fetch(
        `/api/training-sessions/${seancaEDetajuar.id}/attendance`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            playerId,
            status: attendanceStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setGabimi(
          data.error ||
            "Pjesëmarrja nuk mund të përditësohej."
        );
        return;
      }

      await merrPjesemarrjen(seancaEDetajuar.id);
      await merrSeancat();
    } catch {
      setGabimi(
        "Ndodhi një problem gjatë përditësimit të pjesëmarrjes."
      );
    } finally {
      setSportistiNeProces(null);
    }
  }

  async function fshiPjesemarrjen(playerId: string) {
    if (!seancaEDetajuar) return;

    setSportistiNeProces(playerId);
    setGabimi("");

    try {
      const response = await fetch(
        `/api/training-sessions/${seancaEDetajuar.id}/attendance`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ playerId }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setGabimi(
          data.error ||
            "Pjesëmarrja nuk mund të hiqej."
        );
        return;
      }

      await merrPjesemarrjen(seancaEDetajuar.id);
      await merrSeancat();
    } catch {
      setGabimi(
        "Ndodhi një problem gjatë heqjes së pjesëmarrjes."
      );
    } finally {
      setSportistiNeProces(null);
    }
  }

  async function hapDetajet(session: TrainingSession) {
    setSeancaEDetajuar(session);

    setSportistetPjesemarrjes([]);
    setStatistikatPjesemarrjes(null);

    setUshtrimetESeances([]);
    setUshtrimetEDisponueshme([]);
    setStatistikatPlanit(null);

    setDrillIdPerShtim("");
    setKohezgjatjaDrill("");
    setShenimiDrill("");

    await Promise.all([
      merrPjesemarrjen(session.id),
      merrPlaninEStervitjes(session.id),
    ]);
  }

  async function merrPlaninEStervitjes(sessionId: string) {
    setDukeNgarkuarPlanin(true);

    try {
      const response = await fetch(
        `/api/training-sessions/${sessionId}/drills`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setGabimi(
          data.error ||
            "Plani i stërvitjes nuk mund të ngarkohej."
        );
        return;
      }

      setUshtrimetESeances(data.sessionDrills || []);
      setUshtrimetEDisponueshme(
        data.availableDrills || []
      );
      setStatistikatPlanit(
        data.statistics || null
      );
    } catch {
      setGabimi(
        "Ndodhi një problem gjatë ngarkimit të planit të stërvitjes."
      );
    } finally {
      setDukeNgarkuarPlanin(false);
    }
  }

  async function shtoUshtrimNeSeance() {
    if (!seancaEDetajuar || !drillIdPerShtim) {
      return;
    }

    setDukeRuajturPlanin(true);
    setGabimi("");

    try {
      const response = await fetch(
        `/api/training-sessions/${seancaEDetajuar.id}/drills`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            drillId: drillIdPerShtim,
            durationMin: kohezgjatjaDrill,
            notes: shenimiDrill,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setGabimi(
          data.error ||
            "Ushtrimi nuk mund të shtohej në seancë."
        );
        return;
      }

      setDrillIdPerShtim("");
      setKohezgjatjaDrill("");
      setShenimiDrill("");

      await merrPlaninEStervitjes(
        seancaEDetajuar.id
      );
    } catch {
      setGabimi(
        "Ndodhi një problem gjatë shtimit të ushtrimit."
      );
    } finally {
      setDukeRuajturPlanin(false);
    }
  }

  function hapEditiminEUshtrimit(
    item: SessionDrill
  ) {
    setUshtrimiNeEditim(item);

    setKohezgjatjaNeEditim(
      String(
        item.durationMin ??
          item.drill.durationMin ??
          ""
      )
    );

    setShenimiNeEditim(
      item.notes ?? ""
    );

    setGabimi("");
  }

  function mbyllEditiminEUshtrimit() {
    setUshtrimiNeEditim(null);
    setKohezgjatjaNeEditim("");
    setShenimiNeEditim("");
  }

  async function ruajNdryshimetEUshtrimit() {
    if (!seancaEDetajuar || !ushtrimiNeEditim) {
      return;
    }

    const durationMin = Number(
      kohezgjatjaNeEditim
    );

    if (
      !Number.isInteger(durationMin) ||
      durationMin <= 0
    ) {
      setGabimi(
        "Kohëzgjatja duhet të jetë numër i plotë pozitiv."
      );
      return;
    }

    setDukeRuajturPlanin(true);
    setGabimi("");

    try {
      const response = await fetch(
        `/api/training-sessions/${seancaEDetajuar.id}/drills`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionDrillId: ushtrimiNeEditim.id,
            durationMin,
            notes: shenimiNeEditim,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setGabimi(
          data.error ||
            "Ndryshimet nuk mund të ruheshin."
        );
        return;
      }

      mbyllEditiminEUshtrimit();

      await merrPlaninEStervitjes(
        seancaEDetajuar.id
      );
    } catch {
      setGabimi(
        "Ndodhi një problem gjatë ruajtjes së ndryshimeve."
      );
    } finally {
      setDukeRuajturPlanin(false);
    }
  }

  async function ndryshoRenditjen(
    item: SessionDrill,
    drejtimi: "UP" | "DOWN"
  ) {
    if (!seancaEDetajuar) return;

    const index = ushtrimetESeances.findIndex(
      (element) => element.id === item.id
    );

    const targetIndex =
      drejtimi === "UP"
        ? index - 1
        : index + 1;

    if (
      index < 0 ||
      targetIndex < 0 ||
      targetIndex >= ushtrimetESeances.length
    ) {
      return;
    }

    const target = ushtrimetESeances[targetIndex];

    setDukeRuajturPlanin(true);
    setGabimi("");

    try {
      const firstResponse = await fetch(
        `/api/training-sessions/${seancaEDetajuar.id}/drills`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionDrillId: item.id,
            durationMin: item.durationMin,
            notes: item.notes,
            order: target.order,
          }),
        }
      );

      if (!firstResponse.ok) {
        const data = await firstResponse.json();

        setGabimi(
          data.error ||
            "Renditja nuk mund të ndryshohej."
        );
        return;
      }

      const secondResponse = await fetch(
        `/api/training-sessions/${seancaEDetajuar.id}/drills`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionDrillId: target.id,
            durationMin: target.durationMin,
            notes: target.notes,
            order: item.order,
          }),
        }
      );

      if (!secondResponse.ok) {
        const data = await secondResponse.json();

        setGabimi(
          data.error ||
            "Renditja nuk mund të ndryshohej."
        );
        return;
      }

      await merrPlaninEStervitjes(
        seancaEDetajuar.id
      );
    } catch {
      setGabimi(
        "Ndodhi një problem gjatë ndryshimit të renditjes."
      );
    } finally {
      setDukeRuajturPlanin(false);
    }
  }

  async function hiqUshtrimNgaSeanca(
    sessionDrillId: string
  ) {
    if (!seancaEDetajuar) return;

    setDukeRuajturPlanin(true);
    setGabimi("");

    try {
      const response = await fetch(
        `/api/training-sessions/${seancaEDetajuar.id}/drills`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionDrillId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setGabimi(
          data.error ||
            "Ushtrimi nuk mund të hiqej nga seanca."
        );
        return;
      }

      await merrPlaninEStervitjes(
        seancaEDetajuar.id
      );
    } catch {
      setGabimi(
        "Ndodhi një problem gjatë heqjes së ushtrimit."
      );
    } finally {
      setDukeRuajturPlanin(false);
    }
  }

  async function fshiSeancen() {
    if (!seancaPerFshirje) return;

    setDukeFshire(true);
    setGabimi("");

    try {
      const response = await fetch(
        `/api/training-sessions/${seancaPerFshirje.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setGabimi(
          data.error ||
            "Seanca nuk mund të fshihej."
        );
        return;
      }

      setSeancaPerFshirje(null);
      await merrSeancat();
    } catch {
      setGabimi(
        "Ndodhi një problem gjatë fshirjes së seancës."
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
                Seancat stërvitore
              </h1>

              <Sparkles
                size={20}
                className="text-blue-600"
              />
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Planifiko, organizo dhe monitoro stërvitjet e
              akademisë.
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
            Planifiko seancë
          </button>
        </div>

        {gabimi && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {gabimi}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            title="Të planifikuara"
            value={scheduledCount}
            subtitle="Seanca aktive"
            icon={CalendarDays}
          />

          <StatCard
            title="Të përfunduara"
            value={completedCount}
            subtitle="Seanca të realizuara"
            icon={CheckCircle2}
          />

          <StatCard
            title="Të anuluara"
            value={cancelledCount}
            subtitle="Seanca të anuluara"
            icon={TimerReset}
          />
        </div>

        {nextSession && (
          <div className="group relative overflow-hidden rounded-[26px] bg-slate-950 p-6 text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-7">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute -bottom-24 right-28 h-52 w-52 rounded-full bg-indigo-500/10 blur-3xl" />

            <div className="relative grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-center">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-100 ring-1 ring-white/10">
                  <Clock3 size={14} />
                  Seanca e radhës
                </div>

                <h2 className="text-2xl font-bold sm:text-3xl">
                  {nextSession.title}
                </h2>

                <div className="mt-5 flex flex-wrap gap-3">
                  <InfoDark
                    icon={UsersRound}
                    text={nextSession.team.name}
                  />

                  <InfoDark
                    icon={UserRound}
                    text={
                      nextSession.coach
                        ? `${nextSession.coach.firstName} ${nextSession.coach.lastName}`
                        : "Pa trajner"
                    }
                  />

                  <InfoDark
                    icon={MapPin}
                    text={
                      nextSession.location ||
                      nextSession.branch?.name ||
                      "Pa vendndodhje"
                    }
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/10 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
                  Fillimi
                </p>

                <p className="mt-2 text-lg font-bold">
                  {dataShqip(nextSession.startsAt)}
                </p>

                <p className="mt-1 text-3xl font-bold text-blue-300">
                  {ora(nextSession.startsAt)}
                </p>

                {nextSession.endsAt && (
                  <p className="mt-2 text-xs text-slate-300">
                    Përfundon në {ora(nextSession.endsAt)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-950">
                7 ditët e ardhshme
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Pamje e shpejtë e ngarkesës stërvitore.
              </p>
            </div>

            <CalendarDays
              size={20}
              className="text-slate-400"
            />
          </div>

          <div className="grid grid-cols-7 gap-2">
            {ditet.map((item, index) => (
              <div
                key={item.date.toISOString()}
                className={`group rounded-2xl border p-3 text-center transition hover:-translate-y-1 hover:shadow-md ${
                  index === 0
                    ? "border-blue-200 bg-blue-50"
                    : "border-slate-200 bg-slate-50/60"
                }`}
              >
                <p className="text-[10px] font-semibold uppercase text-slate-400">
                  {["Die", "Hën", "Mar", "Mër", "Enj", "Pre", "Sht"][item.date.getDay()]}
                </p>

                <p className="mt-1 text-lg font-bold text-slate-900">
                  {item.date.getDate()}
                </p>

                <div
                  className={`mx-auto mt-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                    item.count > 0
                      ? "bg-blue-600 text-white"
                      : "bg-white text-slate-400"
                  }`}
                >
                  {item.count}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Të gjitha seancat
              </h2>

              <p className="text-sm text-slate-500">
                {sessions.length} seanca gjithsej
              </p>
            </div>

            <button
              onClick={merrSeancat}
              className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:rotate-180 hover:bg-slate-50"
              aria-label="Rifresko"
            >
              <RefreshCw size={17} />
            </button>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              Duke ngarkuar seancat...
            </div>
          ) : sessions.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <CalendarDays size={26} />
              </div>

              <h3 className="mt-4 font-bold text-slate-900">
                Nuk ka ende seanca
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Planifiko seancën e parë të akademisë.
              </p>

              <button
                onClick={hapShtimin}
                className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Planifiko seancë
              </button>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {sessions.map((session) => {
                const StatusIcon =
                  ikonaStatusit(session.status);

                return (
                  <article
                    key={session.id}
                    className="group relative overflow-hidden rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                  >
                    <div className="absolute left-0 top-0 h-full w-1 bg-blue-600 opacity-0 transition group-hover:opacity-100" />

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${klasaStatusit(
                            session.status
                          )}`}
                        >
                          <StatusIcon size={13} />
                          {statusiShqip(session.status)}
                        </span>

                        <h3 className="mt-3 text-lg font-bold text-slate-950">
                          {session.title}
                        </h3>

                        {session.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                            {session.description}
                          </p>
                        )}
                      </div>

                      <div className="rounded-2xl bg-slate-950 px-3 py-2 text-center text-white">
                        <p className="text-[10px] uppercase text-slate-400">
                          Ora
                        </p>
                        <p className="font-bold">
                          {ora(session.startsAt)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <MiniInfo
                        icon={CalendarDays}
                        label="Data"
                        value={vetemData(session.startsAt)}
                      />

                      <MiniInfo
                        icon={UsersRound}
                        label="Ekipi"
                        value={session.team.name}
                      />

                      <MiniInfo
                        icon={UserRound}
                        label="Trajneri"
                        value={
                          session.coach
                            ? `${session.coach.firstName} ${session.coach.lastName}`
                            : "Pa trajner"
                        }
                      />

                      <MiniInfo
                        icon={MapPin}
                        label="Vendndodhja"
                        value={
                          session.location ||
                          session.branch?.name ||
                          "Pa përcaktuar"
                        }
                      />
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <UsersRound size={14} />

                        <span>
                          {session._count.attendances} pjesëmarrje
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            hapEditimin(session)
                          }
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
                          aria-label="Edito"
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          onClick={() =>
                            setSeancaPerFshirje(session)
                          }
                          className="rounded-lg border border-red-100 p-2 text-red-600 transition hover:bg-red-50"
                          aria-label="Fshi"
                        >
                          <Trash2 size={15} />
                        </button>

                        <button
                          onClick={() => hapDetajet(session)}
                          className="rounded-lg bg-slate-950 p-2 text-white transition group-hover:bg-blue-600"
                          aria-label="Hap detajet"
                        >
                          <ChevronRight size={15} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {shfaqFormularin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[26px] bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  {seancaNeEditim
                    ? "Edito seancën"
                    : "Planifiko seancë"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Plotëso informacionin e stërvitjes.
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
              onSubmit={ruajSeancen}
              className="grid gap-5 p-6 sm:grid-cols-2"
            >
              <Field label="Titulli i seancës">
                <input
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  required
                  placeholder="p.sh. Teknikë dhe pasime"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </Field>

              <Field label="Ekipi">
                <select
                  value={teamId}
                  onChange={(event) =>
                    setTeamId(event.target.value)
                  }
                  required
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                >
                  <option value="">
                    Zgjidh ekipin
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
              </Field>

              <Field label="Trajneri">
                <select
                  value={coachId}
                  onChange={(event) =>
                    setCoachId(event.target.value)
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                >
                  <option value="">
                    Pa trajner të caktuar
                  </option>

                  {coaches.map((coach) => (
                    <option
                      key={coach.id}
                      value={coach.id}
                    >
                      {coach.firstName} {coach.lastName}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Dega">
                <select
                  value={branchId}
                  onChange={(event) =>
                    setBranchId(event.target.value)
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                >
                  <option value="">
                    Pa degë të caktuar
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
              </Field>

              <Field label="Fillimi">
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(event) =>
                    setStartsAt(event.target.value)
                  }
                  required
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </Field>

              <Field label="Përfundimi">
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(event) =>
                    setEndsAt(event.target.value)
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </Field>

              <Field label="Fusha / vendndodhja">
                <input
                  value={location}
                  onChange={(event) =>
                    setLocation(event.target.value)
                  }
                  placeholder="p.sh. Fusha 1"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </Field>

              <Field label="Statusi">
                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target.value as SessionStatus
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                >
                  <option value="SCHEDULED">
                    Planifikuar
                  </option>

                  <option value="COMPLETED">
                    Përfunduar
                  </option>

                  <option value="CANCELLED">
                    Anuluar
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
                    placeholder="Objektivi dhe përmbajtja e seancës..."
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 resize-none"
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
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 resize-none"
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
                    : seancaNeEditim
                      ? "Ruaj ndryshimet"
                      : "Planifiko seancën"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {seancaEDetajuar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[26px] bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 p-6">
              <div>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${klasaStatusit(
                    seancaEDetajuar.status
                  )}`}
                >
                  {statusiShqip(seancaEDetajuar.status)}
                </span>

                <h2 className="mt-3 text-2xl font-bold text-slate-950">
                  {seancaEDetajuar.title}
                </h2>

                {seancaEDetajuar.description && (
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {seancaEDetajuar.description}
                  </p>
                )}
              </div>

              <button
                onClick={() => setSeancaEDetajuar(null)}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
                aria-label="Mbyll"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <MiniInfo
                icon={UsersRound}
                label="Ekipi"
                value={seancaEDetajuar.team.name}
              />

              <MiniInfo
                icon={UserRound}
                label="Trajneri"
                value={
                  seancaEDetajuar.coach
                    ? `${seancaEDetajuar.coach.firstName} ${seancaEDetajuar.coach.lastName}`
                    : "Pa trajner"
                }
              />

              <MiniInfo
                icon={CalendarDays}
                label="Data"
                value={dataShqip(seancaEDetajuar.startsAt)}
              />

              <MiniInfo
                icon={Clock3}
                label="Ora"
                value={
                  seancaEDetajuar.endsAt
                    ? `${ora(seancaEDetajuar.startsAt)} - ${ora(seancaEDetajuar.endsAt)}`
                    : ora(seancaEDetajuar.startsAt)
                }
              />

              <MiniInfo
                icon={MapPin}
                label="Vendndodhja"
                value={
                  seancaEDetajuar.location ||
                  seancaEDetajuar.branch?.name ||
                  "Pa përcaktuar"
                }
              />

              <MiniInfo
                icon={UsersRound}
                label="Pjesëmarrja"
                value={`${seancaEDetajuar._count.attendances} sportistë`}
              />

              {seancaEDetajuar.branch && (
                <MiniInfo
                  icon={MapPin}
                  label="Dega"
                  value={seancaEDetajuar.branch.name}
                />
              )}

              {seancaEDetajuar.notes && (
                <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Shënime
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {seancaEDetajuar.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-950">
                    Plani i stërvitjes
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Organizo ushtrimet sipas rendit të realizimit.
                  </p>
                </div>

                {statistikatPlanit && (
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {statistikatPlanit.totalDrills} ushtrime
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {statistikatPlanit.totalDurationMin} minuta
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <select
                    value={drillIdPerShtim}
                    onChange={(event) => {
                      const value = event.target.value;

                      setDrillIdPerShtim(value);

                      const drill =
                        ushtrimetEDisponueshme.find(
                          (item) => item.id === value
                        );

                      setKohezgjatjaDrill(
                        drill?.durationMin
                          ? String(drill.durationMin)
                          : ""
                      );
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  >
                    <option value="">
                      Zgjidh ushtrimin
                    </option>

                    {ushtrimetEDisponueshme.map(
                      (drill) => (
                        <option
                          key={drill.id}
                          value={drill.id}
                        >
                          {drill.name}
                        </option>
                      )
                    )}
                  </select>

                  <input
                    type="number"
                    min="1"
                    value={kohezgjatjaDrill}
                    onChange={(event) =>
                      setKohezgjatjaDrill(
                        event.target.value
                      )
                    }
                    placeholder="Kohëzgjatja në minuta"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  />

                  <textarea
                    value={shenimiDrill}
                    onChange={(event) =>
                      setShenimiDrill(
                        event.target.value
                      )
                    }
                    rows={2}
                    placeholder="Shënim për këtë ushtrim..."
                    className="resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50 md:col-span-2"
                  />
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={shtoUshtrimNeSeance}
                    disabled={
                      !drillIdPerShtim ||
                      dukeRuajturPlanin
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus size={16} />
                    Shto në plan
                  </button>
                </div>
              </div>

              <div className="mt-5">
                {dukeNgarkuarPlanin ? (
                  <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
                    Duke ngarkuar planin...
                  </div>
                ) : ushtrimetESeances.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    Kjo seancë nuk ka ende ushtrime në plan.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ushtrimetESeances.map(
                      (item, index) => (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-slate-200 bg-white p-4"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex min-w-0 gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-bold text-white">
                                {item.order}
                              </div>

                              <div className="min-w-0">
                                <p className="font-semibold text-slate-950">
                                  {item.drill.name}
                                </p>

                                <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                                  <span>
                                    {item.durationMin ??
                                      item.drill.durationMin ??
                                      0}{" "}
                                    min
                                  </span>

                                  {item.drill.category && (
                                    <span>
                                      Â· {item.drill.category}
                                    </span>
                                  )}

                                  {item.drill.objective && (
                                    <span>
                                      Â· {item.drill.objective}
                                    </span>
                                  )}
                                </div>

                                {item.notes && (
                                  <p className="mt-2 text-xs leading-5 text-slate-600">
                                    {item.notes}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex shrink-0 flex-wrap gap-2">

                              <button
                                type="button"
                                disabled={dukeRuajturPlanin}
                                onClick={() =>
                                  hapEditiminEUshtrimit(
                                    item
                                  )
                                }
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                              >
                                Edito
                              </button>

                              <button
                                type="button"
                                disabled={
                                  index === 0 ||
                                  dukeRuajturPlanin
                                }
                                onClick={() =>
                                  ndryshoRenditjen(
                                    item,
                                    "UP"
                                  )
                                }
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                              >
                                Lart
                              </button>

                              <button
                                type="button"
                                disabled={
                                  index ===
                                    ushtrimetESeances.length -
                                      1 ||
                                  dukeRuajturPlanin
                                }
                                onClick={() =>
                                  ndryshoRenditjen(
                                    item,
                                    "DOWN"
                                  )
                                }
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                              >
                                Poshtë
                              </button>

                              <button
                                type="button"
                                disabled={
                                  dukeRuajturPlanin
                                }
                                onClick={() =>
                                  hiqUshtrimNgaSeanca(
                                    item.id
                                  )
                                }
                                className="rounded-lg border border-red-100 p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                                aria-label="Hiq nga plani"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-950">
                    Pjesëmarrja
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Regjistro praninë e sportistëve në këtë seancë.
                  </p>
                </div>

                {statistikatPjesemarrjes && (
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {statistikatPjesemarrjes.present} të pranishëm
                    </span>

                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                      {statistikatPjesemarrjes.absent} mungesa
                    </span>

                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                      {statistikatPjesemarrjes.late} vonë
                    </span>

                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {statistikatPjesemarrjes.excused} të justifikuar
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-5">
                {dukeNgarkuarPjesemarrjen ? (
                  <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
                    Duke ngarkuar sportistët...
                  </div>
                ) : sportistetPjesemarrjes.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    Ky ekip nuk ka sportistë aktivë.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sportistetPjesemarrjes.map((player) => (
                      <div
                        key={player.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                          <div>
                            <p className="font-semibold text-slate-950">
                              {player.firstName} {player.lastName}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {player.position || "Pa pozicion"}
                              {player.jerseyNumber !== null
                                ? ` Â· #${player.jerseyNumber}`
                                : ""}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <AttendanceButton
                              active={player.attendance?.status === "PRESENT"}
                              disabled={sportistiNeProces === player.id}
                              label="I pranishëm"
                              normalClass="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              activeClass="border-emerald-600 bg-emerald-600 text-white"
                              onClick={() =>
                                ndryshoPjesemarrjen(player.id, "PRESENT")
                              }
                            />

                            <AttendanceButton
                              active={player.attendance?.status === "ABSENT"}
                              disabled={sportistiNeProces === player.id}
                              label="Mungon"
                              normalClass="border-red-200 text-red-700 hover:bg-red-50"
                              activeClass="border-red-600 bg-red-600 text-white"
                              onClick={() =>
                                ndryshoPjesemarrjen(player.id, "ABSENT")
                              }
                            />

                            <AttendanceButton
                              active={player.attendance?.status === "LATE"}
                              disabled={sportistiNeProces === player.id}
                              label="Vonë"
                              normalClass="border-amber-200 text-amber-700 hover:bg-amber-50"
                              activeClass="border-amber-500 bg-amber-500 text-white"
                              onClick={() =>
                                ndryshoPjesemarrjen(player.id, "LATE")
                              }
                            />

                            <AttendanceButton
                              active={player.attendance?.status === "EXCUSED"}
                              disabled={sportistiNeProces === player.id}
                              label="I justifikuar"
                              normalClass="border-blue-200 text-blue-700 hover:bg-blue-50"
                              activeClass="border-blue-600 bg-blue-600 text-white"
                              onClick={() =>
                                ndryshoPjesemarrjen(player.id, "EXCUSED")
                              }
                            />

                            {player.attendance && (
                              <button
                                type="button"
                                disabled={sportistiNeProces === player.id}
                                onClick={() => fshiPjesemarrjen(player.id)}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
                              >
                                Pastro
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 p-6">
              <button
                onClick={() => {
                  const session = seancaEDetajuar;
                  setSeancaEDetajuar(null);
                  hapEditimin(session);
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <Pencil size={16} />
                Edito
              </button>

              <button
                onClick={() => setSeancaEDetajuar(null)}
                className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Mbyll
              </button>
            </div>
          </div>
        </div>
      )}
      {ushtrimiNeEditim && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-lg rounded-[24px] bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 p-6">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Edito ushtrimin
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {ushtrimiNeEditim.drill.name}
                </p>
              </div>

              <button
                type="button"
                onClick={mbyllEditiminEUshtrimit}
                disabled={dukeRuajturPlanin}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
                aria-label="Mbyll"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Kohëzgjatja në minuta
                </label>

                <input
                  type="number"
                  min="1"
                  value={kohezgjatjaNeEditim}
                  onChange={(event) =>
                    setKohezgjatjaNeEditim(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Shënime
                </label>

                <textarea
                  rows={4}
                  value={shenimiNeEditim}
                  onChange={(event) =>
                    setShenimiNeEditim(
                      event.target.value
                    )
                  }
                  placeholder="Shënime për këtë ushtrim..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 p-6">
              <button
                type="button"
                onClick={mbyllEditiminEUshtrimit}
                disabled={dukeRuajturPlanin}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Anulo
              </button>

              <button
                type="button"
                onClick={ruajNdryshimetEUshtrimit}
                disabled={
                  dukeRuajturPlanin ||
                  !kohezgjatjaNeEditim
                }
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {dukeRuajturPlanin
                  ? "Duke ruajtur..."
                  : "Ruaj ndryshimet"}
              </button>
            </div>
          </div>
        </div>
      )}



      {seancaPerFshirje && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <Trash2 size={22} />
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-950">
              Fshi seancën
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Je i sigurt që dëshiron të fshish{" "}
              <strong>
                {seancaPerFshirje.title}
              </strong>
              ?
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() =>
                  setSeancaPerFshirje(null)
                }
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium"
              >
                Anulo
              </button>

              <button
                onClick={fshiSeancen}
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
  value: number;
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
    <div className="rounded-xl bg-slate-50 p-3 transition group-hover:bg-blue-50/60">
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

function InfoDark({
  icon: Icon,
  text,
}: {
  icon: React.ElementType;
  text: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm text-slate-200 ring-1 ring-white/10">
      <Icon size={15} />
      {text}
    </div>
  );
}

function AttendanceButton({
  active,
  disabled,
  label,
  normalClass,
  activeClass,
  onClick,
}: {
  active: boolean;
  disabled: boolean;
  label: string;
  normalClass: string;
  activeClass: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${
        active ? activeClass : normalClass
      }`}
    >
      {label}
    </button>
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
