"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Swords,
  Trash2,
  Trophy,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";

type MatchStatus =
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED"
  | "POSTPONED";

type MatchType =
  | "FRIENDLY"
  | "LEAGUE"
  | "CUP"
  | "TOURNAMENT"
  | "OTHER";

type TeamOption = {
  id: string;
  name: string;
  sport: string;
  ageGroup: string | null;
  season: string | null;
};

type MatchItem = {
  id: string;
  opponentName: string;
  matchType: MatchType;
  status: MatchStatus;
  startsAt: string;
  location: string | null;
  isHome: boolean;
  ourScore: number | null;
  opponentScore: number | null;
  competitionName: string | null;
  round: string | null;
  description: string | null;
  notes: string | null;
  team: TeamOption;
};

type MatchPlayerRole =
  | "STARTER"
  | "SUBSTITUTE";

type SquadMatchPlayer = {
  id: string;
  playerId: string;
  role: MatchPlayerRole;
  jerseyNumber: number | null;
  position: string | null;
  notes: string | null;
};

type SquadPlayer = {
  id: string;
  firstName: string;
  lastName: string;
  position: string | null;
  jerseyNumber: number | null;
  status: string;
  teamPosition: string | null;
  teamJerseyNumber: number | null;
  selected: boolean;
  matchPlayer: SquadMatchPlayer | null;
};

type SquadStatistics = {
  totalTeamPlayers: number;
  selected: number;
  starters: number;
  substitutes: number;
};

type MatchEventType =
  | "GOAL"
  | "ASSIST"
  | "YELLOW_CARD"
  | "RED_CARD"
  | "SUBSTITUTION_IN"
  | "SUBSTITUTION_OUT";

type MatchEventItem = {
  id: string;
  playerId: string;
  type: MatchEventType;
  minute: number;
  extraMinute: number | null;
  notes: string | null;
  player: {
    id: string;
    firstName: string;
    lastName: string;
    position: string | null;
    jerseyNumber: number | null;
  };
};

type MatchEventStatistics = {
  total: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  substitutionsIn: number;
  substitutionsOut: number;
};

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

function oraShqip(value: string) {
  const date = new Date(value);

  return `${dyShifror(date.getHours())}:${dyShifror(
    date.getMinutes()
  )}`;
}

function dateTimeLocal(value: string | null) {
  if (!value) return "";

  const date = new Date(value);

  const offset = date.getTimezoneOffset();

  const local = new Date(
    date.getTime() - offset * 60000
  );

  return local.toISOString().slice(0, 16);
}

function etiketaStatusit(status: MatchStatus) {
  switch (status) {
    case "SCHEDULED":
      return "E planifikuar";
    case "COMPLETED":
      return "E përfunduar";
    case "CANCELLED":
      return "E anuluar";
    case "POSTPONED":
      return "E shtyrë";
  }
}

function etiketaLlojit(type: MatchType) {
  switch (type) {
    case "FRIENDLY":
      return "Miqësore";
    case "LEAGUE":
      return "Kampionat";
    case "CUP":
      return "Kupë";
    case "TOURNAMENT":
      return "Turne";
    case "OTHER":
      return "Tjetër";
  }
}

function badgeStatusi(status: MatchStatus) {
  switch (status) {
    case "SCHEDULED":
      return "bg-blue-50 text-blue-700";
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700";
    case "CANCELLED":
      return "bg-red-50 text-red-700";
    case "POSTPONED":
      return "bg-amber-50 text-amber-700";
  }
}

