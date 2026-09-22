"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Copy,
  MailPlus,
  Plus,
  Pencil,
  ShieldCheck,
  Trash2,
  UserCog,
  X,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import {
  StaffAuditLog,
} from "@/components/stafi/staff-audit-log";

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

type EditableAccessStatus =
  | "ACTIVE"
  | "SUSPENDED";

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

  membershipId: string | null;

  accessStatus:
    | "ACTIVE"
    | "INVITED"
    | "SUSPENDED"
    | "REMOVED"
    | "NO_ACCESS";

  accessStatusLabel: string;

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






  const [creating, setCreating] =
    useState(false);

  const [createFirstName, setCreateFirstName] =
    useState("");

  const [createLastName, setCreateLastName] =
    useState("");

  const [createEmail, setCreateEmail] =
    useState("");

  const [createPhone, setCreatePhone] =
    useState("");

  const [createRole, setCreateRole] =
    useState<Exclude<StaffRole, "OWNER">>(
      "COACH"
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [
    invitingStaffId,
    setInvitingStaffId,
  ] = useState<string | null>(null);

  const [
    invitationActionId,
    setInvitationActionId,
  ] = useState<string | null>(null);

  const [
    invitationActionType,
    setInvitationActionType,
  ] = useState<
    "resend" | "revoke" | null
  >(null);
  const [editing, setEditing] =
    useState<StaffMember | null>(null);

  const [role, setRole] =
    useState<StaffRole>("MEMBER");

  const [
    accessStatus,
    setAccessStatus,
  ] = useState<EditableAccessStatus>(
    "ACTIVE"
  );

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


  async function createStaff() {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        "/api/staff",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            firstName:
              createFirstName,
            lastName:
              createLastName,
            email:
              createEmail,
            phone:
              createPhone,
            role:
              createRole,
          }),
        }
      );

      const data = (await response.json()) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Anëtari i stafit nuk u shtua."
        );
      }

      setCreating(false);
      setCreateFirstName("");
      setCreateLastName("");
      setCreateEmail("");
      setCreatePhone("");
      setCreateRole("COACH");

      setMessage(
        data.message ||
          "Anëtari i stafit u shtua me sukses."
      );

      await loadStaff();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ndodhi një gabim gjatë shtimit të stafit."
      );
    } finally {
      setSaving(false);
    }
  }

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
    void loadStaff();
  }, []);

  useEffect(() => {
    if (
      permissions.includes(
        "STAFF_INVITE"
      )
    ) {
      void loadInvitations();
    } else {
      setInvitations([]);
    }
  }, [permissions]);

  async function copyInvitation(
    invitePath: string
  ) {
    const url =
      `${window.location.origin}${invitePath}`;

    await navigator.clipboard.writeText(
      url
    );
  }

  async function resendInvitation(
    invitation: StaffInvitation
  ) {
    const confirmed =
      window.confirm(
        `Dëshiron ta ridërgosh ftesën për ${invitation.email}? Lidhja e vjetër do të çaktivizohet.`
      );

    if (!confirmed) {
      return;
    }

    setInvitationActionId(
      invitation.id
    );
    setInvitationActionType(
      "resend"
    );
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/staff/invitations/${invitation.id}/resend`,
        {
          method: "POST",
        }
      );

      const data = (await response.json()) as {
        error?: string;
        message?: string;
        emailDelivery?: {
          ok?: boolean;
        };
        invitation?: {
          invitePath?: string;
        };
      };

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Ftesa nuk mund të ridërgohej."
        );
      }

      let copied = false;

      if (
        data.invitation?.invitePath
      ) {
        try {
          await navigator.clipboard.writeText(
            `${window.location.origin}${data.invitation.invitePath}`
          );

          copied = true;
        } catch {
          copied = false;
        }
      }

      const emailSent =
        data.emailDelivery?.ok === true;

      setMessage(
        emailSent
          ? copied
            ? "Email-i i ftes\u00ebs u d\u00ebrgua automatikisht dhe lidhja e re u kopjua."
            : "Email-i i ftes\u00ebs u d\u00ebrgua automatikisht."
          : copied
            ? "Email-i i ftes\u00ebs nuk u d\u00ebrgua, por lidhja e re u kopjua. D\u00ebrgoje manualisht."
            : "Email-i i ftes\u00ebs nuk u d\u00ebrgua. Kopjo lidhjen e re te seksioni i ftesave dhe d\u00ebrgoje manualisht."
      );
      await loadInvitations();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ndodhi një gabim gjatë ridërgimit të ftesës."
      );
    } finally {
      setInvitationActionId(null);
      setInvitationActionType(null);
    }
  }

  async function revokeInvitation(
    invitation: StaffInvitation
  ) {
    const confirmed =
      window.confirm(
        `Dëshiron ta revokosh ftesën për ${invitation.email}?`
      );

    if (!confirmed) {
      return;
    }

    setInvitationActionId(
      invitation.id
    );
    setInvitationActionType(
      "revoke"
    );
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/staff/invitations/${invitation.id}`,
        {
          method: "DELETE",
        }
      );

      const data = (await response.json()) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Ftesa nuk mund të revokohej."
        );
      }

      setMessage(
        data.message ||
          "Ftesa u revokua me sukses."
      );

      await loadInvitations();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ndodhi një gabim gjatë revokimit të ftesës."
      );
    } finally {
      setInvitationActionId(null);
      setInvitationActionType(null);
    }
  }
  async function inviteStaff(
    member: StaffMember
  ) {
    if (!member.user.email) {
      setError(
        "Ky anëtar i stafit nuk ka adresë elektronike."
      );
      return;
    }

    setInvitingStaffId(
      member.id
    );

    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/staff/profiles/${member.id}/invite`,
        {
          method: "POST",
        }
      );

      const data = (await response.json()) as {
        error?: string;
        message?: string;
        emailDelivery?: {
          ok?: boolean;
        };

        accessLinked?: boolean;

        invitation?: {
          invitePath?: string;
        };
      };

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Ftesa nuk mund të krijohej."
        );
      }

      if (data.accessLinked) {
        setMessage(
          "Llogaria ekzistuese u lidh me sukses me k\u00ebt\u00eb an\u00ebtar t\u00eb stafit."
        );
      } else if (
        data.invitation?.invitePath
      ) {
        let copied = false;

        try {
          await navigator.clipboard.writeText(
            `${window.location.origin}${data.invitation.invitePath}`
          );

          copied = true;
        } catch {
          copied = false;
        }

        const emailSent =
          data.emailDelivery?.ok === true;

        setMessage(
          emailSent
            ? copied
              ? "Email-i i ftes\u00ebs u d\u00ebrgua automatikisht dhe lidhja u kopjua."
              : "Email-i i ftes\u00ebs u d\u00ebrgua automatikisht."
            : copied
              ? "Email-i i ftes\u00ebs nuk u d\u00ebrgua, por lidhja u kopjua. D\u00ebrgoje manualisht."
              : "Email-i i ftes\u00ebs nuk u d\u00ebrgua. Kopjo lidhjen te seksioni i ftesave dhe d\u00ebrgoje manualisht."
        );
      } else {
        setMessage(
          data.message ||
            "Aksesi u përditësua me sukses."
        );
      }

      await Promise.all([
        loadStaff(),
        loadInvitations(),
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ndodhi një gabim gjatë krijimit të ftesës."
      );
    } finally {
      setInvitingStaffId(null);
    }
  }

  const canUpdate =
    permissions.includes(
      "STAFF_UPDATE"
    );

  const canRemove =
    permissions.includes(
      "STAFF_REMOVE"
    );

  function canManage(
    member: StaffMember
  ) {
    if (
      !canUpdate &&
      !canRemove
    ) {
      return false;
    }
    if (!member.membershipId) {
      return false;
    }

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

    setAccessStatus(
      member.accessStatus ===
        "SUSPENDED"
        ? "SUSPENDED"
        : "ACTIVE"
    );

    setError("");
  }

  async function saveChanges(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (
      !editing ||
      !editing.membershipId
    ) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload: {
        role: StaffRole;
        status?: EditableAccessStatus;
      } = {
        role,
      };

      if (
        editing.accessStatus ===
          "ACTIVE" ||
        editing.accessStatus ===
          "SUSPENDED"
      ) {
        payload.status =
          accessStatus;
      }

      const response = await fetch(
        `/api/staff/${editing.membershipId}`,
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
        `/api/staff/${member.membershipId}`,
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

            {canInvite ? (
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setMessage("");
                  setCreating(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Plus size={17} />
                {"Shto anëtar"}
              </button>
            ) : null}

            {academyName ? (
              <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600">
                <ShieldCheck size={17} />
                {academyName}
              </div>
            ) : null}


          </div>
        </div>


        {creating ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]">
            <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">
                    {"Shto anëtar stafi"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {"Krijo profilin e stafit. Ftesën për akses në platformë mund ta dërgosh më pas."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setCreating(false)
                  }
                  disabled={saving}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Mbyll"
                >
                  <X size={19} />
                </button>
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void createStaff();
                }}
                className="space-y-5 p-6"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-sm font-semibold text-slate-700">
                      Emri
                    </span>

                    <input
                      required
                      maxLength={80}
                      value={createFirstName}
                      onChange={(event) =>
                        setCreateFirstName(
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                      placeholder="Emri"
                    />
                  </label>

                  <label className="space-y-1.5">
                    <span className="text-sm font-semibold text-slate-700">
                      Mbiemri
                    </span>

                    <input
                      required
                      maxLength={80}
                      value={createLastName}
                      onChange={(event) =>
                        setCreateLastName(
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                      placeholder="Mbiemri"
                    />
                  </label>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-sm font-semibold text-slate-700">
                    Email
                  </span>

                  <input
                    required
                    type="email"
                    maxLength={320}
                    value={createEmail}
                    onChange={(event) =>
                      setCreateEmail(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                    placeholder="email@example.com"
                  />

                  <p className="text-xs text-slate-500">
                    {"Ky email do të përdoret edhe për ftesën e aksesit."}
                  </p>
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-sm font-semibold text-slate-700">
                      Telefoni
                    </span>

                    <input
                      maxLength={50}
                      value={createPhone}
                      onChange={(event) =>
                        setCreatePhone(
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                      placeholder="069..."
                    />
                  </label>

                  <label className="space-y-1.5">
                    <span className="text-sm font-semibold text-slate-700">
                      Roli
                    </span>

                    <select
                      value={createRole}
                      onChange={(event) =>
                        setCreateRole(
                          event.target
                            .value as Exclude<
                            StaffRole,
                            "OWNER"
                          >
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                    >
                      {roleOptions.map(
                        (option) => (
                          <option
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        )
                      )}
                    </select>
                  </label>
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setCreating(false)
                    }
                    disabled={saving}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Anulo
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Plus size={17} />

                    {saving
                      ? "Duke shtuar..."
                      : "Shto anëtar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {message}
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
                      Aksesi
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

                        <td className="px-5 py-4">
                          <span
                            className={
                              member.accessStatus ===
                              "ACTIVE"
                                ? "inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                                : member.accessStatus ===
                                  "NO_ACCESS"
                                ? "inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                                : member.accessStatus ===
                                  "INVITED"
                                ? "inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700"
                                : "inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700"
                            }
                          >
                            {
                              member.accessStatusLabel
                            }
                          </span>
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
                            {member.isOwner ? (
                              <span className="text-xs font-medium text-slate-400">
                                I mbrojtur
                              </span>
                            ) : !member.membershipId ? (
                              canInvite ? (
                                member.user.email ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      inviteStaff(
                                        member
                                      )
                                    }
                                    disabled={
                                      invitingStaffId ===
                                      member.id
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    <MailPlus
                                      size={14}
                                    />

                                    {invitingStaffId ===
                                    member.id
                                      ? "Duke krijuar..."
                                      : "Fto në platformë"}
                                  </button>
                                ) : (
                                  <span className="text-xs font-medium text-amber-600">
                                    Pa adresë elektronike
                                  </span>
                                )
                              ) : (
                                <span className="text-xs font-medium text-slate-400">
                                  Pa akses
                                </span>
                              )
                            ) : member.isCurrentUser ? (
                              <span className="text-xs font-medium text-slate-400">
                                Llogaria jote
                              </span>
                            ) : canManage(
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
                            ) : null}
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

                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          copyInvitation(
                            invitation.invitePath
                          )
                        }
                        disabled={
                          invitation.status ===
                            "EXPIRED" ||
                          invitationActionId !==
                            null
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Copy size={15} />
                        Kopjo lidhjen
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          resendInvitation(
                            invitation
                          )
                        }
                        disabled={
                          invitationActionId !==
                          null
                        }
                        className="inline-flex items-center justify-center rounded-xl border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {invitationActionId ===
                          invitation.id &&
                        invitationActionType ===
                          "resend"
                          ? "Duke ridërguar..."
                          : "Ri-dërgo"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          revokeInvitation(
                            invitation
                          )
                        }
                        disabled={
                          invitationActionId !==
                          null
                        }
                        className="inline-flex items-center justify-center rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {invitationActionId ===
                          invitation.id &&
                        invitationActionType ===
                          "revoke"
                          ? "Duke revokuar..."
                          : "Revoko"}
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        ) : null}

        {permissions.includes(
          "AUDIT_LOGS_VIEW"
        ) ? (
          <StaffAuditLog />
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
                    Aksesi në platformë
                  </label>

                  {editing.accessStatus ===
                  "INVITED" ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                      Ftesë në pritje
                    </div>
                  ) : (
                    <select
                      value={accessStatus}
                      onChange={(event) =>
                        setAccessStatus(
                          event.target
                            .value as EditableAccessStatus
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