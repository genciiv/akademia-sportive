"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Plus,
  RefreshCw,
  UserRound,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";

type Player = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  gender: string;
  email: string | null;
  phone: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  guardianEmail: string | null;
  position: string | null;
  jerseyNumber: number | null;
  notes: string | null;
  status: string;
};

function perkthimStatusi(status: string) {
  const statuset: Record<string, string> = {
    ACTIVE: "Aktiv",
    INACTIVE: "Joaktiv",
    INJURED: "I dëmtuar",
    SUSPENDED: "I pezulluar",
    LEFT: "Larguar",
  };

  return statuset[status] || status;
}

function klasaStatusit(status: string) {
  if (status === "ACTIVE") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "INJURED") {
    return "bg-orange-50 text-orange-700";
  }

  if (status === "SUSPENDED") {
    return "bg-red-50 text-red-700";
  }

  return "bg-slate-100 text-slate-600";
}

function llogaritMoshen(dateOfBirth: string | null) {
  if (!dateOfBirth) return "—";

  const sot = new Date();
  const lindja = new Date(dateOfBirth);

  let mosha = sot.getFullYear() - lindja.getFullYear();

  const muaj =
    sot.getMonth() - lindja.getMonth();

  if (
    muaj < 0 ||
    (muaj === 0 &&
      sot.getDate() < lindja.getDate())
  ) {
    mosha--;
  }

  return `${mosha} vjeç`;
}

function formatDateForInput(date: string | null) {
  if (!date) return "";

  return new Date(date).toISOString().split("T")[0];
}

