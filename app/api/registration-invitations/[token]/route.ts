import { NextResponse } from "next/server";

import { hashInvitationToken } from "@/lib/invitation-token";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

async function accountExists(email: string) {
  const user = await prisma.user.findUnique({
    where: {
      email: normalizeEmail(email),
    },
    select: {
      id: true,
    },
  });

  return user !== null;
}

function invalidInvitationResponse() {
  return NextResponse.json(
    {
      valid: false,
      error: "Ftesa nuk është e vlefshme ose ka skaduar.",
    },
    {
      status: 404,
    },
  );
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { token: rawToken } = await params;
  const token = rawToken.trim();

  if (token.length < 16 || token.length > 512) {
    return invalidInvitationResponse();
  }

  const now = new Date();
  const onboardingTokenHash = hashInvitationToken(token);

  const [ownerInvitation, staffInvitation] = await Promise.all([
    prisma.academyApplication.findUnique({
      where: {
        onboardingTokenHash,
      },
      select: {
        academyName: true,
        contactName: true,
        email: true,
        status: true,
        consumedAt: true,
        onboardingExpiresAt: true,
      },
    }),

    prisma.academyInvitation.findUnique({
      where: {
        token,
      },
      select: {
        email: true,
        role: true,
        expiresAt: true,
        acceptedAt: true,
        revokedAt: true,
        academy: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const ownerAllowed =
    ownerInvitation?.status === "APPROVED" &&
    ownerInvitation.consumedAt === null &&
    ownerInvitation.onboardingExpiresAt !== null &&
    ownerInvitation.onboardingExpiresAt > now;

  if (ownerAllowed) {
    const existingAccount = await accountExists(ownerInvitation.email);

    return NextResponse.json({
      valid: true,
      type: "ACADEMY_OWNER",
      email: normalizeEmail(ownerInvitation.email),
      accountExists: existingAccount,
      name: ownerInvitation.contactName,
      academyName: ownerInvitation.academyName,
      expiresAt: ownerInvitation.onboardingExpiresAt,
      nextPath: "/krijo-akademine",
    });
  }

  const staffAllowed =
    staffInvitation !== null &&
    staffInvitation.acceptedAt === null &&
    staffInvitation.revokedAt === null &&
    staffInvitation.expiresAt > now;

  if (staffAllowed) {
    const existingAccount = await accountExists(staffInvitation.email);

    return NextResponse.json({
      valid: true,
      type: "STAFF",
      email: normalizeEmail(staffInvitation.email),
      accountExists: existingAccount,
      academyName: staffInvitation.academy.name,
      role: staffInvitation.role,
      expiresAt: staffInvitation.expiresAt,
      nextPath: `/ftesa/${encodeURIComponent(token)}`,
    });
  }

  return invalidInvitationResponse();
}
