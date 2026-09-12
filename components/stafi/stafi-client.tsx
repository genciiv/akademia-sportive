"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Copy,
  MailPlus,
  Pencil,
  ShieldCheck,
  Trash2,
  UserCog,
  X,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";

type StaffRole =
  | "OWNER"
  | "ADMIN"
  | "SPORTS_DIRECTOR"
  | "HEAD_COACH"
  | "COACH"
  | "ASSISTANT_COACH"
  | "FINANCE"
  | "RECEPTIONIST"
  | "MEMBER";

type MembershipStatus =
  | "ACTIVE"
  | "INVITED"
  | "SUSPENDED"
  | "REMOVED";

type StaffInvitation = {
  id: string;
  email: string;
  role: StaffRole;
  roleLabel: string;
  expiresAt: string;
  createdAt: string;
  invitePath: string;
  status: "PENDING" | "EXPIRED";
  statusLabel: string;
};

type StaffMember = {
  id: string;

  role: StaffRole;
  roleLabel: string;

  status: MembershipStatus;
  statusLabel: string;

  joinedAt: string;

  isCurrentUser: boolean;
  isOwner: boolean;

  user: {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string;
    image: string | null;
  };

  coachProfile: {
    id: string;
    firstName: string;
    lastName: string;
    status: string;
  } | null;
};

const ROLE_OPTIONS: Array<{
  value: Exclude<StaffRole, "OWNER">;
  label: string;
}> = [
  {
    value: "ADMIN",
    label: "Administrator",
  },
  {
    value: "SPORTS_DIRECTOR",
    label: "Drejtor sportiv",
  },
  {
    value: "HEAD_COACH",
    label: "Trajner kryesor",
  },
  {
    value: "COACH",
    label: "Trajner",
  },
  {
    value: "ASSISTANT_COACH",
    label: "Ndihmës trajner",
  },
  {
    value: "FINANCE",
    label: "Financa",
  },
  {
    value: "RECEPTIONIST",
    label: "Recepsion",
  },
  {
    value: "MEMBER",
    label: "Anëtar",
  },
];

function displayName(
  member: StaffMember
) {
  const fullName = [
    member.user.firstName,
    member.user.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    fullName ||
    member.user.name ||
    member.user.email ||
    "Pa emër"
  );
}

function statusClasses(
  status: MembershipStatus
) {
  if (status === "ACTIVE") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "SUSPENDED") {
    return "bg-amber-50 text-amber-700";
  }

  if (status === "INVITED") {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-slate-100 text-slate-600";
}

