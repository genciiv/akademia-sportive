"use client";

import {
  CheckCircle2,
  Clipboard,
  ExternalLink,
  Mail,
  RefreshCw,
  RotateCcw,
  Send,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Player = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
};

type InvitationStatus = "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";

type AthleteInvitation = {
  id: string;
  email: string;
  status: InvitationStatus;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  player: {
    id: string;
    firstName: string;
    lastName: string;
    status: string;
  };
  invitedBy: {
    id: string;
    name: string;
    email: string;
  } | null;
};

type DeliveryResult =
  | {
      ok: true;
      messageId: string | null;
    }
  | {
      ok: false;
      reason: "not_configured" | "provider_error" | "network_error";
      status?: number;
    };

type DeliveryResponse = {
  message?: string;
  emailDelivery?: DeliveryResult;
  invitation?: {
    id: string;
    invitePath: string;
    expiresAt: string;
  };
  error?: string;
};

type AthleteInvitationManagerProps = {
  player: Player;
  onClose: () => void;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("sq-AL", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Tirane",
  }).format(new Date(value));
}

function statusLabel(status: InvitationStatus) {
  switch (status) {
    case "PENDING":
      return "Në pritje";
    case "ACCEPTED":
      return "Portal aktiv";
    case "REVOKED":
      return "E revokuar";
    case "EXPIRED":
      return "E skaduar";
  }
}

function statusClass(status: InvitationStatus) {
  switch (status) {
    case "PENDING":
      return "bg-amber-50 text-amber-700";
    case "ACCEPTED":
      return "bg-emerald-50 text-emerald-700";
    case "REVOKED":
      return "bg-slate-100 text-slate-600";
    case "EXPIRED":
      return "bg-red-50 text-red-700";
  }
}

function deliveryMessage(delivery: DeliveryResult | undefined) {
  if (!delivery) {
    return null;
  }

  if (delivery.ok) {
    return "Email-i i ftesës u dërgua me sukses.";
  }

  switch (delivery.reason) {
    case "not_configured":
      return "Email-i nuk është i konfiguruar. Përdor linkun manual më poshtë.";
    case "provider_error":
      return "Ofruesi i email-it nuk e pranoi dërgimin. Përdor linkun manual më poshtë.";
    case "network_error":
      return "Dërgimi i email-it dështoi për shkak të rrjetit. Përdor linkun manual më poshtë.";
  }
}

