import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { checkAthletePortalAccess } from "@/lib/athlete-portal-access";
import { prisma } from "@/lib/prisma";

type AthleteAccessSuccess = {
  ok: true;

  session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

  athleteAccount: {
    id: string;
    userId: string;
    academyId: string;
    playerId: string;
  };

  player: {
    id: string;
    academyId: string;
    firstName: string;
    lastName: string;
    status: string;
  };

  academy: {
    id: string;
    name: string;
    slug: string;
    status: string;
  };

  athleteAccountId: string;
  userId: string;
  academyId: string;
  playerId: string;
};

type AthleteAccessFailure = {
  ok: false;
  response: NextResponse;
};

export type AthleteAccessResult = AthleteAccessSuccess | AthleteAccessFailure;

export async function requireAthleteAccess(): Promise<AthleteAccessResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Duhet të identifikohesh për të vazhduar.",
        },
        {
          status: 401,
        },
      ),
    };
  }

  const athleteAccount = await prisma.athleteAccount.findFirst({
    where: {
      userId: session.user.id,
    },

    orderBy: {
      createdAt: "asc",
    },

    select: {
      id: true,
      userId: true,
      academyId: true,
      playerId: true,

      academy: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
        },
      },

      player: {
        select: {
          id: true,
          academyId: true,
          firstName: true,
          lastName: true,
          status: true,
        },
      },
    },
  });

  if (!athleteAccount) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Kjo llogari nuk është e lidhur me një profil sportisti.",
        },
        {
          status: 403,
        },
      ),
    };
  }
  const portalAccess = await checkAthletePortalAccess(
    athleteAccount.academyId,
    {
      enforceCapacity: false,
    },
  );

  if (!portalAccess.allowed) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error:
            "Portali i sportistit nuk është i disponueshëm për këtë akademi.",
          reason: portalAccess.reason,
        },
        {
          status: 403,
        },
      ),
    };
  }

  return {
    ok: true,

    session,

    athleteAccount: {
      id: athleteAccount.id,
      userId: athleteAccount.userId,
      academyId: athleteAccount.academyId,
      playerId: athleteAccount.playerId,
    },

    player: {
      id: athleteAccount.player.id,
      academyId: athleteAccount.player.academyId,
      firstName: athleteAccount.player.firstName,
      lastName: athleteAccount.player.lastName,
      status: String(athleteAccount.player.status),
    },

    academy: {
      id: athleteAccount.academy.id,
      name: athleteAccount.academy.name,
      slug: athleteAccount.academy.slug,
      status: String(athleteAccount.academy.status),
    },

    athleteAccountId: athleteAccount.id,
    userId: athleteAccount.userId,
    academyId: athleteAccount.academyId,
    playerId: athleteAccount.playerId,
  };
}