export default function SportistetClient() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [dukeRuajtur, setDukeRuajtur] = useState(false);
  const [gabimi, setGabimi] = useState("");

  const [shfaqFormularin, setShfaqFormularin] =
    useState(false);

  const [playerNeEditim, setPlayerNeEditim] =
    useState<Player | null>(null);

  const [playerPerFshirje, setPlayerPerFshirje] =
    useState<Player | null>(null);

  const [dukeFshire, setDukeFshire] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("NOT_SPECIFIED");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  async function merrSportistet() {
    setLoading(true);
    setGabimi("");

    try {
      const response = await fetch("/api/players", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        setGabimi(
          data.error ||
            "Sportistët nuk mund të ngarkoheshin."
        );
        return;
      }

      setPlayers(data.players || []);
    } catch {
      setGabimi(
        "Ndodhi një problem gjatë ngarkimit të sportistëve."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    merrSportistet();
  }, []);

  function pastroFormularin() {
    setFirstName("");
    setLastName("");
    setDateOfBirth("");
    setGender("NOT_SPECIFIED");
    setPhone("");
    setEmail("");
    setPosition("");
    setJerseyNumber("");
    setStatus("ACTIVE");
    setPlayerNeEditim(null);
  }

  function hapShtimin() {
    pastroFormularin();
    setShfaqFormularin(true);
  }

  function hapEditimin(player: Player) {
    setPlayerNeEditim(player);

    setFirstName(player.firstName);
    setLastName(player.lastName);
    setDateOfBirth(
      formatDateForInput(player.dateOfBirth)
    );
    setGender(player.gender || "NOT_SPECIFIED");
    setPhone(player.phone || "");
    setEmail(player.email || "");
    setPosition(player.position || "");
    setJerseyNumber(
      player.jerseyNumber !== null
        ? String(player.jerseyNumber)
        : ""
    );
    setStatus(player.status);

    setShfaqFormularin(true);
  }

  async function ruajSportistin(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setGabimi("");
    setDukeRuajtur(true);

    try {
      const url = playerNeEditim
        ? `/api/players/${playerNeEditim.id}`
        : "/api/players";

      const response = await fetch(url, {
        method: playerNeEditim ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          dateOfBirth,
          gender,
          phone,
          email,
          position,
          jerseyNumber,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setGabimi(
          data.error ||
            "Sportisti nuk mund të ruhej."
        );
        return;
      }

      setShfaqFormularin(false);
      pastroFormularin();

      await merrSportistet();
    } catch {
      setGabimi(
        "Ndodhi një problem gjatë ruajtjes së sportistit."
      );
    } finally {
      setDukeRuajtur(false);
    }
  }

  async function fshiSportistin() {
    if (!playerPerFshirje) return;

    setDukeFshire(true);
    setGabimi("");

    try {
      const response = await fetch(
        `/api/players/${playerPerFshirje.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setGabimi(
          data.error ||
            "Sportisti nuk mund të fshihej."
        );
        return;
      }

      setPlayerPerFshirje(null);

      await merrSportistet();
    } catch {
      setGabimi(
        "Ndodhi një problem gjatë fshirjes së sportistit."
      );
    } finally {
      setDukeFshire(false);
    }
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">
            Sportistët
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Menaxho sportistët e regjistruar në akademinë aktive.
          </p>
        </div>

        <button
          onClick={hapShtimin}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          <Plus size={18} />
          Shto sportist
        </button>
      </div>

      {gabimi && (
        <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {gabimi}
        </div>
      )}

      {shfaqFormularin && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-950">
              {playerNeEditim
                ? "Edito sportistin"
                : "Sportist i ri"}
            </h2>

            <button
              onClick={() => {
                setShfaqFormularin(false);
                pastroFormularin();
              }}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Mbyll"
            >
              <X size={19} />
            </button>
          </div>

          <form
            onSubmit={ruajSportistin}
            className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            <label className="text-xs font-semibold text-slate-600">
              Emri
              <input
                required
                value={firstName}
                onChange={(e) =>
                  setFirstName(e.target.value)
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
              />
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Mbiemri
              <input
                required
                value={lastName}
                onChange={(e) =>
                  setLastName(e.target.value)
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
              />
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Datëlindja
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) =>
                  setDateOfBirth(e.target.value)
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
              />
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Gjinia
              <select
                value={gender}
                onChange={(e) =>
                  setGender(e.target.value)
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
              >
                <option value="NOT_SPECIFIED">
                  E papërcaktuar
                </option>
                <option value="MALE">
                  Mashkull
                </option>
                <option value="FEMALE">
                  Femër
                </option>
                <option value="OTHER">
                  Tjetër
                </option>
              </select>
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Telefoni
              <input
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
              />
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Adresa elektronike
              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
              />
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Pozicioni
              <input
                value={position}
                onChange={(e) =>
                  setPosition(e.target.value)
                }
                placeholder="Mesfushor"
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
              />
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Numri i fanellës
              <input
                type="number"
                min="0"
                max="999"
                value={jerseyNumber}
                onChange={(e) =>
                  setJerseyNumber(e.target.value)
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
              />
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Statusi
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value)
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
              >
                <option value="ACTIVE">
                  Aktiv
                </option>
                <option value="INACTIVE">
                  Joaktiv
                </option>
                <option value="INJURED">
                  I dëmtuar
                </option>
                <option value="SUSPENDED">
                  I pezulluar
                </option>
                <option value="LEFT">
                  Larguar
                </option>
              </select>
            </label>

            <div className="flex justify-end sm:col-span-2 xl:col-span-3">
              <button
                type="submit"
                disabled={dukeRuajtur}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {dukeRuajtur
                  ? "Duke ruajtur..."
                  : playerNeEditim
                    ? "Ruaj ndryshimet"
                    : "Ruaj sportistin"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-bold text-slate-950">
              Lista e sportistëve
            </h2>

            <p className="mt-0.5 text-xs text-slate-400">
              {players.length} sportistë
            </p>
          </div>

          <button
            onClick={merrSportistet}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Rifresko"
          >
            <RefreshCw size={17} />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Duke ngarkuar sportistët...
          </div>
        ) : players.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <UserRound
              size={40}
              className="text-slate-300"
            />

            <p className="mt-3 font-semibold text-slate-700">
              Nuk ka ende sportistë
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Shto sportistin e parë të akademisë.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-5 py-3">
                    Sportisti
                  </th>
                  <th className="px-5 py-3">
                    Mosha
                  </th>
                  <th className="px-5 py-3">
                    Pozicioni
                  </th>
                  <th className="px-5 py-3">
                    Fanella
                  </th>
                  <th className="px-5 py-3">
                    Kontakti
                  </th>
                  <th className="px-5 py-3">
                    Statusi
                  </th>
                  <th className="px-5 py-3 text-right">
                    Veprime
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {players.map((player) => (
                  <tr
                    key={player.id}
                    className="text-sm"
                  >
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      {player.firstName}{" "}
                      {player.lastName}
                    </td>

                    <td className="px-5 py-4 text-slate-500">
                      {llogaritMoshen(
                        player.dateOfBirth
                      )}
                    </td>

                    <td className="px-5 py-4 text-slate-500">
                      {player.position || "—"}
                    </td>

                    <td className="px-5 py-4 text-slate-500">
                      {player.jerseyNumber ?? "—"}
                    </td>

                    <td className="px-5 py-4 text-slate-500">
                      {player.phone ||
                        player.email ||
                        "—"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${klasaStatusit(
                          player.status
                        )}`}
                      >
                        {perkthimStatusi(
                          player.status
                        )}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() =>
                            hapEditimin(player)
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          <Pencil size={14} />
                          Edito
                        </button>

                        <button
                          onClick={() =>
                            setPlayerPerFshirje(
                              player
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                        >
                          <Trash2 size={14} />
                          Fshi
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {playerPerFshirje && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-950">
              Fshi sportistin?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Je i sigurt që dëshiron të fshish{" "}
              <strong className="text-slate-800">
                {playerPerFshirje.firstName}{" "}
                {playerPerFshirje.lastName}
              </strong>
              ? Ky veprim do ta heqë sportistin edhe
              nga ekipet ku është regjistruar.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() =>
                  setPlayerPerFshirje(null)
                }
                disabled={dukeFshire}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                Anulo
              </button>

              <button
                onClick={fshiSportistin}
                disabled={dukeFshire}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
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