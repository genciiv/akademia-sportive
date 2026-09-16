"use client";

import {
  History,
  RefreshCw,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";

type AuditData =
  Record<string, unknown> | null;

type AuditLogEntry = {
  id: string;
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  entityLabel: string | null;
  beforeData: AuditData;
  afterData: AuditData;
  metadata: AuditData;
  createdAt: string;

  actorUser: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
};

const ACTION_LABELS: Record<
  string,
  string
> = {
  STAFF_ROLE_CHANGED:
    "Roli u ndryshua",

  STAFF_ACCESS_CHANGED:
    "Aksesi u ndryshua",

  STAFF_REMOVED:
    "Anëtari u hoq",

  STAFF_INVITATION_CREATED:
    "Ftesa u krijua",

  STAFF_INVITATION_RESENT:
    "Ftesa u ridërgua",

  STAFF_INVITATION_REVOKED:
    "Ftesa u revokua",

  STAFF_ACCOUNT_LINKED:
    "Llogaria u lidh",
};

const ROLE_LABELS: Record<
  string,
  string
> = {
  OWNER:
    "Pronar",

  ADMIN:
    "Administrator",

  SPORTS_DIRECTOR:
    "Drejtor sportiv",

  HEAD_COACH:
    "Trajner kryesor",

  COACH:
    "Trajner",

  ASSISTANT_COACH:
    "Ndihmës trajner",

  FINANCE:
    "Financa",

  RECEPTIONIST:
    "Recepsion",

  MEMBER:
    "Anëtar",
};

const STATUS_LABELS: Record<
  string,
  string
> = {
  ACTIVE:
    "Aktiv",

  INVITED:
    "Ftuar",

  SUSPENDED:
    "Pezulluar",

  REMOVED:
    "Hequr",

  PENDING:
    "Në pritje",

  REVOKED:
    "Revokuar",
};

function valueFrom(
  data: AuditData,
  key: string
) {
  if (!data) {
    return null;
  }

  const value = data[key];

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
  }

  return null;
}

function roleLabel(
  value: string | null
) {
  if (!value) {
    return "-";
  }

  return (
    ROLE_LABELS[value] ||
    value
  );
}

function statusLabel(
  value: string | null
) {
  if (!value) {
    return "-";
  }

  return (
    STATUS_LABELS[value] ||
    value
  );
}

function actorName(
  entry: AuditLogEntry
) {
  if (!entry.actorUser) {
    return "Sistem";
  }

  const fullName = [
    entry.actorUser.firstName,
    entry.actorUser.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    fullName ||
    entry.actorUser.email ||
    "Përdorues"
  );
}

function auditDetails(
  entry: AuditLogEntry
) {
  const beforeRole =
    valueFrom(
      entry.beforeData,
      "role"
    );

  const afterRole =
    valueFrom(
      entry.afterData,
      "role"
    );

  const beforeStatus =
    valueFrom(
      entry.beforeData,
      "status"
    );

  const afterStatus =
    valueFrom(
      entry.afterData,
      "status"
    );

  if (
    entry.action ===
    "STAFF_ROLE_CHANGED"
  ) {
    return `${roleLabel(
      beforeRole
    )} → ${roleLabel(
      afterRole
    )}`;
  }

  if (
    entry.action ===
      "STAFF_ACCESS_CHANGED" ||
    entry.action ===
      "STAFF_REMOVED"
  ) {
    return `${statusLabel(
      beforeStatus
    )} → ${statusLabel(
      afterStatus
    )}`;
  }

  if (
    entry.action ===
    "STAFF_INVITATION_CREATED"
  ) {
    return `Roli: ${roleLabel(
      afterRole
    )}`;
  }

  if (
    entry.action ===
    "STAFF_INVITATION_RESENT"
  ) {
    return "U krijua një lidhje e re ftese.";
  }

  if (
    entry.action ===
    "STAFF_INVITATION_REVOKED"
  ) {
    return "Ftesa aktive u çaktivizua.";
  }

  if (
    entry.action ===
    "STAFF_ACCOUNT_LINKED"
  ) {
    return "Profili u lidh me një llogari ekzistuese.";
  }

  return entry.entityType;
}

export function StaffAuditLog() {
  const [
    auditLogs,
    setAuditLogs,
  ] = useState<AuditLogEntry[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  async function loadAuditLogs() {
    setLoading(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/staff/audit-logs",
          {
            cache: "no-store",
          }
        );

      const data =
        (await response.json()) as {
          auditLogs?: AuditLogEntry[];
          error?: string;
        };

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Historiku nuk u ngarkua."
        );
      }

      setAuditLogs(
        data.auditLogs || []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ndodhi një gabim gjatë ngarkimit të historikut."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAuditLogs();
  }, []);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <History
              size={18}
              className="text-slate-500"
            />

            <h2 className="font-semibold text-slate-950">
              Historiku i veprimeve
            </h2>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Veprimet administrative më të fundit mbi stafin dhe ftesat.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadAuditLogs()
          }
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={
              loading
                ? "animate-spin"
                : ""
            }
          />

          Rifresko
        </button>
      </div>

      {error ? (
        <div className="px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : loading &&
        auditLogs.length === 0 ? (
        <div className="px-5 py-6 text-sm text-slate-500">
          Duke ngarkuar historikun...
        </div>
      ) : auditLogs.length === 0 ? (
        <div className="px-5 py-6 text-sm text-slate-500">
          Nuk ka ende veprime administrative të regjistruara.
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {auditLogs.map(
            (entry) => (
              <div
                key={entry.id}
                className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div>
                  <div className="font-semibold text-slate-900">
                    {ACTION_LABELS[
                      entry.action
                    ] ||
                      entry.action}
                  </div>

                  <div className="mt-1 text-sm text-slate-600">
                    {entry.entityLabel ||
                      "Pa emër"}
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    {auditDetails(
                      entry
                    )}
                  </div>
                </div>

                <div className="text-left text-xs text-slate-500 sm:text-right">
                  <div className="font-medium text-slate-600">
                    {actorName(
                      entry
                    )}
                  </div>

                  <div className="mt-1">
                    {new Date(
                      entry.createdAt
                    ).toLocaleString(
                      "sq-AL"
                    )}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}