export default function AthleteInvitationManager({
  player,
  onClose,
}: AthleteInvitationManagerProps) {
  const [invitations, setInvitations] = useState<AthleteInvitation[]>([]);

  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [invitePath, setInvitePath] = useState("");
  const [emailDelivery, setEmailDelivery] = useState<DeliveryResult>();

  const latestInvitation = useMemo(
    () =>
      invitations.find((invitation) => invitation.player.id === player.id) ||
      null,
    [invitations, player.id],
  );

  const inviteUrl =
    invitePath && typeof window !== "undefined"
      ? new URL(invitePath, window.location.origin).toString()
      : "";

  async function loadInvitations() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/athlete-invitations", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Ftesat e portalit nuk mund të ngarkoheshin.");
        return;
      }

      setInvitations(data.invitations || []);
    } catch {
      setError("Ndodhi një problem gjatë ngarkimit të ftesave.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvitations();
  }, []);

  function resetDeliveryState() {
    setMessage("");
    setError("");
    setInvitePath("");
    setEmailDelivery(undefined);
  }

  async function createInvitation() {
    if (!player.email || working) {
      return;
    }

    resetDeliveryState();
    setWorking(true);

    try {
      const response = await fetch(`/api/players/${player.id}/athlete-invite`, {
        method: "POST",
      });

      const data = (await response.json()) as DeliveryResponse;

      if (!response.ok) {
        setError(data.error || "Ftesa nuk mund të krijohej.");
        return;
      }

      setMessage(data.message || "Ftesa u krijua me sukses.");

      setInvitePath(data.invitation?.invitePath || "");

      setEmailDelivery(data.emailDelivery);

      await loadInvitations();
    } catch {
      setError("Ndodhi një problem gjatë krijimit të ftesës.");
    } finally {
      setWorking(false);
    }
  }

  async function resendInvitation() {
    if (!latestInvitation || working) {
      return;
    }

    resetDeliveryState();
    setWorking(true);

    try {
      const response = await fetch(
        `/api/athlete-invitations/${latestInvitation.id}/resend`,
        {
          method: "POST",
        },
      );

      const data = (await response.json()) as DeliveryResponse;

      if (!response.ok) {
        setError(data.error || "Ftesa nuk mund të ridërgohej.");
        return;
      }

      setMessage(data.message || "Ftesa u ridërgua me sukses.");

      setInvitePath(data.invitation?.invitePath || "");

      setEmailDelivery(data.emailDelivery);

      await loadInvitations();
    } catch {
      setError("Ndodhi një problem gjatë ridërgimit të ftesës.");
    } finally {
      setWorking(false);
    }
  }

  async function revokeInvitation() {
    if (!latestInvitation || working) {
      return;
    }

    resetDeliveryState();
    setWorking(true);

    try {
      const response = await fetch(
        `/api/athlete-invitations/${latestInvitation.id}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Ftesa nuk mund të revokohej.");
        return;
      }

      setMessage(data.message || "Ftesa u revokua me sukses.");

      await loadInvitations();
    } catch {
      setError("Ndodhi një problem gjatë revokimit të ftesës.");
    } finally {
      setWorking(false);
    }
  }

  async function copyInviteLink() {
    if (!inviteUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteUrl);
      setMessage("Linku i ftesës u kopjua.");
    } catch {
      setError("Linku nuk mund të kopjohej automatikisht.");
    }
  }

  const canCreate =
    !latestInvitation ||
    latestInvitation.status === "REVOKED" ||
    latestInvitation.status === "EXPIRED";

  const canManagePending = latestInvitation?.status === "PENDING";

  const portalActive = latestInvitation?.status === "ACCEPTED";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              Portali i sportistit
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {player.firstName} {player.lastName}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Mbyll"
          >
            <X size={19} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Mail size={16} />
              Email-i i sportistit
            </div>

            <p className="mt-2 text-sm text-slate-600">
              {player.email || "Nuk ka email të regjistruar."}
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-slate-500">
              <RefreshCw size={17} className="animate-spin" />
              Duke ngarkuar statusin e portalit...
            </div>
          ) : (
            <>
              {latestInvitation ? (
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        Ftesa e fundit
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Krijuar më {formatDateTime(latestInvitation.createdAt)}
                      </p>
                    </div>

                    <span
                      className={[
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        statusClass(latestInvitation.status),
                      ].join(" ")}
                    >
                      {statusLabel(latestInvitation.status)}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Email
                      </p>

                      <p className="mt-1 text-slate-700">
                        {latestInvitation.email}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Skadon
                      </p>

                      <p className="mt-1 text-slate-700">
                        {formatDateTime(latestInvitation.expiresAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                  Ky sportist nuk ka ende një ftesë për portalin.
                </div>
              )}

              {portalActive && (
                <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
                  <CheckCircle2 size={19} className="mt-0.5 shrink-0" />

                  <div>
                    <p className="font-semibold">Portali është aktiv</p>

                    <p className="mt-1">
                      Sportisti e ka pranuar ftesën dhe llogaria e portalit
                      është lidhur.
                    </p>
                  </div>
                </div>
              )}

              {!player.email && (
                <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                  <XCircle size={19} className="mt-0.5 shrink-0" />

                  <p>
                    Shto fillimisht email-in e sportistit te “Edito”, pastaj
                    mund të krijosh ftesën.
                  </p>
                </div>
              )}

              {emailDelivery && (
                <div
                  className={[
                    "rounded-xl px-4 py-3 text-sm",
                    emailDelivery.ok
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-800",
                  ].join(" ")}
                >
                  {deliveryMessage(emailDelivery)}
                </div>
              )}

              {inviteUrl && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <p className="text-sm font-semibold text-blue-950">
                    Linku i ftesës
                  </p>

                  <p className="mt-1 text-xs leading-5 text-blue-700">
                    Ky link shfaqet vetëm pas krijimit ose ridërgimit. Përdore
                    për testim ose si fallback nëse email-i nuk mbërrin.
                  </p>

                  <div className="mt-3 break-all rounded-lg bg-white p-3 text-xs text-slate-700">
                    {inviteUrl}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={copyInviteLink}
                      className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-blue-700 shadow-sm"
                    >
                      <Clipboard size={14} />
                      Kopjo linkun
                    </button>

                    <a
                      href={inviteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white"
                    >
                      <ExternalLink size={14} />
                      Hape linkun
                    </a>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
                {canManagePending && (
                  <>
                    <button
                      type="button"
                      onClick={revokeInvitation}
                      disabled={working}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 disabled:opacity-50"
                    >
                      <XCircle size={16} />
                      Revoko
                    </button>

                    <button
                      type="button"
                      onClick={resendInvitation}
                      disabled={working}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      <RotateCcw size={16} />
                      {working ? "Duke ridërguar..." : "Ridërgo ftesën"}
                    </button>
                  </>
                )}

                {canCreate && !portalActive && (
                  <button
                    type="button"
                    onClick={createInvitation}
                    disabled={!player.email || working}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send size={16} />

                    {working
                      ? "Duke krijuar..."
                      : latestInvitation
                        ? "Krijo ftesë të re"
                        : "Fto në portal"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
