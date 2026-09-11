import { prisma } from "@/lib/prisma";

const TEAM_SCOPED_ROLES = [
  "HEAD_COACH",
  "COACH",
  "ASSISTANT_COACH",
] as const;

type TeamScopedRole =
  (typeof TEAM_SCOPED_ROLES)[number];

type AcademyScopeInput = {
  academyId: string;
  role: string;
  membership: {
    id: string;
  };
};

export type TeamScope =
  | {
      isScoped: false;
      teamIds: null;
    }
  | {
      isScoped: true;
      teamIds: string[];
    };

function isTeamScopedRole(
  role: string
): role is TeamScopedRole {
  return TEAM_SCOPED_ROLES.includes(
    role as TeamScopedRole
  );
}

export async function getActiveTeamScope(
  access: AcademyScopeInput
): Promise<TeamScope> {
  if (!isTeamScopedRole(access.role)) {
    return {
      isScoped: false,
      teamIds: null,
    };
  }

  const activeSeason =
    await prisma.academySeason.findFirst({
      where: {
        academyId: access.academyId,
        isActive: true,
      },
      select: {
        name: true,
      },
    });

  const coach =
    await prisma.coach.findFirst({
      where: {
        membershipId: access.membership.id,
        academyId: access.academyId,
        status: "ACTIVE",
      },
      select: {
        teams: {
          where: {
            isActive: true,
            team: {
              academyId: access.academyId,
              status: "ACTIVE",
              ...(activeSeason
                ? {
                    season: activeSeason.name,
                  }
                : {}),
            },
          },
          select: {
            teamId: true,
          },
        },
      },
    });

  return {
    isScoped: true,
    teamIds:
      coach?.teams.map(
        (assignment) => assignment.teamId
      ) ?? [],
  };
}

export async function canAccessPlayer(
  access: AcademyScopeInput,
  playerId: string
): Promise<boolean> {
  const scope =
    await getActiveTeamScope(access);

  if (!scope.isScoped) {
    return true;
  }

  if (scope.teamIds.length === 0) {
    return false;
  }

  const player =
    await prisma.player.findFirst({
      where: {
        id: playerId,
        academyId: access.academyId,
        teams: {
          some: {
            isActive: true,
            teamId: {
              in: scope.teamIds,
            },
          },
        },
      },
      select: {
        id: true,
      },
    });

  return Boolean(player);
}