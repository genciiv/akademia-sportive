import { NextResponse } from "next/server";

import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  getActiveTeamScope,
} from "@/lib/academy-resource-scope";
import {
  PERMISSIONS,
} from "@/lib/permissions";
import { checkPlanLimit } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";

const SPORTET = [
  "FOOTBALL",
  "BASKETBALL",
  "VOLLEYBALL",
  "TENNIS",
  "SWIMMING",
  "HANDBALL",
  "MARTIAL_ARTS",
  "ATHLETICS",
  "OTHER",
] as const;

export async function GET() {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.TEAMS_VIEW
    );

  if (!access.ok) {
    return access.response;
  }

  const { academyId } = access;

  const activeSeason =
    await prisma.academySeason.findFirst({
      where: {
        academyId,
        isActive: true,
      },
    });

  const teamScope =
    await getActiveTeamScope(access);

  const [teams, branches] =
    await Promise.all([
      prisma.team.findMany({
        where: {
          academyId,

          ...(teamScope.isScoped
            ? {
                id: {
                  in: teamScope.teamIds,
                },
              }
            : {}),

          ...(activeSeason
            ? {
                season:
                  activeSeason.name,
              }
            : {}),
        },

        include: {
          branch: true,

          _count: {
            select: {
              players: {
                where: {
                  isActive: true,
                },
              },
            },
          },
        },

        orderBy: {
          name: "asc",
        },
      }),

      prisma.academyBranch.findMany({
        where: {
          academyId,
          isActive: true,
        },

        orderBy: {
          name: "asc",
        },
      }),
    ]);

  return NextResponse.json({
    teams,
    branches,
    activeSeason,
  });
}

export async function POST(
  request: Request
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.TEAMS_CREATE
    );

  if (!access.ok) {
    return access.response;
  }

  const { academyId } = access;

  const activeSeason =
    await prisma.academySeason.findFirst({
      where: {
        academyId,
        isActive: true,
      },
    });

  if (!activeSeason) {
    return NextResponse.json(
      {
        error:
          "Duhet të ketë një sezon aktiv para krijimit të ekipit.",
      },
      {
        status: 400,
      }
    );
  }

  const body =
    await request.json();

  const name =
    String(
      body.name || ""
    ).trim();

  const sport =
    String(
      body.sport || ""
    ).trim();

  if (!name) {
    return NextResponse.json(
      {
        error:
          "Emri i ekipit është i detyrueshëm.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    !SPORTET.includes(
      sport as
        (typeof SPORTET)[number]
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Sporti i zgjedhur nuk është i vlefshëm.",
      },
      {
        status: 400,
      }
    );
  }

  if (body.branchId) {
    const branch =
      await prisma.academyBranch.findFirst({
        where: {
          id: String(
            body.branchId
          ),
          academyId,
          isActive: true,
        },
      });

    if (!branch) {
      return NextResponse.json(
        {
          error:
            "Dega e zgjedhur nuk është e vlefshme.",
        },
        {
          status: 400,
        }
      );
    }
  }

  const ekziston =
    await prisma.team.findUnique({
      where: {
        academyId_name: {
          academyId,
          name,
        },
      },
    });

  if (ekziston) {
    return NextResponse.json(
      {
        error:
          "Ekziston tashmë një ekip me këtë emër.",
      },
      {
        status: 409,
      }
    );
  }

  const planLimit =
    await checkPlanLimit(
      academyId,
      "teams"
    );

  if (!planLimit.allowed) {
    const error =
      planLimit.reason === "LIMIT_REACHED"
        ? `Plani ${planLimit.planCode} lejon maksimumi ${planLimit.limit} ekipe.`
        : "Abonimi aktual nuk lejon krijimin e ekipeve të reja.";

    return NextResponse.json(
      {
        error,
        code: planLimit.reason,
        current: planLimit.current,
        limit: planLimit.limit,
        plan: planLimit.planCode,
      },
      {
        status: 403,
      }
    );
  }
  const team =
    await prisma.team.create({
      data: {
        academyId,
        branchId:
          body.branchId || null,
        name,

        sport:
          sport as
            (typeof SPORTET)[number],

        ageGroup:
          String(
            body.ageGroup || ""
          ).trim() || null,

        season:
          activeSeason.name,

        description:
          String(
            body.description || ""
          ).trim() || null,

        status: "ACTIVE",
      },
    });

  return NextResponse.json(
    {
      team,
    },
    {
      status: 201,
    }
  );
}
