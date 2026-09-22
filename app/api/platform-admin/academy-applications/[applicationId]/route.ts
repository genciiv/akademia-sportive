import { NextResponse } from "next/server";

import { getPlatformAdminAccess } from "@/lib/platform-admin";
import { prisma } from "@/lib/prisma";
import {
  createInvitationToken,
  createOnboardingExpiry,
  hashInvitationToken,
} from "@/lib/invitation-token";
import { sendAcademyOwnerInvitationEmail } from "@/lib/invitation-email";

type RouteContext = {
  params: Promise<{
    applicationId: string;
  }>;
};

const ALLOWED_STATUSES = ["CONTACTED", "APPROVED", "REJECTED"] as const;

type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

export async function PATCH(request: Request, { params }: RouteContext) {
  const access = await getPlatformAdminAccess();

  if (!access.ok) {
    return NextResponse.json(
      {
        error:
          access.status === 401
            ? "Duhet të identifikohesh."
            : "Nuk ke akses në Platform Admin.",
      },
      {
        status: access.status,
      },
    );
  }

  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "Kërkesa nuk është e vlefshme.",
      },
      {
        status: 400,
      },
    );
  }

  const status = String(body.status ?? "");

  if (!ALLOWED_STATUSES.includes(status as AllowedStatus)) {
    return NextResponse.json(
      {
        error: "Statusi nuk është i vlefshëm.",
      },
      {
        status: 400,
      },
    );
  }

  const adminNotes = String(body.adminNotes ?? "").trim() || null;

  if ((adminNotes?.length ?? 0) > 2000) {
    return NextResponse.json(
      {
        error: "Shënimet nuk mund të kalojnë 2000 karaktere.",
      },
      {
        status: 400,
      },
    );
  }

  const { applicationId } = await params;

  const application = await prisma.academyApplication.findUnique({
    where: {
      id: applicationId,
    },
  });

  if (!application) {
    return NextResponse.json(
      {
        error: "Aplikimi nuk u gjet.",
      },
      {
        status: 404,
      },
    );
  }

  if (application.consumedAt) {
    return NextResponse.json(
      {
        error: "Ky aplikim është përdorur tashmë për krijimin e një akademie.",
      },
      {
        status: 409,
      },
    );
  }

  const now = new Date();

  const onboardingToken =
    status === "APPROVED" ? createInvitationToken() : null;

  const onboardingTokenHash = onboardingToken
    ? hashInvitationToken(onboardingToken)
    : null;

  const onboardingExpiresAt = onboardingToken
    ? createOnboardingExpiry(now)
    : null;

  const updated = await prisma.academyApplication.update({
    where: {
      id: application.id,
    },
    data: {
      status: status as AllowedStatus,
      adminNotes,
      reviewedByUserId: access.user.id,

      ...(status === "CONTACTED"
        ? {
            contactedAt: application.contactedAt ?? now,
            reviewedAt: null,
            approvedAt: null,
            rejectedAt: null,
            onboardingTokenHash: null,
            onboardingExpiresAt: null,
          }
        : {}),

      ...(status === "APPROVED"
        ? {
            reviewedAt: now,
            approvedAt: now,
            rejectedAt: null,
            onboardingTokenHash,
            onboardingExpiresAt,
          }
        : {}),

      ...(status === "REJECTED"
        ? {
            reviewedAt: now,
            rejectedAt: now,
            approvedAt: null,
            onboardingTokenHash: null,
            onboardingExpiresAt: null,
          }
        : {}),
    },
  });

  const { onboardingTokenHash: _onboardingTokenHash, ...safeApplication } =
    updated;
  const emailDelivery =
    onboardingToken && onboardingExpiresAt
      ? await sendAcademyOwnerInvitationEmail({
          email: application.email,
          contactName: application.contactName,
          academyName: application.academyName,
          invitationToken: onboardingToken,
          expiresAt: onboardingExpiresAt,
        })
      : null;

  return NextResponse.json({
    application: safeApplication,
    ...(onboardingToken
      ? {
          onboarding: {
            token: onboardingToken,
            expiresAt: onboardingExpiresAt,
            emailDelivery,
          },
        }
      : {}),
  });
}
