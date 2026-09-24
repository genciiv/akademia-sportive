"use client";

import {
  Building2,
  CheckCircle2,
  Clock3,
  Copy,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  UserRound,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

type Status = "PENDING" | "CONTACTED" | "APPROVED" | "REJECTED";

type Application = {
  id: string;
  academyName: string;
  contactName: string;
  email: string;
  phone: string;
  city: string | null;
  address: string | null;
  sport: string | null;
  message: string | null;
  requestedPlanCode: string | null;
  status: Status;
  adminNotes: string | null;
  contactedAt: string | null;
  reviewedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  consumedAt: string | null;
  createdAcademyId: string | null;
  createdAt: string;
  updatedAt: string;
};

type Filter = "ALL" | Status;

const filters: Array<{
  key: Filter;
  label: string;
}> = [
  { key: "ALL", label: "Të gjitha" },
  { key: "PENDING", label: "Në pritje" },
  { key: "CONTACTED", label: "Kontaktuar" },
  { key: "APPROVED", label: "Aprovuar" },
  { key: "REJECTED", label: "Refuzuar" },
];

const statusLabels: Record<Status, string> = {
  PENDING: "Në pritje",
  CONTACTED: "Kontaktuar",
  APPROVED: "Aprovuar",
  REJECTED: "Refuzuar",
};
const planLabels: Record<string, string> = {
  STARTER: "Starter",
  PRO: "Pro",
  PRO_PORTAL: "Pro + Athlete Portal",
};

export default function ApplicationsClient({
  initialApplications,
  adminName,
}: {
  initialApplications: Application[];
  adminName: string;
}) {
  const [applications, setApplications] = useState(initialApplications);

  const [filter, setFilter] = useState<Filter>("PENDING");

  const [selectedId, setSelectedId] = useState<string | null>(
    initialApplications.find((application) => application.status === "PENDING")
      ?.id ??
      initialApplications[0]?.id ??
      null,
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [onboardingInvitation, setOnboardingInvitation] = useState<{
    academyName: string;
    email: string;
    url: string;
    expiresAt: string;
    emailSent: boolean;
  } | null>(null);
  const [invitationCopied, setInvitationCopied] = useState(false);

  const visible = useMemo(
    () =>
      filter === "ALL"
        ? applications
        : applications.filter((application) => application.status === filter),
    [applications, filter],
  );

  const selected =
    visible.find((application) => application.id === selectedId) ??
    visible[0] ??
    null;

  const counts = useMemo(() => {
    return {
      ALL: applications.length,
      PENDING: applications.filter((a) => a.status === "PENDING").length,
      CONTACTED: applications.filter((a) => a.status === "CONTACTED").length,
      APPROVED: applications.filter((a) => a.status === "APPROVED").length,
      REJECTED: applications.filter((a) => a.status === "REJECTED").length,
    };
  }, [applications]);

  async function updateStatus(status: Exclude<Status, "PENDING">) {
    if (!selected || saving) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `/api/platform-admin/academy-applications/${selected.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            adminNotes: selected.adminNotes ?? "",
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || "Veprimi nuk mund të kryhej.");
        return;
      }

      const updated = data.application;

      if (
        status === "APPROVED" &&
        data?.onboarding?.token &&
        data?.onboarding?.expiresAt
      ) {
        const invitationUrl =
          window.location.origin +
          "/regjistrohu?invite=" +
          encodeURIComponent(data.onboarding.token);

        setOnboardingInvitation({
          academyName: selected.academyName,
          email: selected.email,
          url: invitationUrl,
          expiresAt: data.onboarding.expiresAt,
          emailSent: data?.onboarding?.emailDelivery?.ok === true,
        });
        setInvitationCopied(false);
      }

      setApplications((current) =>
        current.map((application) =>
          application.id === selected.id
            ? {
                ...application,
                status: updated.status,
                adminNotes: updated.adminNotes,
                contactedAt: updated.contactedAt,
                reviewedAt: updated.reviewedAt,
                approvedAt: updated.approvedAt,
                rejectedAt: updated.rejectedAt,
                updatedAt: updated.updatedAt,
              }
            : application,
        ),
      );
    } catch {
      setError("Nuk u arrit lidhja me serverin. Provo përsëri.");
    } finally {
      setSaving(false);
    }
  }

  async function copyOnboardingInvitation() {
    if (!onboardingInvitation) return;

    try {
      await navigator.clipboard.writeText(onboardingInvitation.url);
      setInvitationCopied(true);
    } catch {
      setError(
        "Linku nuk u kopjua automatikisht. Kopjoje manualisht nga fusha e ftesës.",
      );
    }
  }

  function updateNotes(value: string) {
    if (!selected) return;

    setApplications((current) =>
      current.map((application) =>
        application.id === selected.id
          ? {
              ...application,
              adminNotes: value,
            }
          : application,
      ),
    );
  }

  return (
    <div>
      {onboardingInvitation ? (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-emerald-950">
                Ftesa e onboarding-ut u krijua
              </p>

              <p className="mt-1 text-xs leading-5 text-emerald-800">
                {onboardingInvitation.academyName} ·{" "}
                {onboardingInvitation.email}
              </p>

              <p
                className={`mt-2 text-xs font-semibold leading-5 ${
                  onboardingInvitation.emailSent
                    ? "text-emerald-700"
                    : "text-amber-700"
                }`}
              >
                {onboardingInvitation.emailSent
                  ? "Email-i i ftesës u dërgua automatikisht."
                  : "Email-i i ftesës nuk u dërgua. Kopjo linkun më poshtë dhe dërgoja manualisht."}
              </p>

              <p className="mt-2 text-xs leading-5 text-emerald-700">
                Kopjoje këtë link tani. Për arsye sigurie, token-i nuk mund të
                rikthehet pas rifreskimit të faqes.
              </p>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  readOnly
                  value={onboardingInvitation.url}
                  aria-label="Linku i ftesës së onboarding-ut"
                  className="min-w-0 flex-1 rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none"
                  onFocus={(event) => event.currentTarget.select()}
                />

                <button
                  type="button"
                  onClick={copyOnboardingInvitation}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-800"
                >
                  <Copy size={14} />
                  {invitationCopied ? "U kopjua" : "Kopjo linkun"}
                </button>
              </div>

              <p className="mt-2 text-[11px] text-emerald-700">
                Skadon më: {formatDate(onboardingInvitation.expiresAt)}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
          Aplikimet
        </p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
          Akademitë e interesuara
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Shqyrto aplikimet, kontakto akademitë dhe aprovo vetëm ato që dëshiron
          të aktivizosh në platformë.
        </p>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {filters.map((item) => {
          const active = filter === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={[
                "whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition",
                active
                  ? "bg-slate-950 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              ].join(" ")}
            >
              {item.label}
              <span
                className={[
                  "ml-2",
                  active ? "text-slate-300" : "text-slate-400",
                ].join(" ")}
              >
                {counts[item.key]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[420px_minmax(0,1fr)]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-xs font-semibold text-slate-500">
              {visible.length} aplikime
            </p>
          </div>

          <div className="max-h-[720px] overflow-y-auto">
            {visible.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <Clock3 size={24} className="mx-auto text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  Nuk ka aplikime
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Nuk ka rezultate për këtë filtër.
                </p>
              </div>
            ) : (
              visible.map((application) => (
                <button
                  key={application.id}
                  type="button"
                  onClick={() => setSelectedId(application.id)}
                  className={[
                    "block w-full border-b border-slate-100 px-4 py-4 text-left transition last:border-b-0",
                    selected?.id === application.id
                      ? "bg-blue-50/70"
                      : "hover:bg-slate-50",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {application.academyName}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {application.contactName}
                      </p>
                    </div>

                    <StatusBadge status={application.status} />
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-slate-400">
                    <span className="truncate">
                      {application.city || "Pa qytet"}
                    </span>

                    <span>{formatDate(application.createdAt)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="min-w-0">
          {!selected ? (
            <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <div>
                <Building2 size={28} className="mx-auto text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  Zgjidh një aplikim
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={selected.status} />

                      {selected.consumedAt ? (
                        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700">
                          Akademia krijuar
                        </span>
                      ) : null}
                    </div>

                    <h2 className="mt-3 text-xl font-bold text-slate-950">
                      {selected.academyName}
                    </h2>

                    <p className="mt-1 text-xs text-slate-400">
                      Aplikuar më {formatDateTime(selected.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-2">
                <Info
                  icon={<UserRound size={15} />}
                  label="Personi i kontaktit"
                  value={selected.contactName}
                />

                <Info
                  icon={<Mail size={15} />}
                  label="Email"
                  value={selected.email}
                  href={`mailto:${selected.email}`}
                />

                <Info
                  icon={<Phone size={15} />}
                  label="Telefon"
                  value={selected.phone}
                  href={`tel:${selected.phone}`}
                />

                <Info
                  icon={<MapPin size={15} />}
                  label="Qyteti"
                  value={selected.city || "—"}
                />

                <Info
                  icon={<Building2 size={15} />}
                  label="Sporti"
                  value={selected.sport || "—"}
                />
                <Info
                  icon={<Building2 size={15} />}
                  label="Paketa e interesit"
                  value={
                    selected.requestedPlanCode
                      ? (planLabels[selected.requestedPlanCode] ??
                        selected.requestedPlanCode)
                      : "Pa paketë të zgjedhur"
                  }
                />

                <Info
                  icon={<MapPin size={15} />}
                  label="Adresa"
                  value={selected.address || "—"}
                />
              </div>

              {selected.message ? (
                <div className="border-t border-slate-100 p-5 sm:p-6">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <MessageSquareText size={15} />
                    Mesazhi
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {selected.message}
                  </p>
                </div>
              ) : null}

              <div className="border-t border-slate-100 p-5 sm:p-6">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">
                    Shënime private
                  </span>

                  <textarea
                    value={selected.adminNotes ?? ""}
                    onChange={(event) => updateNotes(event.target.value)}
                    disabled={!!selected.consumedAt}
                    rows={4}
                    maxLength={2000}
                    placeholder="Shënime për komunikimin me akademinë..."
                    className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50"
                  />
                </label>

                {error ? (
                  <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                {!selected.consumedAt ? (
                  <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => updateStatus("CONTACTED")}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                    >
                      <Phone size={14} />
                      Kontaktuar
                    </button>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => updateStatus("APPROVED")}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <CheckCircle2 size={14} />
                      Aprovo
                    </button>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => updateStatus("REJECTED")}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                    >
                      <XCircle size={14} />
                      Refuzo
                    </button>
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-slate-400">
                    Ky aplikim është konsumuar dhe nuk mund të ndryshohet më.
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const classes: Record<Status, string> = {
    PENDING: "bg-slate-100 text-slate-600",
    CONTACTED: "bg-amber-50 text-amber-700",
    APPROVED: "bg-emerald-50 text-emerald-700",
    REJECTED: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${classes[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}

function Info({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
        {icon}
        {label}
      </div>

      {href ? (
        <a
          href={href}
          className="mt-1.5 block break-all text-sm font-semibold text-blue-600 hover:underline"
        >
          {value}
        </a>
      ) : (
        <p className="mt-1.5 break-words text-sm font-semibold text-slate-800">
          {value}
        </p>
      )}
    </div>
  );
}

const MONTHS_SQ = [
  "jan",
  "shk",
  "mar",
  "pri",
  "maj",
  "qer",
  "kor",
  "gus",
  "sht",
  "tet",
  "nën",
  "dhj",
];

function tiranaDateParts(value: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Tirane",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));

  const getPart = (type: "day" | "month" | "year" | "hour" | "minute") =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    day: getPart("day"),
    month: Number(getPart("month")),
    year: getPart("year"),
    hour: getPart("hour"),
    minute: getPart("minute"),
  };
}

function formatDate(value: string) {
  const { day, month } = tiranaDateParts(value);

  return `${day} ${MONTHS_SQ[month - 1] ?? ""}`.trim();
}

function formatDateTime(value: string) {
  const { day, month, year, hour, minute } = tiranaDateParts(value);

  return `${day} ${MONTHS_SQ[month - 1] ?? ""} ${year}, ${hour}:${minute}`;
}