export default function StafiClient() {
  const [staff, setStaff] =
    useState<StaffMember[]>([]);

  const [academyName, setAcademyName] =
    useState("");

  const [permissions, setPermissions] =
    useState<string[]>([]);

  const [invitations, setInvitations] =
    useState<StaffInvitation[]>([]);

  const [showInviteForm, setShowInviteForm] =
    useState(false);

  const [inviteEmail, setInviteEmail] =
    useState("");

  const [inviteRole, setInviteRole] =
    useState<StaffRole>("COACH");

  const [sendingInvite, setSendingInvite] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [editing, setEditing] =
    useState<StaffMember | null>(null);

  const [role, setRole] =
    useState<StaffRole>("MEMBER");

  const [status, setStatus] =
    useState<MembershipStatus>("ACTIVE");

  const currentMember =
    useMemo(
      () =>
        staff.find(
          (member) =>
            member.isCurrentUser
        ) ?? null,
      [staff]
    );

  const currentRole =
    currentMember?.role ?? null;

  async function loadStaff() {
    setLoading(true);
    setError("");

    try {
      const response =
        await fetch("/api/staff");

      const data = (await response.json()) as {
        academy?: {
          name?: string;
        };
        staff?: StaffMember[];
        permissions?: string[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Stafi nuk u ngarkua."
        );
      }

      setStaff(data.staff || []);
      setPermissions(
        data.permissions || []
      );
      setAcademyName(
        data.academy?.name || ""
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ndodhi një gabim gjatë ngarkimit të stafit."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadInvitations() {
    try {
      const response = await fetch(
        "/api/staff/invitations"
      );

      const data = (await response.json()) as {
        invitations?: StaffInvitation[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Ftesat nuk u ngarkuan."
        );
      }

      setInvitations(
        data.invitations || []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ndodhi një gabim gjatë ngarkimit të ftesave."
      );
    }
  }

  useEffect(() => {
    loadStaff();
    loadInvitations();
  }, []);

  async function createInvitation(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setSendingInvite(true);
    setError("");

    try {
      const response = await fetch(
        "/api/staff/invitations",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            email: inviteEmail,
            role: inviteRole,
          }),
        }
      );

      const data = (await response.json()) as {
        invitation?: StaffInvitation;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Ftesa nuk u krijua."
        );
      }

      setInviteEmail("");
      setInviteRole("COACH");
      setShowInviteForm(false);

      await loadInvitations();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ndodhi një gabim gjatë krijimit të ftesës."
      );
    } finally {
      setSendingInvite(false);
    }
  }

  async function copyInvitation(
    invitePath: string
  ) {
    const url =
      `${window.location.origin}${invitePath}`;

    await navigator.clipboard.writeText(
      url
    );
  }

  function canManage(
    member: StaffMember
  ) {
    if (
      member.isOwner ||
      member.isCurrentUser
    ) {
      return false;
    }

    if (
      member.role === "ADMIN" &&
      currentRole !== "OWNER"
    ) {
      return false;
    }

    return true;
  }

  function openEdit(
    member: StaffMember
  ) {
    if (!canManage(member)) {
      return;
    }

    setEditing(member);
    setRole(member.role);
    setStatus(member.status);
    setError("");
  }

  async function saveChanges(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (!editing) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload: {
        role: StaffRole;
        status?: MembershipStatus;
      } = {
        role,
      };

      if (
        editing.status !== "INVITED"
      ) {
        payload.status = status;
      }

      const response = await fetch(
        `/api/staff/${editing.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            payload
          ),
        }
      );

      const data = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Ndryshimet nuk u ruajtën."
        );
      }

      setEditing(null);
      await loadStaff();
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

  async function removeMember(
    member: StaffMember
  ) {
    if (!canManage(member)) {
      return;
    }

    const confirmed =
      window.confirm(
        `A je i sigurt që dëshiron të heqësh ${displayName(
          member
        )} nga stafi?`
      );

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      const response = await fetch(
        `/api/staff/${member.id}`,
        {
          method: "DELETE",
        }
      );

      const data = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Anëtari nuk u hoq."
        );
      }

      await loadStaff();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ndodhi një gabim."
      );
    }
  }

  const canInvite =
    permissions.includes(
      "STAFF_INVITE"
    );

  const roleOptions =
    ROLE_OPTIONS.filter(
      (option) =>
        currentRole === "OWNER" ||
        option.value !== "ADMIN"
    );

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-950">
              Stafi
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Menaxho rolet dhe aksesin e stafit të akademisë.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {academyName ? (
              <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600">
                <ShieldCheck size={17} />
                {academyName}
              </div>
            ) : null}

            {canInvite ? (
              <button
                type="button"
                onClick={() =>
                  setShowInviteForm(true)
                }
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <MailPlus size={17} />
                Fto anëtar stafi
              </button>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            Duke ngarkuar stafin...
          </div>
        ) : staff.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <UserCog
              className="mx-auto text-slate-400"
              size={32}
            />

            <p className="mt-3 font-semibold text-slate-900">
              Nuk ka anëtarë stafi.
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Anëtarët e stafit do të shfaqen këtu.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3">
                      Anëtari
                    </th>

                    <th className="px-5 py-3">
                      Roli
                    </th>

                    <th className="px-5 py-3">
                      Statusi
                    </th>

                    <th className="px-5 py-3">
                      Profili i trajnerit
                    </th>

                    <th className="px-5 py-3">
                      U bashkua
                    </th>

                    <th className="px-5 py-3 text-right">
                      Veprime
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {staff.map(
                    (member) => (
                      <tr
                        key={member.id}
                        className="text-sm"
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-900">
                            {displayName(
                              member
                            )}

                            {member.isCurrentUser ? (
                              <span className="ml-2 text-xs font-medium text-blue-600">
                                Ti
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {member.user.email}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {member.roleLabel}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(
                              member.status
                            )}`}
                          >
                            {member.statusLabel}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {member.coachProfile ? (
                            <div>
                              <div className="font-medium text-slate-800">
                                {
                                  member
                                    .coachProfile
                                    .firstName
                                }{" "}
                                {
                                  member
                                    .coachProfile
                                    .lastName
                                }
                              </div>

                              <div className="mt-1 text-xs text-slate-500">
                                Profil i lidhur
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">
                              Pa profil të lidhur
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {new Date(
                            member.joinedAt
                          ).toLocaleDateString(
                            "sq-AL"
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            {canManage(
                              member
                            ) ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    openEdit(
                                      member
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                  <Pencil
                                    size={14}
                                  />
                                  Ndrysho
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeMember(
                                      member
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                                >
                                  <Trash2
                                    size={14}
                                  />
                                  Hiq
                                </button>
                              </>
                            ) : (
                              <span className="text-xs font-medium text-slate-400">
                                {member.isOwner
                                  ? "I mbrojtur"
                                  : "Llogaria jote"}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {invitations.length > 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold text-slate-950">
                Ftesat e stafit
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Ftesat që janë ende në pritje ose kanë skaduar.
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {invitations.map(
                (invitation) => (
                  <div
                    key={invitation.id}
                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">
                        {invitation.email}
                      </div>

                      <div className="mt-1 text-sm text-slate-500">
                        {invitation.roleLabel}
                        {" · "}
                        {invitation.statusLabel}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        copyInvitation(
                          invitation.invitePath
                        )
                      }
                      disabled={
                        invitation.status ===
                        "EXPIRED"
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Copy size={15} />
                      Kopjo lidhjen
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        ) : null}

        {showInviteForm ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">
                    Fto anëtar stafi
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Zgjidh adresën elektronike dhe rolin e përdoruesit.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowInviteForm(false)
                  }
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  aria-label="Mbyll"
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={
                  createInvitation
                }
                className="mt-6 space-y-4"
              >
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Adresa elektronike
                  </label>

                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(event) =>
                      setInviteEmail(
                        event.target.value
                      )
                    }
                    placeholder="emri@shembull.al"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Roli
                  </label>

                  <select
                    value={inviteRole}
                    onChange={(event) =>
                      setInviteRole(
                        event.target
                          .value as StaffRole
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                  >
                    {roleOptions.map(
                      (option) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {
                            option.label
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setShowInviteForm(
                        false
                      )
                    }
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Anulo
                  </button>

                  <button
                    type="submit"
                    disabled={
                      sendingInvite
                    }
                    className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sendingInvite
                      ? "Duke krijuar..."
                      : "Krijo ftesën"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {editing ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">
                    Ndrysho anëtarin e stafit
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {displayName(
                      editing
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setEditing(null)
                  }
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  aria-label="Mbyll"
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={
                  saveChanges
                }
                className="mt-6 space-y-4"
              >
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Roli
                  </label>

                  <select
                    value={role}
                    onChange={(event) =>
                      setRole(
                        event.target
                          .value as StaffRole
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-400"
                  >
                    {roleOptions.map(
                      (option) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {
                            option.label
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Statusi
                  </label>

                  {editing.status ===
                  "INVITED" ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                      Ftesë në pritje
                    </div>
                  ) : (
                    <select
                      value={status}
                      onChange={(event) =>
                        setStatus(
                          event.target
                            .value as MembershipStatus
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-400"
                    >
                      <option value="ACTIVE">
                        Aktiv
                      </option>

                      <option value="SUSPENDED">
                        Pezulluar
                      </option>
                    </select>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setEditing(null)
                    }
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Anulo
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving
                      ? "Duke ruajtur..."
                      : "Ruaj ndryshimet"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}