export default function NdeshjetClient() {
  const [ndeshjet, setNdeshjet] =
    useState<MatchItem[]>([]);

  const [ekipet, setEkipet] =
    useState<TeamOption[]>([]);

  const [dukeNgarkuar, setDukeNgarkuar] =
    useState(true);

  const [dukeRuajtur, setDukeRuajtur] =
    useState(false);

  const [dukeFshire, setDukeFshire] =
    useState(false);

  const [gabimi, setGabimi] =
    useState("");

  const [kerkimi, setKerkimi] =
    useState("");

  const [filtriStatusit, setFiltriStatusit] =
    useState<"ALL" | MatchStatus>("ALL");

  const [filtriLlojit, setFiltriLlojit] =
    useState<"ALL" | MatchType>("ALL");

  const [modalHapur, setModalHapur] =
    useState(false);

  const [ndeshjaNeEditim, setNdeshjaNeEditim] =
    useState<MatchItem | null>(null);

  const [ndeshjaPerFshirje, setNdeshjaPerFshirje] =
    useState<MatchItem | null>(null);

  const [ndeshjaEDetajuar, setNdeshjaEDetajuar] =
    useState<MatchItem | null>(null);

  const [sportistetEGrumbullimit, setSportistetEGrumbullimit] =
    useState<SquadPlayer[]>([]);

  const [statistikatEGrumbullimit, setStatistikatEGrumbullimit] =
    useState<SquadStatistics | null>(null);

  const [dukeNgarkuarGrumbullimin, setDukeNgarkuarGrumbullimin] =
    useState(false);

  const [sportistiNeProces, setSportistiNeProces] =
    useState<string | null>(null);

  const [sportistiNeEditim, setSportistiNeEditim] =
    useState<SquadMatchPlayer | null>(null);

  const [roliNeEditim, setRoliNeEditim] =
    useState<MatchPlayerRole>("SUBSTITUTE");

  const [fanellaNeEditim, setFanellaNeEditim] =
    useState("");

  const [pozicioniNeEditim, setPozicioniNeEditim] =
    useState("");

  const [shenimetNeEditim, setShenimetNeEditim] =
    useState("");

  const [ngjarjetENdeshjes, setNgjarjetENdeshjes] =
    useState<MatchEventItem[]>([]);

  const [statistikatENgjarjeve, setStatistikatENgjarjeve] =
    useState<MatchEventStatistics | null>(null);

  const [dukeNgarkuarNgjarjet, setDukeNgarkuarNgjarjet] =
    useState(false);

  const [modalNgjarjejeHapur, setModalNgjarjejeHapur] =
    useState(false);

  const [ngjarjaNeEditim, setNgjarjaNeEditim] =
    useState<MatchEventItem | null>(null);

  const [playerIdNgjarjeje, setPlayerIdNgjarjeje] =
    useState("");

  const [llojiNgjarjes, setLlojiNgjarjes] =
    useState<MatchEventType>("GOAL");

  const [minutaNgjarjes, setMinutaNgjarjes] =
    useState("");

  const [minutaShteseNgjarjes, setMinutaShteseNgjarjes] =
    useState("");

  const [shenimeNgjarjeje, setShenimeNgjarjeje] =
    useState("");

  const [dukeRuajturNgjarjen, setDukeRuajturNgjarjen] =
    useState(false);

  const [ngjarjaNeProces, setNgjarjaNeProces] =
    useState<string | null>(null);

  const [teamId, setTeamId] =
    useState("");

  const [opponentName, setOpponentName] =
    useState("");

  const [matchType, setMatchType] =
    useState<MatchType>("FRIENDLY");

  const [status, setStatus] =
    useState<MatchStatus>("SCHEDULED");

  const [startsAt, setStartsAt] =
    useState("");

  const [location, setLocation] =
    useState("");

  const [isHome, setIsHome] =
    useState(true);

  const [ourScore, setOurScore] =
    useState("");

  const [opponentScore, setOpponentScore] =
    useState("");

  const [competitionName, setCompetitionName] =
    useState("");

  const [round, setRound] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [notes, setNotes] =
    useState("");

  async function merrTeDhenat() {
    setDukeNgarkuar(true);
    setGabimi("");

    try {
      const [
        matchesResponse,
        teamsResponse,
      ] = await Promise.all([
        fetch("/api/matches", {
          cache: "no-store",
        }),
        fetch("/api/teams", {
          cache: "no-store",
        }),
      ]);

      const matchesData =
        await matchesResponse.json();

      const teamsData =
        await teamsResponse.json();

      if (!matchesResponse.ok) {
        setGabimi(
          matchesData.error ||
            "Ndeshjet nuk mund të ngarkoheshin."
        );
        return;
      }

      if (!teamsResponse.ok) {
        setGabimi(
          teamsData.error ||
            "Ekipet nuk mund të ngarkoheshin."
        );
        return;
      }

      setNdeshjet(
        matchesData.matches || []
      );

      setEkipet(
        teamsData.teams || []
      );
    } catch {
      setGabimi(
        "Ndodhi një problem gjatë ngarkimit të të dhënave."
      );
    } finally {
      setDukeNgarkuar(false);
    }
  }

  useEffect(() => {
    void merrTeDhenat();
  }, []);

  const ndeshjetEFiltruara = useMemo(() => {
    const term = kerkimi
      .trim()
      .toLowerCase();

    return ndeshjet.filter((match) => {
      const perputhetKerkimi =
        !term ||
        match.opponentName
          .toLowerCase()
          .includes(term) ||
        match.team.name
          .toLowerCase()
          .includes(term) ||
        (match.location || "")
          .toLowerCase()
          .includes(term) ||
        (match.competitionName || "")
          .toLowerCase()
          .includes(term);

      const perputhetStatusi =
        filtriStatusit === "ALL" ||
        match.status === filtriStatusit;

      const perputhetLloji =
        filtriLlojit === "ALL" ||
        match.matchType === filtriLlojit;

      return (
        perputhetKerkimi &&
        perputhetStatusi &&
        perputhetLloji
      );
    });
  }, [
    ndeshjet,
    kerkimi,
    filtriStatusit,
    filtriLlojit,
  ]);

  const statistikat = useMemo(() => {
    const tani = new Date();

    const tePlanifikuara = ndeshjet.filter(
      (match) =>
        match.status === "SCHEDULED"
    ).length;

    const tePerfunduara = ndeshjet.filter(
      (match) =>
        match.status === "COMPLETED"
    ).length;

    const fitore = ndeshjet.filter(
      (match) =>
        match.status === "COMPLETED" &&
        match.ourScore !== null &&
        match.opponentScore !== null &&
        match.ourScore >
          match.opponentScore
    ).length;

    const teArdhshme = ndeshjet.filter(
      (match) =>
        new Date(match.startsAt) >= tani &&
        match.status === "SCHEDULED"
    ).length;

    return {
      total: ndeshjet.length,
      tePlanifikuara,
      tePerfunduara,
      fitore,
      teArdhshme,
    };
  }, [ndeshjet]);

  async function merrGrumbullimin(
    matchId: string
  ) {
    setDukeNgarkuarGrumbullimin(true);

    try {
      const response = await fetch(
        `/api/matches/${matchId}/players`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setGabimi(
          data.error ||
            "Grumbullimi nuk mund të ngarkohej."
        );
        return;
      }

      setSportistetEGrumbullimit(
        data.players || []
      );

      setStatistikatEGrumbullimit(
        data.statistics || null
      );
    } catch {
      setGabimi(
        "Ndodhi një problem gjatë ngarkimit të grumbullimit."
      );
    } finally {
      setDukeNgarkuarGrumbullimin(false);
    }
  }

  async function hapDetajet(
    match: MatchItem
  ) {
    setNdeshjaEDetajuar(match);

    setSportistetEGrumbullimit([]);
    setStatistikatEGrumbullimit(null);
    setNgjarjetENdeshjes([]);
    setStatistikatENgjarjeve(null);

    await Promise.all([
      merrGrumbullimin(match.id),
      merrNgjarjet(match.id),
    ]);
  }

  async function shtoNeGrumbullim(
    player: SquadPlayer
  ) {
    if (!ndeshjaEDetajuar) {
      return;
    }

    setSportistiNeProces(player.id);
    setGabimi("");

    try {
      const response = await fetch(
        `/api/matches/${ndeshjaEDetajuar.id}/players`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            playerId: player.id,
            role: "SUBSTITUTE",
            jerseyNumber:
              player.teamJerseyNumber ??
              player.jerseyNumber,
            position:
              player.teamPosition ??
              player.position,
            notes: "",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setGabimi(
          data.error ||
            "Sportisti nuk mund të shtohej në grumbullim."
        );
        return;
      }

      await merrGrumbullimin(
        ndeshjaEDetajuar.id
      );
    } catch {
      setGabimi(
        "Ndodhi një problem gjatë shtimit të sportistit."
      );
    } finally {
      setSportistiNeProces(null);
    }
  }

  function hapEditiminESportistit(
    player: SquadPlayer
  ) {
    if (!player.matchPlayer) {
      return;
    }

    setSportistiNeEditim(
      player.matchPlayer
    );

    setRoliNeEditim(
      player.matchPlayer.role
    );

    setFanellaNeEditim(
      player.matchPlayer.jerseyNumber === null
        ? ""
        : String(
            player.matchPlayer.jerseyNumber
          )
    );

    setPozicioniNeEditim(
      player.matchPlayer.position || ""
    );

    setShenimetNeEditim(
      player.matchPlayer.notes || ""
    );

    setGabimi("");
  }

  function mbyllEditiminESportistit() {
    setSportistiNeEditim(null);
    setRoliNeEditim("SUBSTITUTE");
    setFanellaNeEditim("");
    setPozicioniNeEditim("");
    setShenimetNeEditim("");
  }

  async function ruajSportistinEGrumbulluar() {
    if (
      !ndeshjaEDetajuar ||
      !sportistiNeEditim
    ) {
      return;
    }

    const jerseyNumber =
      fanellaNeEditim.trim() === ""
        ? null
        : Number(fanellaNeEditim);

    if (
      jerseyNumber !== null &&
      (
        !Number.isInteger(jerseyNumber) ||
        jerseyNumber < 0 ||
        jerseyNumber > 999
      )
    ) {
      setGabimi(
        "Numri i fanellës nuk është i vlefshëm."
      );
      return;
    }

    setSportistiNeProces(
      sportistiNeEditim.id
    );

    setGabimi("");

    try {
      const response = await fetch(
        `/api/matches/${ndeshjaEDetajuar.id}/players`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            matchPlayerId:
              sportistiNeEditim.id,
            role: roliNeEditim,
            jerseyNumber,
            position:
              pozicioniNeEditim,
            notes:
              shenimetNeEditim,
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

      mbyllEditiminESportistit();

      await merrGrumbullimin(
        ndeshjaEDetajuar.id
      );
    } catch {
      setGabimi(
        "Ndodhi një problem gjatë ruajtjes së sportistit."
      );
    } finally {
      setSportistiNeProces(null);
    }
  }

  async function hiqNgaGrumbullimi(
    matchPlayerId: string
  ) {
    if (!ndeshjaEDetajuar) {
      return;
    }

    setSportistiNeProces(
      matchPlayerId
    );

    setGabimi("");

    try {
      const response = await fetch(
        `/api/matches/${ndeshjaEDetajuar.id}/players`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            matchPlayerId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setGabimi(
          data.error ||
            "Sportisti nuk mund të hiqej nga grumbullimi."
        );
        return;
      }

      await merrGrumbullimin(
        ndeshjaEDetajuar.id
      );
    } catch {
      setGabimi(
        "Ndodhi një problem gjatë heqjes së sportistit."
      );
    } finally {
      setSportistiNeProces(null);
    }
  }

  async function merrNgjarjet(
    matchId: string
  ) {
    setDukeNgarkuarNgjarjet(true);

    try {
      const response = await fetch(
        `/api/matches/${matchId}/events`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setGabimi(
          data.error ||
            "Ngjarjet e ndeshjes nuk mund të ngarkoheshin."
        );
        return;
      }

      setNgjarjetENdeshjes(
        data.events || []
      );

      setStatistikatENgjarjeve(
        data.statistics || null
      );
    } catch {
      setGabimi(
        "Ndodhi një problem gjatë ngarkimit të ngjarjeve."
      );
    } finally {
      setDukeNgarkuarNgjarjet(false);
    }
  }

  function etiketaNgjarjes(
    type: MatchEventType
  ) {
    switch (type) {
      case "GOAL":
        return "Gol";
      case "ASSIST":
        return "Asist";
      case "YELLOW_CARD":
        return "Karton i verdhë";
      case "RED_CARD":
        return "Karton i kuq";
      case "SUBSTITUTION_IN":
        return "Zëvendësim brenda";
      case "SUBSTITUTION_OUT":
        return "Zëvendësim jashtë";
    }
  }

  function hapShtiminENgjarjes() {
    setNgjarjaNeEditim(null);
    setPlayerIdNgjarjeje("");
    setLlojiNgjarjes("GOAL");
    setMinutaNgjarjes("");
    setMinutaShteseNgjarjes("");
    setShenimeNgjarjeje("");
    setGabimi("");
    setModalNgjarjejeHapur(true);
  }

  function hapEditiminENgjarjes(
    event: MatchEventItem
  ) {
    setNgjarjaNeEditim(event);
    setPlayerIdNgjarjeje(
      event.playerId
    );
    setLlojiNgjarjes(event.type);
    setMinutaNgjarjes(
      String(event.minute)
    );
    setMinutaShteseNgjarjes(
      event.extraMinute === null
        ? ""
        : String(event.extraMinute)
    );
    setShenimeNgjarjeje(
      event.notes || ""
    );
    setGabimi("");
    setModalNgjarjejeHapur(true);
  }

  function mbyllModalinENgjarjes() {
    if (dukeRuajturNgjarjen) {
      return;
    }

    setModalNgjarjejeHapur(false);
    setNgjarjaNeEditim(null);
    setPlayerIdNgjarjeje("");
    setLlojiNgjarjes("GOAL");
    setMinutaNgjarjes("");
    setMinutaShteseNgjarjes("");
    setShenimeNgjarjeje("");
  }

  async function ruajNgjarjen() {
    if (!ndeshjaEDetajuar) {
      return;
    }

    if (!playerIdNgjarjeje) {
      setGabimi(
        "Zgjidh sportistin."
      );
      return;
    }

    const minute =
      Number(minutaNgjarjes);

    if (
      !Number.isInteger(minute) ||
      minute < 0 ||
      minute > 200
    ) {
      setGabimi(
        "Minuta e ngjarjes nuk është e vlefshme."
      );
      return;
    }

    const extraMinute =
      minutaShteseNgjarjes.trim() === ""
        ? null
        : Number(
            minutaShteseNgjarjes
          );

    if (
      extraMinute !== null &&
      (
        !Number.isInteger(extraMinute) ||
        extraMinute < 0 ||
        extraMinute > 99
      )
    ) {
      setGabimi(
        "Minuta shtesë nuk është e vlefshme."
      );
      return;
    }

    setDukeRuajturNgjarjen(true);
    setGabimi("");

    try {
      const response = await fetch(
        `/api/matches/${ndeshjaEDetajuar.id}/events`,
        {
          method: ngjarjaNeEditim
            ? "PATCH"
            : "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            ...(ngjarjaNeEditim
              ? {
                  eventId:
                    ngjarjaNeEditim.id,
                }
              : {}),
            playerId:
              playerIdNgjarjeje,
            type: llojiNgjarjes,
            minute,
            extraMinute,
            notes:
              shenimeNgjarjeje,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setGabimi(
          data.error ||
            "Ngjarja nuk mund të ruhej."
        );
        return;
      }

      setModalNgjarjejeHapur(false);
      setNgjarjaNeEditim(null);
      setPlayerIdNgjarjeje("");
      setLlojiNgjarjes("GOAL");
      setMinutaNgjarjes("");
      setMinutaShteseNgjarjes("");
      setShenimeNgjarjeje("");

      await merrNgjarjet(
        ndeshjaEDetajuar.id
      );
    } catch {
      setGabimi(
        "Ndodhi një problem gjatë ruajtjes së ngjarjes."
      );
    } finally {
      setDukeRuajturNgjarjen(false);
    }
  }

  async function fshiNgjarjen(
    event: MatchEventItem
  ) {
    if (!ndeshjaEDetajuar) {
      return;
    }

    const konfirmuar =
      window.confirm(
        `Je i sigurt që dëshiron të fshish ngjarjen "${etiketaNgjarjes(event.type)}"?`
      );

    if (!konfirmuar) {
      return;
    }

    setNgjarjaNeProces(event.id);
    setGabimi("");

    try {
      const response = await fetch(
        `/api/matches/${ndeshjaEDetajuar.id}/events`,
        {
          method: "DELETE",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            eventId: event.id,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setGabimi(
          data.error ||
            "Ngjarja nuk mund të fshihej."
        );
        return;
      }

      await merrNgjarjet(
        ndeshjaEDetajuar.id
      );
    } catch {
      setGabimi(
        "Ndodhi një problem gjatë fshirjes së ngjarjes."
      );
    } finally {
      setNgjarjaNeProces(null);
    }
  }

  function pastroFormularin() {
    setTeamId("");
    setOpponentName("");
    setMatchType("FRIENDLY");
    setStatus("SCHEDULED");
    setStartsAt("");
    setLocation("");
    setIsHome(true);
    setOurScore("");
    setOpponentScore("");
    setCompetitionName("");
    setRound("");
    setDescription("");
    setNotes("");
  }

  function hapShtimin() {
    setNdeshjaNeEditim(null);
    pastroFormularin();
    setGabimi("");
    setModalHapur(true);
  }

  function hapEditimin(match: MatchItem) {
    setNdeshjaNeEditim(match);

    setTeamId(match.team.id);
    setOpponentName(
      match.opponentName
    );
    setMatchType(match.matchType);
    setStatus(match.status);
    setStartsAt(
      dateTimeLocal(match.startsAt)
    );
    setLocation(match.location || "");
    setIsHome(match.isHome);

    setOurScore(
      match.ourScore === null
        ? ""
        : String(match.ourScore)
    );

    setOpponentScore(
      match.opponentScore === null
        ? ""
        : String(match.opponentScore)
    );

    setCompetitionName(
      match.competitionName || ""
    );

    setRound(match.round || "");
    setDescription(
      match.description || ""
    );
    setNotes(match.notes || "");

    setGabimi("");
    setModalHapur(true);
  }

  function mbyllFormularin() {
    if (dukeRuajtur) return;

    setModalHapur(false);
    setNdeshjaNeEditim(null);
    pastroFormularin();
  }

  async function ruajNdeshjen(
    event: FormEvent
  ) {
    event.preventDefault();

    if (!teamId) {
      setGabimi(
        "Zgjidh ekipin."
      );
      return;
    }

    if (!opponentName.trim()) {
      setGabimi(
        "Shkruaj emrin e kundërshtarit."
      );
      return;
    }

    if (!startsAt) {
      setGabimi(
        "Zgjidh datën dhe orën e ndeshjes."
      );
      return;
    }

    setDukeRuajtur(true);
    setGabimi("");

    try {
      const response = await fetch(
        ndeshjaNeEditim
          ? `/api/matches/${ndeshjaNeEditim.id}`
          : "/api/matches",
        {
          method: ndeshjaNeEditim
            ? "PATCH"
            : "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            teamId,
            opponentName,
            matchType,
            status,
            startsAt,
            location,
            isHome,
            ourScore,
            opponentScore,
            competitionName,
            round,
            description,
            notes,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setGabimi(
          data.error ||
            "Ndeshja nuk mund të ruhej."
        );
        return;
      }

      mbyllFormularin();

      await merrTeDhenat();
    } catch {
      setGabimi(
        "Ndodhi një problem gjatë ruajtjes së ndeshjes."
      );
    } finally {
      setDukeRuajtur(false);
    }
  }

  async function fshiNdeshjen() {
    if (!ndeshjaPerFshirje) {
      return;
    }

    setDukeFshire(true);
    setGabimi("");

    try {
      const response = await fetch(
        `/api/matches/${ndeshjaPerFshirje.id}`,
        {
          method: "DELETE",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setGabimi(
          data.error ||
            "Ndeshja nuk mund të fshihej."
        );
        return;
      }

      setNdeshjaPerFshirje(null);

      await merrTeDhenat();
    } catch {
      setGabimi(
        "Ndodhi një problem gjatë fshirjes së ndeshjes."
      );
    } finally {
      setDukeFshire(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
              Menaxhimi sportiv
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
              Ndeshjet
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Menaxho kalendarin, kundërshtarët, rezultatet dhe statusin e ndeshjeve.
            </p>
          </div>

          <button
            type="button"
            onClick={hapShtimin}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={17} />
            Shto ndeshje
          </button>
        </div>

        {gabimi && (
          <div className="flex items-start justify-between gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            <span>{gabimi}</span>

            <button
              type="button"
              onClick={() => setGabimi("")}
              className="shrink-0"
              aria-label="Mbyll njoftimin"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <KarteStatistike
            icon={Swords}
            label="Gjithsej"
            value={statistikat.total}
          />

          <KarteStatistike
            icon={CalendarDays}
            label="Të planifikuara"
            value={statistikat.tePlanifikuara}
          />

          <KarteStatistike
            icon={Clock3}
            label="Të ardhshme"
            value={statistikat.teArdhshme}
          />

          <KarteStatistike
            icon={CheckCircle2}
            label="Të përfunduara"
            value={statistikat.tePerfunduara}
          />

          <KarteStatistike
            icon={Trophy}
            label="Fitore"
            value={statistikat.fitore}
          />
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative w-full xl:max-w-md">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={kerkimi}
                  onChange={(event) =>
                    setKerkimi(
                      event.target.value
                    )
                  }
                  placeholder="Kërko kundërshtar, ekip, vend ose garë..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  value={filtriStatusit}
                  onChange={(event) =>
                    setFiltriStatusit(
                      event.target.value as
                        | "ALL"
                        | MatchStatus
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none"
                >
                  <option value="ALL">
                    Të gjitha statuset
                  </option>
                  <option value="SCHEDULED">
                    E planifikuar
                  </option>
                  <option value="COMPLETED">
                    E përfunduar
                  </option>
                  <option value="POSTPONED">
                    E shtyrë
                  </option>
                  <option value="CANCELLED">
                    E anuluar
                  </option>
                </select>

                <select
                  value={filtriLlojit}
                  onChange={(event) =>
                    setFiltriLlojit(
                      event.target.value as
                        | "ALL"
                        | MatchType
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none"
                >
                  <option value="ALL">
                    Të gjitha llojet
                  </option>
                  <option value="FRIENDLY">
                    Miqësore
                  </option>
                  <option value="LEAGUE">
                    Kampionat
                  </option>
                  <option value="CUP">
                    Kupë
                  </option>
                  <option value="TOURNAMENT">
                    Turne
                  </option>
                  <option value="OTHER">
                    Tjetër
                  </option>
                </select>

                <button
                  type="button"
                  onClick={() =>
                    void merrTeDhenat()
                  }
                  disabled={dukeNgarkuar}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <RefreshCw
                    size={16}
                    className={
                      dukeNgarkuar
                        ? "animate-spin"
                        : ""
                    }
                  />
                  Rifresko
                </button>
              </div>
            </div>
          </div>

          {dukeNgarkuar ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Duke ngarkuar ndeshjet...
            </div>
          ) : ndeshjetEFiltruara.length === 0 ? (
            <div className="p-10 text-center">
              <Swords
                size={32}
                className="mx-auto text-slate-300"
              />

              <h3 className="mt-3 font-semibold text-slate-900">
                Nuk u gjet asnjë ndeshje
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Shto ndeshjen e parë ose ndrysho filtrat.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {ndeshjetEFiltruara.map(
                (match) => (
                  <div
                    key={match.id}
                    className="p-5 transition hover:bg-slate-50/70"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeStatusi(
                              match.status
                            )}`}
                          >
                            {etiketaStatusit(
                              match.status
                            )}
                          </span>

                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {etiketaLlojit(
                              match.matchType
                            )}
                          </span>

                          <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                            {match.isHome
                              ? "Në shtëpi"
                              : "Në transfertë"}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-col gap-2 lg:flex-row lg:items-center">
                          <h3 className="text-base font-bold text-slate-950">
                            {match.isHome
                              ? `${match.team.name} - ${match.opponentName}`
                              : `${match.opponentName} - ${match.team.name}`}
                          </h3>

                          {match.ourScore !==
                            null &&
                            match.opponentScore !==
                              null && (
                              <div className="inline-flex w-fit items-center rounded-xl bg-slate-950 px-3 py-1.5 text-sm font-bold text-white">
                                {match.isHome
                                  ? `${match.ourScore} : ${match.opponentScore}`
                                  : `${match.opponentScore} : ${match.ourScore}`}
                              </div>
                            )}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                          <span className="inline-flex items-center gap-1.5">
                            <UsersRound size={15} />
                            {match.team.name}
                          </span>

                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays size={15} />
                            {dataShqip(
                              match.startsAt
                            )}
                          </span>

                          <span className="inline-flex items-center gap-1.5">
                            <Clock3 size={15} />
                            {oraShqip(
                              match.startsAt
                            )}
                          </span>

                          {match.location && (
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin size={15} />
                              {match.location}
                            </span>
                          )}

                          {match.competitionName && (
                            <span className="inline-flex items-center gap-1.5">
                              <Trophy size={15} />
                              {
                                match.competitionName
                              }
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            void hapDetajet(
                              match
                            )
                          }
                          className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-white"
                          aria-label="Shiko detajet"
                        >
                          <ChevronRight
                            size={18}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            hapEditimin(match)
                          }
                          className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-white"
                          aria-label="Edito ndeshjen"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setNdeshjaPerFshirje(
                              match
                            )
                          }
                          className="rounded-xl border border-red-100 p-2.5 text-red-600 transition hover:bg-red-50"
                          aria-label="Fshi ndeshjen"
                        >
                          <Trash2 size={17} />
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

      {modalHapur && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[26px] bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white p-6">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  {ndeshjaNeEditim
                    ? "Edito ndeshjen"
                    : "Shto ndeshje"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Plotëso informacionin e ndeshjes sportive.
                </p>
              </div>

              <button
                type="button"
                onClick={mbyllFormularin}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
                aria-label="Mbyll"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={ruajNdeshjen}
              className="p-6"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Fusha label="Ekipi *">
                  <select
                    required
                    value={teamId}
                    onChange={(event) =>
                      setTeamId(
                        event.target.value
                      )
                    }
                    className={inputClass}
                  >
                    <option value="">
                      Zgjidh ekipin
                    </option>

                    {ekipet.map((team) => (
                      <option
                        key={team.id}
                        value={team.id}
                      >
                        {team.name}
                      </option>
                    ))}
                  </select>
                </Fusha>

                <Fusha label="Kundërshtari *">
                  <input
                    required
                    value={opponentName}
                    onChange={(event) =>
                      setOpponentName(
                        event.target.value
                      )
                    }
                    placeholder="Emri i kundërshtarit"
                    className={inputClass}
                  />
                </Fusha>

                <Fusha label="Lloji i ndeshjes">
                  <select
                    value={matchType}
                    onChange={(event) =>
                      setMatchType(
                        event.target
                          .value as MatchType
                      )
                    }
                    className={inputClass}
                  >
                    <option value="FRIENDLY">
                      Miqësore
                    </option>
                    <option value="LEAGUE">
                      Kampionat
                    </option>
                    <option value="CUP">
                      Kupë
                    </option>
                    <option value="TOURNAMENT">
                      Turne
                    </option>
                    <option value="OTHER">
                      Tjetër
                    </option>
                  </select>
                </Fusha>

                <Fusha label="Statusi">
                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(
                        event.target
                          .value as MatchStatus
                      )
                    }
                    className={inputClass}
                  >
                    <option value="SCHEDULED">
                      E planifikuar
                    </option>
                    <option value="COMPLETED">
                      E përfunduar
                    </option>
                    <option value="POSTPONED">
                      E shtyrë
                    </option>
                    <option value="CANCELLED">
                      E anuluar
                    </option>
                  </select>
                </Fusha>

                <Fusha label="Data dhe ora *">
                  <input
                    required
                    type="datetime-local"
                    value={startsAt}
                    onChange={(event) =>
                      setStartsAt(
                        event.target.value
                      )
                    }
                    className={inputClass}
                  />
                </Fusha>

                <Fusha label="Vendndodhja">
                  <input
                    value={location}
                    onChange={(event) =>
                      setLocation(
                        event.target.value
                      )
                    }
                    placeholder="Stadiumi ose fusha"
                    className={inputClass}
                  />
                </Fusha>

                <Fusha label="Vendi i ndeshjes">
                  <select
                    value={
                      isHome
                        ? "HOME"
                        : "AWAY"
                    }
                    onChange={(event) =>
                      setIsHome(
                        event.target.value ===
                          "HOME"
                      )
                    }
                    className={inputClass}
                  >
                    <option value="HOME">
                      Në shtëpi
                    </option>
                    <option value="AWAY">
                      Në transfertë
                    </option>
                  </select>
                </Fusha>

                <Fusha label="Gara">
                  <input
                    value={competitionName}
                    onChange={(event) =>
                      setCompetitionName(
                        event.target.value
                      )
                    }
                    placeholder="Emri i kampionatit ose turneut"
                    className={inputClass}
                  />
                </Fusha>

                <Fusha label="Raundi">
                  <input
                    value={round}
                    onChange={(event) =>
                      setRound(
                        event.target.value
                      )
                    }
                    placeholder="P.sh. Java 4"
                    className={inputClass}
                  />
                </Fusha>

                <div className="md:col-span-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-800">
                      Rezultati
                    </p>

                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      <Fusha label="Rezultati ynë">
                        <input
                          type="number"
                          min="0"
                          value={ourScore}
                          onChange={(event) =>
                            setOurScore(
                              event.target.value
                            )
                          }
                          placeholder="0"
                          className={inputClass}
                        />
                      </Fusha>

                      <Fusha label="Rezultati i kundërshtarit">
                        <input
                          type="number"
                          min="0"
                          value={
                            opponentScore
                          }
                          onChange={(event) =>
                            setOpponentScore(
                              event.target.value
                            )
                          }
                          placeholder="0"
                          className={inputClass}
                        />
                      </Fusha>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Fusha label="Përshkrimi">
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(event) =>
                        setDescription(
                          event.target.value
                        )
                      }
                      placeholder="Përshkrimi i ndeshjes..."
                      className={`${inputClass} resize-none`}
                    />
                  </Fusha>
                </div>

                <div className="md:col-span-2">
                  <Fusha label="Shënime">
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(event) =>
                        setNotes(
                          event.target.value
                        )
                      }
                      placeholder="Shënime të brendshme..."
                      className={`${inputClass} resize-none`}
                    />
                  </Fusha>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={mbyllFormularin}
                  disabled={dukeRuajtur}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Anulo
                </button>

                <button
                  type="submit"
                  disabled={dukeRuajtur}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {dukeRuajtur
                    ? "Duke ruajtur..."
                    : ndeshjaNeEditim
                      ? "Ruaj ndryshimet"
                      : "Shto ndeshjen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {ndeshjaEDetajuar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[26px] bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  Detajet e ndeshjes
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-950">
                  {ndeshjaEDetajuar.isHome
                    ? `${ndeshjaEDetajuar.team.name} - ${ndeshjaEDetajuar.opponentName}`
                    : `${ndeshjaEDetajuar.opponentName} - ${ndeshjaEDetajuar.team.name}`}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setNdeshjaEDetajuar(
                    null
                  )
                }
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
                value={
                  ndeshjaEDetajuar.team
                    .name
                }
              />

              <MiniInfo
                icon={Swords}
                label="Kundërshtari"
                value={
                  ndeshjaEDetajuar.opponentName
                }
              />

              <MiniInfo
                icon={CalendarDays}
                label="Data"
                value={dataShqip(
                  ndeshjaEDetajuar.startsAt
                )}
              />

              <MiniInfo
                icon={Clock3}
                label="Ora"
                value={oraShqip(
                  ndeshjaEDetajuar.startsAt
                )}
              />

              <MiniInfo
                icon={MapPin}
                label="Vendi"
                value={
                  ndeshjaEDetajuar.location ||
                  "Pa vendndodhje"
                }
              />

              <MiniInfo
                icon={ShieldCheck}
                label="Statusi"
                value={etiketaStatusit(
                  ndeshjaEDetajuar.status
                )}
              />

              <MiniInfo
                icon={Trophy}
                label="Lloji"
                value={etiketaLlojit(
                  ndeshjaEDetajuar.matchType
                )}
              />

              <MiniInfo
                icon={Swords}
                label="Terreni"
                value={
                  ndeshjaEDetajuar.isHome
                    ? "Në shtëpi"
                    : "Në transfertë"
                }
              />

              {ndeshjaEDetajuar.ourScore !==
                null &&
                ndeshjaEDetajuar
                  .opponentScore !==
                  null && (
                  <div className="sm:col-span-2 rounded-2xl bg-slate-950 p-5 text-center text-white">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Rezultati
                    </p>

                    <p className="mt-2 text-3xl font-black">
                      {
                        ndeshjaEDetajuar.ourScore
                      }{" "}
                      :{" "}
                      {
                        ndeshjaEDetajuar.opponentScore
                      }
                    </p>
                  </div>
                )}

              {ndeshjaEDetajuar
                .competitionName && (
                <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Gara
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {
                      ndeshjaEDetajuar
                        .competitionName
                    }
                    {ndeshjaEDetajuar.round
                      ? ` · ${ndeshjaEDetajuar.round}`
                      : ""}
                  </p>
                </div>
              )}

              {ndeshjaEDetajuar.description && (
                <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Përshkrimi
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {
                      ndeshjaEDetajuar.description
                    }
                  </p>
                </div>
              )}

              {ndeshjaEDetajuar.notes && (
                <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Shënime
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {
                      ndeshjaEDetajuar.notes
                    }
                  </p>
                </div>
              )}
            </div>
            <div className="border-t border-slate-100 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-950">
                    Grumbullimi
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Zgjidh sportistët që do të jenë pjesë e kësaj ndeshjeje.
                  </p>
                </div>

                {statistikatEGrumbullimit && (
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {statistikatEGrumbullimit.selected} të grumbulluar
                    </span>

                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {statistikatEGrumbullimit.starters} titullarë
                    </span>

                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {statistikatEGrumbullimit.substitutes} rezerva
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-5">
                {dukeNgarkuarGrumbullimin ? (
                  <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
                    Duke ngarkuar grumbullimin...
                  </div>
                ) : sportistetEGrumbullimit.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    Ky ekip nuk ka sportistë aktivë.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sportistetEGrumbullimit.map(
                      (player) => (
                        <div
                          key={player.id}
                          className="rounded-2xl border border-slate-200 bg-white p-4"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-slate-950">
                                  {player.firstName}{" "}
                                  {player.lastName}
                                </p>

                                {player.matchPlayer && (
                                  <span
                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                      player.matchPlayer.role ===
                                      "STARTER"
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "bg-blue-50 text-blue-700"
                                    }`}
                                  >
                                    {player.matchPlayer.role ===
                                    "STARTER"
                                      ? "Titullar"
                                      : "Rezervë"}
                                  </span>
                                )}
                              </div>

                              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                {(player.matchPlayer?.position ||
                                  player.teamPosition ||
                                  player.position) && (
                                  <span>
                                    Pozicioni:{" "}
                                    {player.matchPlayer?.position ||
                                      player.teamPosition ||
                                      player.position}
                                  </span>
                                )}

                                {(player.matchPlayer
                                  ?.jerseyNumber ??
                                  player.teamJerseyNumber ??
                                  player.jerseyNumber) !==
                                  null && (
                                  <span>
                                    Fanella:{" "}
                                    {player.matchPlayer
                                      ?.jerseyNumber ??
                                      player.teamJerseyNumber ??
                                      player.jerseyNumber}
                                  </span>
                                )}
                              </div>

                              {player.matchPlayer?.notes && (
                                <p className="mt-2 text-xs leading-5 text-slate-600">
                                  {
                                    player.matchPlayer
                                      .notes
                                  }
                                </p>
                              )}
                            </div>

                            <div className="flex shrink-0 gap-2">
                              {!player.selected ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void shtoNeGrumbullim(
                                      player
                                    )
                                  }
                                  disabled={
                                    sportistiNeProces ===
                                    player.id
                                  }
                                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                                >
                                  {sportistiNeProces ===
                                  player.id
                                    ? "Duke shtuar..."
                                    : "Shto"}
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      hapEditiminESportistit(
                                        player
                                      )
                                    }
                                    disabled={
                                      sportistiNeProces ===
                                      player.matchPlayer?.id
                                    }
                                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                                  >
                                    Edito
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      player.matchPlayer &&
                                      void hiqNgaGrumbullimi(
                                        player.matchPlayer.id
                                      )
                                    }
                                    disabled={
                                      sportistiNeProces ===
                                      player.matchPlayer?.id
                                    }
                                    className="rounded-xl border border-red-100 p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                    aria-label="Hiq nga grumbullimi"
                                  >
                                    <Trash2
                                      size={15}
                                    />
                                  </button>
                                </>
                              )}
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
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-950">
                    Ngjarjet e ndeshjes
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Regjistro golat, asistet, kartonët dhe zëvendësimet.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={hapShtiminENgjarjes}
                  disabled={
                    !statistikatEGrumbullimit ||
                    statistikatEGrumbullimit.selected === 0
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus size={16} />
                  Shto ngjarje
                </button>
              </div>

              {statistikatENgjarjeve && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {statistikatENgjarjeve.total} ngjarje
                  </span>

                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {statistikatENgjarjeve.goals} gola
                  </span>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {statistikatENgjarjeve.assists} asiste
                  </span>

                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    {statistikatENgjarjeve.yellowCards} kartonë të verdhë
                  </span>

                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                    {statistikatENgjarjeve.redCards} kartonë të kuq
                  </span>
                </div>
              )}

              <div className="mt-5">
                {dukeNgarkuarNgjarjet ? (
                  <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
                    Duke ngarkuar ngjarjet...
                  </div>
                ) : ngjarjetENdeshjes.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    <p className="text-sm font-semibold text-slate-700">
                      Nuk ka ngjarje të regjistruara.
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Shto ngjarjen e parë të kësaj ndeshjeje.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ngjarjetENdeshjes.map(
                      (event) => (
                        <div
                          key={event.id}
                          className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-slate-950 px-2.5 py-1 text-xs font-bold text-white">
                                {event.minute}
                                {event.extraMinute !==
                                null
                                  ? `+${event.extraMinute}`
                                  : ""}
                                &apos;
                              </span>

                              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                {etiketaNgjarjes(
                                  event.type
                                )}
                              </span>
                            </div>

                            <p className="mt-2 font-semibold text-slate-950">
                              {event.player.firstName}{" "}
                              {event.player.lastName}
                            </p>

                            {event.notes && (
                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                {event.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex shrink-0 gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                hapEditiminENgjarjes(
                                  event
                                )
                              }
                              disabled={
                                ngjarjaNeProces ===
                                event.id
                              }
                              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                              Edito
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                void fshiNgjarjen(
                                  event
                                )
                              }
                              disabled={
                                ngjarjaNeProces ===
                                event.id
                              }
                              className="rounded-xl border border-red-100 p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                              aria-label="Fshi ngjarjen"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>





            <div className="flex justify-end gap-2 border-t border-slate-100 p-6">
              <button
                type="button"
                onClick={() => {
                  const match =
                    ndeshjaEDetajuar;

                  setNdeshjaEDetajuar(
                    null
                  );

                  hapEditimin(match);
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Pencil size={16} />
                Edito
              </button>

              <button
                type="button"
                onClick={() =>
                  setNdeshjaEDetajuar(
                    null
                  )
                }
                className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Mbyll
              </button>
            </div>
          </div>
        </div>
      )}
      {modalNgjarjejeHapur && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-lg rounded-[24px] bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 p-6">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  {ngjarjaNeEditim
                    ? "Edito ngjarjen"
                    : "Shto ngjarje"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Regjistro një ngjarje të ndeshjes.
                </p>
              </div>

              <button
                type="button"
                onClick={mbyllModalinENgjarjes}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
                aria-label="Mbyll"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <Fusha label="Sportisti *">
                <select
                  value={playerIdNgjarjeje}
                  onChange={(event) =>
                    setPlayerIdNgjarjeje(
                      event.target.value
                    )
                  }
                  className={inputClass}
                >
                  <option value="">
                    Zgjidh sportistin
                  </option>

                  {sportistetEGrumbullimit
                    .filter(
                      (player) =>
                        player.selected
                    )
                    .map((player) => (
                      <option
                        key={player.id}
                        value={player.id}
                      >
                        {player.firstName}{" "}
                        {player.lastName}
                      </option>
                    ))}
                </select>
              </Fusha>

              <Fusha label="Lloji i ngjarjes *">
                <select
                  value={llojiNgjarjes}
                  onChange={(event) =>
                    setLlojiNgjarjes(
                      event.target
                        .value as MatchEventType
                    )
                  }
                  className={inputClass}
                >
                  <option value="GOAL">
                    Gol
                  </option>
                  <option value="ASSIST">
                    Asist
                  </option>
                  <option value="YELLOW_CARD">
                    Karton i verdhë
                  </option>
                  <option value="RED_CARD">
                    Karton i kuq
                  </option>
                  <option value="SUBSTITUTION_IN">
                    Zëvendësim brenda
                  </option>
                  <option value="SUBSTITUTION_OUT">
                    Zëvendësim jashtë
                  </option>
                </select>
              </Fusha>

              <div className="grid gap-4 sm:grid-cols-2">
                <Fusha label="Minuta *">
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={minutaNgjarjes}
                    onChange={(event) =>
                      setMinutaNgjarjes(
                        event.target.value
                      )
                    }
                    placeholder="P.sh. 45"
                    className={inputClass}
                  />
                </Fusha>

                <Fusha label="Minuta shtesë">
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={
                      minutaShteseNgjarjes
                    }
                    onChange={(event) =>
                      setMinutaShteseNgjarjes(
                        event.target.value
                      )
                    }
                    placeholder="P.sh. 2"
                    className={inputClass}
                  />
                </Fusha>
              </div>

              <Fusha label="Shënime">
                <textarea
                  rows={3}
                  value={shenimeNgjarjeje}
                  onChange={(event) =>
                    setShenimeNgjarjeje(
                      event.target.value
                    )
                  }
                  placeholder="Shënime për ngjarjen..."
                  className={`${inputClass} resize-none`}
                />
              </Fusha>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 p-6">
              <button
                type="button"
                onClick={mbyllModalinENgjarjes}
                disabled={
                  dukeRuajturNgjarjen
                }
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Anulo
              </button>

              <button
                type="button"
                onClick={() =>
                  void ruajNgjarjen()
                }
                disabled={
                  dukeRuajturNgjarjen
                }
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {dukeRuajturNgjarjen
                  ? "Duke ruajtur..."
                  : ngjarjaNeEditim
                    ? "Ruaj ndryshimet"
                    : "Shto ngjarjen"}
              </button>
            </div>
          </div>
        </div>
      )}


      {sportistiNeEditim && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-lg rounded-[24px] bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 p-6">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Edito sportistin
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Përcakto rolin dhe të dhënat për këtë ndeshje.
                </p>
              </div>

              <button
                type="button"
                onClick={mbyllEditiminESportistit}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
                aria-label="Mbyll"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Roli
                </label>

                <select
                  value={roliNeEditim}
                  onChange={(event) =>
                    setRoliNeEditim(
                      event.target
                        .value as MatchPlayerRole
                    )
                  }
                  className={inputClass}
                >
                  <option value="STARTER">
                    Titullar
                  </option>

                  <option value="SUBSTITUTE">
                    Rezervë
                  </option>
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Numri i fanellës
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="999"
                    value={fanellaNeEditim}
                    onChange={(event) =>
                      setFanellaNeEditim(
                        event.target.value
                      )
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Pozicioni
                  </label>

                  <input
                    value={pozicioniNeEditim}
                    onChange={(event) =>
                      setPozicioniNeEditim(
                        event.target.value
                      )
                    }
                    placeholder="P.sh. Sulmues"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Shënime
                </label>

                <textarea
                  rows={3}
                  value={shenimetNeEditim}
                  onChange={(event) =>
                    setShenimetNeEditim(
                      event.target.value
                    )
                  }
                  placeholder="Shënime për sportistin..."
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 p-6">
              <button
                type="button"
                onClick={mbyllEditiminESportistit}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Anulo
              </button>

              <button
                type="button"
                onClick={() =>
                  void ruajSportistinEGrumbulluar()
                }
                disabled={
                  sportistiNeProces ===
                  sportistiNeEditim.id
                }
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {sportistiNeProces ===
                sportistiNeEditim.id
                  ? "Duke ruajtur..."
                  : "Ruaj ndryshimet"}
              </button>
            </div>
          </div>
        </div>
      )}



      {ndeshjaPerFshirje && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <Trash2 size={22} />
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-950">
              Fshi ndeshjen
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Je i sigurt që dëshiron të fshish ndeshjen kundër{" "}
              <strong className="text-slate-800">
                {
                  ndeshjaPerFshirje.opponentName
                }
              </strong>
              ?
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  setNdeshjaPerFshirje(
                    null
                  )
                }
                disabled={dukeFshire}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Anulo
              </button>

              <button
                type="button"
                onClick={fshiNdeshjen}
                disabled={dukeFshire}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {dukeFshire
                  ? "Duke fshirë..."
                  : "Fshi ndeshjen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50";

function Fusha({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      {children}
    </label>
  );
}

function KarteStatistike({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-950">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Icon size={19} />
        </div>
      </div>
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
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
          <Icon size={17} />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-400">
            {label}
          </p>

          <p className="mt-1 break-words text-sm font-semibold text-slate-800">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}