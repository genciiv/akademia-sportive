"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus, RefreshCw, UserRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";

type Player = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  gender: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  jerseyNumber: number | null;
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

function llogaritMoshen(dateOfBirth: string | null) {
  if (!dateOfBirth) {
    return "—";
  }

  const sot = new Date();
  const lindja = new Date(dateOfBirth);

  let mosha = sot.getFullYear() - lindja.getFullYear();

  const diferencaMuaj =
    sot.getMonth() - lindja.getMonth();

  if (
    diferencaMuaj < 0 ||
    (diferencaMuaj === 0 &&
      sot.getDate() < lindja.getDate())
  ) {
    mosha--;
  }

  return `${mosha} vjeç`;
}

export default function SportistetClient() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [dukeRuajtur, setDukeRuajtur] = useState(false);
  const [shfaqFormularin, setShfaqFormularin] = useState(false);
  const [gabimi, setGabimi] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("NOT_SPECIFIED");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");

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
          data.error || "Sportistët nuk mund të ngarkoheshin."
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

  async function shtoSportist(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setGabimi("");
    setDukeRuajtur(true);

    try {
      const response = await fetch("/api/players", {
        method: "POST",
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setGabimi(
          data.error || "Sportisti nuk mund të shtohej."
        );
        return;
      }

      setFirstName("");
      setLastName("");
      setDateOfBirth("");
      setGender("NOT_SPECIFIED");
      setPhone("");
      setEmail("");
      setPosition("");
      setJerseyNumber("");

      setShfaqFormularin(false);

      await merrSportistet();
    } catch {
      setGabimi(
        "Ndodhi një problem gjatë shtimit të sportistit."
      );
    } finally {
      setDukeRuajtur(false);
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
          onClick={() =>
            setShfaqFormularin((vlera) => !vlera)
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          <Plus size={18} />
          Shto sportist
        </button>
      </div>

      {shfaqFormularin && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">
            Sportist i ri
          </h2>

          <form
            onSubmit={shtoSportist}
            className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            <input
              required
              value={firstName}
              onChange={(e) =>
                setFirstName(e.target.value)
              }
              placeholder="Emri"
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
            />

            <input
              required
              value={lastName}
              onChange={(e) =>
                setLastName(e.target.value)
              }
              placeholder="Mbiemri"
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
            />

            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) =>
                setDateOfBirth(e.target.value)
              }
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
            />

            <select
              value={gender}
              onChange={(e) =>
                setGender(e.target.value)
              }
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
            >
              <option value="NOT_SPECIFIED">
                Gjinia
              </option>
              <option value="MALE">Mashkull</option>
              <option value="FEMALE">Femër</option>
              <option value="OTHER">Tjetër</option>
            </select>

            <input
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value)
              }
              placeholder="Telefoni"
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
            />

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="Email"
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
            />

            <input
              value={position}
              onChange={(e) =>
                setPosition(e.target.value)
              }
              placeholder="Pozicioni"
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
            />

            <input
              type="number"
              min="0"
              value={jerseyNumber}
              onChange={(e) =>
                setJerseyNumber(e.target.value)
              }
              placeholder="Numri i fanellës"
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
            />

            <div className="sm:col-span-2 xl:col-span-4 flex justify-end">
              <button
                type="submit"
                disabled={dukeRuajtur}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {dukeRuajtur
                  ? "Duke ruajtur..."
                  : "Ruaj sportistin"}
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
              size={38}
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
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">
                    Sportisti
                  </th>
                  <th className="px-5 py-3 font-semibold">
                    Mosha
                  </th>
                  <th className="px-5 py-3 font-semibold">
                    Pozicioni
                  </th>
                  <th className="px-5 py-3 font-semibold">
                    Fanella
                  </th>
                  <th className="px-5 py-3 font-semibold">
                    Kontakti
                  </th>
                  <th className="px-5 py-3 font-semibold">
                    Statusi
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {players.map((player) => (
                  <tr
                    key={player.id}
                    className="text-sm text-slate-600"
                  >
                    <td className="px-5 py-4 font-semibold text-slate-950">
                      {player.firstName}{" "}
                      {player.lastName}
                    </td>

                    <td className="px-5 py-4">
                      {llogaritMoshen(
                        player.dateOfBirth
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {player.position || "—"}
                    </td>

                    <td className="px-5 py-4">
                      {player.jerseyNumber ?? "—"}
                    </td>

                    <td className="px-5 py-4">
                      {player.phone ||
                        player.email ||
                        "—"}
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        {perkthimStatusi(
                          player.status
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}